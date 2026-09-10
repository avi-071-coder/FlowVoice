import React from "react";
import { Waves, Sparkles, Play, Sun, Moon, ShieldCheck, Headphones, BarChart3, Image as ImageIcon, FlaskConical } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dark: boolean;
  setDark: (dark: boolean | ((prev: boolean) => boolean)) => void;
  runDemo: () => void;
  isDemoRunning: boolean;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dark,
  setDark,
  runDemo,
  isDemoRunning,
  isConnected,
}) => {
  return (
    <div className="floating-header-wrapper">
      <header className="floating-navbar">
        <a href="#hero" className="brand-pill">
          <div className="brand-icon-orb">
            <Waves size={18} />
          </div>
          <div className="brand-title">
            FLOW<span>VOICE</span>
          </div>
        </a>

        <nav className="nav-links-pill">
          <button
            className={`nav-item-btn ${activeTab === "session" ? "active" : ""}`}
            onClick={() => setActiveTab("session")}
          >
            <Headphones size={14} />
            <span>Live Session</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === "stories" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("stories");
              document.getElementById("stories-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ImageIcon size={14} />
            <span>Human Stories</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === "lab" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("lab");
              document.getElementById("failure-lab-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <FlaskConical size={14} />
            <span>Failure Lab</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </button>

          <button
            className={`nav-item-btn ${activeTab === "compliance" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("compliance");
              document.getElementById("compliance-section")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ShieldCheck size={14} />
            <span>Rime PS Spec</span>
          </button>
        </nav>

        <div className="nav-actions">
          <button
            className="icon-pill-btn"
            onClick={() => setDark((prev) => !prev)}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="action-pill-btn"
            onClick={runDemo}
            disabled={isDemoRunning}
          >
            {isDemoRunning ? (
              <>
                <Waves size={15} className="spin" />
                <span>Demo Running...</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run Demo</span>
              </>
            )}
          </button>
        </div>
      </header>
    </div>
  );
};
