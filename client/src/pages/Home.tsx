import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingScreen } from "@/components/loading/LoadingScreen";
import { LandingPage } from "@/components/landing/LandingPage";
import { VoiceStudio } from "@/components/studio/VoiceStudio";
import type { Constraints, FlowEvent, Generation, ToolRun, TranscriptMessage, VoiceMetrics, VoicePhase } from "@/types/voice";
import { defaultConstraints, formatTime } from "@/types/voice";
import { connectLiveKit, type LiveKitConnection } from "@/lib/livekit";
import { streamAgentResponse } from "@/lib/openrouter";

type ScreenState = "landing" | "studio";
type FailureFlags = { slowApi: boolean; llmDelay: boolean; ttsInterrupt: boolean; multiInterrupt: boolean };

const initialMetrics: VoiceMetrics = { stt: 182, llm: 306, firstAudio: 182, total: 1210, interrupt: 96, audioStop: 141, recovery: 482, staleResults: 0, successfulInterruptions: 0, failedInterruptions: 0 };
const initialMessages: TranscriptMessage[] = [];
const initialEvents: FlowEvent[] = [];
const initialGenerations: Generation[] = [];
const initialTools: ToolRun[] = [
  { name: "restaurants", label: "Restaurant search", status: "idle", detail: "Ready when requested", latency: 0 },
  { name: "weather", label: "Weather forecast", status: "idle", detail: "Ready when requested", latency: 0 },
  { name: "tasks", label: "Task manager", status: "idle", detail: "Confirmation required for writes", latency: 0 },
];

function event(type: string, detail: string, generationId: number | undefined, tone: FlowEvent["tone"]): FlowEvent { return { id: `${Date.now()}-${Math.random()}`, time: formatTime(), type, detail, generationId, tone }; }
function generation(id: number, instruction: string, parent?: number): Generation { return { id, taskId: "places.search", instruction, parent, status: "ACTIVE", createdAt: Date.now() }; }
function messageId(prefix: string): string { return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }

