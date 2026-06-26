import type { ProgressLayer } from "../types.ts";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function ProgressRenderer({ layer, currentTime }: { layer: ProgressLayer; currentTime: number }) {
  const { variant, value, label, color, trackColor, showValue, timeStart, duration, position } = layer;

  const elapsed = currentTime - timeStart;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const animatedValue = easeOutCubic(progress) * value;
  const pct = Math.min(100, animatedValue);

  if (variant === "circle") {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <div style={{
        position: "absolute",
        left: `${position.x}%`, top: `${position.y}%`,
        width: `${position.width}%`, height: `${position.height}%`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <svg viewBox="0 0 100 100" style={{ width: "80%", height: "80%" }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke={trackColor} strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 0.1s ease-out" }}
          />
          {showValue && (
            <text x="50" y="55" textAnchor="middle" fill={color} fontSize="18" fontWeight="bold">
              {Math.round(pct)}%
            </text>
          )}
        </svg>
        {label && <div style={{ color, fontSize: 14, marginTop: 4, textAlign: "center" }}>{label}</div>}
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute",
      left: `${position.x}%`, top: `${position.y}%`,
      width: `${position.width}%`, height: `${position.height}%`,
      display: "flex", flexDirection: "column", justifyContent: "center", gap: 6,
      padding: "0 4%", boxSizing: "border-box",
      pointerEvents: "none",
    }}>
      {label && <div style={{ color, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      <div style={{ position: "relative", background: trackColor, borderRadius: 8, height: 12, overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: color, borderRadius: 8,
          transition: "width 0.1s ease-out",
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
      {showValue && (
        <div style={{ color, fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(pct)}%
        </div>
      )}
    </div>
  );
}
