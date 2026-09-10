export type GenerationStatus = "ACTIVE" | "INVALIDATED" | "COMPLETED";

export interface GenerationRecord {
  id: number;
  sessionId: string;
  taskId: string;
  instruction: string;
  parentGenerationId?: number;
  createdAt: number;
  status: GenerationStatus;
}

export interface GuardDecision { accepted: boolean; reason: "CURRENT_GENERATION" | "STALE_GENERATION" | "INVALIDATED_GENERATION"; }

/**
 * The safety boundary between slow tools/TTS and the user-facing audio stream.
 * Every async result must pass through acceptResult before it is rendered or spoken.
 */
export class GenerationController {
  private nextId = 1;
  private current?: GenerationRecord;
  private readonly records = new Map<number, GenerationRecord>();

  create(sessionId: string, taskId: string, instruction: string): GenerationRecord {
    if (this.current) this.invalidate(this.current.id);
    const generation: GenerationRecord = {
      id: this.nextId++, sessionId, taskId, instruction,
      parentGenerationId: this.current?.id,
      createdAt: Date.now(), status: "ACTIVE",
    };
    this.records.set(generation.id, generation);
    this.current = generation;
    return generation;
  }

  invalidate(id: number) {
    const generation = this.records.get(id);
    if (generation && generation.status === "ACTIVE") generation.status = "INVALIDATED";
  }

  complete(id: number) {
    const generation = this.records.get(id);
    if (generation && generation.status === "ACTIVE") generation.status = "COMPLETED";
  }

  getCurrent() { return this.current; }
  getHistory() { return Array.from(this.records.values()).sort((a, b) => b.id - a.id); }

  acceptResult(generationId: number): GuardDecision {
    const candidate = this.records.get(generationId);
    if (!candidate || candidate.status === "INVALIDATED") return { accepted: false, reason: "INVALIDATED_GENERATION" };
    if (!this.current || this.current.id !== generationId) return { accepted: false, reason: "STALE_GENERATION" };
    return { accepted: true, reason: "CURRENT_GENERATION" };
  }
}