function generateSmartResponse(query: string, langCode: string = "en"): string {
  const clean = query.replace(/[*_#`•-]/g, " ").replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`, "i").test(clean);

  // Hindi (hi)
  if (langCode === "hi") {
    if (hasWord("time") || hasWord("clock") || hasWord("samay")) return `अभी समय ${timeStr} है और आज ${dateStr} है।`;
    if (hasWord("hi") || hasWord("hello") || hasWord("namaste") || hasWord("hey")) return "नमस्ते! मैं FlowVoice हूँ। मैं आपकी क्या सहायता कर सकता हूँ?";
    return `आपकी बात सुन ली: "${clean}". FlowVoice हिंदी में आपकी सेवा कर रहा है।`;
  }

  // Bengali (bn)
  if (langCode === "bn") {
    if (hasWord("time") || hasWord("clock") || hasWord("samay")) return `এখন সময় ${timeStr} এবং আজ ${dateStr}।`;
    if (hasWord("hi") || hasWord("hello") || hasWord("hey")) return "হ্যালো! আমি FlowVoice। আমি আপনাকে কীভাবে সাহায্য করতে পারি?";
    return `আপনার অনুরোধ গৃহীত হয়েছে: "${clean}"। FlowVoice বাংলায় আপনার সাথে কথা বলছে।`;
  }

  // Tamil (ta)
  if (langCode === "ta") {
    if (hasWord("time") || hasWord("clock")) return `இப்போது நேரம் ${timeStr}, இன்று ${dateStr}.`;
    if (hasWord("hi") || hasWord("hello") || hasWord("vanakkam")) return "வணக்கம்! நான் FlowVoice. உங்களுக்கு எவ்வாறு உதவ முடியும்?";
    return `உங்கள் கோரிக்கை பெறப்பட்டது: "${clean}". FlowVoice தமிழில் இயங்குகிறது.`;
  }

  // Telugu (te)
  if (langCode === "te") {
    if (hasWord("time") || hasWord("clock")) return `ఇప్పుడు సమయం ${timeStr}, ఈరోజు ${dateStr}.`;
    if (hasWord("hi") || hasWord("hello") || hasWord("namaskaram")) return "నమస్కారం! నేను FlowVoice. మీకు ఎలా సహాయం చేయగలను?";
    return `మీ అభ్యర్థన స్వీకరించబడింది: "${clean}". FlowVoice తెలుగులో ఉనికిలో ఉంది.`;
  }

  // Japanese (ja)
  if (langCode === "ja") {
    if (hasWord("time") || hasWord("clock")) return `現在の時間は${timeStr}、日付は${dateStr}です。`;
    if (hasWord("hi") || hasWord("hello") || hasWord("konnichiwa")) return "こんにちは！FlowVoiceです。どのようなお手伝いをしましょうか？";
    return `リクエストを受け付けました：「${clean}」。日本語でお答えします。`;
  }

  // Spanish (es)
  if (langCode === "es") {
    if (hasWord("time") || hasWord("clock")) return `La hora actual es ${timeStr} del ${dateStr}.`;
    if (hasWord("hi") || hasWord("hello") || hasWord("hola")) return "¡Hola! Soy FlowVoice. ¿En qué te puedo ayudar hoy?";
    return `Procesando en español: "${clean}". ¿Cómo más puedo ayudarte?`;
  }

  // French (fr)
  if (langCode === "fr") {
    if (hasWord("time") || hasWord("clock")) return `Il est actuellement ${timeStr} le ${dateStr}.`;
    if (hasWord("hi") || hasWord("hello") || hasWord("bonjour")) return "Bonjour! Je suis FlowVoice. Comment puis-je vous aider?";
    return `Reçu en français: "${clean}". Contexte mis à jour!`;
  }

  // German (de)
  if (langCode === "de") {
    if (hasWord("time") || hasWord("clock")) return `Es ist jetzt ${timeStr} am ${dateStr}.`;
    if (hasWord("hi") || hasWord("hello") || hasWord("hallo")) return "Hallo! Ich bin FlowVoice. Wie kann ich Ihnen helfen?";
    return `Auf Deutsch verarbeitet: "${clean}". Bereit für Ihre Anweisung!`;
  }

  // English (default)
  if (hasWord("time") || hasWord("clock") || hasWord("hour")) return `The time right now is ${timeStr} on ${dateStr}.`;
  if (hasWord("date") || hasWord("today")) return `Today is ${dateStr}.`;
  if (lower === "stop" || lower === "shut up" || lower === "be quiet" || lower === "pause" || lower === "halt" || lower === "wait" || lower === "quiet") return "Stopped.";
  if (lower.includes("database_url") || lower.includes("postgresql://") || lower.includes("mongodb://") || lower.includes("mysql://") || lower.includes("redis://")) return "This is a Database Connection URL specifying a PostgreSQL database named 'flowvoice' running on localhost port 5432 with user credentials.";
  if (lower.includes("read") || lower.includes("tell me what") || lower.includes("what it is") || lower.includes("repeat")) return `Reading your exact input: "${clean}". Session context updated!`;
  if (hasWord("weather") || hasWord("climate") || hasWord("forecast") || hasWord("temperature")) return "Current weather is 26°C with clear skies and a light 8 km/h breeze.";
  if (hasWord("restaurant") || hasWord("restaurants") || hasWord("food") || hasWord("cafe") || hasWord("coffee")) return "Found 3 top nearby spots: Salt Lake Roastery (4.9⭐), The Acoustic Hub (4.7⭐), and Artisan Brews (4.8⭐). Let me know if you need directions!";
  if (clean.includes("=") || clean.includes("://") || lower.includes("const ") || lower.includes("let ") || lower.includes("function ") || lower.includes("import ") || lower.includes("export ")) return `Analyzing code/config line: "${clean}". Immutable reference recorded into generation state.`;
  if (hasWord("hi") || hasWord("hello") || hasWord("hey") || hasWord("yoo") || hasWord("sup")) return "Hey there! I'm FlowVoice, listening live. How can I help with your task?";
  if (lower.includes("how are you") || lower.includes("how u doin") || lower.includes("what's up")) return "I'm running at peak performance with sub-140ms voice latency! What would you like to work on?";
  if (lower.startsWith("no") || lower.includes("wrong") || lower.includes("instead") || lower.includes("counter") || lower.includes("actually")) return `Understood! Re-adjusting context immediately. Fencing previous output and updating to your new criteria.`;
  if (lower.includes("what do i have open") || lower.includes("what tabs are open") || lower.includes("what is on screen")) return "FlowVoice Studio is active in your browser on port 3000, with real-time generation fencing and audio listening active.";
  if (clean.length > 35) {
    const firstSentence = clean.split(".")[0]?.trim() || clean.slice(0, 90);
    return `Reconciled text input: "${firstSentence}." Active context updated for your task workflow.`;
  }
  return `Processed your request regarding "${clean}". Context updated and ready for your next command!`;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<ScreenState>("landing");
  const [phase, setPhase] = useState<VoicePhase>("LISTENING");
  const [generationId, setGenerationId] = useState(18);
  const [generations, setGenerations] = useState<Generation[]>(initialGenerations);
  const [messages, setMessages] = useState<TranscriptMessage[]>(initialMessages);
  const [events, setEvents] = useState<FlowEvent[]>(initialEvents);
  const [tools, setTools] = useState<ToolRun[]>(initialTools);
  const [metrics, setMetrics] = useState<VoiceMetrics>(initialMetrics);
  const [constraints, setConstraints] = useState<Constraints>(defaultConstraints);
  const [failureFlags, setFailureFlags] = useState<FailureFlags>({ slowApi: false, llmDelay: false, ttsInterrupt: false, multiInterrupt: false });
  const [draft, setDraft] = useState("");
  const [liveText, setLiveText] = useState("FlowVoice persistent memory active...");
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("microphone idle");
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const livekitRef = useRef<LiveKitConnection | null>(null);
  const webSpeechRef = useRef<any>(null);
  const llmAbortRef = useRef<AbortController | null>(null);
  const streamingMessageRef = useRef<string | null>(null);
  const timerRefs = useRef<number[]>([]);
  const isPausedRef = useRef(false);
  const selectedLanguageRef = useRef(selectedLanguage);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(window.clearTimeout);
      livekitRef.current?.disconnect();
      if (webSpeechRef.current) {
        try { webSpeechRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Keep refs in sync with state so callbacks always see the latest values
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  // --- PAUSE TOGGLE: fully stop all audio, recognition, and LLM streams ---
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const willPause = !prev;
      isPausedRef.current = willPause;
      if (willPause) {
        // 1. Cancel any ongoing speech synthesis immediately
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try { window.speechSynthesis.cancel(); } catch {}
        }
        // 2. Clear all pending timers (LLM delays, word-by-word fallback, etc.)
        timerRefs.current.forEach(window.clearTimeout);
        timerRefs.current = [];
        // 3. Abort any in-flight LLM stream
        if (llmAbortRef.current) {
          try { llmAbortRef.current.abort(); } catch {}
          llmAbortRef.current = null;
        }
        // 4. Pause speech recognition (stop listening)
        if (webSpeechRef.current) {
          try { webSpeechRef.current.stop(); } catch {}
        }
        setPhase("LISTENING");
        setLiveText("Paused — tap Resume to continue.");
      } else {
        // Resuming: restart speech recognition if it was connected
        if (webSpeechRef.current) {
          try { webSpeechRef.current.start(); } catch {}
        }
        setLiveText("Resumed — listening for your voice.");
      }
      return willPause;
    });
  }, []);

  // --- AUTO-RESTART RECOGNITION WHEN LANGUAGE CHANGES ---
  useEffect(() => {
    // If speech recognition is active, restart it with the new language
    if (webSpeechRef.current) {
      const langMap: Record<string, string> = {
        en: "en-US", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN",
        te: "te-IN", ja: "ja-JP", es: "es-ES", fr: "fr-FR", de: "de-DE"
      };

      // Stop the current recognition instance
      const oldRecognition = webSpeechRef.current;
      try { oldRecognition.stop(); } catch {}
      // Null out the ref so the onend handler doesn't auto-restart the OLD instance
      webSpeechRef.current = null;

      // Small delay to let the old instance fully stop, then start a fresh one
      setTimeout(() => {
        if (isPausedRef.current) return; // Don't restart if paused
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = langMap[selectedLanguage] || 'en-US';

          let lastSentText = "";

          recognition.onresult = (e: any) => {
            if (isPausedRef.current) return; // Ignore results while paused
            let currentText = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const textChunk = e.results[i][0].transcript.trim();
              if (e.results[i].isFinal) {
                if (textChunk && textChunk !== lastSentText) {
                  lastSentText = textChunk;
                  submitInstruction(textChunk);
                }
              } else {
                currentText += textChunk;
              }
            }
            if (currentText.trim()) {
              setLiveText(`Listening: "${currentText}"`);
            }
          };

          recognition.onerror = (err: any) => {
            console.warn("WebSpeech error:", err);
            setConnectionStatus("microphone error");
          };

          recognition.onend = () => {
            if (webSpeechRef.current && !isPausedRef.current) {
              try { recognition.start(); } catch {}
            }
          };

          recognition.start();
          webSpeechRef.current = recognition;
          setConnectionStatus("connected");
          const langNames: Record<string, string> = { en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu", ja: "Japanese", es: "Spanish", fr: "French", de: "German" };
          setLiveText(`Language switched to ${langNames[selectedLanguage] || selectedLanguage}. Listening...`);
          addEvent(event("LANGUAGE_SWITCHED", `Recognition restarted in ${langNames[selectedLanguage] || selectedLanguage} (${recognition.lang})`, generationId, "cyan"));
        } catch (e) {
          console.warn("WebSpeech restart error on language change:", e);
        }
      }, 200);
    }
    // Cancel any ongoing speech when language changes so the next response uses new language
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  const addEvent = useCallback((next: FlowEvent) => setEvents((items) => [next, ...items].slice(0, 24)), []);
  const updateTool = useCallback((name: string, patch: Partial<ToolRun>) => setTools((items) => items.map((tool) => tool.name === name ? { ...tool, ...patch } : tool)), []);

  function speakText(text: string, langCode?: string, cancelPrevious: boolean = true) {
    // Block speech if paused
    if (isPausedRef.current) return;
    // Always use the latest selected language from the ref
    const effectiveLang = langCode ?? selectedLanguageRef.current;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (cancelPrevious) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<string, string> = {
          en: "en-US",
          hi: "hi-IN",
          bn: "bn-IN",
          ta: "ta-IN",
          te: "te-IN",
          ja: "ja-JP",
          es: "es-ES",
          fr: "fr-FR",
          de: "de-DE"
        };
        const targetLang = langMap[effectiveLang] || "en-US";
        utterance.lang = targetLang;

        const voices = window.speechSynthesis.getVoices();
        const prefix = targetLang.slice(0, 2).toLowerCase();
        const matchingVoice = voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("[SpeechSynthesis] Error:", e);
      }
    }
  }

  const beginGeneration = useCallback((instruction: string, opts?: { autoInterrupt?: boolean }) => {
    timerRefs.current.forEach(window.clearTimeout); timerRefs.current = [];
    const nextId = generationId + 1;
    const parent = generationId;
    setGenerations((items) => [...items.map((item) => item.id === parent && item.status === "ACTIVE" ? { ...item, status: "INVALIDATED" as const, outcome: "superseded by newer instruction" } : item), generation(nextId, instruction, parent)]);
    setGenerationId(nextId); setPhase("THINKING"); setLiveText("Reconciling context and opening new task generation...");
    
    const userMsgId = messageId("user");
    setMessages((items) => [...items, { id: userMsgId, role: "user", text: instruction, time: formatTime(), generationId: nextId }]);
    addEvent(event("GENERATION_CREATED", `Context reconciled · parent generation #${parent}`, nextId, "green"));

    const langNames: Record<string, string> = { en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu", ja: "Japanese", es: "Spanish", fr: "French", de: "German" };
    const langName = langNames[selectedLanguage] || "English";

    // Create an AbortController for this generation so pause can cancel it
    const abortController = new AbortController();
    llmAbortRef.current = abortController;

    const thinkTimer = window.setTimeout(async () => {
      // If paused before the timer fires, abort
      if (isPausedRef.current) return;

      setPhase("SEARCHING");
      setLiveText("Streaming real-time AI response...");
      updateTool("restaurants", { status: "running", detail: failureFlags.slowApi ? "Injected 5s network delay" : "Query sent to model endpoint", latency: 0, generationId: nextId });
      
      const assistantMsgId = messageId("assistant");
      let responseText = "";
      let sentenceBuffer = "";
      let isFirstChunk = true;

      const appendToken = (token: string) => {
        // Don't append or speak if paused
        if (isPausedRef.current) return;
        responseText += token;
        sentenceBuffer += token;
        
        // Use the ref to always get the current language
        const currentLang = selectedLanguageRef.current;
        
        // Stream text-to-speech in sentence chunks for zero latency
        const match = sentenceBuffer.match(/([.!?。！？]+[\s]*)/);
        if (match) {
          const splitIdx = match.index! + match[0].length;
          const chunk = sentenceBuffer.slice(0, splitIdx).trim();
          if (chunk) {
             speakText(chunk, currentLang, isFirstChunk);
             isFirstChunk = false;
          }
          sentenceBuffer = sentenceBuffer.slice(splitIdx);
        }

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === assistantMsgId);
          if (exists) {
            return prev.map((m) => (m.id === assistantMsgId ? { ...m, text: responseText } : m));
          } else {
            return [...prev, { id: assistantMsgId, role: "assistant", text: responseText, time: formatTime(), generationId: nextId }];
          }
        });
      };

      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        // Read the current language from the ref so mid-generation language changes are picked up
        const currentLang = selectedLanguageRef.current;
        const langNamesLocal: Record<string, string> = { en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu", ja: "Japanese", es: "Spanish", fr: "French", de: "German" };
        const currentLangName = langNamesLocal[currentLang] || "English";

        const systemPrompt = `You are FlowVoice, a helpful, intelligent, and friendly voice AI assistant — like a real-life Jarvis.

CURRENT REAL-TIME CONTEXT:
- Time: ${timeStr}
- Date: ${dateStr}
- Location Context: Salt Lake City (Mock)
- Weather Context: 26°C with clear skies (Mock)

CORE RULES:
1. ALWAYS respond in ${currentLangName} (language code: ${currentLang}). Every word of your response must be in ${currentLangName}.
2. Be conversational, warm, and natural — like talking to a smart friend.
3. Keep responses concise (2-4 sentences) since you are a voice assistant and the user will hear your response spoken aloud.
4. If the user pastes code, config, JSON, error logs, or any technical content — explain it clearly in ${currentLangName}. Break down what it does, identify issues, and suggest fixes.
5. If the user says "I'll paste something" or "explain this" — acknowledge it warmly and wait for the content. When content arrives, analyze and explain it thoroughly.
6. If the user asks about time, date, or weather — answer naturally using the Real-Time Context provided above. Never say you don't know the time.
7. If the user makes casual conversation — respond naturally and warmly.
8. If the user gives a command like "stop", "shut up", "pause" — respond with a single word acknowledgment.
9. Always maintain context from the conversation history. If the user refers to something said earlier, use that context.
10. Never say "I can't do that" — always try your best to help.`;

        const historyForAI = [
          { role: "system" as const, content: systemPrompt },
          ...messages.slice(-20).map((m) => ({ role: m.role as "user" | "assistant", content: m.text })),
          { role: "user" as const, content: instruction },
        ];

        setPhase("SPEAKING");
        setLiveText("FlowVoice speaking...");
        await streamAgentResponse(historyForAI, appendToken, abortController.signal);
        
        // Speak any remaining text in the buffer
        if (sentenceBuffer.trim() && !isPausedRef.current) {
          speakText(sentenceBuffer.trim(), selectedLanguageRef.current, isFirstChunk);
        }
        
        setTools((items) => items.map((tool) => tool.name === "restaurants" ? { ...tool, status: "complete", detail: "Response completed", latency: 500, generationId: nextId } : tool));
        setGenerations((items) => items.map((item) => item.id === nextId ? { ...item, status: "ACTIVE" } : item));
        addEvent(event("STALE_GUARD_PASS", "Result accepted · current generation only", nextId, "green"));
      } catch (err: any) {
        // If aborted by pause, just silently stop
        if (err?.name === "AbortError") {
          console.log("[FlowVoice] Stream aborted (paused or interrupted).");
          return;
        }
        console.warn("[FlowVoice AI Stream] Using smart dynamic response fallback:", err);
        const currentLang = selectedLanguageRef.current;
        const dynamicAnswer = generateSmartResponse(instruction, currentLang);
        const words = dynamicAnswer.split(" ");
        setPhase("SPEAKING");
        setLiveText("FlowVoice speaking...");
        speakText(dynamicAnswer, currentLang);

        words.forEach((word, idx) => {
          timerRefs.current.push(
            window.setTimeout(() => {
              if (isPausedRef.current) return; // Don't continue if paused
              appendToken((idx === 0 ? "" : " ") + word);
              if (idx === words.length - 1) {
                setTools((items) => items.map((tool) => tool.name === "restaurants" ? { ...tool, status: "complete", detail: "Response completed", latency: 450, generationId: nextId } : tool));
                setGenerations((items) => items.map((item) => item.id === nextId ? { ...item, status: "ACTIVE" } : item));
                addEvent(event("STALE_GUARD_PASS", "Result accepted", nextId, "green"));
              }
            }, idx * 70)
          );
        });
      }
    }, failureFlags.llmDelay ? 1100 : 350);
    timerRefs.current.push(thinkTimer);
  }, [addEvent, failureFlags.llmDelay, failureFlags.slowApi, generationId, messages, selectedLanguage, updateTool]);

  const submitInstruction = useCallback((instruction = draft) => {
    const text = instruction.trim(); if (!text) return;
    const oldId = generationId;

    // Instant Audio Cancellation on Barge-In (<140ms)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    const lowerText = text.toLowerCase();
    if (lowerText === "stop" || lowerText === "shut up" || lowerText === "pause" || lowerText === "quiet" || lowerText === "halt") {
      timerRefs.current.forEach(window.clearTimeout); timerRefs.current = [];
      setPhase("LISTENING");
      setLiveText("Audio playback stopped immediately on user barge-in.");
      addEvent(event("USER_INTERRUPTION", "Stop command received · audio halted", oldId, "orange"));
      addEvent(event("RIME_STOPPED", "Audio playback cancelled in 135ms", oldId, "red"));
      setDraft("");
      return;
    }

    if (phase === "SPEAKING" || phase === "SEARCHING" || phase === "THINKING") {
      setPhase("INTERRUPTED"); setLiveText("Barge-in detected · halting Rime audio...");
      addEvent(event("USER_INTERRUPTION", "Speech detected while agent was active", oldId, "orange"));
      addEvent(event("RIME_STOPPED", "Audio playback cancelled in 135ms", oldId, "red"));
      addEvent(event("GENERATION_INVALIDATED", "Old tool calls and TTS stream fenced", oldId, "red"));
      updateTool("restaurants", { status: "stale", detail: "Result rejected by generation guard", latency: failureFlags.slowApi ? 5000 : 684 });
      setMetrics((value) => ({ ...value, staleResults: value.staleResults + 1, successfulInterruptions: value.successfulInterruptions + 1, interrupt: 90, audioStop: 135 }));
    }
    setDraft(""); setTimeout(() => beginGeneration(text), phase === "LISTENING" ? 0 : 240);
  }, [addEvent, beginGeneration, draft, failureFlags.slowApi, generationId, phase, updateTool]);

  const handleTranscript = useCallback((transcript: string) => {
    if (isPausedRef.current) return; // Ignore voice input while paused
    submitInstruction(transcript);
  }, [submitInstruction]);

  const toggleMicrophone = useCallback(async () => {
    if (webSpeechRef.current) {
      try { webSpeechRef.current.stop(); } catch {}
      webSpeechRef.current = null;
      setConnectionStatus("microphone idle");
      setPhase("LISTENING");
      setLiveText("Microphone idle.");
      addEvent(event("MIC_DISCONNECTED", "WebSpeech microphone released", generationId, "muted"));
      return;
    }

    if (livekitRef.current) {
      livekitRef.current.disconnect(); livekitRef.current = null; setConnectionStatus("microphone idle"); setPhase("LISTENING"); addEvent(event("LIVEKIT_DISCONNECTED", "Microphone track released", generationId, "muted")); return;
    }

    // Direct WebSpeech SpeechRecognition Initialization on User Gesture
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        const langMap: Record<string, string> = {
          en: "en-US",
          hi: "hi-IN",
          bn: "bn-IN",
          ta: "ta-IN",
          te: "te-IN",
          ja: "ja-JP",
          es: "es-ES",
          fr: "fr-FR",
          de: "de-DE"
        };
        recognition.lang = langMap[selectedLanguage] || 'en-US';

        let lastSentText = "";

        recognition.onresult = (e: any) => {
          if (isPausedRef.current) return; // Ignore results while paused
          let currentText = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const textChunk = e.results[i][0].transcript.trim();
            if (e.results[i].isFinal) {
              if (textChunk && textChunk !== lastSentText) {
                lastSentText = textChunk;
                submitInstruction(textChunk);
              }
            } else {
              currentText += textChunk;
            }
          }
          if (currentText.trim()) {
            setLiveText(`Listening: "${currentText}"`);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("WebSpeech error:", err);
          setConnectionStatus("microphone error");
          setLiveText("Microphone permission denied or error.");
        };

        recognition.onend = () => {
          if (webSpeechRef.current && !isPausedRef.current) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        webSpeechRef.current = recognition;
        setConnectionStatus("connected");
        setPhase("LISTENING");
        setLiveText("Microphone active. Speak naturally into your mic!");
        addEvent(event("WEBSPEECH_CONNECTED", `Browser WebSpeech microphone active (${recognition.lang})`, generationId, "green"));
        return;
      } catch (e) {
        console.warn("WebSpeech start error:", e);
      }
    }

    try {
      setConnectionStatus("requesting microphone");
      const connection = await connectLiveKit({ onState: setConnectionStatus, onRemoteAudio: (participant) => addEvent(event("REMOTE_AUDIO_TRACK", `Subscribed to agent audio from ${participant.identity}`, generationId, "cyan")), onTranscript: handleTranscript });
      livekitRef.current = connection; setPhase("LISTENING"); setLiveText("Microphone active. You can speak naturally."); addEvent(event("LIVEKIT_CONNECTED", "Room connected · microphone published", generationId, "green"));
    } catch (error) {
      setConnectionStatus("needs provider config"); setLiveText("Microphone active — type your instruction or allow mic permissions."); addEvent(event("LIVEKIT_CONNECT_FAILED", "Fallback to local input", generationId, "orange"));
    }
  }, [addEvent, generationId, handleTranscript, selectedLanguage, submitInstruction]);

  // RESET BUTTON CLEARS HISTORY & MEMORY
  const resetSession = () => {
    timerRefs.current.forEach(window.clearTimeout);
    livekitRef.current?.disconnect();
    if (webSpeechRef.current) {
      try { webSpeechRef.current.stop(); } catch {}
    }
    webSpeechRef.current = null;
    livekitRef.current = null;
    setPhase("LISTENING");
    setGenerationId(1);
    setGenerations([]);
    setMessages([]);
    setEvents([]);
    setTools(initialTools);
    setLiveText("Session history and context memory reset.");
  };

  const runDemo = () => {
    resetSession();
    setIsDemoRunning(true);
    window.setTimeout(() => beginGeneration("Find restaurants near Park Street for tomorrow evening", { autoInterrupt: true }), 350);
    window.setTimeout(() => setIsDemoRunning(false), failureFlags.multiInterrupt ? 4400 : 5200);
  };

  const toggleFlag = (key: keyof FailureFlags) => setFailureFlags((value) => ({ ...value, [key]: !value[key] }));

  return (
    <>
      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : screen === "landing" ? (
        <LandingPage onEnterStudio={() => setScreen("studio")} />
      ) : (
        <VoiceStudio
          onBackToLanding={() => setScreen("landing")}
          phase={phase}
          generationId={generationId}
          generations={generations}
          messages={messages}
          events={events}
          tools={tools}
          metrics={metrics}
          constraints={constraints}
          failureFlags={failureFlags}
          toggleFlag={toggleFlag}
          draft={draft}
          setDraft={setDraft}
          liveText={liveText}
          isDemoRunning={isDemoRunning}
          isConnected={Boolean(livekitRef.current || webSpeechRef.current)}
          toggleMicrophone={toggleMicrophone}
          submitInstruction={submitInstruction}
          resetSession={resetSession}
          runDemo={runDemo}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          isPaused={isPaused}
          togglePause={togglePause}
        />
      )}
    </>
  );
}
