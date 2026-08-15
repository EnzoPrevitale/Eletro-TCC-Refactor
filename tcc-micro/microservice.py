"""Headless RC machine service.

The Arduino protocol is one CSV line per measurement:
    cycle,state,time_ms,voltage

This module contains no GUI concerns. It reads the machine, applies the RC
domain rules, and mirrors trials, cycles, and measurements to tcc-backend.
"""

from __future__ import annotations

import json
import logging
import math
import threading
import time
from dataclasses import dataclass
from datetime import datetime, time as local_time
from typing import Callable, Iterator, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

try:
    import serial
except ImportError:  # Keeps calculation and parser tests independent of hardware.
    serial = None


LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class MicroConfig:
    serial_port: str = "COM5"
    baudrate: int = 115200
    serial_timeout: float = 0.1
    startup_delay: float = 2.0
    ready_timeout: float = 5.0
    backend_url: str = "http://localhost:8080"
    capacitor_microfarads: float = 470.0
    resistor_ohms: float = 2200.0


@dataclass(frozen=True)
class ArduinoProfile:
    capacitor_microfarads: Optional[float] = None
    resistor_ohms: Optional[float] = None
    tau_seconds: Optional[float] = None
    preconditioning_cycles: Optional[int] = None


@dataclass(frozen=True)
class RcTiming:
    capacitor_microfarads: float
    resistor_ohms: float

    def __post_init__(self) -> None:
        if self.capacitor_microfarads <= 0 or self.resistor_ohms <= 0:
            raise ValueError("Capacitor and resistor values must be positive")

    @property
    def tau_seconds(self) -> float:
        return self.resistor_ohms * self.capacitor_microfarads / 1_000_000

    @property
    def five_tau_seconds(self) -> float:
        return 5 * self.tau_seconds

    @property
    def cycle_seconds(self) -> float:
        return 2 * self.five_tau_seconds

    def estimate_cycles(self, duration_minutes: float) -> int:
        if duration_minutes < 0:
            raise ValueError("Duration cannot be negative")
        return int(duration_minutes * 60 / self.cycle_seconds)


@dataclass(frozen=True)
class Measurement:
    cycle_number: int
    state: str
    time_seconds: float
    voltage: float


def parse_measurement(line: str) -> Optional[Measurement]:
    """Parse one Arduino line, returning None for status/malformed lines."""
    text = line.strip()
    if not text or text.startswith("PRE,") or text.startswith("#"):
        return None
    if text in {"PRE_CONDICIONAMENTO", "PRE_CONDICIONAMENTO_OK", "ARDUINO_RC_PRONTO"}:
        return None

    parts = text.split(",")
    if len(parts) != 4:
        return None
    try:
        cycle_number = int(parts[0])
        state = parts[1].strip().upper()
        time_seconds = float(parts[2]) / 1000
        voltage = float(parts[3])
    except ValueError:
        return None
    if (
        cycle_number < 1
        or state not in {"CARGA", "DESCARGA"}
        or time_seconds < 0
        or not math.isfinite(voltage)
        or voltage < 0
        or voltage > 5.0
    ):
        return None
    return Measurement(cycle_number, state, time_seconds, voltage)


