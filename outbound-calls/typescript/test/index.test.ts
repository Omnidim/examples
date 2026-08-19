// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArguments, parseContacts } from '../src/index.js';

test('parses a valid contact list', () => {
  assert.deepEqual(parseContacts('phone_number,name\n+15550101001,Demo User'), [{ phone_number: '+15550101001', name: 'Demo User' }]);
});

test('rejects an invalid contact number', () => {
  assert.throws(() => parseContacts('phone_number\n5550101001'), /invalid phone_number/);
});

test('uses dry run by default', () => {
  assert.deepEqual(parseArguments(['contacts.csv']), { csvPath: 'contacts.csv', live: false, name: 'Outbound campaign' });
});
