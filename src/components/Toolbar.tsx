import { useRef, useState } from "react";
import {
  X,
  Sun,
  Moon,
  MousePointer2,
  Pencil,
  Square,
  Circle as CircleIcon,
  MapPin,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ZoomIn,
  Download,
  Upload,
  LocateFixed,
  RotateCcw,
  User,
} from "lucide-react";
import { CATEGORIES, EXTRA_COLORS, type CategoryId } from "../lib/categories";
import type { DrawMode, ShapeMeta, ShapeStatus } from "../types/map";
import { cn } from "../utils/cn";

interface ToolbarProps {
  open: boolean;
  onClose: () => void;
  mode: DrawMode;
  setMode: (m: DrawMode) => void;
  shapes: ShapeMeta[];
  selectedId: string | null;
  selectShape: (id: string) => void;
  onDeleteSelected: () => void;
  onDuplicate: () => void;
  onClearAll: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeCategory: CategoryId;
  setActiveCategory: (c: CategoryId) => void;
  activeStyle: { color: string; fillOpacity: number; status: ShapeStatus };
  setActiveStyle: (patch: Partial<{ color: string; fillOpacity: number; status: ShapeStatus }>) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  synoptic: string;
  setSynoptic: (s: string) => void;
  exportGeoJSON: () => void;
  importGeoJSON: (text: string) => void;
  toggleVisibility: (id: string) => void;
  zoomToShape: (id: string) => void;
  locate: () => void;
  resetView: () => void;
}

const TOOLS: { id: DrawMode; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Курсор", icon: MousePointer2 },
  { id: "polygon", label: "Полигон", icon: Pencil },
  { id: "rectangle", label: "Прямоугольник", icon: Square },
  { id: "circle", label: "Круг", icon: CircleIcon },
  { id: "marker", label: "Точка", icon: MapPin },
];