class BackendClient:
    """Small HTTP client matching the current tcc-backend DTOs."""

    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _post(self, path: str, payload: dict) -> dict:
        return self._request(path, "POST", payload)

    def _request(self, path: str, method: str, payload: Optional[dict] = None) -> dict:
        request = Request(
            f"{self.base_url}/{path.lstrip('/')}",
            data=json.dumps(payload).encode("utf-8") if payload is not None else None,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method=method,
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.load(response)
        except (HTTPError, URLError, TimeoutError) as error:
            raise ConnectionError(f"Backend request failed for {path}: {error}") from error

    def finish_trial(self, trial_id: UUID) -> dict:
        return self._request(f"trial/{trial_id}/finish", "PATCH")

    def create_trial(self, mode: str, number_cycles: Optional[int], duration_minutes: Optional[float], started: datetime) -> UUID:
        if mode not in {"CYCLE", "TIME"}:
            raise ValueError("mode must be CYCLE or TIME")
        payload = {
            "mode": mode,
            "numberCycles": number_cycles,
            "time": _format_local_time(duration_minutes) if duration_minutes is not None else None,
            "timeStarted": started.strftime("%d/%m/%Y %H:%M:%S"),
            "endTime": None,
            "status": "NEW_TEST",
        }
        return UUID(self._post("trial", payload)["id"])

    def create_cycle(self, trial_id: UUID, number: int) -> UUID:
        return UUID(self._post("cycle", {"number": number, "trialId": str(trial_id)})["id"])

    def create_measurement(self, cycle_id: UUID, measurement: Measurement) -> dict:
        payload = {
            "cycleId": str(cycle_id),
            "cycleStatus": {"CARGA": "CHARGE", "DESCARGA": "DISCHARGE"}[measurement.state],
            "time": _format_local_time(measurement.time_seconds / 60),
            "voltage": measurement.voltage,
        }
        return self._post("measurement", payload)


def _format_local_time(minutes: float) -> str:
    total_seconds = max(0, int(round(minutes * 60)))
    return local_time(total_seconds // 3600 % 24, total_seconds // 60 % 60, total_seconds % 60).strftime("%H:%M:%S")


class SerialMachine:
    def __init__(self, config: MicroConfig) -> None:
        self.config = config
        self.connection = None
        self.profile = ArduinoProfile()

    def connect(self) -> None:
        if serial is None:
            raise RuntimeError("pyserial is required to connect to the Arduino")
        self.connection = serial.Serial(self.config.serial_port, self.config.baudrate, timeout=self.config.serial_timeout)
        time.sleep(self.config.startup_delay)
        self._wait_until_ready()

    def _wait_until_ready(self) -> None:
        if self.connection is None:
            raise RuntimeError("Arduino connection was not opened")
        deadline = time.monotonic() + self.config.ready_timeout
        metadata = {}
        while time.monotonic() < deadline:
            raw = self.connection.readline()
            if not raw:
                continue
            line = raw.decode("utf-8", errors="ignore").strip()
            if line.startswith("Capacitor:"):
                metadata["capacitor_microfarads"] = _parse_number(line, "Capacitor:", "uF")
            elif line.startswith("Resistor:"):
                metadata["resistor_ohms"] = _parse_number(line, "Resistor:", "ohms")
            elif line.startswith("Tau teorico:"):
                metadata["tau_seconds"] = _parse_number(line, "Tau teorico:", "s")
            elif line.startswith("Pre-condicionamento:"):
                metadata["preconditioning_cycles"] = int(_parse_number(line, "Pre-condicionamento:", "ciclos"))
            elif line == "ARDUINO_RC_PRONTO":
                self.profile = ArduinoProfile(**metadata)
                return
        raise TimeoutError("Arduino did not send ARDUINO_RC_PRONTO")

    def lines(self) -> Iterator[str]:
        if self.connection is None or not self.connection.is_open:
            raise RuntimeError("Arduino is not connected")
        while True:
            raw = self.connection.readline()
            if raw:
                yield raw.decode("utf-8", errors="ignore")

    def send(self, command: str) -> None:
        if self.connection is not None and self.connection.is_open:
            self.connection.write(f"{command}\n".encode("ascii"))

    def close(self) -> None:
        if self.connection is not None and self.connection.is_open:
            self.connection.close()


def _parse_number(line: str, prefix: str, suffix: str) -> float:
    value = line.removeprefix(prefix).removesuffix(suffix).strip()
    return float(value.replace(",", "."))


class RcMicroservice:
    """Coordinates Arduino acquisition and backend persistence."""

    def __init__(
        self,
        machine: SerialMachine,
        backend: BackendClient,
        on_measurement: Optional[Callable[[Measurement], None]] = None,
    ) -> None:
        self.machine = machine
        self.backend = backend
        self.on_measurement = on_measurement
        self.trial_id: Optional[UUID] = None
        self._cycle_ids: dict[int, UUID] = {}
        self._running = False
        self._reader: Optional[threading.Thread] = None
        self._trial_finished = False

    def start(self, mode: str, number_cycles: Optional[int] = None, duration_minutes: Optional[float] = None) -> UUID:
        if self._running:
            raise RuntimeError("A trial is already running")
        if mode not in {"CYCLE", "TIME"}:
            raise ValueError("mode must be CYCLE or TIME")
        if mode == "CYCLE" and (number_cycles is None or number_cycles < 1):
            raise ValueError("number_cycles must be positive in CYCLE mode")
        if mode == "TIME" and (duration_minutes is None or duration_minutes <= 0):
            raise ValueError("duration_minutes must be positive in TIME mode")
        self.machine.connect()
        try:
            self.trial_id = self.backend.create_trial(mode, number_cycles, duration_minutes, datetime.now())
        except Exception:
            self.machine.close()
            raise
        self._cycle_ids.clear()
        self._trial_finished = False
        self.machine.send("START")
        self._running = True
        self._reader = threading.Thread(target=self._read_loop, name="rc-measurements", daemon=True)
        self._reader.start()
        return self.trial_id

    def stop(self) -> None:
        self._running = False
        self.machine.send("STOP")
        if self.trial_id is not None and not self._trial_finished:
            try:
                self.backend.finish_trial(self.trial_id)
                self._trial_finished = True
            except ConnectionError:
                LOGGER.exception("Could not finish trial in tcc-backend")

    def reset(self) -> None:
        self._running = False
        self.machine.send("RESET")
        self._cycle_ids.clear()
        self.trial_id = None
        self._trial_finished = False

    def close(self) -> None:
        self.stop()
        self.machine.close()

    def _read_loop(self) -> None:
        try:
            for line in self.machine.lines():
                if not self._running:
                    break
                measurement = parse_measurement(line)
                if measurement is None or self.trial_id is None:
                    continue
                self._persist_measurement(measurement)
        except Exception:
            LOGGER.exception("RC acquisition loop stopped")
            self._running = False

    def _persist_measurement(self, measurement: Measurement) -> None:
        if self.trial_id is None:
            raise RuntimeError("No trial has been started")
        cycle_id = self._cycle_ids.get(measurement.cycle_number)
        if cycle_id is None:
            cycle_id = self.backend.create_cycle(self.trial_id, measurement.cycle_number)
            self._cycle_ids[measurement.cycle_number] = cycle_id
        self.backend.create_measurement(cycle_id, measurement)
        if self.on_measurement is not None:
            self.on_measurement(measurement)
