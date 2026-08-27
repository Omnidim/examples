# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

from argparse import Namespace
from pathlib import Path
import unittest

from src.main import as_webhook_contacts, batched, build_create_payload, parse_conditions, parse_contacts


class ContactShapeTests(unittest.TestCase):
    def test_csv_rows_become_the_webhook_shape(self) -> None:
        rows = [{"phone_number": "+15550101001", "name": "Demo User", "plan": "pro"}]
        self.assertEqual(
            as_webhook_contacts(rows),
            [{"to_number": "+15550101001", "custom_variables": {"name": "Demo User", "plan": "pro"}}],
        )

    def test_batches_never_exceed_the_cap(self) -> None:
        contacts = [{"to_number": f"+1555010{index:04d}"} for index in range(2500)]
        batches = batched(contacts, 1000)
        self.assertEqual([len(batch) for batch in batches], [1000, 1000, 500])

    def test_rejects_invalid_phone_number(self) -> None:
        source = Path(self._testMethodName + ".csv")
        self.addCleanup(source.unlink, missing_ok=True)
        source.write_text("phone_number\n5550101001\n")
        with self.assertRaisesRegex(ValueError, "invalid phone_number"):
            parse_contacts(source)


class CreatePayloadTests(unittest.TestCase):
    def _options(self, **overrides) -> Namespace:
        defaults = dict(name="Test", bot_id=None, concurrency=3, condition=[],
                        rotate=None, calls_per_number=50)
        defaults.update(overrides)
        return Namespace(**defaults)

    def test_rotation_numbers_get_ordered_sequences(self) -> None:
        payload = build_create_payload(self._options(rotate="177,178"), "177")
        self.assertEqual(
            payload["rotation"]["numbers"],
            [{"phone_number_id": 177, "sequence": 10}, {"phone_number_id": 178, "sequence": 20}],
        )

    def test_conditions_parse_column_and_value(self) -> None:
        self.assertEqual(
            parse_conditions(["plan=pro"]),
            [{"column": "plan", "operator": "equals", "value": "pro"}],
        )
        with self.assertRaisesRegex(ValueError, "column=value"):
            parse_conditions(["plan"])

    def test_a_plain_create_is_a_draft(self) -> None:
        payload = build_create_payload(self._options(), "177")
        self.assertTrue(payload["save_as_draft"])
        self.assertNotIn("rotation", payload)
        self.assertNotIn("call_conditions", payload)
