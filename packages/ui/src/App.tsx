import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import { useProject } from "./useProject.ts";
import type { FootageLayer, LottieLayer, SubtitleLayer, Layer } from "./types.ts";
import { ChartRenderer } from "./renderers/ChartRenderer.tsx";
import { CounterRenderer } from "./renderers/CounterRenderer.tsx";
import { ProgressRenderer } from "./renderers/ProgressRenderer.tsx";
import { ListRenderer } from "./renderers/ListRenderer.tsx";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

export default function App() {
  const { project, connected } = useProject();
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const baseTimeRef = useRef<number>(0);

  const duration = project?.duration ?? 0;

  useEffect(() => {
    if (playing) {
      startRef.current = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - startRef.current) / 1000;
        const t = baseTimeRef.current + elapsed;
        if (t >= duration) {
          setCurrentTime(duration);
          setPlaying(false);
          baseTimeRef.current = 0;
          return;
        }
        setCurrentTime(t);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration]);

  function togglePlay() {
    if (!playing) {
      baseTimeRef.current = currentTime >= duration ? 0 : currentTime;
      startRef.current = performance.now();
    } else {
      baseTimeRef.current = currentTime;
    }
    setPlaying((p) => !p);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = Number(e.target.value);
    baseTimeRef.current = t;
    setCurrentTime(t);
    setPlaying(false);
  }

  const activeLayers = (project?.layers ?? []).filter(
    (l) => currentTime >= l.timeStart && currentTime < l.timeStart + l.duration
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a" }}>
      {/* Status bar */}
      <div style={{ padding: "8px 16px", background: "#111", borderBottom: "1px solid #222", display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#888" }}>
        <span style={{ color: connected ? "#4ade80" : "#f87171" }}>
          {connected ? "● connected" : "○ waiting for MCP server..."}
        </span>
        {project && <span style={{ color: "#aaa" }}>{project.name}</span>}
        {project && <span>{project.layers.length} layers · {duration.toFixed(1)}s</span>}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 960, aspectRatio: "16/9", background: "#000", borderRadius: 8, overflow: "hidden" }}>
          {activeLayers.map((layer) => (
            <LayerRenderer key={layer.id} layer={layer} currentTime={currentTime} />
          ))}
          {!project && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 32 }}>⬡</div>
              <div style={{ fontSize: 14 }}>call project_init to start</div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline controls */}
      <div style={{ padding: "12px 24px", background: "#111", borderTop: "1px solid #222" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <button
            onClick={togglePlay}
            style={{ background: "#222", border: "1px solid #333", color: "#fff", padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
          >
            {playing ? "⏸ pause" : "▶ play"}
          </button>
          <span style={{ fontSize: 12, color: "#666", minWidth: 80 }}>
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={seek}
          style={{ width: "100%", accentColor: "#6366f1" }}
        />
        {/* Layer track view */}
        {project && project.layers.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
            {project.layers.map((l) => (
              <LayerTrack key={l.id} layer={l} duration={duration} currentTime={currentTime} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LayerRenderer({ layer, currentTime }: { layer: Layer; currentTime: number }) {
  if (layer.type === "footage") return <FootageRenderer layer={layer} currentTime={currentTime} />;
  if (layer.type === "lottie") return <LottieRenderer layer={layer} />;
  if (layer.type === "subtitle") return <SubtitleRenderer layer={layer} />;
  if (layer.type === "chart") return <ChartRenderer layer={layer} />;
  if (layer.type === "counter") return <CounterRenderer layer={layer} currentTime={currentTime} />;
  if (layer.type === "progress") return <ProgressRenderer layer={layer} currentTime={currentTime} />;
  if (layer.type === "list") return <ListRenderer layer={layer} currentTime={currentTime} />;
  return null;
}

function FootageRenderer({ layer, currentTime }: { layer: FootageLayer; currentTime: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const offset = currentTime - layer.timeStart;

  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = offset;
  }, [offset]);

  return (
    <video
      ref={videoRef}
      src={layer.src}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      muted
    />
  );
}

function LottieRenderer({ layer }: { layer: LottieLayer }) {
  const { position, opacity, lottieJson } = layer;
  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        opacity,
        pointerEvents: "none",
      }}
    >
      <Lottie animationData={lottieJson} loop autoplay style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function SubtitleRenderer({ layer }: { layer: SubtitleLayer }) {
  const { style, text } = layer;
  const posMap = { bottom: "10%", center: "50%", top: "10%" };
  const alignMap = { bottom: "flex-end", center: "center", top: "flex-start" };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: alignMap[style.position] as "flex-end" | "center" | "flex-start",
        alignItems: "center",
        padding: `${posMap[style.position]} 5%`,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          color: style.color,
          fontSize: `${style.fontSize}px`,
          fontWeight: 700,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {text}
      </span>
    </div>
  );
}

const LAYER_COLORS: Record<string, string> = {
  footage: "#3b82f6",
  lottie: "#8b5cf6",
  subtitle: "#10b981",
  chart: "#f59e0b",
  counter: "#ec4899",
  progress: "#06b6d4",
  list: "#84cc16",
};

function LayerTrack({ layer, duration, currentTime }: { layer: Layer; duration: number; currentTime: number }) {
  const left = (layer.timeStart / duration) * 100;
  const width = (layer.duration / duration) * 100;
  const active = currentTime >= layer.timeStart && currentTime < layer.timeStart + layer.duration;
  const color = LAYER_COLORS[layer.type] ?? "#666";
  const label = layer.type === "subtitle" ? `subtitle: "${(layer as SubtitleLayer).text.slice(0, 20)}"` : layer.type;

  return (
    <div style={{ position: "relative", height: 20, background: "#1a1a1a", borderRadius: 3 }}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          width: `${width}%`,
          height: "100%",
          background: color,
          opacity: active ? 1 : 0.5,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          paddingLeft: 6,
          overflow: "hidden",
          transition: "opacity 0.1s",
        }}
      >
        <span style={{ fontSize: 10, color: "#fff", whiteSpace: "nowrap" }}>{label}</span>
      </div>
    </div>
  );
}
