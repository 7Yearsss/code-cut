import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ProjectManager } from "./project.js";

const project = new ProjectManager();

const server = new McpServer({
  name: "code-cut",
  version: "0.1.0",
});

server.tool(
  "project_init",
  "Initialize a new video project. Opens the preview UI at http://localhost:5173. Call this first before adding any layers.",
  { name: z.string().optional().describe("Project name") },
  async ({ name }) => {
    const p = project.init(name ?? "Untitled");
    return {
      content: [{
        type: "text",
        text: `Project "${p.name}" initialized (id: ${p.id}).\nPreview: http://localhost:5173\nWebSocket broadcasting on ws://localhost:8765`,
      }],
    };
  }
);

server.tool(
  "lottie_add",
  "Add a Lottie animation overlay to the project. The animation plays over footage (or standalone if no footage). AI should provide valid Lottie JSON.",
  {
    lottie_json: z.record(z.unknown()).describe("Valid Lottie animation JSON object"),
    time_start: z.number().describe("When the animation starts (seconds)"),
    duration: z.number().describe("How long the animation plays (seconds)"),
    x: z.number().default(0).describe("X position as percentage of canvas width (0-100)"),
    y: z.number().default(0).describe("Y position as percentage of canvas height (0-100)"),
    width: z.number().default(100).describe("Width as percentage of canvas width (0-100)"),
    height: z.number().default(100).describe("Height as percentage of canvas height (0-100)"),
    opacity: z.number().default(1).describe("Opacity 0-1"),
  },
  async ({ lottie_json, time_start, duration, x, y, width, height, opacity }) => {
    const layer = project.addLayer({
      type: "lottie",
      lottieJson: lottie_json,
      timeStart: time_start,
      duration,
      position: { x, y, width, height },
      opacity,
    });
    return {
      content: [{
        type: "text",
        text: `Lottie layer added (id: ${layer.id}) at ${time_start}s for ${duration}s.`,
      }],
    };
  }
);

server.tool(
  "footage_add",
  "Add a video footage layer. Provide a local file path or URL to a video file.",
  {
    src: z.string().describe("Path or URL to video file"),
    time_start: z.number().default(0).describe("When footage starts on timeline (seconds)"),
    duration: z.number().describe("Duration to use from footage (seconds)"),
  },
  async ({ src, time_start, duration }) => {
    const layer = project.addLayer({ type: "footage", src, timeStart: time_start, duration });
    return {
      content: [{
        type: "text",
        text: `Footage layer added (id: ${layer.id}): ${src}`,
      }],
    };
  }
);

server.tool(
  "subtitle_add",
  "Add a subtitle/text overlay. Choose animation style: word-spring (bouncy, energetic), cinematic (clip-reveal, film-like), typewriter (character-by-character), fade (simple).",
  {
    text: z.string().describe("Subtitle text content"),
    time_start: z.number().describe("When subtitle appears (seconds)"),
    duration: z.number().describe("How long subtitle shows (seconds)"),
    color: z.string().default("#ffffff").describe("Text color (hex)"),
    font_size: z.number().default(64).describe("Font size in pixels"),
    position: z.enum(["bottom", "top", "center"]).default("center"),
    animation: z.enum(["word-spring", "typewriter", "cinematic", "fade"]).default("word-spring").describe("Entrance animation style"),
  },
  async ({ text, time_start, duration, color, font_size, position, animation }) => {
    const layer = project.addLayer({
      type: "subtitle",
      text,
      timeStart: time_start,
      duration,
      style: { color, fontSize: font_size, position },
      animation,
    });
    return {
      content: [{
        type: "text",
        text: `Subtitle layer added (id: ${layer.id}): "${text}" [${animation}]`,
      }],
    };
  }
);

server.tool(
  "background_add",
  "Add a background layer. Use 'mesh' for animated gradient orbs (most cinematic), 'gradient' for static linear gradient, 'noise' for film-grain texture, 'solid' for flat color. Always add a background first for non-footage projects.",
  {
    variant: z.enum(["mesh", "gradient", "noise", "solid"]).default("mesh"),
    colors: z.array(z.string()).default(["#6366f1", "#06b6d4", "#ec4899", "#10b981"]).describe("1-4 hex colors. For mesh: orb colors. For gradient: stop colors. For noise: base gradient. For solid: single color."),
    opacity: z.number().min(0).max(1).default(1),
    animated: z.boolean().default(true).describe("Whether the background animates (mesh only)"),
    time_start: z.number().default(0),
    duration: z.number(),
  },
  async ({ variant, colors, opacity, animated, time_start, duration }) => {
    const layer = project.addLayer({
      type: "background",
      variant,
      colors,
      opacity,
      animated,
      timeStart: time_start,
      duration,
    });
    return { content: [{ type: "text", text: `Background layer added (id: ${layer.id}): ${variant}` }] };
  }
);

