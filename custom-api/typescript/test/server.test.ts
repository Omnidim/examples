// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { customerFor, handler, reserveAppointment, slotsFor } from "../src/server.js";

test("returns a fixture customer", () => {
  assert.equal(customerFor("+15551234567")?.name, "Ravi Shah");
  assert.equal(customerFor("+15550000000"), undefined);
});

test("reserves an available appointment only once", () => {
  const slot = slotsFor("2026-09-04")?.[0];
  assert.ok(slot);
  assert.equal(reserveAppointment("+15551234567", slot)?.timeSlot, slot);
  assert.equal(reserveAppointment("+15551234567", slot), undefined);
});

test("rejects non-string appointment fields as a missing-field error", async () => {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/appointments`, {
      method: "POST",
      body: JSON.stringify({ customerPhone: 123, timeSlot: 456 })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "customerPhone_and_timeSlot_are_required" });
  } finally {
    server.close();
  }
});
