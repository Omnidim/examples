// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

const DEFAULT_API_BASE_URL = "https://omnidim.io";

export function apiBaseUrl() {
  return process.env.OMNIDIM_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export function sessionEndpoint() {
  return new URL("/api/v1/sessions/create", apiBaseUrl()).toString();
}

export function agentEndpoint(agentId: number) {
  return new URL(`/api/v1/agents/${agentId}`, apiBaseUrl()).toString();
}

export function sessionWebSocketUrl(sessionUrl: string) {
  const localBaseUrl = process.env.OMNIDIM_LOCAL_WEB_SOCKET_BASE_URL;
  if (!localBaseUrl) return sessionUrl;

  const session = new URL(sessionUrl);
  const localBase = new URL(localBaseUrl);

  if (localBase.protocol !== "ws:" && localBase.protocol !== "wss:") {
    throw new Error("OMNIDIM_LOCAL_WEB_SOCKET_BASE_URL must use ws:// or wss://.");
  }

  localBase.pathname = session.pathname;
  localBase.search = session.search;
  return localBase.toString();
}
