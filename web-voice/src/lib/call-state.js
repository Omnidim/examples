export function isInCall(state) {
  return state === "connecting" || state === "active";
}

export function getStatusLabel(state, muted) {
  if (state === "ready") return "Ready to connect";
  if (state === "connecting") return "Connecting";
  if (state === "active") return muted ? "Microphone muted" : "Live";
  if (state === "ended") return "Call ended";
  return "Connection issue";
}
