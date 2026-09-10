import { useEffect, useRef } from "react";
import { ArrowUp, Mic, Sparkles, UserRound, MessageSquare } from "lucide-react";
import type { TranscriptMessage } from "@/types/voice";

interface ConversationPanelProps {
  messages: TranscriptMessage[];
  draft: string;
  liveText: string;
  setDraft: (value: string) => void;
  onSubmit: () => void;
  onPreset: (value: string) => void;
}

const presets = [
  "Find coffee shops nearby",
  "Recommend quiet places to work",
  "What is the weather today?",
];

export default function ConversationPanel({
  messages,
  draft,
  liveText,
  setDraft,
  onSubmit,
  onPreset,
}: ConversationPanelProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, liveText]);

  return (
    <section className="conversation-panel-clean">
      {/* Messages List Container */}
      <div className="transcript-box" ref={transcriptRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-conversation-state">
            <div className="empty-icon-orb">
              <MessageSquare size={24} />
            </div>
            <h4>Your conversation starts here</h4>
            <p>Tap the mic above or pick a quick prompt below to speak with FlowVoice.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div className={`chat-bubble-row ${message.role}`} key={message.id}>
              <div className="chat-avatar">
                {message.role === "user" ? <UserRound size={14} /> : <Sparkles size={14} />}
              </div>
              <div className="chat-bubble-content">
                <div className="chat-author">
                  {message.role === "user" ? "You" : "FlowVoice"}
                  <span className="chat-time">{message.time}</span>
                </div>
                <p className="chat-text">{message.text}</p>
              </div>
            </div>
          ))
        )}

        {liveText ? (
          <div className="live-speech-indicator">
            <span className="pulse-dot" />
            <span>{liveText}</span>
          </div>
        ) : null}
      </div>

      {/* Quick Prompt Presets */}
      <div className="quick-presets-row">
        {presets.map((preset) => (
          <button key={preset} className="preset-pill" onClick={() => onPreset(preset)}>
            {preset}
          </button>
        ))}
      </div>

      {/* Modern Composer Input Bar */}
      <div className="composer-bar">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Type an instruction or speak naturally to barge in..."
          className="composer-input"
        />
        <button
          className="send-pill-btn"
          onClick={onSubmit}
          disabled={!draft.trim()}
          title="Send Instruction"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </section>
  );
}
