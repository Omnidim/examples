// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type Customer = { name: string; accountStatus: "active" | "past_due"; renewalDate: string };
type Appointment = { confirmationId: string; customerPhone: string; timeSlot: string };

const customers: Record<string, Customer> = {
  "+15551234567": { name: "Ravi Shah", accountStatus: "active", renewalDate: "2026-12-01" },
  "+15557654321": { name: "Maya Chen", accountStatus: "past_due", renewalDate: "2026-08-31" }
};
const availability: Record<string, string[]> = {
  "2026-09-04": ["2026-09-04T10:00:00Z", "2026-09-04T14:30:00Z"]
};

export function customerFor(phone: string): Customer | undefined {
  return customers[phone];
}

export function slotsFor(date: string): string[] | undefined {
  return availability[date];
}

export function reserveAppointment(customerPhone: string, timeSlot: string): Appointment | undefined {
  const date = timeSlot.slice(0, 10);
  const slots = availability[date];
  if (!customerFor(customerPhone) || !slots?.includes(timeSlot)) return undefined;
  availability[date] = slots.filter((slot) => slot !== timeSlot);
  return { confirmationId: `apt_${Date.now()}`, customerPhone, timeSlot };
}

function send(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : undefined;
}

export function handler(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url ?? "/", "http://localhost");
  const customerMatch = url.pathname.match(/^\/v1\/customers\/([^/]+)$/);

  if (request.method === "GET" && url.pathname === "/healthz") return send(response, 200, { ok: true });
  if (request.method === "GET" && customerMatch) {
    const customer = customerFor(decodeURIComponent(customerMatch[1]));
    return customer ? send(response, 200, customer) : send(response, 404, { error: "customer_not_found" });
  }
  if (request.method === "GET" && url.pathname === "/v1/availability") {
    const date = url.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(response, 400, { error: "date_must_use_yyyy_mm_dd" });
    return send(response, 200, { date, availableSlots: slotsFor(date) ?? [] });
  }
  if (request.method === "POST" && url.pathname === "/v1/appointments") {
    void readJson(request).then((value) => {
      const body = value as Partial<{ customerPhone: string; timeSlot: string }>;
      if (!body.customerPhone || !body.timeSlot) return send(response, 400, { error: "customerPhone_and_timeSlot_are_required" });
      const appointment = reserveAppointment(body.customerPhone, body.timeSlot);
      return appointment ? send(response, 201, appointment) : send(response, 409, { error: "customer_or_slot_not_available" });
    }).catch(() => send(response, 400, { error: "invalid_json" }));
    return;
  }
  return send(response, 404, { error: "not_found" });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = Number(process.env.PORT ?? 8787);
  createServer(handler).listen(port, () => console.log(`Fixture API listening on http://localhost:${port}`));
}
