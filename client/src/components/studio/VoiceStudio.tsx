import React, { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, RotateCcw, ArrowLeft, FlaskConical, ShieldCheck, Globe } from "lucide-react";
import VoiceOrb from "@/components/voice/VoiceOrb";
import ConversationPanel from "@/components/conversation/ConversationPanel";
import { ComplianceInspector } from "@/components/sections/ComplianceInspector";
import type { Constraints, FlowEvent, Generation, ToolRun, TranscriptMessage, VoiceMetrics, VoicePhase } from "@/types/voice";

interface VoiceStudioProps {
  onBackToLanding: () => void;
  phase: VoicePhase;
  generationId: number;
  generations: Generation[];
  messages: TranscriptMessage[];
  events: FlowEvent[];
  tools: ToolRun[];
  metrics: VoiceMetrics;
  constraints: Constraints;
  failureFlags: { slowApi: boolean; llmDelay: boolean; ttsInterrupt: boolean; multiInterrupt: boolean };
  toggleFlag: (key: "slowApi" | "llmDelay" | "ttsInterrupt" | "multiInterrupt") => void;
  draft: string;
  setDraft: (value: string) => void;
  liveText: string;
  isDemoRunning: boolean;
  isConnected: boolean;
  toggleMicrophone: () => void;
  submitInstruction: (text?: string) => void;
  resetSession: () => void;
  runDemo: () => void;
  selectedLanguage: string;
  setSelectedLanguage: (value: string) => void;
  isPaused: boolean;
  togglePause: () => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  onBackToLanding,
  phase,
  generationId,
  generations,
  messages,
  events,
  tools,
  metrics,
  constraints,
  failureFlags,
  toggleFlag,
  draft,
  setDraft,
  liveText,
  isDemoRunning,
  isConnected,
  toggleMicrophone,
  submitInstruction,
  resetSession,
  runDemo,
  selectedLanguage,
  setSelectedLanguage,
  isPaused,
  togglePause,
}) => {
  const [showFailureLab, setShowFailureLab] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated Background Particle Soundwaves Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let wavePhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      wavePhase += 0.02;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(76, 201, 240, 0.08)";
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x += 10) {
        const y = height / 2 + Math.sin(x * 0.004 + wavePhase) * 60 + Math.cos(x * 0.008) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(224, 122, 95, 0.06)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 10) {
        const y = height / 2 + Math.cos(x * 0.005 - wavePhase) * 70;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(76, 201, 240, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleResetClick = () => {
    resetSession();
    setResetConfirmed(true);
    setTimeout(() => setResetConfirmed(false), 2000);
  };

  return (
    <div className="voice-studio-container">
      {/* Background canvas soundwave animation */}
      <canvas ref={canvasRef} className="studio-particle-canvas" />

      {/* Top Floating Glass Header */}
      <header className="studio-navbar">
        <button className="icon-pill-btn" onClick={onBackToLanding} title="Back to Landing Page">
          <ArrowLeft size={16} />
          <span>Landing Page</span>
        </button>

        <div className="brand-pill">
          <img src="/logo.png" alt="FlowVoice Logo" className="brand-logo-img" />
          <div className="brand-title">
            FLOW<span>VOICE</span> STUDIO
          </div>
        </div>

        <div className="studio-header-actions">
          <div className="icon-pill-btn language-selector-pill" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Globe size={15} style={{ color: "var(--accent-cyan)" }} />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-select-dropdown"
              title="Select Synthesis & STT Language"
            >
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
              <option value="bn">Bengali (bn)</option>
              <option value="ta">Tamil (ta)</option>
              <option value="te">Telugu (te)</option>
              <option value="ja">Japanese (ja)</option>
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
            </select>
          </div>

          <button className="icon-pill-btn" onClick={() => setShowFailureLab((prev) => !prev)}>
            <FlaskConical size={15} style={{ color: "var(--accent-terracotta)" }} />
            <span>Failure Lab</span>
          </button>

          <button className="icon-pill-btn" onClick={() => setShowSpecModal((prev) => !prev)}>
            <ShieldCheck size={15} style={{ color: "var(--accent-sage)" }} />
            <span>Rime Spec</span>
          </button>
        </div>
      </header>

      {/* Central Voice Stage with Animated Background */}
      <div className="studio-hero-stage">
        <div className="central-voice-orb-wrapper">
          <VoiceOrb
            phase={isPaused ? "INTERRUPTED" : phase}
            generationId={generationId}
            onClick={() => (phase === "LISTENING" ? toggleMicrophone() : submitInstruction("Stop — search near Salt Lake instead"))}
          />
        </div>

        {/* Central Controls: Mic, Pause, Reset */}
        <div className="central-controls-bar">
          <button
            className={`studio-control-btn mic-btn ${isConnected ? "active" : ""}`}
            onClick={toggleMicrophone}
            title={isConnected ? "Disconnect Microphone" : "Start Live Voice"}
          >
            <Mic size={22} />
            <span>{isConnected ? "Mic Active (Click to Stop)" : "Click Mic to Start"}</span>
          </button>

          <button
            className={`studio-control-btn pause-btn ${isPaused ? "paused" : ""}`}
            onClick={togglePause}
            title="Pause Audio Stream"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
            <span>{isPaused ? "Resume Audio" : "Pause Audio"}</span>
          </button>

          <button
            className={`studio-control-btn reset-btn ${resetConfirmed ? "confirmed" : ""}`}
            onClick={handleResetClick}
            title="Clear Conversation History & Reset Memory"
          >
            <RotateCcw size={20} className={resetConfirmed ? "spin-once" : ""} />
            <span>{resetConfirmed ? "Memory Cleared ✓" : "Reset History"}</span>
          </button>
        </div>
      </div>

      {/* Centered Beautiful Conversation Container */}
      <div className="centered-studio-conversation">
        <div className="glass-panel-wrapper">
          <ConversationPanel
            messages={messages}
            draft={draft}
            liveText={liveText}
            setDraft={setDraft}
            onSubmit={() => submitInstruction()}
            onPreset={(presetText) => submitInstruction(presetText)}
          />
        </div>
      </div>

      {/* Failure Lab Drawer Modal */}
      {showFailureLab && (
        <div className="drawer-overlay" onClick={() => setShowFailureLab(false)}>
          <div className="drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-card-header">
              <h3>
                <FlaskConical size={18} style={{ color: "var(--accent-terracotta)" }} />
                <span>Failure Lab & Stress Injector</span>
              </h3>
              <button className="icon-pill-btn" onClick={() => setShowFailureLab(false)}>✕</button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "8px 0 16px" }}>
              Inject latency or force barge-in interruptions to observe generation fencing in real time.
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              {(
                [
                  ["slowApi", "Slow Places API (5s delay)"],
                  ["llmDelay", "LLM Reasoning Latency"],
                  ["ttsInterrupt", "TTS Stream Interruption"],
                  ["multiInterrupt", "Multiple Rapid Barge-Ins"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                  <button className={`switch ${failureFlags[key] ? "on" : ""}`} onClick={() => toggleFlag(key)}>
                    <span />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rime PS Spec Modal */}
      {showSpecModal && (
        <div className="drawer-overlay" onClick={() => setShowSpecModal(false)}>
          <div className="drawer-card large" onClick={(e) => e.stopPropagation()}>
            <div className="panel-card-header">
              <h3>
                <ShieldCheck size={18} style={{ color: "var(--accent-sage)" }} />
                <span>Rime Hackathon Compliance Specification</span>
              </h3>
              <button className="icon-pill-btn" onClick={() => setShowSpecModal(false)}>✕</button>
            </div>
            <ComplianceInspector />
          </div>
        </div>
      )}
    </div>
  );
};
