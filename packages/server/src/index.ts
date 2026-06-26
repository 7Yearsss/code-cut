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
  "Add a subtitle/text overlay to the project.",
  {
    text: z.string().describe("Subtitle text content"),
    time_start: z.number().describe("When subtitle appears (seconds)"),
    duration: z.number().describe("How long subtitle shows (seconds)"),
    color: z.string().default("#ffffff").describe("Text color (hex)"),
    font_size: z.number().default(48).describe("Font size in pixels"),
    position: z.enum(["bottom", "top", "center"]).default("bottom"),
  },
  async ({ text, time_start, duration, color, font_size, position }) => {
    const layer = project.addLayer({
      type: "subtitle",
      text,
      timeStart: time_start,
      duration,
      style: { color, fontSize: font_size, position },
    });
    return {
      content: [{
        type: "text",
        text: `Subtitle layer added (id: ${layer.id}): "${text}"`,
      }],
    };
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
