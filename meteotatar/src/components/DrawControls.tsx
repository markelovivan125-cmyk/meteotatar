import { Check, RotateCcw, X } from "lucide-react";
import type { DrawMode } from "../types/shapes";

interface Props {
  mode: DrawMode;
  hint: string;
  onFinish: () => void;
  onCancel: () => void;
  onUndoPoint: () => void;
}

const MULTI_POINT_MODES: DrawMode[] = ["polygon", "line"];
const ACTIVE_MODES: DrawMode[] = ["polygon", "rectangle", "circle", "freehand", "line", "point", "edit", "move"];

export default function DrawControls({ mode, hint, onFinish, onCancel, onUndoPoint }: Props) {
  if (!ACTIVE_MODES.includes(mode)) return null;
  const showFinishControls = MULTI_POINT_MODES.includes(mode);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {hint && (
        <div className="pointer-events-auto max-w-sm rounded-2xl bg-slate-900/90 px-4 py-2 text-center text-xs font-medium text-white shadow-2xl backdrop-blur">
          {hint}
        </div>
      )}
      {showFinishControls && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 p-1.5 shadow-2xl ring-1 ring-slate-200 backdrop-blur">
          <button
            onClick={onUndoPoint}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95"
          >
            <RotateCcw size={15} /> Назад
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:scale-95"
          >
            <X size={15} /> Отмена
          </button>
          <button
            onClick={onFinish}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-700 active:scale-95"
          >
            <Check size={15} /> Готово
          </button>
        </div>
      )}
    </div>
  );
}
