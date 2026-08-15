import unittest
from uuid import UUID, uuid4

from microservice import Measurement, RcMicroservice


class FakeMachine:
    def __init__(self):
        self.connected = False
        self.commands = []

    def connect(self):
        self.connected = True

    def send(self, command):
        self.commands.append(command)

    def close(self):
        self.connected = False

    def lines(self):
        yield from ()


class FakeBackend:
    def __init__(self):
        self.trial_id = uuid4()
        self.calls = []

    def create_trial(self, mode, number_cycles, duration_minutes, started):
        self.calls.append(("trial", mode, number_cycles, duration_minutes))
        return self.trial_id

    def create_cycle(self, trial_id, number):
        cycle_id = uuid4()
        self.calls.append(("cycle", trial_id, number))
        return cycle_id

    def create_measurement(self, cycle_id, measurement):
        self.calls.append(("measurement", cycle_id, measurement))
        return {"id": str(uuid4())}


class RcMicroserviceTests(unittest.TestCase):
    def test_start_creates_trial_and_reuses_cycle_id(self):
        machine = FakeMachine()
        backend = FakeBackend()
        service = RcMicroservice(machine, backend)

        trial_id = service.start("CYCLE", number_cycles=2)
        first = Measurement(1, "CARGA", 0.5, 1.2)
        second = Measurement(1, "DESCARGA", 1.5, 0.4)
        service.trial_id = trial_id
        service._running = True
        service._persist_measurement(first)
        service._persist_measurement(second)

        self.assertEqual(backend.calls[0][0], "trial")
        self.assertEqual([call[0] for call in backend.calls[1:]], ["cycle", "measurement", "measurement"])
        self.assertEqual(len({call[1] for call in backend.calls[2:]}), 1)


if __name__ == "__main__":
    unittest.main()