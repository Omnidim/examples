export type PostCallEvent = {
  call_id: number;
  bot_id: number;
  bot_name: string;
  phone_number: string;
  call_date: string;
  user_email: string;
  call_report?: {
    summary?: string;
    sentiment?: string;
    extracted_variables?: Record<string, unknown>;
    full_conversation?: string;
    interactions?: Array<Record<string, unknown>>;
  };
};

export function parsePostCallEvent(value: unknown): PostCallEvent | undefined {
  if (!value || typeof value !== "object") return undefined;
  const event = value as Record<string, unknown>;
  const requiredStrings = ["bot_name", "phone_number", "call_date", "user_email"];
  if (typeof event.call_id !== "number" || typeof event.bot_id !== "number") return undefined;
  if (requiredStrings.some((key) => typeof event[key] !== "string")) return undefined;
  if (event.call_report !== undefined && (typeof event.call_report !== "object" || event.call_report === null || Array.isArray(event.call_report))) return undefined;
  return event as PostCallEvent;
}

export function eventSummary(event: PostCallEvent): Record<string, unknown> {
  return {
    callId: event.call_id,
    agent: event.bot_name,
    phoneNumber: event.phone_number,
    callDate: event.call_date,
    sentiment: event.call_report?.sentiment ?? null,
    extractedVariables: event.call_report?.extracted_variables ?? {}
  };
}
