import { CheckCircle2, CloudSun, MapPin, ListTodo, Loader2, ShieldAlert, XCircle } from "lucide-react";
import type { ToolRun } from "@/types/voice";

interface ToolTimelineProps { tools: ToolRun[]; }

const icons = { restaurants: MapPin, weather: CloudSun, tasks: ListTodo } as const;

export default function ToolTimeline({ tools }: ToolTimelineProps) {
  return <section className="panel tools-panel">
    <div className="panel-heading"><div><span className="eyebrow">TOOL ORCHESTRATION</span><h3>Real work, fenced by generation</h3></div><span className="status-pill"><ShieldAlert size={13} /> stale-safe</span></div>
    <div className="tool-list">{tools.map((tool) => { const Icon = icons[tool.name as keyof typeof icons] ?? MapPin; return <div className={`tool-row ${tool.status}`} key={tool.name}><div className="tool-icon"><Icon size={16} /></div><div className="tool-copy"><strong>{tool.label}</strong><span>{tool.detail}</span></div><div className="tool-latency">{tool.status === "running" ? <Loader2 className="spin" size={15} /> : tool.status === "complete" ? <CheckCircle2 size={15} /> : tool.status === "cancelled" || tool.status === "stale" ? <XCircle size={15} /> : null}<small>{tool.latency} ms</small></div></div>; })}</div>
  </section>;
}