export default function Toolbar(props: ToolbarProps) {
  const {
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
    theme,
    setTheme,
    synoptic,
    setSynoptic,
    exportGeoJSON,
    importGeoJSON,
    toggleVisibility,
    zoomToShape,
    locate,
    resetView,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState(false);

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importGeoJSON(String(reader.result));
        setImportError(false);
      } catch {
        setImportError(true);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[1px] md:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-full max-w-sm flex-col bg-white/97 shadow-2xl ring-1 ring-slate-200 backdrop-blur transition-transform duration-300 ease-out dark:bg-slate-900/97 dark:ring-slate-700",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-slate-700">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">CSF · SPC стиль</p>
            <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">МетеоТатарстан</h1>
            <p className="text-xs text-slate-400">Радар зон и предупреждений</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Theme */}
          <section>
            <SectionLabel emoji="🎨" text="Тема" />
            <div className="grid grid-cols-2 gap-2">
              <ThemeBtn active={theme === "light"} onClick={() => setTheme("light")} icon={Sun} label="Светлая" />
              <ThemeBtn active={theme === "dark"} onClick={() => setTheme("dark")} icon={Moon} label="Тёмная" />
            </div>
          </section>

          {/* Categories */}
          <section>
            <SectionLabel emoji="🗂️" text="Категория оповещения" />
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                    activeCategory === cat.id
                      ? "border-transparent text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  )}
                  style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                >
                  <span>
                    {cat.emoji} {cat.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-normal",
                      activeCategory === cat.id ? "text-white/85" : "text-slate-400"
                    )}
                  >
                    {cat.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Tool */}
          <section>
            <SectionLabel emoji="✏️" text="Инструмент" />
            <div className="grid grid-cols-5 gap-1.5">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  title={t.label}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[10px] font-medium transition",
                    mode === t.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  )}
                >
                  <t.icon size={17} />
                  <span className="leading-none">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Color / style */}
          <section>
            <SectionLabel emoji="🖍️" text="Цвет и стиль зоны" />
            <div className="flex flex-wrap gap-2">
              {EXTRA_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveStyle({ color: c })}
                  className={cn(
                    "h-7 w-7 rounded-full ring-2 ring-offset-2 transition dark:ring-offset-slate-900",
                    activeStyle.color === c ? "ring-slate-800 dark:ring-white" : "ring-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={activeStyle.color}
                onChange={(e) => setActiveStyle({ color: e.target.value })}
                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Заливка</span>
                <span>{Math.round(activeStyle.fillOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.7}
                step={0.05}
                value={activeStyle.fillOpacity}
                onChange={(e) => setActiveStyle({ fillOpacity: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatusBtn
                active={activeStyle.status === "forecast"}
                onClick={() => setActiveStyle({ status: "forecast" })}
                label="🔎 Прогноз"
              />
              <StatusBtn
                active={activeStyle.status === "active"}
                onClick={() => setActiveStyle({ status: "active" })}
                label="⚠️ Подтверждено"
              />
            </div>
          </section>

          {/* Synoptic */}
          <section>
            <SectionLabel emoji="👤" text="Синоптик" />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <User size={16} className="text-slate-400" />
              <input
                value={synoptic}
                onChange={(e) => setSynoptic(e.target.value)}
                placeholder="Ваше имя / позывной"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </div>
          </section>

          {/* Actions */}
          <section>
            <SectionLabel emoji="🧰" text="Действия" />
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn icon={Undo2} label="Отменить" onClick={undo} disabled={!canUndo} />
              <ActionBtn icon={Redo2} label="Вернуть" onClick={redo} disabled={!canRedo} />
              <ActionBtn icon={LocateFixed} label="Моё место" onClick={locate} />
              <ActionBtn icon={RotateCcw} label="Татарстан" onClick={resetView} />
              <ActionBtn icon={Download} label="Экспорт" onClick={exportGeoJSON} />
              <ActionBtn icon={Upload} label="Импорт" onClick={handleImportClick} />
            </div>
            <input ref={fileInputRef} type="file" accept=".geojson,.json" onChange={handleFile} className="hidden" />
            {importError && <p className="mt-1 text-xs text-red-500">Не удалось прочитать файл</p>}
            <button
              onClick={onClearAll}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
            >
              <Trash2 size={15} /> Очистить всю карту
            </button>
          </section>

          {/* Shapes list */}
          <section>
            <SectionLabel emoji="📋" text={`Зоны на карте (${shapes.length})`} />
            {shapes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400 dark:border-slate-700">
                Пока нет ни одной зоны. Выберите инструмент выше и отметьте зону на карте.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {shapes.map((s) => {
                  const cat = CATEGORIES.find((c) => c.id === s.category)!;
                  const isSelected = s.id === selectedId;
                  return (
                    <li
                      key={s.id}
                      onClick={() => selectShape(s.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition",
                        isSelected
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      )}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: s.style.color, opacity: s.visible ? 1 : 0.3 }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-700 dark:text-slate-200">
                          {cat.emoji} {s.label}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {s.style.status === "active" ? "Подтверждено" : "Прогноз"}
                          {s.areaKm2 ? ` · ~${Math.round(s.areaKm2)} км²` : ""}
                          {s.synoptic ? ` · ${s.synoptic}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <IconBtn
                          icon={s.visible ? Eye : EyeOff}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(s.id);
                          }}
                        />
                        <IconBtn
                          icon={ZoomIn}
                          onClick={(e) => {
                            e.stopPropagation();
                            zoomToShape(s.id);
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {selectedId && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={onDuplicate}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Copy size={13} /> Копировать
                </button>
                <button
                  onClick={onDeleteSelected}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 size={13} /> Удалить
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-slate-200 px-4 py-2.5 text-center text-[10px] text-slate-400 dark:border-slate-700">
          Идея категорий и рабочего процесса вдохновлена проектом CSF · SPC Russia
        </div>
      </aside>
    </>
  );
}

function SectionLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
      <span>{emoji}</span> {text}
    </p>
  );
}

function ThemeBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sun;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold transition",
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      )}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

function StatusBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border py-2 text-xs font-semibold transition",
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      )}
    >
      {label}
    </button>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Undo2;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function IconBtn({ icon: Icon, onClick }: { icon: typeof Eye; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200/70 dark:hover:bg-slate-700">
      <Icon size={13} />
    </button>
  );
}
