// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

const publicApiOrigin = "https://omnidim.io";

export function sessionEndpoint() {
  return new URL("/api/v1/sessions/create", publicApiOrigin).toString();
}

export function agentEndpoint(agentId: number) {
  return new URL(`/api/v1/agents/${agentId}`, publicApiOrigin).toString();
}
