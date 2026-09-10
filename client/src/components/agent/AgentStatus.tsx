import { Check, CircleDot, Clock3, Cpu, GitBranch, ShieldCheck, X } from "lucide-react";
import type { Generation, VoicePhase } from "@/types/voice";

interface AgentStatusProps {
  phase: VoicePhase;
  generation: Generation;
  generations: Generation[];
}

const pipeline = [
  ["STT", "Deepgram"],
  ["LLM", "OpenRouter"],
  ["TOOL", "Places API"],
  ["TTS", "Rime"],
] as const;

export default function AgentStatus({ phase, generation, generations }: AgentStatusProps) {
  return (
    <section className="panel agent-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">GENERATION CONTROL</span><h3>Agent state machine</h3></div>
        <span className="live-pill"><CircleDot size={12} /> {phase}</span>
      </div>
      <div className="generation-focus">
        <div className="generation-number">#{generation.id}</div>
        <div><strong>{generation.taskId}</strong><p>{generation.instruction}</p></div>
        <span className="active-badge"><Check size={12} /> ACTIVE</span>
      </div>
      <div className="pipeline-list">
        {pipeline.map(([label, provider], index) => {
          const active = (phase === "LISTENING" && index === 0) || (phase === "THINKING" && index === 1) || (phase === "SEARCHING" && index === 2) || (phase === "SPEAKING" && index === 3) || phase === "RECOVERING";
          return <div className={`pipeline-row ${active ? "active" : ""}`} key={label}><span className="pipeline-icon">{active ? <CircleDot size={13} /> : <Check size={13} />}</span><span className="pipeline-label">{label}</span><span className="pipeline-provider">{provider}</span><span className={`pipeline-state ${active ? "hot" : "ready"}`}>{active ? "ACTIVE" : "READY"}</span></div>;
        })}
      </div>
      <div className="generation-history">
        <div className="history-heading"><span>GENERATION HISTORY</span><span><GitBranch size={12} /> parent chain</span></div>
        {generations.slice(-4).reverse().map((item) => <div className="history-row" key={item.id}><span className={`history-dot ${item.status.toLowerCase()}`} /> <strong>GEN #{item.id}</strong><span>{item.status === "INVALIDATED" ? <><X size={12} /> fenced</> : item.status === "ACTIVE" ? <><Check size={12} /> serving</> : <><Clock3 size={12} /> done</>}</span><small>{item.taskId}</small></div>)}
      </div>
      <div className="guardrail-note"><ShieldCheck size={15} /><span>Stale guard active — only generation <strong>#{generation.id}</strong> can reach Rime.</span></div>
    </section>
  );
}
