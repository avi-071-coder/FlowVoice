import { AlertTriangle, Check, CircleDot, Clock3, Radio, X } from "lucide-react";
import type { FlowEvent } from "@/types/voice";

interface EventTimelineProps { events: FlowEvent[]; }
const iconFor = (tone: FlowEvent["tone"]) => tone === "red" ? X : tone === "orange" ? AlertTriangle : tone === "green" ? Check : tone === "cyan" ? Radio : CircleDot;

export default function EventTimeline({ events }: EventTimelineProps) {
  return <section className="panel events-panel"><div className="panel-heading"><div><span className="eyebrow">EVENT LOG</span><h3>Auditable pipeline timeline</h3></div><span className="status-pill"><Clock3 size={13} /> live</span></div><div className="event-list">{events.slice(0, 10).map((event) => { const Icon = iconFor(event.tone); return <div className={`event-row tone-${event.tone}`} key={event.id}><span className="event-time">{event.time}</span><span className="event-icon"><Icon size={12} /></span><div><strong>{event.type}{event.generationId ? ` · #${event.generationId}` : ""}</strong><p>{event.detail}</p></div></div>; })}</div></section>;
}
