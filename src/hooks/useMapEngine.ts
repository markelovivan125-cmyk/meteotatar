import { useCallback, useEffect, useRef, useState } from "react";
import { MapEngine } from "../lib/mapEngine";
import type { CategoryId } from "../lib/categories";
import type { ActiveStylePatch, DrawMode, ShapeMeta, ShapeStatus } from "../types/map";

export function useMapEngine() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engine = useRef<MapEngine | null>(null);

  const [mode, setModeState] = useState<DrawMode>("select");
  const [shapes, setShapes] = useState<ShapeMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hint, setHint] = useState("");
  const [tempPointCount, setTempPointCount] = useState(0);
  const [activeCategory, setActiveCategoryState] = useState<CategoryId>("convective");
  const [activeStyle, setActiveStyleState] = useState<{ color: string; fillOpacity: number; status: ShapeStatus }>({
    color: "#f97316",
    fillOpacity: 0.35,
    status: "forecast",
  });
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [synoptic, setSynopticState] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    const eng = new MapEngine(containerRef.current);
    engine.current = eng;
    setSynopticState(eng.synopticName);

    const sync = () => {
      setShapes(eng.getShapesList());
      setSelectedId(eng.selectedId);
      setCanUndo(eng.undoStack.length > 0);
      setCanRedo(eng.redoStack.length > 0);
      setHint(eng.hint);
      setModeState(eng.mode);
      setTempPointCount(eng.tempPoints.length);
      setActiveCategoryState(eng.activeCategory);
      setActiveStyleState({ ...eng.activeStyle });
      setThemeState(eng.theme);
      setSynopticState(eng.synopticName);
    };
    const unsub = eng.subscribe(sync);
    sync();

    return () => {
      unsub();
      eng.destroy();
      engine.current = null;
    };
  }, []);

  const setMode = useCallback((m: DrawMode) => engine.current?.setMode(m), []);
  const setActiveCategory = useCallback((c: CategoryId) => engine.current?.setActiveCategory(c), []);
  const setActiveStyle = useCallback((s: ActiveStylePatch) => engine.current?.setActiveStyle(s), []);
  const setTheme = useCallback((t: "light" | "dark") => engine.current?.setTheme(t), []);
  const setSynoptic = useCallback((name: string) => engine.current?.setSynopticName(name), []);

  return {
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
  };
}
