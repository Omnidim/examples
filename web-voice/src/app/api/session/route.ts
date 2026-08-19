// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/auth";
import { sessionEndpoint } from "../../../lib/session-url";

function isLiveMode() {
  return process.env.NEXT_PUBLIC_OMNIDIM_MODE === "live";
}

export async function POST(request: Request) {
  if (!isLiveMode()) {
    return NextResponse.json({ mode: "mock" as const });
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { message: "Live sessions require an authenticated application user. Configure src/lib/auth.ts first." },
      { status: 401 },
    );
  }

  const apiKey = process.env.OMNIDIM_API_KEY;
  const agentId = Number(process.env.OMNIDIM_AGENT_ID);

  if (!apiKey || !Number.isSafeInteger(agentId) || agentId <= 0) {
    return NextResponse.json(
      { message: "Live mode needs OMNIDIM_API_KEY and a positive OMNIDIM_AGENT_ID on the server." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(sessionEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        type: "voice",
        custom_variables: { name: "Website visitor", user_id: user.id },
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as { ws_url?: unknown; message?: unknown } | null;

    if (!response.ok || typeof data?.ws_url !== "string") {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Unable to start a voice session." },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json({ mode: "live" as const, wsUrl: data.ws_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach OmniDimension. Check your connection and try again.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
