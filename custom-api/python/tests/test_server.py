import unittest

import server


class ReserveAppointmentTests(unittest.TestCase):
    def test_reserves_an_available_slot(self) -> None:
        slot = server.AVAILABILITY["2026-09-04"][0]
        appointment = server.reserve_appointment("+15551234567", slot)
        self.assertEqual(appointment["timeSlot"], slot)
        self.assertIsNone(server.reserve_appointment("+15551234567", slot))

    def test_rejects_an_unknown_customer(self) -> None:
        self.assertIsNone(server.reserve_appointment("+15550000000", "2026-09-04T14:30:00Z"))


if __name__ == "__main__":
    unittest.main()
