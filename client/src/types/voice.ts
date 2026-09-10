export type VoicePhase =
  | "LISTENING"
  | "THINKING"
  | "SEARCHING"
  | "SPEAKING"
  | "INTERRUPTED"
  | "RECOVERING";

export type GenerationStatus = "ACTIVE" | "INVALIDATED" | "COMPLETED" | "PENDING";

export type AgentMode = "engineering" | "user";

export interface Generation {
  id: number;
  taskId: string;
  instruction: string;
  parent?: number;
  status: GenerationStatus;
  createdAt: number;
  outcome?: string;
}

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  time: string;
  generationId?: number;
  interrupted?: boolean;
}

export interface FlowEvent {
  id: string;
  time: string;
  type: string;
  detail: string;
  generationId?: number;
  tone: "cyan" | "orange" | "red" | "green" | "muted";
}

export interface ToolRun {
  name: string;
  label: string;
  status: "idle" | "running" | "complete" | "cancelled" | "stale" | "error";
  detail: string;
  latency: number;
  generationId?: number;
}

export interface VoiceMetrics {
  stt: number;
  llm: number;
  firstAudio: number;
  total: number;
  interrupt: number;
  audioStop: number;
  recovery: number;
  staleResults: number;
  successfulInterruptions: number;
  failedInterruptions: number;
}

export interface Constraints {
  location: string;
  cuisine: string;
  dietary: string;
  budget: string;
  rating: string;
  openAfter: string;
  openNow: boolean;
}

export const defaultConstraints: Constraints = {
  location: "Salt Lake, Kolkata",
  cuisine: "Any cuisine",
  dietary: "Vegetarian",
  budget: "₹800",
  rating: "4.2+",
  openAfter: "8:00 PM",
  openNow: true,
};

export const formatTime = (timestamp = Date.now()) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
