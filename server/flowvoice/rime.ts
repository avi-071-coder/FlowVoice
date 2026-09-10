export interface RimeStreamOptions { voice?: string; model?: string; sampleRate?: number; speedAlpha?: number; }

export async function streamRimeAudio(text: string, options: RimeStreamOptions = {}, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.RIME_API_KEY;
  if (!apiKey) throw new Error("RIME_API_KEY is not configured");
  const response = await fetch(process.env.RIME_API_URL || "https://users.rime.ai/v1/rime-tts", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "audio/pcm" }, body: JSON.stringify({ text, speaker: options.voice || process.env.RIME_VOICE || "astra", modelId: options.model || process.env.RIME_MODEL || "mist", audioFormat: "pcm", samplingRate: options.sampleRate || 24000, speedAlpha: options.speedAlpha || 1 }), signal });
  if (!response.ok || !response.body) throw new Error(`Rime TTS failed (${response.status})`);
  return response.body;
}