server.tool(
  "chart_add",
  "Add a data chart overlay (bar, line, pie, donut, or area). Great for visualizing numbers from your script — revenue, stats, comparisons.",
  {
    chart_type: z.enum(["bar", "line", "pie", "donut", "area"]).default("bar"),
    theme: z.enum(["dark", "light", "minimal", "neon"]).default("dark"),
    accent_color: z.string().default("#6366f1").describe("Primary accent color (hex)"),
    title: z.string().optional(),
    labels: z.array(z.string()).describe("Category labels or x-axis values"),
    datasets: z.array(z.object({
      name: z.string(),
      values: z.array(z.number()),
    })).describe("One or more data series"),
    show_grid: z.boolean().default(true),
    show_legend: z.boolean().default(false),
    time_start: z.number().describe("When chart appears (seconds)"),
    duration: z.number().describe("How long it shows (seconds)"),
    x: z.number().default(5).describe("X position % of canvas"),
    y: z.number().default(10).describe("Y position % of canvas"),
    width: z.number().default(50).describe("Width % of canvas"),
    height: z.number().default(70).describe("Height % of canvas"),
  },
  async ({ chart_type, theme, accent_color, title, labels, datasets, show_grid, show_legend, time_start, duration, x, y, width, height }) => {
    const layer = project.addLayer({
      type: "chart",
      chartType: chart_type,
      theme,
      accentColor: accent_color,
      title,
      labels,
      datasets,
      showGrid: show_grid,
      showLegend: show_legend,
      timeStart: time_start,
      duration,
      position: { x, y, width, height },
    });
    return { content: [{ type: "text", text: `Chart layer added (id: ${layer.id}) — ${chart_type} chart with ${datasets.length} series.` }] };
  }
);

server.tool(
  "counter_add",
  "Add an animated number counter that counts up from startValue to value over the layer duration. Good for KPIs, metrics, scores.",
  {
    value: z.number().describe("Final value to count to"),
    start_value: z.number().default(0).describe("Starting value"),
    prefix: z.string().default("").describe("Text before the number (e.g. '$', '¥')"),
    suffix: z.string().default("").describe("Text after the number (e.g. '%', 'K', ' users')"),
    font_size: z.number().default(96).describe("Font size in pixels"),
    color: z.string().default("#ffffff").describe("Text color"),
    align: z.enum(["left", "center", "right"]).default("center"),
    vertical_align: z.enum(["top", "center", "bottom"]).default("center"),
    time_start: z.number(),
    duration: z.number(),
  },
  async ({ value, start_value, prefix, suffix, font_size, color, align, vertical_align, time_start, duration }) => {
    const layer = project.addLayer({
      type: "counter",
      value,
      startValue: start_value,
      prefix,
      suffix,
      fontSize: font_size,
      color,
      align,
      verticalAlign: vertical_align,
      timeStart: time_start,
      duration,
    });
    return { content: [{ type: "text", text: `Counter layer added (id: ${layer.id}): ${prefix}${start_value}→${value}${suffix}` }] };
  }
);

server.tool(
  "progress_add",
  "Add a progress bar or circle indicator. Animates from 0% to the target value over the duration. Good for showing completion rates, loading states.",
  {
    variant: z.enum(["bar", "circle"]).default("bar"),
    value: z.number().min(0).max(100).describe("Target percentage (0-100)"),
    label: z.string().optional().describe("Optional label text"),
    color: z.string().default("#6366f1").describe("Fill color"),
    track_color: z.string().default("rgba(255,255,255,0.15)").describe("Track/background color"),
    show_value: z.boolean().default(true),
    time_start: z.number(),
    duration: z.number(),
    x: z.number().default(10),
    y: z.number().default(40),
    width: z.number().default(80),
    height: z.number().default(20),
  },
  async ({ variant, value, label, color, track_color, show_value, time_start, duration, x, y, width, height }) => {
    const layer = project.addLayer({
      type: "progress",
      variant,
      value,
      label,
      color,
      trackColor: track_color,
      showValue: show_value,
      timeStart: time_start,
      duration,
      position: { x, y, width, height },
    });
    return { content: [{ type: "text", text: `Progress layer added (id: ${layer.id}): ${variant} → ${value}%` }] };
  }
);

server.tool(
  "list_add",
  "Add an animated list where items appear one by one over the duration. Good for bullet points, steps, feature lists from your script.",
  {
    items: z.array(z.string()).describe("List items in order"),
    style: z.enum(["bullets", "numbered", "checkmarks", "steps"]).default("bullets"),
    color: z.string().default("#ffffff"),
    font_size: z.number().default(32),
    align: z.enum(["left", "center", "right"]).default("left"),
    vertical_align: z.enum(["top", "center", "bottom"]).default("center"),
    time_start: z.number(),
    duration: z.number(),
  },
  async ({ items, style, color, font_size, align, vertical_align, time_start, duration }) => {
    const layer = project.addLayer({
      type: "list",
      items,
      style,
      color,
      fontSize: font_size,
      align,
      verticalAlign: vertical_align,
      timeStart: time_start,
      duration,
    });
    return { content: [{ type: "text", text: `List layer added (id: ${layer.id}): ${items.length} items (${style})` }] };
  }
);

server.tool(
  "layer_update",
  "Update any property of an existing layer. Only specify the fields you want to change.",
  {
    layer_id: z.string().describe("Layer ID returned when layer was created"),
    patch: z.record(z.unknown()).describe("Object with fields to update (e.g. {text: 'new text', style: {color: '#ff0000'}})"),
  },
  async ({ layer_id, patch }) => {
    const updated = project.updateLayer(layer_id, patch as never);
    if (!updated) return { content: [{ type: "text", text: `Layer ${layer_id} not found.` }] };
    return { content: [{ type: "text", text: `Layer ${layer_id} updated.` }] };
  }
);

server.tool(
  "layer_remove",
  "Remove a layer from the project by ID.",
  { layer_id: z.string() },
  async ({ layer_id }) => {
    const ok = project.removeLayer(layer_id);
    return { content: [{ type: "text", text: ok ? `Layer ${layer_id} removed.` : `Layer ${layer_id} not found.` }] };
  }
);

server.tool(
  "project_state",
  "Get the current project state — all layers, timings, and metadata. Use this to understand what's in the project before making changes.",
  {},
  async () => {
    const p = project.getProject();
    return { content: [{ type: "text", text: JSON.stringify(p, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
