# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server


class ReserveAppointmentTests(unittest.TestCase):
    def test_reserves_an_available_slot(self) -> None:
        slot = server.AVAILABILITY["2026-09-04"][0]
        appointment = server.reserve_appointment("+15551234567", slot)
        self.assertEqual(appointment["timeSlot"], slot)
        self.assertIsNone(server.reserve_appointment("+15551234567", slot))

    def test_rejects_an_unknown_customer(self) -> None:
        self.assertIsNone(server.reserve_appointment("+15550000000", "2026-09-04T14:30:00Z"))


class AppointmentRequestTests(unittest.TestCase):
    """The handler is the trust boundary, so bad payload types must not reach the fixtures."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_address[1]}/v1/appointments"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def post(self, body: str) -> tuple[int, dict]:
        request = Request(self.url, data=body.encode(), headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urlopen(request) as response:
                return response.status, json.loads(response.read())
        except HTTPError as error:
            return error.code, json.loads(error.read())

    def test_rejects_null_fields(self) -> None:
        self.assertEqual(self.post('{"customerPhone": null, "timeSlot": null}'), (400, {"error": "customerPhone_and_timeSlot_are_required"}))

    def test_rejects_non_string_fields(self) -> None:
        self.assertEqual(self.post('{"customerPhone": 123, "timeSlot": 456}'), (400, {"error": "customerPhone_and_timeSlot_are_required"}))

    def test_rejects_empty_fields(self) -> None:
        self.assertEqual(self.post('{"customerPhone": "", "timeSlot": ""}'), (400, {"error": "customerPhone_and_timeSlot_are_required"}))


if __name__ == "__main__":
    unittest.main()
