"use client";
import { ArrowRight, FlipHorizontal2, FlipVertical2, Link2, Loader2, RotateCcw, RotateCw, Unlink2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert, Button, DownloadButton, Field, Segmented, Slider, Stat } from "@/components/ui";
import { LIMITS } from "@/lib/files";
import { baseName, cn, downloadBlob, errorMessage, formatBytes } from "@/lib/utils";
import { FileDrop, Row } from "./shared";

type Mime = "image/jpeg" | "image/png" | "image/webp";
const EXT: Record<Mime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const LABEL: Record<Mime, string> = { "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WebP" };
const MAX_SIDE = 10_000;

interface Loaded { file: File; url: string; img: HTMLImageElement; w: number; h: number; type: Mime }
interface Result { blob: Blob; url: string; w: number; h: number }

/* ---------- Moteur canvas ---------- */
function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Ton navigateur n'a pas pu allouer la mémoire nécessaire pour cette image.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

function toBlob(canvas: HTMLCanvasElement, type: Mime, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("L'encodage de l'image a échoué (image trop grande pour ce navigateur ?)."));
      else if (blob.type !== type) reject(new Error(`Ton navigateur ne sait pas encoder au format ${LABEL[type]}. Choisis un autre format de sortie.`));
      else resolve(blob);
    }, type, quality);
  });
}

function fillIfOpaque(ctx: CanvasRenderingContext2D, type: Mime, bg = "#ffffff") {
  if (type === "image/jpeg") { ctx.fillStyle = bg; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
}

function useImage() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback((file: File) => {
    setLoading(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLoading(false);
      const w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) { URL.revokeObjectURL(url); toast.error("Cette image est vide ou illisible."); return; }
      if (w * h > LIMITS.maxPixels) { URL.revokeObjectURL(url); toast.error(`Image trop grande (${w} × ${h} px). Limite : ${LIMITS.maxPixels / 1e6} mégapixels.`); return; }
      const type = (["image/jpeg", "image/png", "image/webp"] as Mime[]).includes(file.type as Mime) ? (file.type as Mime) : "image/png";
      setLoaded((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { file, url, img, w, h, type }; });
    };
    img.onerror = () => { setLoading(false); URL.revokeObjectURL(url); toast.error(`Impossible de décoder « ${file.name} » : le fichier semble corrompu.`); };
    img.src = url;
  }, []);
  const clear = useCallback(() => setLoaded((prev) => { if (prev) URL.revokeObjectURL(prev.url); return null; }), []);
  return { loaded, loading, load, clear };
}

/** Recalcule le résultat (avec anti-rebond) dès que les options changent. */
function useProcessed(loaded: Loaded | null, process: (l: Loaded) => Promise<{ blob: Blob; w: number; h: number }>, deps: unknown[]) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(process);
  latest.current = process;
  useEffect(() => {
    if (!loaded) { setResult(null); setError(""); return; }
    let cancelled = false;
    setBusy(true);
    const t = setTimeout(() => {
      latest.current(loaded)
        .then((r) => { if (cancelled) return; setError(""); setResult((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { ...r, url: URL.createObjectURL(r.blob) }; }); })
        .catch((e) => { if (!cancelled) { setError(errorMessage(e, "Le traitement de l'image a échoué.")); setResult(null); } })
        .finally(() => { if (!cancelled) setBusy(false); });
    }, 160);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, ...deps]);
  useEffect(() => () => { setResult((prev) => { if (prev) URL.revokeObjectURL(prev.url); return null; }); }, []);
  return { result, busy, error };
}

/* ---------- Interface partagée ---------- */
function Compare({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="checker relative overflow-hidden rounded-2xl border border-border select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Après traitement" className="mx-auto block max-h-[28rem] w-full object-contain" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="Image d'origine" className="absolute inset-0 size-full object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.25)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg">↔</span>
      </div>
      <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">Avant</span>
      <span className="pointer-events-none absolute top-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">Après</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Position du comparateur avant/après" className="absolute inset-0 !h-full cursor-ew-resize opacity-0" />
    </div>
  );
}

