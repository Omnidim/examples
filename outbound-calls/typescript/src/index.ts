// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

import { readFile } from 'node:fs/promises';

export type Contact = {
  phone_number: string;
  name?: string;
  [key: string]: string | undefined;
};

type Arguments = {
  csvPath: string;
  live: boolean;
  name: string;
};

const E164_PHONE = /^\+[1-9]\d{7,14}$/;

export function parseArguments(args: string[]): Arguments {
  const csvPath = args.find((argument) => !argument.startsWith('--'));
  if (!csvPath) throw new Error('Provide a CSV file path.');

  const nameIndex = args.indexOf('--name');
  return {
    csvPath,
    live: args.includes('--live'),
    name: nameIndex >= 0 ? (args[nameIndex + 1] ?? '') : 'Outbound campaign',
  };
}

export function parseContacts(csv: string): Contact[] {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  const headers = headerLine?.split(',').map((header) => header.trim()) ?? [];
  if (!headers.includes('phone_number')) {
    throw new Error('CSV must include a phone_number column.');
  }

  return rows.filter(Boolean).map((row, index) => {
    const values = row.split(',').map((value) => value.trim());
    const fields = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? ''])) as Record<string, string>;
    const phoneNumber = fields.phone_number;
    if (!E164_PHONE.test(phoneNumber)) {
      throw new Error(`Row ${index + 2} has an invalid phone_number. Use E.164 format, for example +15551234567.`);
    }
    return { ...fields, phone_number: phoneNumber };
  });
}

export async function createCampaign(contacts: Contact[], name: string): Promise<unknown> {
  const apiKey = process.env.OMNIDIM_API_KEY;
  const phoneNumberId = process.env.OMNIDIM_PHONE_NUMBER_ID;
  if (!apiKey || !phoneNumberId) {
    throw new Error('Set OMNIDIM_API_KEY and OMNIDIM_PHONE_NUMBER_ID before using --live.');
  }

  const baseUrl = process.env.OMNIDIM_API_BASE_URL ?? 'https://omnidim.io/api/v1';
  const response = await fetch(`${baseUrl}/calls/bulk_call/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, phone_number_id: Number(phoneNumberId), contact_list: contacts }),
  });

  if (!response.ok) throw new Error(`Campaign creation failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const contacts = parseContacts(await readFile(options.csvPath, 'utf8'));
  console.log(JSON.stringify({ mode: options.live ? 'live' : 'dry-run', name: options.name, contacts }, null, 2));

  if (!options.live) return;
  console.log(JSON.stringify(await createCampaign(contacts, options.name), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
