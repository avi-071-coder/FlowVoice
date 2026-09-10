export async function streamAgentResponse(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, onToken: (token: string) => void, signal?: AbortSignal) {
  const response = await fetch("/api/ai/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }), signal });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? "The agent response stream is unavailable");
  }
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim(); if (data === "[DONE]") return;
      try { const token = JSON.parse(data)?.choices?.[0]?.delta?.content; if (token) onToken(token); } catch { /* wait for the next complete SSE line */ }
    }
  }
}
