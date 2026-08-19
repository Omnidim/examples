# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

import json
import os
from pathlib import Path
import unittest

import server


FIXTURE = json.loads((Path(__file__).parents[2] / "fixtures" / "post-call.json").read_text())


class PostCallEventTests(unittest.TestCase):
    def test_parses_the_documented_fixture(self) -> None:
        event = server.parse_post_call_event(FIXTURE)
        self.assertEqual(server.event_summary(event)["extractedVariables"]["name"], "Ravi")

    def test_rejects_a_payload_without_call_identifiers(self) -> None:
        self.assertIsNone(server.parse_post_call_event({"bot_name": "Agent"}))

    def test_rejects_non_public_forwarding_targets(self) -> None:
        original = os.environ.get("FORWARD_URL")
        original_allowed_hosts = os.environ.get("FORWARD_URL_ALLOWED_HOSTS")
        try:
            os.environ["FORWARD_URL"] = "https://127.0.0.1/internal"
            os.environ["FORWARD_URL_ALLOWED_HOSTS"] = "hooks.example.com"
            with self.assertRaisesRegex(ValueError, "FORWARD_URL_ALLOWED_HOSTS"):
                server.forward(FIXTURE)
        finally:
            if original is None:
                os.environ.pop("FORWARD_URL", None)
            else:
                os.environ["FORWARD_URL"] = original
            if original_allowed_hosts is None:
                os.environ.pop("FORWARD_URL_ALLOWED_HOSTS", None)
            else:
                os.environ["FORWARD_URL_ALLOWED_HOSTS"] = original_allowed_hosts


if __name__ == "__main__":
    unittest.main()
