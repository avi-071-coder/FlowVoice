import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { AccessToken } from "livekit-server-sdk";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/deepgram/transcribe", express.raw({ type: ["audio/webm", "audio/ogg", "audio/wav", "audio/mpeg"], limit: "4mb" }), async (req, res) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Deepgram is not configured. Add DEEPGRAM_API_KEY on the server." });
    try {
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&interim_results=true", { method: "POST", headers: { Authorization: `Token ${apiKey}`, "Content-Type": String(req.headers["content-type"] || "audio/webm") }, body: req.body });
      const payload = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: payload?.err_msg || "Deepgram transcription failed" });
      const transcript = payload?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      return res.json({ transcript, isFinal: Boolean(payload?.results?.utterances?.length), confidence: payload?.results?.channels?.[0]?.alternatives?.[0]?.confidence ?? 0 });
    } catch (error) {
      console.error("[Deepgram] Transcription failed", error);
      return res.status(502).json({ error: "Deepgram is temporarily unavailable" });
    }
  });
  app.post("/api/ai/stream", async (req, res) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "OpenRouter is not configured. Add OPENROUTER_API_KEY on the server." });
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) return res.status(400).json({ error: "At least one message is required" });
    try {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://flowvoice.app", "X-Title": "FlowVoice" }, body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini", messages, stream: true, temperature: 0.35 }) });
      if (!upstream.ok || !upstream.body) return res.status(upstream.status || 502).json({ error: await upstream.text() || "OpenRouter stream failed" });
      res.status(200); res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache"); res.setHeader("Connection", "keep-alive");
      const reader = upstream.body.getReader(); const decoder = new TextDecoder();
      req.on("close", () => reader.cancel().catch(() => undefined));
      while (true) { const { value, done } = await reader.read(); if (done) break; res.write(decoder.decode(value, { stream: true })); }
      return res.end();
    } catch (error) {
      console.error("[OpenRouter] Streaming failed", error);
      if (!res.headersSent) return res.status(502).json({ error: "OpenRouter is temporarily unavailable" });
      return res.end();
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/livekit/token", async (req, res) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;
    const room = String(req.query.room || "flowvoice-demo");
    const participant = String(req.query.participant || `guest-${Date.now()}`);
    if (!apiKey || !apiSecret || !url) {
      return res.status(503).json({ error: "LiveKit is not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL on the server." });
    }
    try {
      const token = new AccessToken(apiKey, apiSecret, { identity: participant, name: participant, ttl: "10m" });
      token.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
      return res.json({ token: await token.toJwt(), url, room, participant });
    } catch (error) {
      console.error("[LiveKit] Token creation failed", error);
      return res.status(500).json({ error: "Could not create a LiveKit room token" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
