import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parsePostCallEvent, eventSummary } from "./event.js";

function send(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function allowedForwardingHosts(): Set<string> {
  return new Set(
    (process.env.FORWARD_URL_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function forwardingUrl(): URL | null {
  const target = process.env.FORWARD_URL;
  if (!target) return null;

  const url = new URL(target);
  const allowedHosts = allowedForwardingHosts();
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error("FORWARD_URL must use HTTPS and a host listed in FORWARD_URL_ALLOWED_HOSTS");
  }
  return url;
}

async function forward(event: unknown): Promise<void> {
  const url = forwardingUrl();
  if (!url) return;
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event) });
  if (!response.ok) throw new Error(`Forwarding failed with ${response.status}`);
}

export function handler(request: IncomingMessage, response: ServerResponse): void {
  if (request.method === "GET" && request.url === "/healthz") return send(response, 200, { ok: true });
  if (request.method !== "POST" || request.url !== "/webhooks/omnidimension") return send(response, 404, { error: "not_found" });
  void readJson(request).then(async (payload) => {
    const event = parsePostCallEvent(payload);
    if (!event) return send(response, 400, { error: "invalid_post_call_payload" });
    console.info(JSON.stringify({ event: "post_call_received", ...eventSummary(event) }));
    await forward(event);
    return send(response, 202, { accepted: true, callId: event.call_id });
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "post_call_processing_failed");
    send(response, 502, { error: "post_call_processing_failed" });
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = Number(process.env.PORT ?? 8788);
  createServer(handler).listen(port, () => console.log(`Webhook receiver listening on http://localhost:${port}`));
}
