"""Command-line entry point for the RC machine service."""

from __future__ import annotations

import argparse
import logging
import os
import time
from typing import Iterator

from microservice import BackendClient, MicroConfig, RcMicroservice, SerialMachine


class SimulatedMachine:
    """Finite machine source used to validate the service without an Arduino."""

    def __init__(self, cycles: int) -> None:
        self.cycles = cycles
        self.commands: list[str] = []
        self.connected = False

    def connect(self) -> None:
        self.connected = True

    def lines(self) -> Iterator[str]:
        for cycle in range(1, self.cycles + 1):
            yield f"{cycle},CARGA,1000,1.25\n"
            yield f"{cycle},DESCARGA,2000,0.35\n"

    def send(self, command: str) -> None:
        self.commands.append(command)

    def close(self) -> None:
        self.connected = False


def _positive_float(value: str) -> float:
    parsed = float(value.replace(",", "."))
    if parsed <= 0:
        raise argparse.ArgumentTypeError("value must be positive")
    return parsed


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be at least 1")
    return parsed


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Operate the RC Arduino and persist measurements")
    parser.add_argument("--mode", choices=("cycle", "time"), default="cycle")
    parser.add_argument("--cycles", type=_positive_int, default=1, help="Number of cycles in cycle mode")
    parser.add_argument("--minutes", type=_positive_float, default=1.0, help="Duration in minutes in time mode")
    parser.add_argument("--port", default=os.getenv("TCC_SERIAL_PORT", "COM5"))
    parser.add_argument("--backend-url", default=os.getenv("TCC_BACKEND_URL", "http://localhost:8080"))
    parser.add_argument("--baudrate", type=int, default=int(os.getenv("TCC_BAUDRATE", "115200")))
    parser.add_argument("--capacitor-uf", type=_positive_float, default=_positive_float(os.getenv("TCC_CAPACITOR_UF", "470")))
    parser.add_argument("--resistor-ohm", type=_positive_float, default=_positive_float(os.getenv("TCC_RESISTOR_OHM", "2200")))
    parser.add_argument("--simulate", action="store_true", help="Generate measurements instead of opening a serial port")
    parser.add_argument("--verbose", action="store_true")
    return parser


def run(args: argparse.Namespace) -> None:
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="%(asctime)s %(levelname)s %(message)s")
    config = MicroConfig(
        serial_port=args.port,
        baudrate=args.baudrate,
        backend_url=args.backend_url,
        capacitor_microfarads=args.capacitor_uf,
        resistor_ohms=args.resistor_ohm,
    )
    machine = SimulatedMachine(args.cycles) if args.simulate else SerialMachine(config)
    service = RcMicroservice(
        machine,
        BackendClient(config.backend_url),
        on_measurement=lambda measurement: print(
            f"cycle={measurement.cycle_number} state={measurement.state} "
            f"time={measurement.time_seconds:.3f}s voltage={measurement.voltage:.3f}V"
        ),
    )

    try:
        if args.mode == "cycle":
            trial_id = service.start("CYCLE", number_cycles=args.cycles)
        else:
            trial_id = service.start("TIME", duration_minutes=args.minutes)
        print(f"trial={trial_id}")
        if args.simulate:
            service._reader.join()
        else:
            while True:
                time.sleep(0.5)
    except KeyboardInterrupt:
        print("Stopping trial...")
    finally:
        service.close()


if __name__ == "__main__":
    run(build_parser().parse_args())
