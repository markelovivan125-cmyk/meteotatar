import type { CategoryId } from "../lib/categories";

export type DrawMode = "select" | "polygon" | "rectangle" | "circle" | "marker";
export type ShapeType = "polygon" | "rectangle" | "circle" | "marker";
// Статус зоны — по аналогии с системой NWS/SPC: "Watch" (прогноз/вероятность)
// и "Warning" (подтверждённое, действующее предупреждение).
export type ShapeStatus = "forecast" | "active";

export interface ShapeStyle {
  color: string;
  fillOpacity: number;
  status: ShapeStatus;
}

export interface ShapeMeta {
  id: string;
  type: ShapeType;
  category: CategoryId;
  style: ShapeStyle;
  label: string;
  synoptic: string;
  createdAt: number;
  visible: boolean;
  areaKm2?: number;
}

export interface ActiveStylePatch {
  color?: string;
  fillOpacity?: number;
  status?: ShapeStatus;
}
