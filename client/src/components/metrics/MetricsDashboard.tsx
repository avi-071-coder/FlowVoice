import type { VoiceMetrics } from "@/types/voice";

interface MetricsDashboardProps { metrics: VoiceMetrics; compact?: boolean; }
export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  return <section className="metrics-grid"><div className="metric-card"><strong>{metrics.firstAudio}ms</strong></div></section>;
}
