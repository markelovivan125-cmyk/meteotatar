import { useState } from "react";
import { ChevronDown, ChevronUp, Radar } from "lucide-react";
import { CATEGORIES } from "../lib/categories";
import { cn } from "../utils/cn";

export default function Legend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-4 right-3 z-20 flex justify-end pb-[env(safe-area-inset-bottom)] sm:bottom-5 sm:right-5">
      <div className="pointer-events-auto w-52 overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/95 dark:ring-slate-700">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <Radar size={14} className="text-indigo-500" /> Легенда
          </span>
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div className={cn("space-y-1.5 px-3 pb-3 transition-all", collapsed ? "hidden" : "block")}>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <span>
                {cat.emoji} {cat.label}
              </span>
            </div>
          ))}
          <div className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-700">
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-0 w-4 border-t-2 border-dashed border-slate-400" /> Прогноз (Watch)
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <span className="inline-block h-0 w-4 border-t-2 border-slate-700" /> Подтверждено (Warning)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
