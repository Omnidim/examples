import assert from "node:assert/strict";
import test from "node:test";
import { customerFor, reserveAppointment, slotsFor } from "../src/server.js";

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
