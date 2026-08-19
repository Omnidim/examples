// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

export type AuthenticatedUser = { id: string };

export async function getAuthenticatedUser(_request: Request): Promise<AuthenticatedUser | null> {
  // Connect this adapter to the server-side session mechanism used by your app.
  // A copied deployment remains blocked until it provides an authenticated user.
  return null;
}
