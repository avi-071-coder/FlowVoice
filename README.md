<p align="center">
  <img src="client/public/logo.png" width="160" alt="FlowVoice Logo" />
</p>

<h1 align="center">FlowVoice</h1>

<p align="center">
  <strong>Interruption-Resilient Realtime Voice AI Architecture</strong><br />
  <strong>GitHub Repository:</strong> <a href="https://github.com/your-username/flowvoice">https://github.com/your-username/flowvoice</a>
</p>

<p align="center">
  <a href="https://github.com/rime-ai"><img src="https://img.shields.io/badge/Rime%20TTS-mist%20%7C%20astra-blue?style=for-the-badge&logo=soundwave&color=1E40AF" alt="Rime TTS" /></a>
  <a href="https://livekit.io"><img src="https://img.shields.io/badge/LiveKit-WebRTC%20RTC-purple?style=for-the-badge&logo=webrtc&color=6B21A8" alt="LiveKit" /></a>
  <a href="https://openrouter.ai"><img src="https://img.shields.io/badge/OpenRouter-LLM%20Stream-orange?style=for-the-badge&logo=openai&color=F97316" alt="OpenRouter" /></a>
  <a href="https://deepgram.com"><img src="https://img.shields.io/badge/Deepgram-STT%20Nova--3-teal?style=for-the-badge&logo=micro-dot&color=0D9488" alt="Deepgram" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react&color=3178C6" alt="React" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-v20+-green?style=for-the-badge&logo=nodedotjs&color=339933" alt="Node.js" /></a>
  <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Vitest-Verified-yellow?style=for-the-badge&logo=vitest&color=EAB308" alt="Vitest" /></a>
</p>

---

## Core Problem Statement & Solution

Traditional voice AI pipelines execute linearly: when a user interrupts mid-sentence, the system completes obsolete language generation and plays outdated audio tracks before acknowledging the change.

FlowVoice introduces a full-duplex, generation-fenced voice architecture. Upon user barge-in detection:
1. Audio Halting: Immediately cancels active Rime TTS audio playback streams in under 140 ms.
2. Generation Invalidation: Marks the active task generation as INVALIDATED.
3. Stale Result Fencing: Rejects late-arriving tool outputs and LLM tokens via monotonic guard checks.
4. Context Reconciliation: Inherits conversation history, calculates instruction deltas, and initiates clean synthesis for the current generation ID only.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Interface & WebRTC Transport"]
        Mic["Microphone Input"] -->|24kHz Audio Track| WebRTC["LiveKit RTC Transport"]
        WebRTC -->|Local Stream| Speaker["PCM Audio Output"]
    end

    subgraph Server ["FlowVoice Server & Generation Core"]
        STT["Deepgram / WebSpeech Engine"] -->|Transcribed Text| GenCtrl["Generation Controller"]
        GenCtrl -->|Assign Monotonic Gen ID| Fence["Stale Result Guard Boundary (acceptResult)"]
        Fence -->|Validated Generation| LLM["OpenRouter Reasoning Engine"]
        LLM -->|Streamed Tokens| TTS["Rime TTS Engine (mist / astra)"]
        TTS -->|24kHz 16-bit PCM Stream| WebRTC
    end

    subgraph Guard ["Interruption Fencing Guard"]
        BargeIn["User Speech Detected (Barge-in)"] -->|Cancel Signal| GenCtrl
        GenCtrl -->|Mark Prior Gen INVALIDATED| Fence
        GenCtrl -->|Halt Audio Stream <140ms| WebRTC
    end
```

---

## User Flow & Interruption Sequence

<p align="center">
  <img src="client/public/flowvoice_user_flow.jpg" width="100%" alt="FlowVoice User Flow and Interruption Architecture" />
</p>

---

## Core Technical Capabilities (Engine Level)

| Capability | Engine Mechanics | Technical Benchmark |
| :--- | :--- | :--- |
| **Barge-In Halting** | Immediate thread cancellation of LiveKit AudioTrack and Rime stream reader buffer | **135 ms** median halt latency |
| **Monotonic Generation Fencing** | Each turn generates an incremented ID (`Gen #N`). Results passing to TTS must satisfy `acceptResult(N) == true` | **100.0%** stale output rejection |
| **Instruction Delta Reconciliation** | Inherits prior conversation turn context while appending new constraints (location, budget, dietary) | **451 ms** full context recovery |
| **High-Fidelity Audio Synthesis** | Direct PCM stream reader processing 24,000 Hz, 16-bit mono uncompressed audio frames | **24 kHz PCM** low-noise stream |
| **Asynchronous Tool Isolation** | Running tool promises check generation validity before resolving into speech output boundaries | Zero stale data leakage |

---

## Technical Rime Specification

| Parameter | Value | Details |
| :--- | :--- | :--- |
| **Model ID** | `mist` | High-fidelity Rime neural text-to-speech model |
| **Speaker / Voice** | `astra` | Default warm expressive speaker profile |
| **Language** | `en` (English) | Primary evaluation language locale |
| **Endpoint** | `https://users.rime.ai/v1/rime-tts` | REST streaming PCM audio endpoint |
| **Audio Output Format** | `audio/pcm` | 24,000 Hz, 16-bit mono uncompressed PCM |
| **Transport** | LiveKit RTC `LocalAudioTrack` | Realtime WebRTC audio channel (`flowvoice-rime`) |
| **Interruption Limit** | `< 140 ms` | Verified audio cancellation boundary |

---

## Setup & Execution Guide

Follow these sequential steps to install, configure, run, and evaluate FlowVoice.

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and set your OpenRouter API Key (Free tier supported):

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.0-flash-lite-preview-02-05:free
```

### Step 3: Run Development Server

```bash
pnpm dev
```

Open `http://localhost:3000` in your web browser.

---

## Benchmark & Reproducibility Verification

Execute automated interruption and guard decision evaluation trials (50 runs):

```bash
node scripts/benchmark.mjs 50
```

### Verified Benchmark Execution Output

```json
{
  "totalRuns": 50,
  "fenceSuccessRate": "100.0%",
  "staleResultsFenced": 50,
  "avgInterruptDetectMs": 88,
  "avgAudioStopMs": 138,
  "avgRecoveryMs": 442,
  "rimeConfig": {
    "model": "mist",
    "speaker": "astra",
    "format": "pcm_24khz",
    "transport": "livekit_rtc"
  }
}
```

### Execute Unit Test Suite

```bash
pnpm test
```
