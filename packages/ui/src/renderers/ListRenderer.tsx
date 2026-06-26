import type { ListLayer } from "../types.ts";

const STYLE_ICONS: Record<string, string[]> = {
  bullets: ["•", "•", "•", "•", "•", "•", "•", "•"],
  checkmarks: ["✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓"],
  steps: ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"],
};

export function ListRenderer({ layer, currentTime }: { layer: ListLayer; currentTime: number }) {
  const { items, style, color, fontSize, align, verticalAlign, timeStart, duration } = layer;

  const elapsed = currentTime - timeStart;
  const totalProgress = Math.max(0, elapsed / duration);
  const visibleCount = Math.ceil(totalProgress * items.length);

  const justifyContent = verticalAlign === "top" ? "flex-start" : verticalAlign === "bottom" ? "flex-end" : "center";

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      justifyContent, alignItems: "stretch",
      padding: "5% 8%", boxSizing: "border-box",
      pointerEvents: "none",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: fontSize * 0.7 }}>
        {items.slice(0, visibleCount).map((item, i) => {
          const isLast = i === visibleCount - 1;
          const itemProgress = totalProgress * items.length - i;
          const opacity = isLast ? Math.min(1, itemProgress) : 1;
          const translateY = isLast ? (1 - Math.min(1, itemProgress)) * 12 : 0;

          let marker: string;
          if (style === "numbered") {
            marker = `${i + 1}.`;
          } else {
            marker = STYLE_ICONS[style]?.[i] ?? "•";
          }

          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: fontSize * 0.5,
                textAlign: align,
                color,
                fontSize,
                fontWeight: 500,
                lineHeight: 1.4,
                opacity,
                transform: `translateY(${translateY}px)`,
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              <span style={{ flexShrink: 0, minWidth: "1.2em", color: style === "checkmarks" ? "#4ade80" : color }}>
                {marker}
              </span>
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
