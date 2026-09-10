import React, { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const duration = 6000; // Exactly 6 seconds total loading duration
    const intervalTime = 40;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsFadingOut(true), 150);
          setTimeout(() => onComplete(), 600);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={`loading-overlay ${isFadingOut ? "fade-out" : ""}`}>
      {/* Background Video Only */}
      <video
        className="loading-bg-video"
        src="/videos/loading.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="loading-dark-backdrop" />

      {/* Number 0 to 100 and Bar ONLY */}
      <div className="loading-content">
        <div className="loading-counter">
          {Math.floor(progress)}
          <span className="percent-symbol">%</span>
        </div>

        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};
