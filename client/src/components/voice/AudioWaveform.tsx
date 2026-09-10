import { useEffect, useRef } from "react";

interface AudioWaveformProps { stream?: MediaStream | null; active?: boolean; color?: string; }

export default function AudioWaveform({ stream, active = false, color = "#70dfe0" }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const audioContext = stream ? new AudioContext() : null;
    const analyser = audioContext?.createAnalyser() ?? null;
    let source: MediaStreamAudioSourceNode | null = null;
    if (analyser && audioContext && stream) { analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.82; source = audioContext.createMediaStreamSource(stream); source.connect(analyser); }
    let animation = 0;
    const frame = () => {
      const width = canvas.width = canvas.clientWidth * devicePixelRatio;
      const height = canvas.height = canvas.clientHeight * devicePixelRatio;
      context.clearRect(0, 0, width, height);
      const bars = 22; const gap = width / (bars * 1.65); const buffer = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
      analyser?.getByteFrequencyData(buffer!);
      context.fillStyle = color;
      for (let index = 0; index < bars; index += 1) {
        const live = buffer ? (buffer[index % buffer.length] / 255) : 0;
        const pulse = active ? (0.28 + Math.abs(Math.sin(performance.now() / 380 + index * .7)) * .5) : .12;
        const barHeight = Math.max(3, height * Math.min(1, live * .9 + pulse));
        const x = index * gap + gap * .2;
        context.globalAlpha = .35 + (barHeight / height) * .55;
        context.fillRect(x, (height - barHeight) / 2, Math.max(2, gap * .42), barHeight);
      }
      context.globalAlpha = 1; animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animation); source?.disconnect(); audioContext?.close().catch(() => undefined); };
  }, [active, color, stream]);
  return <canvas ref={canvasRef} className="audio-waveform" aria-label="Live audio waveform" />;
}
