import "dotenv/config";
import { cli, defineAgent, JobContext, ServerOptions } from "@livekit/agents";
import { AudioFrame, AudioSource, LocalAudioTrack } from "@livekit/rtc-node";
import { streamRimeAudio } from "./rime";

const SAMPLE_RATE = 24000;

async function publishRimeResponse(ctx: JobContext, text: string, signal?: AbortSignal) {
  const participant = ctx.agent;
  if (!participant) return;
  const source = new AudioSource(SAMPLE_RATE, 1, 1000);
  const track = LocalAudioTrack.createAudioTrack("flowvoice-rime", source);
  const publication = await participant.publishTrack(track, { name: "flowvoice-rime" } as never);
  try {
    const pcm = await streamRimeAudio(text, { voice: process.env.RIME_VOICE || "astra", sampleRate: SAMPLE_RATE }, signal);
    const reader = pcm.getReader();
    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;
      if (signal?.aborted) break;
      const samples = new Int16Array(chunk.buffer, chunk.byteOffset, Math.floor(chunk.byteLength / 2));
      if (samples.length) await source.captureFrame(new AudioFrame(samples, SAMPLE_RATE, 1, samples.length));
    }
    await source.waitForPlayout();
  } finally {
    await participant.unpublishTrack(publication.sid!, true);
    await source.close();
  }
}

/**
 * Persistent LiveKit worker for FlowVoice. It joins assigned rooms, publishes
 * Rime PCM audio as a real microphone-compatible track, and leaves room for
 * Deepgram/OpenRouter AgentSession nodes to drive subsequent responses.
 */
export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();
    const participant = await ctx.waitForParticipant();
    console.log(`[FlowVoice worker] joined room ${ctx.room.name} for ${participant.identity}`);
    if (process.env.RIME_API_KEY) {
      await publishRimeResponse(ctx, "FlowVoice is connected. You can interrupt me at any time.");
    } else {
      console.warn("[FlowVoice worker] RIME_API_KEY is missing; audio publication is disabled");
    }
    ctx.addShutdownCallback(async () => console.log(`[FlowVoice worker] leaving room ${ctx.room.name}`));
  },
});

export { publishRimeResponse };

if (process.argv[1]?.endsWith("agent-worker.ts") || process.argv[1]?.endsWith("agent-worker.js")) {
  cli.runApp(new ServerOptions({ agent: import.meta.filename, agentName: process.env.LIVEKIT_AGENT_NAME || "flowvoice-agent" }));
}