function Preview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="checker flex items-center justify-center overflow-hidden rounded-2xl border border-border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-[28rem] max-w-full object-contain" />
    </div>
  );
}

function Shell({ loaded, loading, onFile, onClear, allowed, controls, children, result, busy, error, suffix, note }: {
  loaded: Loaded | null; loading: boolean; onFile: (f: File) => void; onClear: () => void; allowed?: Mime[];
  controls: ReactNode; children: ReactNode; result: Result | null; busy: boolean; error: string; suffix: string; note?: ReactNode;
}) {
  if (!loaded) {
    return loading
      ? <div className="flex h-56 items-center justify-center rounded-2xl border border-border"><Loader2 className="size-6 animate-spin text-accent" /></div>
      : <FileDrop kind="image" allowed={allowed} onFiles={(f) => onFile(f[0])} />;
  }
  const ext = result ? EXT[result.blob.type as Mime] ?? "png" : "";
  const gain = result ? 1 - result.blob.size / loaded.file.size : 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
      <div className="grid content-start gap-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-subtle/50 p-2.5 pl-3.5">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{loaded.file.name}</p><p className="text-xs text-muted">{loaded.w} × {loaded.h} px · {formatBytes(loaded.file.size)} · {LABEL[loaded.type]}</p></div>
          <Button size="icon" variant="ghost" onClick={onClear} aria-label="Retirer l'image" title="Changer d'image"><X /></Button>
        </div>
        {controls}
        {error && <Alert tone="danger">{error}</Alert>}
        {note}
        {result && (
          <div className="grid gap-3 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted tabular-nums">{formatBytes(loaded.file.size)}</span>
              <ArrowRight className="size-4 text-faint" aria-hidden="true" />
              <span className="font-semibold tabular-nums">{formatBytes(result.blob.size)}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", gain > 0.005 ? "bg-success-soft text-success" : gain < -0.005 ? "bg-warning-soft text-warning" : "bg-subtle text-muted")}>{gain > 0.005 ? "−" : gain < -0.005 ? "+" : ""}{Math.abs(gain * 100).toFixed(0)} %</span>
            </div>
            <p className="text-xs text-muted">{result.w} × {result.h} px · {LABEL[result.blob.type as Mime] ?? result.blob.type}</p>
            <DownloadButton variant="primary" size="md" loading={busy} label={`Télécharger en .${ext}`} onClick={() => { downloadBlob(result.blob, `${baseName(loaded.file.name)}-${suffix}.${ext}`); toast.success("Image téléchargée"); }} />
          </div>
        )}
      </div>
      <div className={cn("min-w-0 transition-opacity duration-200", busy && "opacity-60")} aria-busy={busy}>{children}</div>
    </div>
  );
}

