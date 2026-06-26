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
  value: number;
  label?: string;
  color: string;
  trackColor: string;
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

export interface Project {
  id: string; name: string; duration: number; layers: Layer[];
}
