import assert from "node:assert/strict";
import test from "node:test";
import fixture from "../../fixtures/post-call.json" with { type: "json" };
import { eventSummary, parsePostCallEvent } from "../src/event.js";
import { forwardingUrl } from "../src/server.js";

test("parses the documented post-call fixture", () => {
  const event = parsePostCallEvent(fixture);
  assert.ok(event);
  assert.deepEqual(eventSummary(event).extractedVariables, { name: "Ravi", appointment_type: "Dental Checkup" });
});

test("rejects a payload without call identifiers", () => {
  assert.equal(parsePostCallEvent({ bot_name: "Agent" }), undefined);
});

test("allows only HTTPS forwarding targets on the configured allowlist", () => {
  const original = process.env.FORWARD_URL;
  const originalAllowedHosts = process.env.FORWARD_URL_ALLOWED_HOSTS;
  try {
    process.env.FORWARD_URL = "https://hooks.example.com/omnidimension";
    process.env.FORWARD_URL_ALLOWED_HOSTS = "hooks.example.com";
    assert.equal(forwardingUrl()?.hostname, "hooks.example.com");

    process.env.FORWARD_URL = "http://hooks.example.com/omnidimension";
    assert.throws(forwardingUrl, /HTTPS/);

    process.env.FORWARD_URL = "https://127.0.0.1/internal";
    assert.throws(forwardingUrl, /FORWARD_URL_ALLOWED_HOSTS/);
  } finally {
    if (original === undefined) delete process.env.FORWARD_URL;
    else process.env.FORWARD_URL = original;
    if (originalAllowedHosts === undefined) delete process.env.FORWARD_URL_ALLOWED_HOSTS;
    else process.env.FORWARD_URL_ALLOWED_HOSTS = originalAllowedHosts;
  }
});
