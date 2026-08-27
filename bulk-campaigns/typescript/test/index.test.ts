// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asWebhookContacts,
  batched,
  buildCreatePayload,
  parseConditions,
  parseContacts,
  type CreateOptions,
} from '../src/index.js';

const options = (overrides: Partial<CreateOptions> = {}): CreateOptions => ({
  name: 'Test',
  concurrency: 3,
  condition: [],
  callsPerNumber: 50,
  ...overrides,
});

test('csv rows become the webhook shape', () => {
  assert.deepEqual(
    asWebhookContacts([{ phone_number: '+15550101001', name: 'Demo User', plan: 'pro' }]),
    [{ to_number: '+15550101001', custom_variables: { name: 'Demo User', plan: 'pro' } }],
  );
});

test('batches never exceed the cap', () => {
  const contacts = Array.from({ length: 2500 }, (_, index) => ({ to_number: `+1555010${String(index).padStart(4, '0')}` }));
  assert.deepEqual(batched(contacts, 1000).map((batch) => batch.length), [1000, 1000, 500]);
});

test('rejects an invalid phone number', () => {
  assert.throws(() => parseContacts('phone_number\n5550101001'), /invalid phone_number/);
});

test('rotation numbers get ordered sequences', () => {
  const payload = buildCreatePayload(options({ rotate: '177,178' }), '177');
  assert.deepEqual((payload.rotation as { numbers: unknown }).numbers, [
    { phone_number_id: 177, sequence: 10 },
    { phone_number_id: 178, sequence: 20 },
  ]);
});

test('conditions parse column and value', () => {
  assert.deepEqual(parseConditions(['plan=pro']), [{ column: 'plan', operator: 'equals', value: 'pro' }]);
  assert.throws(() => parseConditions(['plan']), /column=value/);
});

test('a plain create is a draft', () => {
  const payload = buildCreatePayload(options(), '177');
  assert.equal(payload.save_as_draft, true);
  assert.ok(!('rotation' in payload));
  assert.ok(!('call_conditions' in payload));
});
