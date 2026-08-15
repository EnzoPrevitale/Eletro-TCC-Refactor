"""HTTP entry point for starting and stopping RC trials from the frontend."""

from __future__ import annotations

import json
import logging
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from microservice import BackendClient, MicroConfig, RcMicroservice, SerialMachine

LOGGER = logging.getLogger(__name__)


def _positive_int(value: Any) -> int:
    parsed = int(value)
    if parsed < 1:
        raise ValueError("numberCycles must be positive")
    return parsed


def _positive_float(value: Any) -> float:
    parsed = float(value)
    if parsed <= 0:
        raise ValueError("durationMinutes must be positive")
    return parsed


def _duration_minutes(payload: dict[str, Any]) -> float:
    if "durationMinutes" in payload:
        return _positive_float(payload["durationMinutes"])
    value = str(payload.get("time", ""))
    parts = value.split(":")
    if len(parts) != 3:
        raise ValueError("time must use HH:MM:SS format")
    hours, minutes, seconds = (int(part) for part in parts)
    return hours * 60 + minutes + seconds / 60


class TrialApi:
    def __init__(self) -> None:
        config = MicroConfig(
            serial_port=os.getenv("TCC_SERIAL_PORT", "COM5"),
            baudrate=int(os.getenv("TCC_BAUDRATE", "115200")),
            backend_url=os.getenv("TCC_BACKEND_URL", "http://localhost:8080"),
            capacitor_microfarads=float(os.getenv("TCC_CAPACITOR_UF", "470")),
            resistor_ohms=float(os.getenv("TCC_RESISTOR_OHM", "2200")),
        )
        self.service = RcMicroservice(SerialMachine(config), BackendClient(config.backend_url))

    def start(self, payload: dict[str, Any]) -> dict[str, str]:
        mode = str(payload.get("mode", "CYCLE")).upper()
        number_cycles = _positive_int(payload["numberCycles"]) if mode == "CYCLE" else None
        duration_minutes = _duration_minutes(payload) if mode == "TIME" else None
        trial_id = self.service.start(mode, number_cycles, duration_minutes)
        return {"id": str(trial_id)}

    def stop(self) -> None:
        self.service.stop()


api = TrialApi()


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict[str, Any]) -> None:
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send(200, {"running": api.service._running})
            return
        self._send(404, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path != "/start":
            self._send(404, {"error": "Not found"})
            return
        try:
            self._send(201, api.start(self._json()))
        except (ValueError, RuntimeError, ConnectionError) as error:
            self._send(409 if isinstance(error, RuntimeError) else 400, {"error": str(error)})
        except OSError as error:
            self._send(503, {"error": "Nao foi possivel acessar a porta serial. Execute esta API no Windows host com o Arduino conectado e TCC_SERIAL_PORT configurado.", "detail": str(error)})
        except Exception:
            LOGGER.exception("Could not start trial")
            self._send(500, {"error": "Could not start trial"})

    def do_PATCH(self) -> None:
        if self.path != "/stop":
            self._send(404, {"error":   "Not found"})
            return
        api.stop()
        self._send(200, {"stopped": True})

    def log_message(self, format: str, *args: object) -> None:
        LOGGER.info("%s - %s", self.address_string(), format % args)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    server = ThreadingHTTPServer(("0.0.0.0", int(os.getenv("TCC_MICRO_PORT", "8000"))), Handler)
    LOGGER.info("Trial API listening on port %s", server.server_port)
    try:
        server.serve_forever()
    finally:
        api.service.close()
        server.server_close()
