import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

export interface FootageLayer {
  id: string; type: "footage";
  src: string; timeStart: number; duration: number;
}
export interface LottieLayer {
  id: string; type: "lottie";
  lottieJson: object; timeStart: number; duration: number;
  position: { x: number; y: number; width: number; height: number };
  opacity: number;
}
export interface SubtitleLayer {
  id: string; type: "subtitle";
  text: string; timeStart: number; duration: number;
  style: { color: string; fontSize: number; position: "bottom" | "top" | "center" };
}
export interface ChartDataset { name: string; values: number[] }
export interface ChartLayer {
  id: string; type: "chart";
  chartType: "bar" | "line" | "pie" | "donut" | "area";
  theme: "dark" | "light" | "minimal" | "neon";
  accentColor: string;
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
  showGrid: boolean;
  showLegend: boolean;
  timeStart: number; duration: number;
  position: { x: number; y: number; width: number; height: number };
}
export interface CounterLayer {
  id: string; type: "counter";
  value: number; startValue: number;
  prefix: string; suffix: string;
  fontSize: number; color: string;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "center" | "bottom";
  timeStart: number; duration: number;
}
export interface ProgressLayer {
  id: string; type: "progress";
  variant: "bar" | "circle";
  value: number; label?: string;
  color: string; trackColor: string;
  showValue: boolean;
  timeStart: number; duration: number;
  position: { x: number; y: number; width: number; height: number };
}
export interface ListLayer {
  id: string; type: "list";
  items: string[];
  style: "bullets" | "numbered" | "checkmarks" | "steps";
  color: string; fontSize: number;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "center" | "bottom";
  timeStart: number; duration: number;
}

export type Layer =
  | FootageLayer | LottieLayer | SubtitleLayer
  | ChartLayer | CounterLayer | ProgressLayer | ListLayer;

export interface Project { id: string; name: string; duration: number; layers: Layer[] }

type AddLayer =
  | Omit<FootageLayer, "id"> | Omit<LottieLayer, "id"> | Omit<SubtitleLayer, "id">
  | Omit<ChartLayer, "id"> | Omit<CounterLayer, "id"> | Omit<ProgressLayer, "id"> | Omit<ListLayer, "id">;

const WS_PORT = 8765;

export class ProjectManager {
  private project: Project | null = null;
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor() {
    this.wss = new WebSocketServer({ port: WS_PORT });
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      if (this.project) ws.send(JSON.stringify({ type: "project", data: this.project }));
      ws.on("close", () => this.clients.delete(ws));
    });
  }

  private broadcast(event: object) {
    const msg = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  init(name: string): Project {
    this.project = { id: randomUUID(), name, duration: 0, layers: [] };
    this.broadcast({ type: "project", data: this.project });
    return this.project;
  }

  getProject(): Project {
    if (!this.project) this.project = { id: randomUUID(), name: "Untitled", duration: 0, layers: [] };
    return this.project;
  }

  addLayer(layer: AddLayer): Layer {
    const p = this.getProject();
    const newLayer = { ...layer, id: randomUUID() } as Layer;
    p.layers.push(newLayer);
    p.duration = Math.max(p.duration, newLayer.timeStart + newLayer.duration);
    this.broadcast({ type: "project", data: p });
    return newLayer;
  }

  updateLayer(layerId: string, patch: Record<string, unknown>): Layer | null {
    const p = this.getProject();
    const idx = p.layers.findIndex((l) => l.id === layerId);
    if (idx === -1) return null;
    p.layers[idx] = { ...p.layers[idx], ...patch } as Layer;
    p.duration = p.layers.reduce((max, l) => Math.max(max, l.timeStart + l.duration), 0);
    this.broadcast({ type: "project", data: p });
    return p.layers[idx];
  }

  removeLayer(layerId: string): boolean {
    const p = this.getProject();
    const before = p.layers.length;
    p.layers = p.layers.filter((l) => l.id !== layerId);
    if (p.layers.length === before) return false;
    p.duration = p.layers.reduce((max, l) => Math.max(max, l.timeStart + l.duration), 0);
    this.broadcast({ type: "project", data: p });
    return true;
  }
}
