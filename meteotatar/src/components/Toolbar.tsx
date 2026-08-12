import { useRef } from "react";
import {
  MousePointer2,
  Pentagon,
  Square,
  Circle,
  Spline,
  Minus,
  MapPin,
  Move,
  Edit3,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Download,
  Upload,
  Crosshair,
  RotateCw,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import type { DrawMode, ShapeRecord, ShapeStyle } from "../types/shapes";
import { CATEGORY_PRESETS, COLOR_SWATCHES } from "../types/shapes";
import { cn } from "../utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  mode: DrawMode;
  setMode: (m: DrawMode) => void;
  shapes: ShapeRecord[];
  selectedId: string | null;
  selectShape: (id: string) => void;
  onDeleteSelected: () => void;
  onDuplicate: () => void;
  onClearAll: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  activeStyle: ShapeStyle;
  setActiveStyle: (s: ShapeStyle) => void;
  exportGeoJSON: () => void;
  importGeoJSON: (text: string) => void;
  toggleVisibility: (id: string) => void;
  zoomToShape: (id: string) => void;
  locate: () => void;
  resetView: () => void;
}

const DRAW_TOOLS: { mode: DrawMode; label: string; icon: React.ReactNode }[] = [
  { mode: "polygon", label: "Полигон", icon: <Pentagon size={18} /> },
  { mode: "rectangle", label: "Прямоугольник", icon: <Square size={18} /> },
  { mode: "circle", label: "Круг", icon: <Circle size={18} /> },
  { mode: "freehand", label: "От руки", icon: <Spline size={18} /> },
  { mode: "line", label: "Линия", icon: <Minus size={18} /> },
  { mode: "point", label: "Точка", icon: <MapPin size={18} /> },
];

const EDIT_TOOLS: { mode: DrawMode; label: string; icon: React.ReactNode }[] = [
  { mode: "select", label: "Выбор", icon: <MousePointer2 size={18} /> },
  { mode: "edit", label: "Узлы", icon: <Edit3 size={18} /> },
  { mode: "move", label: "Сдвиг", icon: <Move size={18} /> },
];

function ToolButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-semibold transition active:scale-95",
        active ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      )}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 px-2 py-1.5 font-medium transition",
            value === o.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Toolbar({
  open,
  onClose,
  mode,
  setMode,
  shapes,
  selectedId,
  selectShape,
  onDeleteSelected,
  onDuplicate,
  onClearAll,
  undo,
  redo,
  canUndo,
  canRedo,
  activeCategory,
  setActiveCategory,
  activeStyle,
  setActiveStyle,
  exportGeoJSON,
  importGeoJSON,
  toggleVisibility,
  zoomToShape,
  locate,
  resetView,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Backdrop for mobile */}
      {open && <div onClick={onClose} className="fixed inset-0 z-20 bg-black/20 md:hidden" />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[86vw] max-w-sm transform flex-col bg-white shadow-2xl transition-transform duration-700 ease-out md:w-96",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <h1 className="text-sm font-bold text-slate-800">Карта метеопредупреждений</h1>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Draw tools */}
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Инструменты рисования</h2>
            <div className="grid grid-cols-3 gap-2">
              {DRAW_TOOLS.map((t) => (
                <ToolButton key={t.mode} active={mode === t.mode} label={t.label} icon={t.icon} onClick={() => setMode(t.mode)} />
              ))}
            </div>
          </section>

          {/* Edit tools */}
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Редактирование</h2>
            <div className="grid grid-cols-3 gap-2">
              {EDIT_TOOLS.map((t) => (
                <ToolButton key={t.mode} active={mode === t.mode} label={t.label} icon={t.icon} onClick={() => setMode(t.mode)} />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={onDuplicate}
                disabled={!selectedId}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
              >
                <Copy size={14} /> Дублировать
              </button>
              <button
                onClick={onDeleteSelected}
                disabled={!selectedId}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-95 disabled:opacity-40"
              >
                <Trash2 size={14} /> Удалить
              </button>
            </div>
          </section>

          {/* History */}
          <section className="flex gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
            >
              <Undo2 size={14} /> Отменить
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
            >
              <Redo2 size={14} /> Вернуть
            </button>
          </section>

          {/* Category presets */}
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Шаблоны опасных явлений</h2>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setActiveCategory(preset.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition active:scale-95",
                    activeCategory === preset.id ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className="text-base leading-none">{preset.emoji}</span>
                  <span className="leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Custom style */}
          <section className="space-y-3 rounded-xl border border-slate-200 p-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Свой стиль{selectedId ? " (для выбранной зоны)" : ""}
            </h2>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-slate-500">Цвет</div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveStyle({ ...activeStyle, color: c })}
                    className={cn(
                      "h-7 w-7 rounded-full ring-2 ring-offset-1 transition active:scale-90",
                      activeStyle.color === c ? "ring-slate-800" : "ring-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-slate-500">Линия контура</div>
              <SegmentedControl
                value={activeStyle.lineStyle}
                options={[
                  { value: "solid", label: "Сплошная" },
                  { value: "dashed", label: "Пунктир" },
                ]}
                onChange={(lineStyle) => setActiveStyle({ ...activeStyle, lineStyle })}
              />
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-slate-500">Заливка</div>
              <SegmentedControl
                value={activeStyle.fillType}
                options={[
                  { value: "dots", label: "Точки" },
                  { value: "hatch", label: "Штрихи" },
                  { value: "solid", label: "Сплошная" },
                ]}
                onChange={(fillType) => setActiveStyle({ ...activeStyle, fillType })}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Непрозрачность заливки</span>
                <span>{Math.round(activeStyle.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={90}
                value={Math.round(activeStyle.opacity * 100)}
                onChange={(e) => setActiveStyle({ ...activeStyle, opacity: Number(e.target.value) / 100 })}
                className="w-full accent-indigo-600"
              />
            </div>
          </section>

          {/* Layers */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Слои ({shapes.length})</h2>
              {shapes.length > 0 && (
                <button onClick={onClearAll} className="text-[11px] font-semibold text-red-500 hover:underline">
                  Очистить всё
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {shapes.length === 0 && (
                <p className="rounded-lg bg-slate-50 p-3 text-center text-[11px] text-slate-400">
                  Пока нет ни одной зоны. Выберите инструмент выше и нарисуйте её на карте.
                </p>
              )}
              {shapes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    selectShape(s.id);
                    zoomToShape(s.id);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition",
                    selectedId === s.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: s.style.color }} />
                  <span className="flex-1 truncate font-medium text-slate-700">{s.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(s.id);
                    }}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                  >
                    {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Import / Export */}
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Данные</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportGeoJSON}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
              >
                <Download size={14} /> Экспорт
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
              >
                <Upload size={14} /> Импорт
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,application/geo+json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => importGeoJSON(String(reader.result));
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </div>
          </section>

          {/* Map utils */}
          <section className="grid grid-cols-2 gap-2">
            <button
              onClick={locate}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <Crosshair size={14} /> Моё место
            </button>
            <button
              onClick={resetView}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <RotateCw size={14} /> Сбросить вид
            </button>
          </section>
        </div>
      </aside>
    </>
  );
}
