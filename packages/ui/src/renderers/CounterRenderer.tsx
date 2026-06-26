import type { CounterLayer } from "../types.ts";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CounterRenderer({ layer, currentTime }: { layer: CounterLayer; currentTime: number }) {
  const { value, startValue, prefix, suffix, fontSize, color, align, verticalAlign, timeStart, duration } = layer;

  const elapsed = currentTime - timeStart;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const eased = easeOutCubic(progress);
  const displayed = Math.round(startValue + (value - startValue) * eased);

  const justifyContent = verticalAlign === "top" ? "flex-start" : verticalAlign === "bottom" ? "flex-end" : "center";
  const textAlign = align;

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      justifyContent, alignItems: "stretch",
      padding: "5%", boxSizing: "border-box",
      pointerEvents: "none",
    }}>
      <div style={{
        color,
        fontSize,
        fontWeight: "bold",
        fontVariantNumeric: "tabular-nums",
        textAlign,
        lineHeight: 1.1,
        textShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}>
        {prefix}{displayed.toLocaleString()}{suffix}
      </div>
    </div>
  );
}
