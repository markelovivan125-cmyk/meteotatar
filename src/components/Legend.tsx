import { useState } from "react";
import { Info, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";

export default function Legend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-start gap-2 sm:left-auto sm:right-3 sm:w-72">
      <div
        className={cn(
          "pointer-events-auto w-full overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-slate-200 backdrop-blur transition-all duration-300",
          open ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Info size={13} className="text-indigo-600" /> Условные обозначения
          </div>
          <LegendRow swatch={<DotsSwatch color="#7c3aed" />} text="Заливка точками — град или гроза" />
          <LegendRow swatch={<SolidSwatch color="#f59e0b" />} text="Заливка без точек — риск явления" />
          <LegendRow swatch={<DashedSwatch color="#ef4444" />} text="Пунктирный контур — предупреждение о грозе" />
          <LegendRow swatch={<HatchSwatch color="#16a34a" />} text="Штриховая заливка — доп. явления (ветер и т.д.)" />
        </div>
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex w-full items-center justify-between gap-2 rounded-full bg-white/95 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xl ring-1 ring-slate-200 backdrop-blur active:scale-95 sm:w-auto"
      >
        Легенда {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );
}

function LegendRow({ swatch, text }: { swatch: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-600">
      {swatch}
      <span>{text}</span>
    </div>
  );
}

function DotsSwatch({ color }: { color: string }) {
  return (
    <svg width="26" height="20" className="shrink-0 rounded ring-1 ring-slate-200" style={{ background: `${color}22` }}>
      {[[5, 5], [16, 5], [10, 12], [22, 12], [5, 16], [16, 16]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.6} fill={color} />
      ))}
    </svg>
  );
}

function SolidSwatch({ color }: { color: string }) {
  return <div className="h-5 w-6.5 shrink-0 rounded ring-1 ring-slate-200" style={{ width: 26, height: 20, background: `${color}55`, border: `1.5px solid ${color}` }} />;
}

function DashedSwatch({ color }: { color: string }) {
  return (
    <svg width="26" height="20" className="shrink-0 rounded" style={{ background: `${color}22` }}>
      <rect x="1" y="1" width="24" height="18" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" />
    </svg>
  );
}

function HatchSwatch({ color }: { color: string }) {
  const id = "legend-hatch";
  return (
    <svg width="26" height="20" className="shrink-0 rounded ring-1 ring-slate-200">
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="26" height="20" fill={`url(#${id})`} />
    </svg>
  );
}