function FormatSelect({ value, onChange, options, label = "Format de sortie" }: { value: string; onChange: (v: string) => void; options: [string, string][]; label?: string }) {
  return <Field label={label}>{(id) => <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>;
}
const sameOr = (choice: string, loaded: Loaded): Mime => (choice === "same" ? loaded.type : (choice as Mime));
const q = (type: Mime, quality: number) => (type === "image/png" ? undefined : quality / 100);

/* ---------- Compresseur ---------- */
export function ImageCompressor() {
  const im = useImage();
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("same");
  const [maxSide, setMaxSide] = useState("0");
  const out = im.loaded ? sameOr(format, im.loaded) : "image/jpeg";
  const { result, busy, error } = useProcessed(im.loaded, async (l) => {
    const type = sameOr(format, l);
    const limit = Number(maxSide);
    const scale = limit > 0 ? Math.min(1, limit / Math.max(l.w, l.h)) : 1;
    const { canvas, ctx } = makeCanvas(l.w * scale, l.h * scale);
    fillIfOpaque(ctx, type);
    ctx.drawImage(l.img, 0, 0, canvas.width, canvas.height);
    return { blob: await toBlob(canvas, type, q(type, quality)), w: canvas.width, h: canvas.height };
  }, [quality, format, maxSide]);
  const bigger = result && im.loaded && result.blob.size >= im.loaded.file.size;
  return (
    <Shell {...im} onFile={im.load} onClear={im.clear} result={result} busy={busy} error={error} suffix="compresse"
      note={<>
        {out === "image/png" && <Alert>Le PNG est un format sans perte : la qualité n&apos;a pas d&apos;effet. Choisis la sortie <strong>WebP</strong> pour réduire fortement le poids en conservant la transparence.</Alert>}
        {bigger && out !== "image/png" && <Alert tone="warning">Le résultat est plus lourd que l&apos;original, déjà bien optimisé. Baisse la qualité ou réduis la dimension maximale.</Alert>}
      </>}
      controls={<>
        <Slider label="Qualité" value={quality} onChange={setQuality} min={5} max={100} suffix=" %" />
        <FormatSelect value={format} onChange={setFormat} options={[["same", "Conserver le format d'origine"], ["image/jpeg", "JPG"], ["image/webp", "WebP (recommandé)"]]} />
        <FormatSelect label="Dimension maximale" value={maxSide} onChange={setMaxSide} options={[["0", "Dimensions d'origine"], ["3840", "3840 px (4K)"], ["2560", "2560 px"], ["1920", "1920 px (Full HD)"], ["1280", "1280 px"], ["800", "800 px"]]} />
      </>}>
      {result && im.loaded ? <Compare before={im.loaded.url} after={result.url} /> : im.loaded && <Preview src={im.loaded.url} alt="Image d'origine" />}
    </Shell>
  );
}

/* ---------- Convertisseurs ---------- */
export function ImageConverter({ from, to }: { from?: Mime; to?: Mime }) {
  const im = useImage();
  const [choice, setChoice] = useState<Mime>("image/webp");
  const [quality, setQuality] = useState(90);
  const [bg, setBg] = useState("#ffffff");
  const target: Mime = to ?? choice;
  const loadedType = im.loaded?.type;
  useEffect(() => { if (!to && loadedType) setChoice(loadedType === "image/webp" ? "image/jpeg" : "image/webp"); }, [to, loadedType]);
  const { result, busy, error } = useProcessed(im.loaded, async (l) => {
    const { canvas, ctx } = makeCanvas(l.w, l.h);
    fillIfOpaque(ctx, target, bg);
    ctx.drawImage(l.img, 0, 0);
    return { blob: await toBlob(canvas, target, q(target, quality)), w: l.w, h: l.h };
  }, [target, quality, bg]);
  return (
    <Shell {...im} onFile={im.load} onClear={im.clear} allowed={from ? [from] : undefined} result={result} busy={busy} error={error} suffix="converti"
      note={im.loaded && im.loaded.type === target ? <Alert>L&apos;image est déjà au format {LABEL[target]} : elle sera simplement réencodée.</Alert> : undefined}
      controls={<>
        {!to && <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Convertir en</span><Segmented label="Format de sortie" value={choice} onChange={setChoice} options={[{ value: "image/webp", label: "WebP" }, { value: "image/jpeg", label: "JPG" }, { value: "image/png", label: "PNG" }]} /></div>}
        {target !== "image/png" ? <Slider label="Qualité" value={quality} onChange={setQuality} min={10} max={100} suffix=" %" /> : <p className="text-[13px] text-muted">Le PNG est enregistré sans perte : aucun réglage de qualité n&apos;est nécessaire.</p>}
        {target === "image/jpeg" && (
          <label className="flex items-center justify-between gap-3 text-[13px] font-medium">Couleur de fond (zones transparentes)<input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
        )}
      </>}>
      {result && im.loaded ? <Compare before={im.loaded.url} after={result.url} /> : im.loaded && <Preview src={im.loaded.url} alt="Image d'origine" />}
    </Shell>
  );
}

/* ---------- Redimensionnement ---------- */
const RESIZE_PRESETS: [string, number, number][] = [["Full HD", 1920, 1080], ["HD", 1280, 720], ["Carré 1080", 1080, 1080], ["Story", 1080, 1920], ["Profil 400", 400, 400]];
export function ImageResizer() {
  const im = useImage();
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState("same");
  const l = im.loaded;
  useEffect(() => { if (l) { setW(l.w); setH(l.h); } }, [l]);
  const ratio = l ? l.w / l.h : 1;
  const clamp = (v: number) => Math.min(MAX_SIDE, Math.max(1, Math.round(v) || 1));
  const changeW = (v: number) => { const nw = clamp(v); setW(nw); if (lock) setH(clamp(nw / ratio)); };
  const changeH = (v: number) => { const nh = clamp(v); setH(nh); if (lock) setW(clamp(nh * ratio)); };
  const percent = l ? Math.round((w / l.w) * 100) : 100;
  const { result, busy, error } = useProcessed(l && w > 0 && h > 0 ? l : null, async (img) => {
    const type = sameOr(format, img);
    const { canvas, ctx } = makeCanvas(w, h);
    fillIfOpaque(ctx, type);
    ctx.drawImage(img.img, 0, 0, w, h);
    return { blob: await toBlob(canvas, type, q(type, 92)), w, h };
  }, [w, h, format]);
  return (
    <Shell {...im} onFile={im.load} onClear={im.clear} result={result} busy={busy} error={error} suffix={`${w}x${h}`}
      note={l && (w > l.w || h > l.h) ? <Alert tone="warning">L&apos;image est agrandie au-delà de sa taille d&apos;origine : elle perdra en netteté.</Alert> : undefined}
      controls={<>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Field label="Largeur (px)">{(id) => <input id={id} type="number" min={1} max={MAX_SIDE} className="field tabular-nums" value={w || ""} onChange={(e) => changeW(Number(e.target.value))} />}</Field>
          <Button size="icon" variant={lock ? "soft" : "ghost"} aria-pressed={lock} aria-label={lock ? "Proportions verrouillées" : "Proportions libres"} title={lock ? "Proportions conservées" : "Proportions libres"} onClick={() => { setLock(!lock); if (!lock && l) setH(clamp(w / ratio)); }}>{lock ? <Link2 /> : <Unlink2 />}</Button>
          <Field label="Hauteur (px)">{(id) => <input id={id} type="number" min={1} max={MAX_SIDE} className="field tabular-nums" value={h || ""} onChange={(e) => changeH(Number(e.target.value))} />}</Field>
        </div>
        {l && <Slider label="Échelle" value={Math.min(200, Math.max(1, percent))} onChange={(p) => { setW(clamp((l.w * p) / 100)); setH(clamp((l.h * p) / 100)); }} min={1} max={200} suffix=" %" />}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium">Préréglages</span>
          <div className="flex flex-wrap gap-1.5">
            {[25, 50, 75].map((p) => <Button key={p} size="sm" onClick={() => l && (setW(clamp((l.w * p) / 100)), setH(clamp((l.h * p) / 100)))}>{p} %</Button>)}
            {RESIZE_PRESETS.map(([name, pw, ph]) => <Button key={name} size="sm" title={`${pw} × ${ph} px, ajusté sans déformation`} onClick={() => { if (!l) return; if (lock) { const s = Math.min(pw / l.w, ph / l.h); setW(clamp(l.w * s)); setH(clamp(l.h * s)); } else { setW(pw); setH(ph); } }}>{name}</Button>)}
          </div>
          {lock && <p className="mt-1.5 text-xs text-muted">Proportions verrouillées : les préréglages ajustent l&apos;image à l&apos;intérieur du format, sans la déformer.</p>}
        </div>
        <FormatSelect value={format} onChange={setFormat} options={[["same", "Conserver le format d'origine"], ["image/jpeg", "JPG"], ["image/png", "PNG"], ["image/webp", "WebP"]]} />
      </>}>
      {(result ?? l) && <Preview src={(result ?? l)!.url} alt="Aperçu de l'image redimensionnée" />}
    </Shell>
  );
}

/* ---------- Recadrage ---------- */
interface Rect { x: number; y: number; w: number; h: number }
const RATIOS: [string, number | null][] = [["Libre", null], ["1:1", 1], ["4:3", 4 / 3], ["3:2", 3 / 2], ["16:9", 16 / 9], ["4:5", 4 / 5], ["9:16", 9 / 16]];
const HANDLES: [number, number, string][] = [[-1, -1, "nwse-resize"], [1, -1, "nesw-resize"], [-1, 1, "nesw-resize"], [1, 1, "nwse-resize"], [0, -1, "ns-resize"], [0, 1, "ns-resize"], [-1, 0, "ew-resize"], [1, 0, "ew-resize"]];
const lim = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function fitRatio(W: number, H: number, ratio: number | null): Rect {
  if (!ratio) return { x: Math.round(W * 0.1), y: Math.round(H * 0.1), w: Math.round(W * 0.8), h: Math.round(H * 0.8) };
  let w = W, h = W / ratio;
  if (h > H) { h = H; w = H * ratio; }
  return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w: Math.round(w), h: Math.round(h) };
}

