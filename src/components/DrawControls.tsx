import { Check, X, Undo2 } from "lucide-react";
import type { DrawMode } from "../types/map";

interface DrawControlsProps {
  mode: DrawMode;
  hint: string;
  tempPointCount: number;
  onFinish: () => void;
  onCancel: () => void;
  onUndoPoint: () => void;
}

export default function DrawControls({ mode, hint, tempPointCount, onFinish, onCancel, onUndoPoint }: DrawControlsProps) {
  if (mode === "select") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex max-w-lg flex-1 flex-col gap-2 rounded-2xl bg-slate-900/95 px-4 py-3 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium leading-snug">{hint}</p>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {mode === "polygon" && tempPointCount > 0 && (
            <button
              onClick={onUndoPoint}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            >
              <Undo2 size={13} /> Точка назад
            </button>
          )}
          {mode === "polygon" && tempPointCount >= 3 && (
            <button
              onClick={onFinish}
              className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
            >
              <Check size={13} /> Готово
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold transition hover:bg-red-500"
          >
            <X size={13} /> Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
