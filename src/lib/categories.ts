export type CategoryId = "convective" | "tornado" | "wind" | "warning";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

// Названия и идея разделения по категориям вдохновлены проектом
// "CSF | SPC Russia" — конвективный / смерч / ветер / предупреждения,
// адаптированы под карту Республики Татарстан.
export const CATEGORIES: CategoryDef[] = [
  {
    id: "convective",
    label: "Конвективный",
    emoji: "⚡",
    color: "#f97316",
    description: "Грозы, ливни, град",
  },
  {
    id: "tornado",
    label: "Смерч",
    emoji: "🌪️",
    color: "#dc2626",
    description: "Угроза смерча / шквалистого вихря",
  },
  {
    id: "wind",
    label: "Ветер",
    emoji: "💨",
    color: "#0ea5e9",
    description: "Усиление ветра, шквалы",
  },
  {
    id: "warning",
    label: "Предупреждения",
    emoji: "⚠️",
    color: "#eab308",
    description: "Общие метеопредупреждения МЧС",
  },
];

export function getCategory(id: CategoryId): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export const EXTRA_COLORS = ["#f97316", "#dc2626", "#0ea5e9", "#eab308", "#8b5cf6", "#22c55e", "#0f172a"];
