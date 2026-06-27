import { useEffect, useRef } from "react";
import type { BackgroundLayer } from "../types.ts";

// ── mesh gradient (CSS animated radial gradients) ───────────────────────────

const MESH_KEYFRAMES = `
@keyframes meshA { 0%,100%{transform:translate(0%,0%) scale(1)} 33%{transform:translate(8%,-6%) scale(1.08)} 66%{transform:translate(-5%,9%) scale(0.96)} }
@keyframes meshB { 0%,100%{transform:translate(0%,0%) scale(1)} 33%{transform:translate(-10%,5%) scale(1.05)} 66%{transform:translate(7%,-8%) scale(1.1)} }
@keyframes meshC { 0%,100%{transform:translate(0%,0%) scale(1)} 50%{transform:translate(6%,6%) scale(1.07)} }
@keyframes meshD { 0%,100%{transform:translate(0%,0%) scale(1.05)} 50%{transform:translate(-8%,-5%) scale(0.95)} }
`;

function injectKeyframes() {
  if (document.getElementById("bg-keyframes")) return;
  const s = document.createElement("style");
  s.id = "bg-keyframes";
  s.textContent = MESH_KEYFRAMES;
  document.head.appendChild(s);
}

function MeshBackground({ colors, opacity, animated }: { colors: string[]; opacity: number; animated: boolean }) {
  useEffect(() => { if (animated) injectKeyframes(); }, [animated]);

  const c = [
    colors[0] ?? "#6366f1",
    colors[1] ?? "#06b6d4",
    colors[2] ?? "#ec4899",
    colors[3] ?? "#10b981",
  ];

  const blobs = [
    { color: c[0], x: "15%", y: "20%", anim: "meshA 12s ease-in-out infinite" },
    { color: c[1], x: "75%", y: "65%", anim: "meshB 15s ease-in-out infinite" },
    { color: c[2], x: "65%", y: "15%", anim: "meshC 10s ease-in-out infinite" },
    { color: c[3], x: "25%", y: "75%", anim: "meshD 18s ease-in-out infinite" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity, overflow: "hidden", background: "#050510" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x, top: b.y,
            width: "70%", height: "70%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse at center, ${b.color}55 0%, transparent 65%)`,
            animation: animated ? b.anim : "none",
            filter: "blur(2px)",
          }}
        />
      ))}
      {/* subtle noise overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
        backgroundSize: "128px 128px",
        opacity: 0.4,
        mixBlendMode: "overlay",
      }} />
    </div>
  );
}

// ── noise / film grain ───────────────────────────────────────────────────────

function NoiseBackground({ colors, opacity }: { colors: string[]; opacity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function draw() {
      const { width: w, height: h } = canvas!;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 28;
      }
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const bg = colors.length >= 2
    ? `linear-gradient(135deg, ${colors.join(", ")})`
    : colors[0] ?? "#0a0a0a";

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", inset: 0, background: bg }} />
      <canvas
        ref={canvasRef}
        width={640} height={360}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "screen" }}
      />
    </div>
  );
}

// ── main export ──────────────────────────────────────────────────────────────

export function BackgroundRenderer({ layer }: { layer: BackgroundLayer }) {
  const { variant, colors, opacity, animated } = layer;

  if (variant === "solid") {
    return <div style={{ position: "absolute", inset: 0, background: colors[0] ?? "#000", opacity }} />;
  }

  if (variant === "gradient") {
    const dir = colors.length > 2 ? "135deg" : "160deg";
    return (
      <div style={{
        position: "absolute", inset: 0, opacity,
        background: `linear-gradient(${dir}, ${colors.join(", ")})`,
      }} />
    );
  }

  if (variant === "mesh") {
    return <MeshBackground colors={colors} opacity={opacity} animated={animated} />;
  }

  if (variant === "noise") {
    return <NoiseBackground colors={colors} opacity={opacity} />;
  }

  return null;
}
