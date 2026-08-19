// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

/**
 * Requests microphone access while the user is still in the click action.
 * OmniDimension's WebSession opens its own capture stream immediately after.
 */
export async function requestMicrophonePermission(mediaDevices) {
  if (!mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support microphone access.");
  }

  const stream = await mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}
