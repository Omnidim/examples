import assert from "node:assert/strict";
import test from "node:test";
import { getStatusLabel, isInCall } from "../src/lib/call-state.js";
import { requestMicrophonePermission } from "../src/lib/microphone.js";
import { applyTranscriptSnapshot } from "../src/lib/transcript.js";

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

test("cumulative agent snapshots replace the visible line", () => {
  const initial = [{ id: "agent-1", role: "agent", text: "Thank you", final: false }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "agent", text: "Thank you for calling", final: false },
    () => "agent-2",
  );

  assert.deepEqual(updated, [{ id: "agent-1", role: "agent", text: "Thank you for calling", final: false }]);
});

test("a cumulative agent snapshot also replaces a finalized interim message", () => {
  const initial = [{ id: "agent-1", role: "agent", text: "Thank you", final: true }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "agent", text: "Thank you for calling", final: true },
    () => "agent-2",
  );

  assert.deepEqual(updated, [{ id: "agent-1", role: "agent", text: "Thank you for calling", final: true }]);
});

test("cumulative user snapshots replace the visible line", () => {
  const initial = [{ id: "user-1", role: "user", text: "I would", final: false }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "user", text: "I would like to discuss", final: false },
    () => "user-2",
  );

  assert.deepEqual(updated, [{ id: "user-1", role: "user", text: "I would like to discuss", final: false }]);
});

test("revised user snapshots keep one open transcript line", () => {
  const initial = [{ id: "user-1", role: "user", text: "Hey, Arun. How are you?", final: false }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "user", text: "Now tell me how you are doing?", final: false },
    () => "user-2",
  );

  assert.deepEqual(updated, [{ id: "user-1", role: "user", text: "Now tell me how you are doing?", final: false }]);
});

test("the final user result replaces the open transcript line", () => {
  const initial = [{ id: "user-1", role: "user", text: "Now tell me", final: false }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "user", text: "Hey, Arun. How are you? Now tell me how you are doing?", final: true },
    () => "user-2",
  );

  assert.deepEqual(updated, [{ id: "user-1", role: "user", text: "Hey, Arun. How are you? Now tell me how you are doing?", final: true }]);
});

test("a finalized user turn is not overwritten by a new turn from the same speaker", () => {
  const initial = [{ id: "user-1", role: "user", text: "Thank you for calling.", final: true }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "user", text: "Thank you again. What can I help with?", final: false },
    () => "user-2",
  );

  assert.equal(updated.length, 2);
  assert.equal(updated[1].id, "user-2");
});

test("a new speaker starts a new transcript line", () => {
  const initial = [{ id: "agent-1", role: "agent", text: "How can I help?", final: true }];
  const updated = applyTranscriptSnapshot(
    initial,
    { role: "user", text: "I need a payment plan.", final: true },
    () => "user-2",
  );

  assert.equal(updated.length, 2);
  assert.equal(updated[1].id, "user-2");
});

test("microphone preflight releases the permission probe stream", async () => {
  let stopped = false;
  await requestMicrophonePermission({
    getUserMedia: async () => ({ getTracks: () => [{ stop: () => { stopped = true; } }] }),
  });

  assert.equal(stopped, true);
});
