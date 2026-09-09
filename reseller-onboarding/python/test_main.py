# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

import json
import unittest
from pathlib import Path

from src.main import answer_for, entry_for_carrier, load_carrier, plan

CARRIERS = Path(__file__).resolve().parent.parent / "carriers"


class CarrierFileTests(unittest.TestCase):
    def test_every_shipped_carrier_file_loads(self) -> None:
        files = sorted(CARRIERS.glob("*.json"))
        self.assertTrue(files, "no carrier files found")
        for path in files:
            with self.subTest(path.name):
                carrier = load_carrier(path)
                self.assertEqual(carrier["carrier"], path.stem)

    def test_rejects_a_file_with_no_answers(self) -> None:
        path = Path("no-answers.json")
        self.addCleanup(path.unlink, missing_ok=True)
        path.write_text(json.dumps({"region": "IN", "carrier": "carrier-1", "answers": {}}))
        with self.assertRaisesRegex(ValueError, "answers object"):
            load_carrier(path)

    def test_rejects_a_phone_that_is_not_e164(self) -> None:
        path = Path("bad-phone.json")
        self.addCleanup(path.unlink, missing_ok=True)
        path.write_text(
            json.dumps(
                {
                    "region": "IN",
                    "carrier": "carrier-1",
                    "answers": {"register": {"phone": "9876543210"}},
                }
            )
        )
        with self.assertRaisesRegex(ValueError, "E.164"):
            load_carrier(path)


class StepSelectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.carrier = load_carrier(CARRIERS / "carrier-1.json")

    def test_gst_is_a_fork_the_file_decides(self) -> None:
        # The API answers verify-gst; a client with no GST runs skip-gst.
        step, fields = answer_for(self.carrier, "verify-gst")
        self.assertEqual(step, "skip-gst")
        self.assertEqual(fields, {})

    def test_a_step_with_no_answers_is_refused_before_the_call(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "no answers for it"):
            answer_for(self.carrier, "some-new-step")

    def test_fields_are_copied_so_a_prompt_cannot_edit_the_file(self) -> None:
        _, fields = answer_for(self.carrier, "register")
        fields["email"] = "changed@example.com"
        self.assertEqual(self.carrier["answers"]["register"]["email"], "demo@example.com")


class StatusMatchingTests(unittest.TestCase):
    STATUS = {
        "regions": [
            {"carrier": "carrier-1", "next_step": "register", "can_purchase": False},
            {"carrier": "carrier-2-new", "next_step": None, "can_purchase": True},
        ]
    }

    def test_matches_on_carrier_not_region(self) -> None:
        self.assertTrue(entry_for_carrier(self.STATUS, "carrier-2-new")["can_purchase"])
        self.assertFalse(entry_for_carrier(self.STATUS, "carrier-1")["can_purchase"])

    def test_an_unknown_carrier_names_the_ones_that_came_back(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "carrier-2-new"):
            entry_for_carrier(self.STATUS, "carrier-9")


class PlanTests(unittest.TestCase):
    # Attach is the one call in the chain that takes no carrier: by then the
    # number is already bought and the carrier is settled.
    CARRIER_BEARING = ("/kyc/steps/", "/phone_number/search", "/phone_number/purchase")

    def test_every_call_that_needs_a_carrier_carries_one(self) -> None:
        for path in sorted(CARRIERS.glob("*.json")):
            carrier = load_carrier(path)
            with self.subTest(path.name):
                for call in plan(carrier, "Demo User", 100, 0.2):
                    if any(part in call["endpoint"] for part in self.CARRIER_BEARING):
                        self.assertEqual(call["body"].get("carrier"), carrier["carrier"])

    def test_the_plan_ends_at_an_attached_number(self) -> None:
        carrier = load_carrier(CARRIERS / "carrier-us.json")
        endpoints = [call["endpoint"] for call in plan(carrier, "Demo User", 100, 0.2)]
        self.assertEqual(endpoints[0], "POST /reseller/users/add")
        self.assertEqual(endpoints[-1], "POST /phone_number/attach")


if __name__ == "__main__":
    unittest.main()
