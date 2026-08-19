# Copyright (c) 2026 OmniDimension
# SPDX-License-Identifier: MIT
# Part of https://github.com/Omnidim/examples

from pathlib import Path
import unittest

from src.main import parse_contacts


class ContactParsingTests(unittest.TestCase):
    def test_parses_valid_contacts(self) -> None:
        source = Path(self._testMethodName + ".csv")
        self.addCleanup(source.unlink, missing_ok=True)
        source.write_text("phone_number,name\n+15550101001,Demo User\n")
        self.assertEqual(parse_contacts(source), [{"phone_number": "+15550101001", "name": "Demo User"}])

    def test_rejects_invalid_phone_number(self) -> None:
        source = Path(self._testMethodName + ".csv")
        self.addCleanup(source.unlink, missing_ok=True)
        source.write_text("phone_number\n5550101001\n")
        with self.assertRaisesRegex(ValueError, "invalid phone_number"):
            parse_contacts(source)
