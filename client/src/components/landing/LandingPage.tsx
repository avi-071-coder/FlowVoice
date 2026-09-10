import React, { useEffect } from "react";
import { Mic, Waves, Zap, ShieldCheck, Radio, ArrowRight, Layers, Terminal, Cpu } from "lucide-react";

interface LandingPageProps {
  onEnterStudio: () => void;
}

const techGallery = [
  {
    id: "studio-mic",
    img: "/images/tech_studio_mic.jpg",
    caption: "Neumann Condenser Transducer",
    desc: "Ultra-low noise floor microphone arrays streaming PCM at 24kHz.",
  },
  {
    id: "oscilloscope",
    img: "/images/tech_audio_oscilloscope.jpg",
    caption: "Analog Scope Waveform Fencing",
    desc: "Barge-in detection halting audio playback within 135 ms.",
  },
  {
    id: "mixing-console",
    img: "/images/tech_mixing_console.jpg",
    caption: "Multi-Track Signal Routing",
    desc: "Zero-latency context switching across dynamic user interruptions.",
  },
  {
    id: "server-nodes",
    img: "/images/tech_server_nodes.jpg",
    caption: "Realtime LiveKit WebRTC Nodes",
    desc: "Interruption-resilient agent worker architecture running generation guards.",
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterStudio }) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          } else {
            entry.target.classList.remove("revealed");
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".scroll-reveal-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Video Container */}
      <div className="landing-hero">
        <video
          className="hero-video-bg"
          src="/videos/hero_bg.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="hero-dark-overlay" />

        {/* Top Floating Glass Header */}
        <header className="landing-navbar">
          <div className="brand-pill">
            <img src="/logo.png" alt="FlowVoice Logo" className="brand-logo-img" />
            <div className="brand-title">
              FLOW<span>VOICE</span>
            </div>
          </div>

          <button className="cta-use-flowvoice-top" onClick={onEnterStudio}>
            <Mic size={16} />
            <span>USE FLOWVOICE</span>
            <ArrowRight size={14} />
          </button>
        </header>

        {/* Hero Copy (Top-Left & Bottom-Right Text ONLY — No Duplicate Button) */}
        <div className="hero-grid-overlay">
          <div className="hero-top-left">
            <h1 className="hero-main-title">
              Speak freely.<br />
              <span>Flow naturally.</span>
            </h1>
          </div>

          <div className="hero-bottom-right">
            <p className="hero-desc-text">
              Traditional voice AI locks up when you interrupt. FlowVoice fences stale background queries and halts audio in <strong>&lt;140ms</strong> so the agent instantly follows your latest instruction.
            </p>
          </div>
        </div>
      </div>

      {/* Scrolling Content Sections with Scroll Reveal Animations */}
      <main className="landing-scroll-body">
        {/* Section 1: What We Made */}
        <section className="landing-section scroll-reveal-section">
          <h2 className="section-title">What We Made</h2>
          <p className="section-subtitle">
            An interruption-resilient speech architecture designed for real-world dynamic conversations.
          </p>

          <div className="features-three-grid">
            <div className="feature-card">
              <div className="feature-icon cyan"><Zap size={22} /></div>
              <h3>Sub-140ms Barge-In</h3>
              <p>Instant audio cancellation when user speech is detected mid-sentence before obsolete words leak.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange"><ShieldCheck size={22} /></div>
              <h3>Generation Fencing</h3>
              <p>Monotonically incremented task IDs ensure late tool responses are automatically discarded by stale guards.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon green"><Radio size={22} /></div>
              <h3>Rime TTS Integration</h3>
              <p>Crystal clear 24kHz PCM audio streaming powered by Rime's <code>mist</code> model and <code>astra</code> voice profile.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Tech Gallery (NO HUMANS & NO BADGES) */}
        <section className="landing-section scroll-reveal-section">
          <h2 className="section-title">Engineering Precision</h2>
          <p className="section-subtitle">
            Built for professional acoustics, ultra-low latency audio processing, and verifiable state fencing.
          </p>

          <div className="polaroid-grid">
            {techGallery.map((item) => (
              <div key={item.id} className="polaroid-card">
                <div className="polaroid-img-wrapper">
                  <img src={item.img} alt={item.caption} loading="lazy" />
                </div>
                <div className="polaroid-caption">{item.caption}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: How It Works & How To Use */}
        <section className="landing-section scroll-reveal-section">
          <h2 className="section-title">How To Use FlowVoice</h2>
          <p className="section-subtitle">
            Experience natural barge-in without rigid turn-taking or waiting for AI speech to finish.
          </p>

          <div className="steps-flow-grid">
            <div className="step-box">
              <div className="step-num">01</div>
              <h4>Click "Use FlowVoice"</h4>
              <p>Enter the dedicated voice studio with a central interactive microphone orb.</p>
            </div>

            <div className="step-box">
              <div className="step-num">02</div>
              <h4>Speak Your Request</h4>
              <p>Say anything — ask for restaurants, check weather, or give complex multi-step instructions.</p>
            </div>

            <div className="step-box">
              <div className="step-num">03</div>
              <h4>Interrupt Mid-Sentence</h4>
              <p>Change constraints midway. FlowVoice immediately stops audio playback and updates context.</p>
            </div>
          </div>

          <div className="bottom-cta-banner">
            <h2>Ready to experience souled voice AI?</h2>
            <p>Launch the interactive studio, run failure stress tests, or talk directly over live microphone.</p>
            <button className="cta-use-flowvoice-bottom" onClick={onEnterStudio}>
              <Mic size={20} />
              <span>USE FLOWVOICE NOW</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
