export interface FootageLayer {
  id: string;
  type: "footage";
  src: string;
  timeStart: number;
  duration: number;
}

export interface LottieLayer {
  id: string;
  type: "lottie";
  lottieJson: object;
  timeStart: number;
  duration: number;
  position: { x: number; y: number; width: number; height: number };
  opacity: number;
}

export interface SubtitleLayer {
  id: string;
  type: "subtitle";
  text: string;
  timeStart: number;
  duration: number;
  style: {
    color: string;
    fontSize: number;
    position: "bottom" | "top" | "center";
  };
}

export type Layer = FootageLayer | LottieLayer | SubtitleLayer;

export interface Project {
  id: string;
  name: string;
  duration: number;
  layers: Layer[];
}
