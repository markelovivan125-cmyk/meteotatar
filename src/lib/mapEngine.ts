import L from "leaflet";
import { CATEGORIES, getCategory, type CategoryId } from "./categories";
import type { ActiveStylePatch, DrawMode, ShapeMeta, ShapeStatus, ShapeType } from "../types/map";

const TATARSTAN_CENTER: L.LatLngTuple = [55.7963, 49.1064];
const TATARSTAN_BOUNDS = L.latLngBounds([53.9, 47.0], [56.9, 54.6]);

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function uid() {
  return `zone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function polygonAreaKm2(latlngs: L.LatLng[]): number {
  if (latlngs.length < 3) return 0;
  const R = 6371; // km
  const lat0 = toRad(latlngs.reduce((s, p) => s + p.lat, 0) / latlngs.length);
  const pts = latlngs.map((p) => ({
    x: toRad(p.lng) * R * Math.cos(lat0),
    y: toRad(p.lat) * R,
  }));
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
}

function makeMarkerIcon(color: string, selected = false) {
  const size = selected ? 28 : 22;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45);transform:rotate(-45deg)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

interface Record_ {
  id: string;
  type: ShapeType;
  category: CategoryId;
  color: string;
  fillOpacity: number;
  status: ShapeStatus;
  label: string;
  synoptic: string;
  createdAt: number;
  visible: boolean;
  layer: L.Layer;
  geom:
    | { kind: "polygon"; latlngs: L.LatLng[] }
    | { kind: "rectangle"; bounds: L.LatLngBounds }
    | { kind: "circle"; center: L.LatLng; radius: number }
    | { kind: "marker"; latlng: L.LatLng };
}

type Listener = () => void;

export class MapEngine {
  map: L.Map;
  private tileLight: L.TileLayer;
  private tileDark: L.TileLayer;
  private shapesGroup: L.LayerGroup;
  private previewLayer: L.Layer | null = null;
  private records = new Map<string, Record_>();
  private order: string[] = [];
  private listeners = new Set<Listener>();

  mode: DrawMode = "select";
  activeCategory: CategoryId = "convective";
  activeStyle = { color: getCategory("convective").color, fillOpacity: 0.35, status: "forecast" as ShapeStatus };
  synopticName = "";
  theme: "light" | "dark" = "light";
  selectedId: string | null = null;
  hint = "";
  tempPoints: L.LatLng[] = [];

  undoStack: string[] = [];
  redoStack: string[] = [];

  constructor(container: HTMLElement) {
    this.map = L.map(container, {
      center: TATARSTAN_CENTER,
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
      maxBounds: L.latLngBounds([50, 40], [60, 62]),
      maxBoundsViscosity: 0.6,
    });

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    this.tileLight = L.tileLayer(LIGHT_TILES, { attribution: TILE_ATTR, maxZoom: 18 });
    this.tileDark = L.tileLayer(DARK_TILES, { attribution: TILE_ATTR, maxZoom: 18 });
    this.tileLight.addTo(this.map);

    this.shapesGroup = L.layerGroup().addTo(this.map);

    try {
      const saved = localStorage.getItem("meteotatar.synoptic");
      if (saved) this.synopticName = saved;
    } catch {
      /* ignore */
    }

    this.map.on("click", this.handleMapClick);
    this.map.on("mousemove", this.handleMouseMove);
    this.map.on("dblclick", this.handleDblClick);

    this.resetView(false);
    this.updateHint();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  // ---------- mode & style ----------

  setMode(mode: DrawMode) {
    this.clearTempDrawing();
    this.mode = mode;
    if (mode !== "select") this.selectShape(null, false);
    this.updateHint();
    this.emit();
  }

  setActiveCategory(cat: CategoryId) {
    this.activeCategory = cat;
    this.activeStyle.color = getCategory(cat).color;
    this.emit();
  }

  setActiveStyle(patch: ActiveStylePatch) {
    this.activeStyle = { ...this.activeStyle, ...patch };
    this.emit();
  }

  setSynopticName(name: string) {
    this.synopticName = name;
    try {
      localStorage.setItem("meteotatar.synoptic", name);
    } catch {
      /* ignore */
    }
    this.emit();
  }

  setTheme(theme: "light" | "dark") {
    this.theme = theme;
    if (theme === "dark") {
      this.map.removeLayer(this.tileLight);
      this.tileDark.addTo(this.map);
    } else {
      this.map.removeLayer(this.tileDark);
      this.tileLight.addTo(this.map);
    }
    this.emit();
  }

  private updateHint() {
    const n = this.tempPoints.length;
    switch (this.mode) {
      case "select":
        this.hint = "";
        break;
      case "marker":
        this.hint = "Кликните на карте, чтобы поставить точечное предупреждение";
        break;
      case "rectangle":
        this.hint = n === 0 ? "Кликните — первый угол прямоугольника" : "Кликните — противоположный угол";
        break;
      case "circle":
        this.hint = n === 0 ? "Кликните — центр зоны" : "Кликните ещё раз, чтобы задать радиус";
        break;
      case "polygon":
        this.hint =
          n < 3
            ? `Отмечайте контур зоны точками (${n} из мин. 3)`
            : `Точек: ${n}. Нажмите «Готово» или продолжайте отмечать контур`;
        break;
    }
  }

  // ---------- drawing ----------

  private handleMapClick = (e: L.LeafletMouseEvent) => {
    if (this.mode === "select") {
      this.selectShape(null);
      return;
    }
    const latlng = e.latlng;
    if (this.mode === "marker") {
      this.finalizeMarker(latlng);
      return;
    }
    this.tempPoints.push(latlng);
    if (this.mode === "rectangle" && this.tempPoints.length === 2) {
      this.finalizeRectangle();
    } else if (this.mode === "circle" && this.tempPoints.length === 2) {
      this.finalizeCircle();
    } else if (this.mode === "polygon") {
      this.renderPolygonPreview();
    }
    this.updateHint();
    this.emit();
  };

  private handleDblClick = () => {
    if (this.mode === "polygon" && this.tempPoints.length >= 3) {
      this.finishDrawing();
    }
  };

  private handleMouseMove = (e: L.LeafletMouseEvent) => {
    if (this.mode === "select" || this.tempPoints.length === 0) return;
    const cursor = e.latlng;
    this.clearPreview();
    const previewStyle: L.PathOptions = {
      color: this.activeStyle.color,
      weight: 2,
      fillOpacity: this.activeStyle.fillOpacity * 0.7,
      dashArray: "4 6",
    };
    if (this.mode === "rectangle" && this.tempPoints.length === 1) {
      this.previewLayer = L.rectangle(L.latLngBounds(this.tempPoints[0], cursor), previewStyle).addTo(this.map);
    } else if (this.mode === "circle" && this.tempPoints.length === 1) {
      const radius = this.tempPoints[0].distanceTo(cursor);
      this.previewLayer = L.circle(this.tempPoints[0], { ...previewStyle, radius }).addTo(this.map);
    } else if (this.mode === "polygon") {
      this.previewLayer = L.polyline([...this.tempPoints, cursor], previewStyle).addTo(this.map);
    }
  };

  private renderPolygonPreview() {
    this.clearPreview();
    if (this.tempPoints.length > 0) {
      this.previewLayer = L.polyline(this.tempPoints, {
        color: this.activeStyle.color,
        weight: 2,
        dashArray: "4 6",
      }).addTo(this.map);
    }
  }

  private clearPreview() {
    if (this.previewLayer) {
      this.map.removeLayer(this.previewLayer);
      this.previewLayer = null;
    }
  }

  private clearTempDrawing() {
    this.tempPoints = [];
    this.clearPreview();
  }

  undoLastPoint() {
    if (this.mode !== "polygon" || this.tempPoints.length === 0) return;
    this.tempPoints.pop();
    this.renderPolygonPreview();
    this.updateHint();
    this.emit();
  }

  finishDrawing() {
    if (this.mode === "polygon" && this.tempPoints.length >= 3) {
      this.finalizePolygon();
    }
  }

  cancelDrawing() {
    this.clearTempDrawing();
    this.updateHint();
    this.emit();
  }

  private pathStyle(): L.PathOptions {
    return {
      color: this.activeStyle.color,
      weight: this.activeStyle.status === "active" ? 3 : 2,
      fillColor: this.activeStyle.color,
      fillOpacity: this.activeStyle.fillOpacity,
      dashArray: this.activeStyle.status === "forecast" ? "8 6" : undefined,
      opacity: 1,
    };
  }

  private attachSelectHandler(layer: L.Layer, id: string) {
    layer.on("click", (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      this.selectShape(id);
    });
  }

  private commitRecord(rec: Omit<Record_, "layer"> & { layer: L.Layer }) {
    this.pushUndo();
    this.shapesGroup.addLayer(rec.layer);
    this.attachSelectHandler(rec.layer, rec.id);
    rec.layer.bindPopup(this.popupHtml(rec));
    this.records.set(rec.id, rec);
    this.order.push(rec.id);
    this.clearTempDrawing();
    this.updateHint();
    this.emit();
  }

  private popupHtml(rec: Pick<Record_, "category" | "label" | "synoptic" | "status" | "createdAt">) {
    const cat = getCategory(rec.category);
    const statusLabel = rec.status === "active" ? "⚠️ Подтверждено" : "🔎 Прогноз";
    const date = new Date(rec.createdAt).toLocaleString("ru-RU");
    return `<div style="font-family:inherit;min-width:170px">
      <div style="font-weight:700;margin-bottom:2px">${cat.emoji} ${rec.label}</div>
      <div style="font-size:12px;color:#475569">${cat.label} · ${statusLabel}</div>
      ${rec.synoptic ? `<div style="font-size:12px;color:#475569">👤 Синоптик: ${rec.synoptic}</div>` : ""}
      <div style="font-size:11px;color:#94a3b8;margin-top:4px">${date}</div>
    </div>`;
  }

  private finalizeMarker(latlng: L.LatLng) {
    const id = uid();
    const layer = L.marker(latlng, { icon: makeMarkerIcon(this.activeStyle.color) });
    this.commitRecord({
      id,
      type: "marker",
      category: this.activeCategory,
      color: this.activeStyle.color,
      fillOpacity: this.activeStyle.fillOpacity,
      status: this.activeStyle.status,
      label: `${getCategory(this.activeCategory).label} — точка`,
      synoptic: this.synopticName,
      createdAt: Date.now(),
      visible: true,
      layer,
      geom: { kind: "marker", latlng },
    });
  }

  private finalizeRectangle() {
    const bounds = L.latLngBounds(this.tempPoints[0], this.tempPoints[1]);
    const layer = L.rectangle(bounds, this.pathStyle());
    this.commitRecord({
      id: uid(),
      type: "rectangle",
      category: this.activeCategory,
      color: this.activeStyle.color,
      fillOpacity: this.activeStyle.fillOpacity,
      status: this.activeStyle.status,
      label: `${getCategory(this.activeCategory).label} — зона`,
      synoptic: this.synopticName,
      createdAt: Date.now(),
      visible: true,
      layer,
      geom: { kind: "rectangle", bounds },
    });
  }

  private finalizeCircle() {
    const center = this.tempPoints[0];
    const radius = center.distanceTo(this.tempPoints[1]);
    const layer = L.circle(center, { ...this.pathStyle(), radius });
    this.commitRecord({
      id: uid(),
      type: "circle",
      category: this.activeCategory,
      color: this.activeStyle.color,
      fillOpacity: this.activeStyle.fillOpacity,
      status: this.activeStyle.status,
      label: `${getCategory(this.activeCategory).label} — очаг`,
      synoptic: this.synopticName,
      createdAt: Date.now(),
      visible: true,
      layer,
      geom: { kind: "circle", center, radius },
    });
  }

  private finalizePolygon() {
    const latlngs = [...this.tempPoints];
    const layer = L.polygon(latlngs, this.pathStyle());
    this.commitRecord({
      id: uid(),
      type: "polygon",
      category: this.activeCategory,
      color: this.activeStyle.color,
      fillOpacity: this.activeStyle.fillOpacity,
      status: this.activeStyle.status,
      label: `${getCategory(this.activeCategory).label} — область`,
      synoptic: this.synopticName,
      createdAt: Date.now(),
      visible: true,
      layer,
      geom: { kind: "polygon", latlngs },
    });
  }

  // ---------- selection & editing ----------

  selectShape(id: string | null, emit = true) {
    this.selectedId = id;
    this.records.forEach((rec, key) => {
      if (rec.type === "marker") return;
      const path = rec.layer as L.Path;
      const base: L.PathOptions = {
        color: rec.color,
        weight: rec.status === "active" ? 3 : 2,
        fillColor: rec.color,
        fillOpacity: rec.fillOpacity,
        dashArray: rec.status === "forecast" ? "8 6" : undefined,
      };
      if (key === id) {
        path.setStyle({ ...base, weight: base.weight! + 3, color: "#111827" });
        path.bringToFront();
      } else {
        path.setStyle(base);
      }
    });
    if (emit) this.emit();
  }

  updateShapeMeta(id: string, patch: { label?: string; category?: CategoryId; color?: string; fillOpacity?: number; status?: ShapeStatus }) {
    const rec = this.records.get(id);
    if (!rec) return;
    this.pushUndo();
    if (patch.label !== undefined) rec.label = patch.label;
    if (patch.category !== undefined) rec.category = patch.category;
    if (patch.color !== undefined) rec.color = patch.color;
    if (patch.fillOpacity !== undefined) rec.fillOpacity = patch.fillOpacity;
    if (patch.status !== undefined) rec.status = patch.status;
    if (rec.type !== "marker") {
      (rec.layer as L.Path).setStyle({
        color: rec.color,
        weight: rec.status === "active" ? 3 : 2,
        fillColor: rec.color,
        fillOpacity: rec.fillOpacity,
        dashArray: rec.status === "forecast" ? "8 6" : undefined,
      });
    } else {
      (rec.layer as L.Marker).setIcon(makeMarkerIcon(rec.color));
    }
    rec.layer.unbindPopup();
    rec.layer.bindPopup(this.popupHtml(rec));
    this.emit();
  }

  deleteSelected() {
    if (!this.selectedId) return;
    this.deleteShape(this.selectedId);
  }

  deleteShape(id: string) {
    const rec = this.records.get(id);
    if (!rec) return;
    this.pushUndo();
    this.shapesGroup.removeLayer(rec.layer);
    this.records.delete(id);
    this.order = this.order.filter((x) => x !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.emit();
  }

  duplicateSelected() {
    if (!this.selectedId) return;
    const rec = this.records.get(this.selectedId);
    if (!rec) return;
    this.pushUndo();
    const offset = 0.05;
    const id = uid();
    let layer: L.Layer;
    let geom: Record_["geom"];
    if (rec.geom.kind === "polygon") {
      const latlngs = rec.geom.latlngs.map((p) => L.latLng(p.lat + offset, p.lng + offset));
      layer = L.polygon(latlngs, this.styleFor(rec));
      geom = { kind: "polygon", latlngs };
    } else if (rec.geom.kind === "rectangle") {
      const sw = rec.geom.bounds.getSouthWest();
      const ne = rec.geom.bounds.getNorthEast();
      const bounds = L.latLngBounds(
        L.latLng(sw.lat + offset, sw.lng + offset),
        L.latLng(ne.lat + offset, ne.lng + offset)
      );
      layer = L.rectangle(bounds, this.styleFor(rec));
      geom = { kind: "rectangle", bounds };
    } else if (rec.geom.kind === "circle") {
      const center = L.latLng(rec.geom.center.lat + offset, rec.geom.center.lng + offset);
      layer = L.circle(center, { ...this.styleFor(rec), radius: rec.geom.radius });
      geom = { kind: "circle", center, radius: rec.geom.radius };
    } else {
      const latlng = L.latLng(rec.geom.latlng.lat + offset, rec.geom.latlng.lng + offset);
      layer = L.marker(latlng, { icon: makeMarkerIcon(rec.color) });
      geom = { kind: "marker", latlng };
    }
    const copy: Record_ = { ...rec, id, layer, geom, createdAt: Date.now() };
    this.shapesGroup.addLayer(layer);
    this.attachSelectHandler(layer, id);
    layer.bindPopup(this.popupHtml(copy));
    this.records.set(id, copy);
    this.order.push(id);
    this.selectShape(id, false);
    this.emit();
  }

  private styleFor(rec: Record_): L.PathOptions {
    return {
      color: rec.color,
      weight: rec.status === "active" ? 3 : 2,
      fillColor: rec.color,
      fillOpacity: rec.fillOpacity,
      dashArray: rec.status === "forecast" ? "8 6" : undefined,
    };
  }

  clearAll() {
    if (this.records.size === 0) return;
    this.pushUndo();
    this.shapesGroup.clearLayers();
    this.records.clear();
    this.order = [];
    this.selectedId = null;
    this.emit();
  }

  toggleVisibility(id: string) {
    const rec = this.records.get(id);
    if (!rec) return;
    rec.visible = !rec.visible;
    if (rec.visible) this.shapesGroup.addLayer(rec.layer);
    else this.shapesGroup.removeLayer(rec.layer);
    this.emit();
  }

  zoomToShape(id: string) {
    const rec = this.records.get(id);
    if (!rec) return;
    if (rec.geom.kind === "marker") {
      this.map.flyTo(rec.geom.latlng, Math.max(this.map.getZoom(), 10));
    } else if ("getBounds" in rec.layer) {
      this.map.flyToBounds((rec.layer as L.Polygon).getBounds(), { padding: [40, 40] });
    }
    this.selectShape(id);
  }

  // ---------- view ----------

  locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.map.flyTo([latitude, longitude], 11);
        L.circleMarker([latitude, longitude], {
          radius: 7,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(this.map)
          .bindPopup("Вы здесь")
          .openPopup();
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  resetView(animate = true) {
    if (animate) this.map.flyToBounds(TATARSTAN_BOUNDS, { padding: [30, 30] });
    else this.map.fitBounds(TATARSTAN_BOUNDS, { padding: [30, 30] });
  }

  // ---------- undo/redo ----------

  private pushUndo() {
    this.undoStack.push(this.serialize());
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (!this.undoStack.length) return;
    const prev = this.undoStack.pop()!;
    this.redoStack.push(this.serialize());
    this.rebuildFrom(prev);
    this.emit();
  }

  redo() {
    if (!this.redoStack.length) return;
    const next = this.redoStack.pop()!;
    this.undoStack.push(this.serialize());
    this.rebuildFrom(next);
    this.emit();
  }

  private serialize(): string {
    const arr = this.order
      .map((id) => this.records.get(id))
      .filter(Boolean)
      .map((rec) => {
        const r = rec as Record_;
        let geometry: unknown;
        if (r.geom.kind === "polygon") geometry = { kind: "polygon", latlngs: r.geom.latlngs.map((p) => [p.lat, p.lng]) };
        else if (r.geom.kind === "rectangle") {
          const sw = r.geom.bounds.getSouthWest();
          const ne = r.geom.bounds.getNorthEast();
          geometry = { kind: "rectangle", bounds: [[sw.lat, sw.lng], [ne.lat, ne.lng]] };
        } else if (r.geom.kind === "circle") geometry = { kind: "circle", center: [r.geom.center.lat, r.geom.center.lng], radius: r.geom.radius };
        else geometry = { kind: "marker", latlng: [r.geom.latlng.lat, r.geom.latlng.lng] };
        return {
          id: r.id,
          type: r.type,
          category: r.category,
          color: r.color,
          fillOpacity: r.fillOpacity,
          status: r.status,
          label: r.label,
          synoptic: r.synoptic,
          createdAt: r.createdAt,
          visible: r.visible,
          geometry,
        };
      });
    return JSON.stringify(arr);
  }

  private rebuildFrom(json: string) {
    this.shapesGroup.clearLayers();
    this.records.clear();
    this.order = [];
    const selected = this.selectedId;
    this.selectedId = null;
    let arr: any[] = [];
    try {
      arr = JSON.parse(json);
    } catch {
      arr = [];
    }
    for (const item of arr) {
      const geometry = item.geometry;
      let layer: L.Layer;
      let geom: Record_["geom"];
      const style: L.PathOptions = {
        color: item.color,
        weight: item.status === "active" ? 3 : 2,
        fillColor: item.color,
        fillOpacity: item.fillOpacity,
        dashArray: item.status === "forecast" ? "8 6" : undefined,
      };
      if (geometry.kind === "polygon") {
        const latlngs = geometry.latlngs.map((p: [number, number]) => L.latLng(p[0], p[1]));
        layer = L.polygon(latlngs, style);
        geom = { kind: "polygon", latlngs };
      } else if (geometry.kind === "rectangle") {
        const bounds = L.latLngBounds(L.latLng(geometry.bounds[0][0], geometry.bounds[0][1]), L.latLng(geometry.bounds[1][0], geometry.bounds[1][1]));
        layer = L.rectangle(bounds, style);
        geom = { kind: "rectangle", bounds };
      } else if (geometry.kind === "circle") {
        const center = L.latLng(geometry.center[0], geometry.center[1]);
        layer = L.circle(center, { ...style, radius: geometry.radius });
        geom = { kind: "circle", center, radius: geometry.radius };
      } else {
        const latlng = L.latLng(geometry.latlng[0], geometry.latlng[1]);
        layer = L.marker(latlng, { icon: makeMarkerIcon(item.color) });
        geom = { kind: "marker", latlng };
      }
      const rec: Record_ = {
        id: item.id,
        type: item.type,
        category: item.category,
        color: item.color,
        fillOpacity: item.fillOpacity,
        status: item.status,
        label: item.label,
        synoptic: item.synoptic,
        createdAt: item.createdAt,
        visible: item.visible,
        layer,
        geom,
      };
      if (rec.visible) this.shapesGroup.addLayer(layer);
      this.attachSelectHandler(layer, rec.id);
      layer.bindPopup(this.popupHtml(rec));
      this.records.set(rec.id, rec);
      this.order.push(rec.id);
    }
    if (selected && this.records.has(selected)) this.selectShape(selected, false);
  }

  // ---------- import / export ----------

  exportGeoJSON(): string {
    const features = this.order
      .map((id) => this.records.get(id))
      .filter(Boolean)
      .map((rec) => {
        const r = rec as Record_;
        let geometry: any;
        if (r.geom.kind === "polygon") {
          const coords = r.geom.latlngs.map((p) => [p.lng, p.lat]);
          coords.push(coords[0]);
          geometry = { type: "Polygon", coordinates: [coords] };
        } else if (r.geom.kind === "rectangle") {
          const sw = r.geom.bounds.getSouthWest();
          const ne = r.geom.bounds.getNorthEast();
          const nw = [sw.lng, ne.lat];
          const se = [ne.lng, sw.lat];
          geometry = {
            type: "Polygon",
            coordinates: [[[sw.lng, sw.lat], se, [ne.lng, ne.lat], nw, [sw.lng, sw.lat]]],
          };
        } else if (r.geom.kind === "circle") {
          geometry = { type: "Point", coordinates: [r.geom.center.lng, r.geom.center.lat] };
        } else {
          geometry = { type: "Point", coordinates: [r.geom.latlng.lng, r.geom.latlng.lat] };
        }
        return {
          type: "Feature",
          properties: {
            shapeType: r.type,
            category: r.category,
            color: r.color,
            fillOpacity: r.fillOpacity,
            status: r.status,
            label: r.label,
            synoptic: r.synoptic,
            createdAt: r.createdAt,
            visible: r.visible,
            radius: r.geom.kind === "circle" ? r.geom.radius : undefined,
          },
          geometry,
        };
      });
    return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
  }

  importGeoJSON(text: string) {
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return;
    }
    const features = parsed?.features ?? [];
    this.pushUndo();
    for (const f of features) {
      const props = f.properties ?? {};
      const type: ShapeType = props.shapeType ?? (f.geometry.type === "Point" ? "marker" : "polygon");
      const color = props.color ?? getCategory(props.category ?? "warning").color;
      const fillOpacity = props.fillOpacity ?? 0.35;
      const status: ShapeStatus = props.status ?? "forecast";
      const style: L.PathOptions = {
        color,
        weight: status === "active" ? 3 : 2,
        fillColor: color,
        fillOpacity,
        dashArray: status === "forecast" ? "8 6" : undefined,
      };
      let layer: L.Layer;
      let geom: Record_["geom"];
      if (type === "marker" || (f.geometry.type === "Point" && !props.radius)) {
        const [lng, lat] = f.geometry.coordinates;
        const latlng = L.latLng(lat, lng);
        layer = L.marker(latlng, { icon: makeMarkerIcon(color) });
        geom = { kind: "marker", latlng };
      } else if (f.geometry.type === "Point" && props.radius) {
        const [lng, lat] = f.geometry.coordinates;
        const center = L.latLng(lat, lng);
        layer = L.circle(center, { ...style, radius: props.radius });
        geom = { kind: "circle", center, radius: props.radius };
      } else {
        const ring: [number, number][] = f.geometry.coordinates[0];
        const latlngs = ring.slice(0, -1).map(([lng, lat]) => L.latLng(lat, lng));
        if (type === "rectangle") {
          layer = L.polygon(latlngs, style);
          geom = { kind: "polygon", latlngs };
        } else {
          layer = L.polygon(latlngs, style);
          geom = { kind: "polygon", latlngs };
        }
      }
      const rec: Record_ = {
        id: uid(),
        type: type === "rectangle" ? "polygon" : type,
        category: props.category ?? "warning",
        color,
        fillOpacity,
        status,
        label: props.label ?? "Импортированная зона",
        synoptic: props.synoptic ?? "",
        createdAt: props.createdAt ?? Date.now(),
        visible: props.visible ?? true,
        layer,
        geom,
      };
      if (rec.visible) this.shapesGroup.addLayer(layer);
      this.attachSelectHandler(layer, rec.id);
      layer.bindPopup(this.popupHtml(rec));
      this.records.set(rec.id, rec);
      this.order.push(rec.id);
    }
    this.emit();
  }

  // ---------- getters ----------

  getShapesList(): ShapeMeta[] {
    return [...this.order]
      .reverse()
      .map((id) => this.records.get(id))
      .filter(Boolean)
      .map((rec) => {
        const r = rec as Record_;
        let areaKm2: number | undefined;
        if (r.geom.kind === "polygon") areaKm2 = polygonAreaKm2(r.geom.latlngs);
        else if (r.geom.kind === "circle") areaKm2 = Math.PI * (r.geom.radius / 1000) ** 2;
        return {
          id: r.id,
          type: r.type,
          category: r.category,
          style: { color: r.color, fillOpacity: r.fillOpacity, status: r.status },
          label: r.label,
          synoptic: r.synoptic,
          createdAt: r.createdAt,
          visible: r.visible,
          areaKm2,
        };
      });
  }

  destroy() {
    this.map.off();
    this.map.remove();
    this.listeners.clear();
  }
}

export { CATEGORIES };
