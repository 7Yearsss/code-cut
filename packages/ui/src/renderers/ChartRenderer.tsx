import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { ChartLayer } from "../types.ts";

const NEON_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
const MINIMAL_COLORS = ["#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

function buildOption(layer: ChartLayer): echarts.EChartsOption {
  const { chartType, labels, datasets, accentColor, theme, title, showGrid, showLegend } = layer;
  const colors = theme === "neon" ? NEON_COLORS : theme === "minimal" ? MINIMAL_COLORS : [accentColor, ...NEON_COLORS];
  const isDark = theme !== "light" && theme !== "minimal";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const base: echarts.EChartsOption = {
    backgroundColor: "transparent",
    color: colors,
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut",
    title: title ? { text: title, textStyle: { color: textColor, fontSize: 18, fontWeight: "bold" }, left: "center", top: 8 } : undefined,
    legend: showLegend ? { textStyle: { color: textColor }, bottom: 0 } : undefined,
    tooltip: { trigger: chartType === "pie" || chartType === "donut" ? "item" : "axis", backgroundColor: "rgba(15,23,42,0.9)", borderColor: accentColor, textStyle: { color: "#f1f5f9" } },
  };

  if (chartType === "pie" || chartType === "donut") {
    const flat = datasets[0]?.values ?? [];
    return {
      ...base,
      series: [{
        type: "pie",
        radius: chartType === "donut" ? ["45%", "70%"] : "65%",
        center: ["50%", "55%"],
        data: labels.map((l, i) => ({ name: l, value: flat[i] ?? 0 })),
        label: { color: textColor },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" } },
      }],
    };
  }

  const isHorizontalBar = chartType === "bar" && labels.length > 8;

  return {
    ...base,
    grid: { left: "10%", right: "5%", top: title ? 60 : 20, bottom: showLegend ? 50 : 30, containLabel: true },
    xAxis: isHorizontalBar
      ? { type: "value", splitLine: { lineStyle: { color: gridColor } }, axisLabel: { color: textColor } }
      : { type: "category", data: labels, axisLabel: { color: textColor, rotate: labels.length > 6 ? 30 : 0 }, axisLine: { lineStyle: { color: gridColor } }, splitLine: { show: false } },
    yAxis: isHorizontalBar
      ? { type: "category", data: labels, axisLabel: { color: textColor } }
      : { type: "value", splitLine: { show: showGrid, lineStyle: { color: gridColor } }, axisLabel: { color: textColor } },
    series: datasets.map((ds) => ({
      name: ds.name,
      type: (chartType === "area" ? "line" : chartType) as "bar" | "line",
      data: isHorizontalBar ? ds.values.map((v, i) => [v, labels[i]]) : ds.values,
      smooth: chartType === "line" || chartType === "area",
      areaStyle: chartType === "area" ? { opacity: 0.3 } : undefined,
      itemStyle: { borderRadius: chartType === "bar" ? [4, 4, 0, 0] : 0 },
    })),
  };
}

export function ChartRenderer({ layer }: { layer: ChartLayer }) {
  const el = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!el.current) return;
    instance.current = echarts.init(el.current, layer.theme === "light" ? undefined : "dark", { renderer: "canvas" });
    return () => { instance.current?.dispose(); instance.current = null; };
  }, []);

  useEffect(() => {
    if (!instance.current) return;
    instance.current.setOption(buildOption(layer), true);
  }, [layer]);

  const { position } = layer;
  return (
    <div style={{
      position: "absolute",
      left: `${position.x}%`, top: `${position.y}%`,
      width: `${position.width}%`, height: `${position.height}%`,
      pointerEvents: "none",
    }}>
      <div ref={el} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
