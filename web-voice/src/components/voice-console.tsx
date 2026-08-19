"use client";

import { useEffect, useRef, useState } from "react";
import { getStatusLabel, isInCall } from "@/lib/call-state";

type CallState = "ready" | "connecting" | "active" | "ended" | "error";
type Role = "agent" | "user";
type TranscriptLine = { id: string; role: Role; text: string; final?: boolean };

type SessionHandle = {
  on: (event: "status" | "transcript" | "error", callback: (value: unknown) => void) => void;
  start: (options: { wsUrl: string }) => Promise<void>;
  mute: (muted: boolean) => void;
  stop: () => void;
};

const initialTranscript: TranscriptLine[] = [
  { id: "welcome", role: "agent", text: "Hi, I’m the OmniDimension assistant. How can I help today?", final: true },
];

function parseTranscript(value: unknown): { role: Role; text: string; final: boolean } | null {
  if (!value || typeof value !== "object") return null;
  const event = value as { role?: unknown; text?: unknown; final?: unknown };
  if ((event.role !== "agent" && event.role !== "user") || typeof event.text !== "string") return null;
  return { role: event.role, text: event.text, final: event.final === true };
}

function readableError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "We could not start the call. Check your microphone permissions and try again.";
}

export function VoiceConsole() {
  const [callState, setCallState] = useState<CallState>("ready");
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<"mock" | "live">("mock");
  const [transcript, setTranscript] = useState<TranscriptLine[]>(initialTranscript);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<SessionHandle | null>(null);
  const mockTimers = useRef<number[]>([]);

  const clearMockTimers = () => {
    mockTimers.current.forEach((timer) => window.clearTimeout(timer));
    mockTimers.current = [];
  };

  useEffect(() => () => {
    clearMockTimers();
    sessionRef.current?.stop();
  }, []);

  const appendMockConversation = () => {
    const timers = [
      window.setTimeout(() => {
        setTranscript((current) => [...current, { id: "visitor", role: "user", text: "I’m looking for a voice agent for my product.", final: true }]);
      }, 1000),
      window.setTimeout(() => {
        setTranscript((current) => [...current, { id: "reply", role: "agent", text: "I can help with that. This interface is using the same call states and transcript pattern as a live Web SDK session.", final: true }]);
      }, 2200),
    ];
    mockTimers.current.push(...timers);
  };

  const startMockCall = () => {
    setMode("mock");
    setCallState("connecting");
    setTranscript(initialTranscript);
    const timer = window.setTimeout(() => {
      setCallState("active");
      appendMockConversation();
    }, 650);
    mockTimers.current.push(timer);
  };

  const startLiveCall = async (wsUrl: string) => {
    setMode("live");
    const { WebSession } = await import("@omnidim-ai/client");
    const session = new WebSession() as SessionHandle;
    sessionRef.current = session;

    session.on("status", (status) => {
      if (status === "connecting") setCallState("connecting");
      if (status === "active") setCallState("active");
      if (status && typeof status === "object" && "state" in status && status.state === "ended") setCallState("ended");
    });
    session.on("transcript", (event) => {
      const line = parseTranscript(event);
      if (!line) return;
      setTranscript((current) => {
        const existing = current.findIndex((item) => item.role === line.role && item.final === false);
        const id = existing === -1 ? `${line.role}-${Date.now()}` : current[existing].id;
        const next = { id, ...line };
        if (existing === -1) return [...current, next];
        const updated = [...current];
        updated[existing] = next;
        return updated;
      });
    });
    session.on("error", (event) => setError(readableError(event)));
    await session.start({ wsUrl });
  };

  const startCall = async () => {
    clearMockTimers();
    sessionRef.current?.stop();
    sessionRef.current = null;
    setMuted(false);
    setError(null);
    setCallState("connecting");
    setTranscript(initialTranscript);

    try {
      const response = await fetch("/api/session", { method: "POST" });
      const data = (await response.json()) as { mode?: "mock" | "live"; wsUrl?: string; message?: string };
      if (!response.ok) throw new Error(data.message ?? "Unable to start a voice session.");
      if (data.mode === "mock") {
        startMockCall();
        return;
      }
      if (!data.wsUrl) throw new Error("The session did not return a connection URL.");
      await startLiveCall(data.wsUrl);
    } catch (startError) {
      setCallState("error");
      setError(readableError(startError));
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    sessionRef.current?.mute(nextMuted);
    setMuted(nextMuted);
  };

  const endCall = () => {
    clearMockTimers();
    sessionRef.current?.stop();
    sessionRef.current = null;
    setMuted(false);
    setCallState("ended");
  };

  const statusLabel = getStatusLabel(callState, muted);
  const activeCall = isInCall(callState);

  return (
    <section className="voice-console" aria-label="Voice call example">
      <div className="call-stage">
        <div className={`orb ${callState === "active" ? "orb-active" : ""} ${muted ? "orb-muted" : ""}`} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="call-meta">
          <div className="status-line"><span className={`status-dot status-${callState}`} />{statusLabel}</div>
          <p>{mode === "mock" ? "Local simulation. No microphone or API key needed." : "Connected to your OmniDimension agent."}</p>
        </div>
        <div className="call-actions">
          {!activeCall ? (
            <button className="primary-action" type="button" onClick={startCall}>
              {callState === "ended" ? "Start another call" : "Start a call"}
            </button>
          ) : (
            <>
              <button className="secondary-action" type="button" onClick={toggleMute} disabled={callState !== "active"}>
                {muted ? "Unmute" : "Mute"}
              </button>
              <button className="end-action" type="button" onClick={endCall}>End call</button>
            </>
          )}
        </div>
      </div>

      <div className="transcript-panel" aria-live="polite">
        <div className="panel-header"><span>Conversation</span><span>{mode === "mock" ? "Demo" : "Live session"}</span></div>
        <div className="transcript">
          {transcript.map((line) => (
            <article className={`transcript-line ${line.role}`} key={line.id}>
              <span>{line.role === "agent" ? "Agent" : "You"}</span>
              <p>{line.text}</p>
            </article>
          ))}
          {error ? <p className="call-error" role="alert">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
