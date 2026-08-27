// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

// Drive a bulk-call campaign through its whole lifecycle from the command line.
//
// Each subcommand maps to one API call. Without --live it prints the exact
// request it would send, so you can read the payloads before anything dials.
//
//   create        build the campaign (as a draft, with rotation and filters)
//   add-contacts  feed it a CSV in batches of up to 1000 contacts
//   start         launch a draft
//   status        watch it run
//   concurrency   change how many calls dial at once, mid-run
//   results       read per-contact outcomes, following the cursor

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const E164_PHONE = /^\+[1-9]\d{7,14}$/;
export const CONTACTS_PER_REQUEST = 1000; // the API caps one add-contacts request at 1000 rows

export type Contact = Record<string, string>;

export type CreateOptions = {
  name: string;
  botId?: number;
  concurrency: number;
  condition: string[];
  rotate?: string;
  callsPerNumber: number;
};

export function parseContacts(csv: string): Contact[] {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  const headers = headerLine?.split(',').map((header) => header.trim()) ?? [];
  if (!headers.includes('phone_number')) {
    throw new Error('CSV must include a phone_number column.');
  }

  return rows.filter(Boolean).map((row, index) => {
    const values = row.split(',').map((value) => value.trim());
    const contact = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? ''])) as Contact;
    if (!E164_PHONE.test(contact.phone_number ?? '')) {
      throw new Error(`Row ${index + 2} has an invalid phone_number. Use E.164 format, for example +15551234567.`);
    }
    return contact;
  });
}

// Create-time rows are flat: phone_number plus loose variable keys. The
// add-contact endpoints instead take to_number with the variables inside an
// explicit custom_variables object. This is where that translation happens.
export function asWebhookContacts(contacts: Contact[]): Record<string, unknown>[] {
  return contacts.map((contact) => ({
    to_number: contact.phone_number,
    custom_variables: Object.fromEntries(
      Object.entries(contact).filter(([key, value]) => key !== 'phone_number' && value),
    ),
  }));
}

export function batched<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }
  return batches;
}

// Each --condition is column=value, matched with the equals operator.
export function parseConditions(pairs: string[]): Record<string, string>[] {
  return pairs.map((pair) => {
    const separator = pair.indexOf('=');
    const column = pair.slice(0, separator < 0 ? 0 : separator);
    const value = separator < 0 ? '' : pair.slice(separator + 1);
    if (separator < 0 || !column || !value) {
      throw new Error(`--condition takes column=value, got '${pair}'.`);
    }
    return { column, operator: 'equals', value };
  });
}

export function buildCreatePayload(options: CreateOptions, phoneNumberId: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: options.name,
    phone_number_id: phoneNumberId,
    save_as_draft: true,
    concurrent_call_limit: options.concurrency,
  };
  if (options.botId) payload.bot_id = options.botId;
  if (options.condition.length > 0) payload.call_conditions = parseConditions(options.condition);
  if (options.rotate) {
    const numbers = options.rotate.split(',').map(Number);
    payload.rotation = {
      numbers: numbers.map((numberId, position) => ({ phone_number_id: numberId, sequence: (position + 1) * 10 })),
      strategy: 'fixed_count',
      calls_per_number: options.callsPerNumber,
    };
  }
  return payload;
}

async function send(
  method: string,
  path: string,
  payload: Record<string, unknown> | null,
  live: boolean,
  query?: Record<string, string>,
): Promise<void> {
  const baseUrl = process.env.OMNIDIM_API_BASE_URL ?? 'https://omnidim.io/api/v1';
  let url = `${baseUrl}${path}`;
  if (query) url += '?' + new URLSearchParams(query).toString();
  const plan: Record<string, unknown> = { request: `${method} ${url}` };
  if (payload !== null) plan.payload = payload;
  if (!live) {
    console.log(JSON.stringify({ mode: 'dry-run', ...plan }, null, 2));
    return;
  }

  const apiKey = process.env.OMNIDIM_API_KEY;
  if (!apiKey) throw new Error('Set OMNIDIM_API_KEY before using --live.');
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: payload !== null ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
  console.log(JSON.stringify(await response.json(), null, 2));
}

async function main(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      live: { type: 'boolean', default: false },
      name: { type: 'string', default: 'Bulk campaign' },
      'bot-id': { type: 'string' },
      concurrency: { type: 'string', default: '1' },
      condition: { type: 'string', multiple: true, default: [] },
      rotate: { type: 'string' },
      'calls-per-number': { type: 'string', default: '50' },
      'call-status': { type: 'string' },
      cursor: { type: 'string' },
      pagesize: { type: 'string', default: '50' },
    },
  });
  const [command, ...rest] = positionals;

  if (command === 'create') {
    const phoneNumberId = process.env.OMNIDIM_PHONE_NUMBER_ID ?? 'YOUR_PHONE_NUMBER_ID';
    const options: CreateOptions = {
      name: values.name,
      botId: values['bot-id'] ? Number(values['bot-id']) : undefined,
      concurrency: Number(values.concurrency),
      condition: values.condition,
      rotate: values.rotate,
      callsPerNumber: Number(values['calls-per-number']),
    };
    await send('POST', '/calls/bulk_call/create', buildCreatePayload(options, phoneNumberId), values.live);
  } else if (command === 'add-contacts') {
    const [campaignId, csvPath] = rest;
    if (!campaignId || !csvPath) throw new Error('add-contacts takes a campaign id and a CSV path.');
    const contacts = asWebhookContacts(parseContacts(await readFile(csvPath, 'utf8')));
    for (const batch of batched(contacts, CONTACTS_PER_REQUEST)) {
      await send('POST', `/calls/bulk_call/${campaignId}/add_contacts`, { contacts: batch }, values.live);
    }
  } else if (command === 'start') {
    const [campaignId] = rest;
    if (!campaignId) throw new Error('start takes a campaign id.');
    await send('POST', `/calls/bulk_call/${campaignId}/start`, {}, values.live);
  } else if (command === 'status') {
    const [campaignId] = rest;
    if (!campaignId) throw new Error('status takes a campaign id.');
    await send('GET', `/bulk-call/${campaignId}/live-status`, null, values.live);
  } else if (command === 'concurrency') {
    const [campaignId, limit] = rest;
    if (!campaignId || !limit) throw new Error('concurrency takes a campaign id and a limit.');
    await send('PUT', `/calls/bulk_call/${campaignId}/concurrency`, { concurrent_call_limit: Number(limit) }, values.live);
  } else if (command === 'results') {
    const [campaignId] = rest;
    if (!campaignId) throw new Error('results takes a campaign id.');
    const query: Record<string, string> = { pagesize: values.pagesize };
    if (values['call-status']) query.call_status = values['call-status'];
    if (values.cursor) query.cursor = values.cursor;
    await send('GET', `/calls/bulk_call/${campaignId}/lines`, null, values.live, query);
  } else {
    throw new Error('Provide a subcommand: create, add-contacts, start, status, concurrency, or results.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
