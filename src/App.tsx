import { useCallback, useEffect, useState } from "react";
import { Menu, Radar } from "lucide-react";
import { useMapEngine } from "./hooks/useMapEngine";
import Toolbar from "./components/Toolbar";
import DrawControls from "./components/DrawControls";
import Legend from "./components/Legend";
import { cn } from "./utils/cn";

export default function App() {
  const {
    containerRef,
    engine,
    mode,
    setMode,
    shapes,
    selectedId,
    canUndo,
    canRedo,
    hint,
    tempPointCount,
    activeCategory,
    setActiveCategory,
    activeStyle,
    setActiveStyle,
    theme,
    setTheme,
    synoptic,
    setSynoptic,
  } = useMapEngine();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Плавно открываем панель инструментов вскоре после загрузки карты.
  useEffect(() => {
    const t = setTimeout(() => setSidebarOpen(true), 350);
    return () => clearTimeout(t);
  }, []);

  const selectShape = useCallback((id: string) => engine.current?.selectShape(id), [engine]);
  const onDeleteSelected = useCallback(() => engine.current?.deleteSelected(), [engine]);
  const onDuplicate = useCallback(() => engine.current?.duplicateSelected(), [engine]);
  const onClearAll = useCallback(() => {
    if (confirm("Удалить все зоны с карты?")) engine.current?.clearAll();
  }, [engine]);
  const undo = useCallback(() => engine.current?.undo(), [engine]);
  const redo = useCallback(() => engine.current?.redo(), [engine]);
  const toggleVisibility = useCallback((id: string) => engine.current?.toggleVisibility(id), [engine]);
  const zoomToShape = useCallback((id: string) => engine.current?.zoomToShape(id), [engine]);
  const locate = useCallback(() => engine.current?.locate(), [engine]);
  const resetView = useCallback(() => engine.current?.resetView(), [engine]);
  const onFinish = useCallback(() => engine.current?.finishDrawing(), [engine]);
  const onCancel = useCallback(() => {
    engine.current?.cancelDrawing();
    engine.current?.setMode("select");
  }, [engine]);
  const onUndoPoint = useCallback(() => engine.current?.undoLastPoint(), [engine]);

  const exportGeoJSON = useCallback(() => {
    const data = engine.current?.exportGeoJSON();
    if (!data) return;
    const blob = new Blob([data], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meteotatar-zones-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [engine]);

  const importGeoJSON = useCallback((text: string) => engine.current?.importGeoJSON(text), [engine]);

  return (
    <div className={cn("fixed inset-0 h-[100dvh] w-screen overflow-hidden font-sans", theme === "dark" ? "bg-slate-950" : "bg-slate-100")}>
      {/* Map */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Top bar */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-700",
          sidebarOpen ? "md:opacity-0 md:pointer-events-none" : "opacity-100"
        )}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 py-2.5 pl-3 pr-4 text-sm font-semibold text-slate-700 shadow-2xl ring-1 ring-slate-200 backdrop-blur transition active:scale-95 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-slate-700"
        >
          <Menu size={18} />
          <span className="hidden sm:inline">Инструменты</span>
        </button>
        <div className="pointer-events-auto hidden items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xl ring-1 ring-slate-200 backdrop-blur sm:flex dark:bg-slate-900/95 dark:text-slate-100 dark:ring-slate-700">
          <Radar size={16} className="text-indigo-600" />
          CSF · МетеоТатарстан — карта предупреждений
        </div>
      </div>

      <Toolbar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mode={mode}
        setMode={setMode}
        shapes={shapes}
        selectedId={selectedId}
        selectShape={selectShape}
        onDeleteSelected={onDeleteSelected}
        onDuplicate={onDuplicate}
        onClearAll={onClearAll}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeStyle={activeStyle}
        setActiveStyle={setActiveStyle}
        theme={theme}
        setTheme={setTheme}
        synoptic={synoptic}
        setSynoptic={setSynoptic}
        exportGeoJSON={exportGeoJSON}
        importGeoJSON={importGeoJSON}
        toggleVisibility={toggleVisibility}
        zoomToShape={zoomToShape}
        locate={locate}
        resetView={resetView}
      />

      <DrawControls
        mode={mode}
        hint={hint}
        tempPointCount={tempPointCount}
        onFinish={onFinish}
        onCancel={onCancel}
        onUndoPoint={onUndoPoint}
      />

      <Legend />
    </div>
  );
}
