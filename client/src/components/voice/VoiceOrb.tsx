import React from "react";
import { Mic, Radio, Volume2, Zap } from "lucide-react";
import type { VoicePhase } from "@/types/voice";

interface VoiceOrbProps {
  phase: VoicePhase;
  generationId: number;
  onClick: () => void;
  disabled?: boolean;
}

const phaseCopy: Record<VoicePhase, { label: string; sublabel: string; color: string }> = {
  LISTENING: { label: "Listening", sublabel: "Tap central mic or speak to interrupt", color: "var(--accent-cyan)" },
  THINKING: { label: "Thinking", sublabel: "Reconciling instruction delta", color: "var(--accent-gold)" },
  SEARCHING: { label: "Searching", sublabel: "Executing query parameters", color: "var(--accent-gold)" },
  SPEAKING: { label: "Speaking", sublabel: "Streaming Rime TTS PCM", color: "var(--accent-sage)" },
  INTERRUPTED: { label: "Barge-in!", sublabel: "Audio stopped <140ms", color: "var(--accent-terracotta)" },
  RECOVERING: { label: "Recovering", sublabel: "Latest instruction wins", color: "var(--accent-sand)" },
};

export default function VoiceOrb({ phase, onClick, disabled }: VoiceOrbProps) {
  const isListening = phase === "LISTENING";
  const isSpeaking = phase === "SPEAKING";
  const isInterrupted = phase === "INTERRUPTED";
  const copy = phaseCopy[phase];

  return (
    <div className={`central-mic-stage phase-${phase}`}>
      {/* Breathing Halo Rings */}
      <div className="mic-pulse-halo" style={{ borderColor: copy.color }}>
        <span className="halo-ring ring-1" style={{ borderColor: copy.color }} />
        <span className="halo-ring ring-2" style={{ borderColor: copy.color }} />
      </div>

      {/* Main Central Interactive Microphone Orb */}
      <button
        className="main-center-mic-orb"
        onClick={onClick}
        disabled={disabled}
        aria-label="Toggle Microphone"
        style={{
          borderColor: copy.color,
          boxShadow: `0 0 40px ${copy.color}40, inset 0 0 20px ${copy.color}20`,
        }}
      >
        {isInterrupted ? (
          <Zap size={44} style={{ color: "var(--accent-terracotta)" }} />
        ) : isSpeaking ? (
          <Volume2 size={44} style={{ color: "var(--accent-sage)" }} />
        ) : isListening ? (
          <Mic size={44} style={{ color: "var(--accent-cyan)" }} />
        ) : (
          <Radio size={44} style={{ color: "var(--accent-gold)" }} />
        )}
      </button>

      {/* Centered Status Label */}
      <div className="mic-status-label">
        <h2 className="mic-phase-title">{copy.label}</h2>
        <p className="mic-phase-subtitle">{copy.sublabel}</p>
      </div>
    </div>
  );
}