function resizeRect(s: Rect, hx: number, hy: number, dx: number, dy: number, W: number, H: number, ratio: number | null): Rect {
  const MIN = Math.min(16, W, H);
  let left = s.x, top = s.y, right = s.x + s.w, bottom = s.y + s.h;
  if (hx === -1) left = lim(left + dx, 0, right - MIN);
  if (hx === 1) right = lim(right + dx, left + MIN, W);
  if (hy === -1) top = lim(top + dy, 0, bottom - MIN);
  if (hy === 1) bottom = lim(bottom + dy, top + MIN, H);
  if (ratio) {
    let w = right - left, h = w / ratio;
    const maxH = hy === -1 ? bottom : H - top;
    if (h > maxH) { h = maxH; w = h * ratio; }
    if (hx === -1) left = right - w; else right = left + w;
    if (hy === -1) top = bottom - h; else bottom = top + h;
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

function Cropper({ loaded, rect, setRect, ratio }: { loaded: Loaded; rect: Rect; setRect: (r: Rect) => void; ratio: number | null }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; start: Rect; hx: number; hy: number; move: boolean; scale: number } | null>(null);
  const begin = (e: React.PointerEvent, hx: number, hy: number, move: boolean) => {
    e.preventDefault(); e.stopPropagation();
    const bounds = box.current!.getBoundingClientRect();
    drag.current = { px: e.clientX, py: e.clientY, start: rect, hx, hy, move, scale: loaded.w / bounds.width };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = (e.clientX - d.px) * d.scale, dy = (e.clientY - d.py) * d.scale;
    if (d.move) setRect({ ...d.start, x: lim(d.start.x + dx, 0, loaded.w - d.start.w), y: lim(d.start.y + dy, 0, loaded.h - d.start.h) });
    else setRect(resizeRect(d.start, d.hx, d.hy, dx, dy, loaded.w, loaded.h, ratio));
  };
  const end = () => { drag.current = null; };
  const pct = { left: `${(rect.x / loaded.w) * 100}%`, top: `${(rect.y / loaded.h) * 100}%`, width: `${(rect.w / loaded.w) * 100}%`, height: `${(rect.h / loaded.h) * 100}%` };
  return (
    <div className="checker flex justify-center rounded-2xl border border-border p-4">
      <div ref={box} className="relative touch-none select-none" style={{ aspectRatio: `${loaded.w} / ${loaded.h}`, width: `min(100%, calc(60vh * ${loaded.w / loaded.h}))` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={loaded.url} alt="Image à recadrer" className="block size-full" draggable={false} />
        {/* Voile sombre hors sélection, rogné aux limites de l'image ; les poignées, elles, peuvent déborder. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]" style={pct} /></div>
        <div className="absolute cursor-move outline-2 outline-white" style={pct} onPointerDown={(e) => begin(e, 0, 0, true)} onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}>
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-60">{Array.from({ length: 9 }, (_, i) => <span key={i} className="border-[0.5px] border-white/50" />)}</div>
          {HANDLES.filter(([hx, hy]) => !ratio || (hx !== 0 && hy !== 0)).map(([hx, hy, cursor]) => (
            <span key={`${hx}${hy}`} onPointerDown={(e) => begin(e, hx, hy, false)} onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}
              className="absolute z-10 size-7 -translate-x-1/2 -translate-y-1/2 after:absolute after:top-1/2 after:left-1/2 after:size-3.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-accent after:bg-white after:shadow"
              style={{ left: `${((hx + 1) / 2) * 100}%`, top: `${((hy + 1) / 2) * 100}%`, cursor }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ImageCropper() {
  const im = useImage();
  const l = im.loaded;
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 1, h: 1 });
  const [ratioKey, setRatioKey] = useState("Libre");
  const [format, setFormat] = useState("same");
  const ratio = RATIOS.find(([k]) => k === ratioKey)![1];
  useEffect(() => { if (l) setRect(fitRatio(l.w, l.h, ratio)); }, [l, ratioKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.max(1, Math.round(rect.w)), h: Math.max(1, Math.round(rect.h)) };
  const { result, busy, error } = useProcessed(l, async (img) => {
    const type = sameOr(format, img);
    const { canvas, ctx } = makeCanvas(r.w, r.h);
    fillIfOpaque(ctx, type);
    ctx.drawImage(img.img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    return { blob: await toBlob(canvas, type, q(type, 95)), w: r.w, h: r.h };
  }, [r.x, r.y, r.w, r.h, format]);
  const setField = (k: keyof Rect, v: number) => {
    if (!l) return;
    const n = { ...r, [k]: Math.max(k === "w" || k === "h" ? 1 : 0, Math.round(v) || 0) };
    if (ratio && k === "w") n.h = Math.round(n.w / ratio);
    if (ratio && k === "h") n.w = Math.round(n.h * ratio);
    n.w = Math.min(n.w, l.w); n.h = Math.min(n.h, l.h);
    n.x = lim(n.x, 0, l.w - n.w); n.y = lim(n.y, 0, l.h - n.h);
    setRect(n);
  };
  return (
    <Shell {...im} onFile={im.load} onClear={im.clear} result={result} busy={busy} error={error} suffix="recadre"
      controls={<>
        <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Ratio</span><Segmented label="Ratio de recadrage" value={ratioKey} onChange={setRatioKey} options={RATIOS.map(([k]) => ({ value: k, label: k }))} /></div>
        <div className="grid grid-cols-2 gap-2">
          {([["w", "Largeur (px)"], ["h", "Hauteur (px)"], ["x", "Position X"], ["y", "Position Y"]] as const).map(([k, label]) => (
            <Field key={k} label={label}>{(id) => <input id={id} type="number" min={0} className="field tabular-nums" value={r[k]} onChange={(e) => setField(k, Number(e.target.value))} />}</Field>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => l && setRect(ratio ? fitRatio(l.w, l.h, ratio) : { x: 0, y: 0, w: l.w, h: l.h })}>Sélection maximale</Button>
        <FormatSelect value={format} onChange={setFormat} options={[["same", "Conserver le format d'origine"], ["image/jpeg", "JPG"], ["image/png", "PNG"], ["image/webp", "WebP"]]} />
      </>}>
      {l && <Cropper loaded={l} rect={rect} setRect={setRect} ratio={ratio} />}
      <p className="mt-2 text-center text-xs text-muted">Déplace le cadre ou tire sur ses poignées. Zone sélectionnée : {r.w} × {r.h} px.</p>
    </Shell>
  );
}

/* ---------- Rotation ---------- */
export function ImageRotator() {
  const im = useImage();
  const [quarter, setQuarter] = useState(0);
  const [fine, setFine] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState("same");
  const angle = (((quarter * 90 + fine) % 360) + 360) % 360;
  const { result, busy, error } = useProcessed(im.loaded, async (l) => {
    const type = sameOr(format, l);
    const rad = (angle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
    const exact = angle % 90 === 0;
    const W = exact ? (angle % 180 === 0 ? l.w : l.h) : Math.ceil(l.w * cos + l.h * sin);
    const H = exact ? (angle % 180 === 0 ? l.h : l.w) : Math.ceil(l.w * sin + l.h * cos);
    if (W > MAX_SIDE * 1.5 || H > MAX_SIDE * 1.5) throw new Error("L'image pivotée serait trop grande.");
    const { canvas, ctx } = makeCanvas(W, H);
    fillIfOpaque(ctx, type);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(l.img, -l.w / 2, -l.h / 2);
    return { blob: await toBlob(canvas, type, q(type, 95)), w: W, h: H };
  }, [angle, flipH, flipV, format]);
  const untouched = angle === 0 && !flipH && !flipV;
  return (
    <Shell {...im} onFile={im.load} onClear={im.clear} result={result} busy={busy} error={error} suffix="pivote"
      note={!untouched && angle % 90 !== 0 && (im.loaded ? sameOr(format, im.loaded) : "") === "image/jpeg" ? <Alert>Avec un angle libre, les coins vides sont remplis de blanc en JPG. Choisis PNG ou WebP pour des coins transparents.</Alert> : undefined}
      controls={<>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setQuarter((v) => v - 1)}><RotateCcw /> 90° gauche</Button>
          <Button onClick={() => setQuarter((v) => v + 1)}><RotateCw /> 90° droite</Button>
          <Button variant={flipH ? "soft" : "secondary"} aria-pressed={flipH} onClick={() => setFlipH((v) => !v)}><FlipHorizontal2 /> Miroir horiz.</Button>
          <Button variant={flipV ? "soft" : "secondary"} aria-pressed={flipV} onClick={() => setFlipV((v) => !v)}><FlipVertical2 /> Miroir vert.</Button>
        </div>
        <Slider label="Ajustement fin" value={fine} onChange={setFine} min={-45} max={45} suffix="°" />
        <Row className="justify-between"><span className="text-[13px] text-muted">Angle total : <strong className="text-fg tabular-nums">{angle}°</strong></span><Button size="sm" variant="ghost" disabled={untouched} onClick={() => { setQuarter(0); setFine(0); setFlipH(false); setFlipV(false); }}>Réinitialiser</Button></Row>
        <FormatSelect value={format} onChange={setFormat} options={[["same", "Conserver le format d'origine"], ["image/jpeg", "JPG"], ["image/png", "PNG"], ["image/webp", "WebP"]]} />
      </>}>
      {(result ?? im.loaded) && <Preview src={(result ?? im.loaded)!.url} alt="Aperçu de l'image pivotée" />}
    </Shell>
  );
}

/* ---------- Niveaux de gris ---------- */
export function ImageGrayscale() {
  const im = useImage();
  const [intensity, setIntensity] = useState(100);
  const [contrast, setContrast] = useState(0);
  const [format, setFormat] = useState("same");
  const { result, busy, error } = useProcessed(im.loaded, async (l) => {
    const type = sameOr(format, l);
    const { canvas, ctx } = makeCanvas(l.w, l.h);
    fillIfOpaque(ctx, type);
    ctx.drawImage(l.img, 0, 0);
    const data = ctx.getImageData(0, 0, l.w, l.h);
    const px = data.data, k = intensity / 100, c = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55));
    for (let i = 0; i < px.length; i += 4) {
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      for (let j = 0; j < 3; j++) {
        const v = px[i + j] + (lum - px[i + j]) * k;
        px[i + j] = contrast ? c * (v - 128) + 128 : v; // Uint8ClampedArray borne automatiquement à [0, 255]
      }
    }
    ctx.putImageData(data, 0, 0);
    return { blob: await toBlob(canvas, type, q(type, 92)), w: l.w, h: l.h };
  }, [intensity, contrast, format]);
  return (
    <Shell {...im} onFile={im.load} onClear={im.clear} result={result} busy={busy} error={error} suffix="noir-et-blanc"
      controls={<>
        <Slider label="Intensité de l'effet" value={intensity} onChange={setIntensity} min={0} max={100} suffix=" %" />
        <Slider label="Contraste" value={contrast} onChange={setContrast} min={-50} max={50} />
        <FormatSelect value={format} onChange={setFormat} options={[["same", "Conserver le format d'origine"], ["image/jpeg", "JPG"], ["image/png", "PNG"], ["image/webp", "WebP"]]} />
        {im.loaded && <div className="grid grid-cols-2 gap-2"><Stat label="Mégapixels" value={((im.loaded.w * im.loaded.h) / 1e6).toFixed(1)} /><Stat label="Luminance" value="Rec. 601" /></div>}
      </>}>
      {result && im.loaded ? <Compare before={im.loaded.url} after={result.url} /> : im.loaded && <Preview src={im.loaded.url} alt="Image d'origine" />}
    </Shell>
  );
}
