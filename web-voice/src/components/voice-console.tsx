// Copyright (c) 2026 OmniDimension
// SPDX-License-Identifier: MIT
// Part of https://github.com/Omnidim/examples

"use client";

import { useEffect, useRef, useState } from "react";
import { getStatusLabel, isInCall } from "@/lib/call-state";
import type { AgentContext } from "@/lib/agent-context";
import { requestMicrophonePermission } from "@/lib/microphone";
import { applyTranscriptSnapshot } from "@/lib/transcript";

type CallState = "ready" | "connecting" | "active" | "ended" | "error";
type Role = "agent" | "user";
type TranscriptLine = { id: string; role: Role; text: string; final?: boolean };

type SessionHandle = {
  on: (event: "status" | "transcript" | "error", callback: (value: unknown) => void) => void;
  start: (options: { wsUrl: string }) => Promise<void>;
  mute: (muted: boolean) => void;
  stop: () => void;
};

function initialTranscript(agent: AgentContext | null): TranscriptLine[] {
  const greeting = agent?.welcomeMessage ?? "Hi, I’m the OmniDimension assistant. How can I help today?";
  return [{ id: "welcome", role: "agent", text: greeting, final: true }];
}

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

export function VoiceConsole({ agent }: { agent: AgentContext | null }) {
  const [callState, setCallState] = useState<CallState>("ready");
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<"mock" | "live">(agent ? "live" : "mock");
  const [transcript, setTranscript] = useState<TranscriptLine[]>(() => initialTranscript(agent));
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<SessionHandle | null>(null);
  const mockTimers = useRef<number[]>([]);
  const transcriptSequence = useRef(0);
  const transcriptViewportRef = useRef<HTMLDivElement | null>(null);

  const clearMockTimers = () => {
    mockTimers.current.forEach((timer) => window.clearTimeout(timer));
    mockTimers.current = [];
  };

  useEffect(() => () => {
    clearMockTimers();
    sessionRef.current?.stop();
  }, []);

  useEffect(() => {
    const viewport = transcriptViewportRef.current;
    if (!viewport) return;

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (distanceFromBottom <= 48) viewport.scrollTop = viewport.scrollHeight;
  }, [transcript, error]);

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
    setTranscript(initialTranscript(agent));
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
      setTranscript((current) => applyTranscriptSnapshot(
        current,
        line,
        (role: Role) => `${role}-${++transcriptSequence.current}`,
      ));
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
    setTranscript(initialTranscript(agent));

    try {
      // Ask before creating a live session, while the browser still has the
      // user gesture that opened the call. A denied microphone never creates
      // a billable session.
      if (agent) await requestMicrophonePermission(navigator.mediaDevices);

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
  const callDescription = callState === "connecting" && agent
    ? "Allow microphone access to join this call."
    : callState === "active" && agent
      ? `You are connected to ${agent.name}.`
      : agent
        ? `${agent.name} is ready. Your microphone stays off until you start the call.`
        : "Local simulation. No microphone or API key needed.";

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
          <div className="status-line"><span className={`status-pill status-${callState}`}>{statusLabel}</span></div>
          <p>{callDescription}</p>
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
        <div className="panel-header"><span>{agent ? agent.name : "Conversation"}</span><span>{mode === "mock" ? "Demo" : "Live session"}</span></div>
        <div className="transcript" ref={transcriptViewportRef}>
          {agent ? <p className="agent-context">{[agent.voiceName, ...agent.languages].filter(Boolean).join(" · ")}</p> : null}
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
