import assert from "node:assert/strict";
import test from "node:test";
import { getStatusLabel, isInCall } from "../src/lib/call-state.js";

test("only connecting and active calls expose in-call controls", () => {
  assert.equal(isInCall("ready"), false);
  assert.equal(isInCall("connecting"), true);
  assert.equal(isInCall("active"), true);
  assert.equal(isInCall("ended"), false);
  assert.equal(isInCall("error"), false);
});

test("the visible status describes mute and terminal call states", () => {
  assert.equal(getStatusLabel("active", false), "Live");
  assert.equal(getStatusLabel("active", true), "Microphone muted");
  assert.equal(getStatusLabel("ended", false), "Call ended");
  assert.equal(getStatusLabel("error", false), "Connection issue");
});
