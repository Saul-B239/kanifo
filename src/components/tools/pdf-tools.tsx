"use client";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, FileText, Loader2, RotateCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert, Button, DownloadButton, Field, Segmented, Slider } from "@/components/ui";
import { LIMITS } from "@/lib/files";
import { canvasToBlob, formatRanges, jpegOrientation, loadPdf, openForRender, parseRanges, renderPage } from "@/lib/pdf";
import { baseName, cn, downloadBlob, errorMessage, formatBytes } from "@/lib/utils";
import { FileDrop, Progress, Row } from "./shared";

const MAX_THUMBS = 300;
const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });
const pages = (n: number) => `${n} page${n > 1 ? "s" : ""}`;

/* ---------- Briques partagées ---------- */
interface PdfFile { file: File; bytes: Uint8Array; pageCount: number }

function usePdfFile() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await loadPdf(bytes, file.name);
      const pageCount = doc.getPageCount();
      if (pageCount === 0) throw new Error(`« ${file.name} » ne contient aucune page.`);
      setPdf({ file, bytes, pageCount });
    } catch (e) { toast.error(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  return { pdf, loading, load, clear: () => setPdf(null) };
}

/** Génère progressivement les miniatures des pages (JPEG légers). */
function useThumbnails(pdf: PdfFile | null) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  useEffect(() => {
    setThumbs([]);
    if (!pdf) return;
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      try {
        const doc = await openForRender(pdf.bytes, pdf.file.name);
        for (let i = 1; i <= Math.min(doc.numPages, MAX_THUMBS) && !cancelled; i++) {
          const first = await doc.getPage(i);
          const base = first.getViewport({ scale: 1 });
          const canvas = await renderPage(doc, i, 200 / Math.max(base.width, 1));
          const url = URL.createObjectURL(await canvasToBlob(canvas, "image/jpeg", 0.7));
          urls.push(url);
          if (!cancelled) setThumbs((t) => [...t, url]);
        }
        void doc.loadingTask.destroy();
      } catch (e) { if (!cancelled) toast.error(errorMessage(e, "Impossible de générer les aperçus.")); }
    })();
    return () => { cancelled = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [pdf]);
  return thumbs;
}

function FileBar({ pdf, onClear }: { pdf: PdfFile; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-subtle/50 p-2.5 pl-3.5">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e5484d]/10 text-[#e5484d]"><FileText className="size-[18px]" /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{pdf.file.name}</p><p className="text-xs text-muted">{pages(pdf.pageCount)} · {formatBytes(pdf.file.size)}</p></div>
      <Button size="icon" variant="ghost" onClick={onClear} aria-label="Retirer le fichier" title="Changer de fichier"><X /></Button>
    </div>
  );
}

function Loading({ label = "Lecture du document…" }: { label?: string }) {
  return <div className="flex h-48 items-center justify-center gap-3 rounded-2xl border border-border text-sm text-muted"><Loader2 className="size-5 animate-spin text-accent" />{label}</div>;
}

interface Output { blob: Blob; name: string; info?: string }
function ResultCard({ output, original, onReset }: { output: Output; original?: number; onReset?: () => void }) {
  const gain = original ? 1 - output.blob.size / original : null;
  return (
    <div className="flex animate-pop flex-wrap items-center gap-4 rounded-2xl border border-success/30 bg-success-soft p-4 sm:p-5">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-success text-white"><Check className="size-5" strokeWidth={2.5} /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{output.name}</p>
        <p className="text-[13px] text-muted">
          {original ? `${formatBytes(original)} → ` : ""}{formatBytes(output.blob.size)}
          {gain !== null && gain > 0.001 && <strong className="ml-2 text-success">−{(gain * 100).toFixed(0)} %</strong>}
          {output.info && ` · ${output.info}`}
        </p>
      </div>
      <div className="flex gap-2">
        {onReset && <Button variant="ghost" onClick={onReset}>Recommencer</Button>}
        <DownloadButton variant="primary" size="md" onClick={() => { downloadBlob(output.blob, output.name); toast.success("Téléchargement lancé"); }} />
      </div>
    </div>
  );
}

function PageThumb({ src, number, selected, children, onClick, dimmed, className, ...rest }: {
  src?: string; number: number; selected?: boolean; children?: ReactNode; onClick?: () => void; dimmed?: boolean; className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onClick">) {
  return (
    <div {...rest} className={cn("group relative rounded-xl border-2 bg-surface p-1.5 transition-all duration-150", selected ? "border-accent shadow-card" : "border-border hover:border-border-strong", dimmed && "opacity-45", className)}>
      <button type="button" onClick={onClick} disabled={!onClick} aria-pressed={onClick ? !!selected : undefined} aria-label={`Page ${number}`} className="block w-full disabled:cursor-default">
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt="" className="max-h-full max-w-full object-contain" draggable={false} /> : <span className="skeleton size-full !rounded-md" />}
        </div>
        <span className="mt-1 block text-center text-xs font-medium text-muted tabular-nums">{number}</span>
      </button>
      {selected && <span className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-accent text-white shadow"><Check className="size-3" strokeWidth={3} /></span>}
      {children}
    </div>
  );
}

function useTask() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState<Output | null>(null);
  const run = async (fn: (setProgress: (p: number) => void) => Promise<Output | null>) => {
    setBusy(true); setProgress(0); setOutput(null);
    try { const out = await fn(setProgress); if (out) setOutput(out); }
    catch (e) { toast.error(errorMessage(e, "Le traitement a échoué.")); }
    finally { setBusy(false); }
  };
  return { busy, progress, output, setOutput, run };
}

const move = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr;
  const a = [...arr]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
};

/* ---------- Fusionner ---------- */
interface MergeItem { id: string; file: File; bytes: Uint8Array; pageCount: number }
export function PdfMerge() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [adding, setAdding] = useState(false);
  const task = useTask();
  const total = items.reduce((a, i) => a + i.file.size, 0);
  async function add(files: File[]) {
    setAdding(true);
    let size = total;
    const next: MergeItem[] = [];
    for (const file of files) {
      if (items.length + next.length >= 50) { toast.error("Limite de 50 fichiers atteinte."); break; }
      if (size + file.size > LIMITS.pdfTotal) { toast.error(`« ${file.name} » ignoré : le total dépasserait ${formatBytes(LIMITS.pdfTotal)}.`); continue; }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await loadPdf(bytes, file.name);
        next.push({ id: crypto.randomUUID(), file, bytes, pageCount: doc.getPageCount() });
        size += file.size;
      } catch (e) { toast.error(errorMessage(e)); }
    }
    setItems((l) => [...l, ...next]);
    task.setOutput(null);
    setAdding(false);
  }
  const merge = () => task.run(async (setProgress) => {
    const { PDFDocument } = await import("pdf-lib");
    const out = await PDFDocument.create();
    for (let i = 0; i < items.length; i++) {
      const src = await loadPdf(items[i].bytes, items[i].file.name);
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
      setProgress((i + 1) / items.length);
    }
    return { blob: pdfBlob(await out.save()), name: "fusion.pdf", info: `${pages(out.getPageCount())} · ${items.length} fichiers` };
  });
  const update = (fn: (l: MergeItem[]) => MergeItem[]) => { setItems(fn); task.setOutput(null); };
  return (
    <div className="grid gap-5">
      <FileDrop kind="pdf" multiple compact={items.length > 0} onFiles={(f) => void add(f)} />
      {adding && <Loading />}
      {items.length > 0 && (
        <>
          <ol className="grid gap-2">
            {items.map((it, i) => (
              <li key={it.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 pl-3.5 shadow-soft">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">{i + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{it.file.name}</p><p className="text-xs text-muted">{pages(it.pageCount)} · {formatBytes(it.file.size)}</p></div>
                <Button size="icon" variant="ghost" className="size-8" disabled={i === 0} aria-label={`Monter ${it.file.name}`} onClick={() => update((l) => move(l, i, i - 1))}><ArrowUp /></Button>
                <Button size="icon" variant="ghost" className="size-8" disabled={i === items.length - 1} aria-label={`Descendre ${it.file.name}`} onClick={() => update((l) => move(l, i, i + 1))}><ArrowDown /></Button>
                <Button size="icon" variant="ghost" className="size-8" aria-label={`Retirer ${it.file.name}`} onClick={() => update((l) => l.filter((x) => x.id !== it.id))}><Trash2 /></Button>
              </li>
            ))}
          </ol>
          <Row className="justify-between">
            <p className="text-[13px] text-muted">{items.length} fichier{items.length > 1 ? "s" : ""} · {pages(items.reduce((a, i) => a + i.pageCount, 0))} · {formatBytes(total)}</p>
            <div className="flex gap-2"><Button variant="ghost" onClick={() => update(() => [])}>Tout retirer</Button><Button variant="primary" loading={task.busy} disabled={items.length < 2} onClick={merge}>Fusionner {items.length} PDF</Button></div>
          </Row>
          {items.length < 2 && <Alert>Ajoute au moins un deuxième fichier pour lancer la fusion.</Alert>}
        </>
      )}
      {task.busy && <Progress value={task.progress} label="Fusion en cours…" />}
      {task.output && <ResultCard output={task.output} />}
    </div>
  );
}

/* ---------- Diviser ---------- */
export function PdfSplit() {
  const f = usePdfFile();
  const task = useTask();
  const [mode, setMode] = useState<"each" | "ranges" | "chunks">("each");
  const [ranges, setRanges] = useState("");
  const [chunk, setChunk] = useState(2);
  const pdf = f.pdf;
  const parsed = pdf ? parseRanges(ranges, pdf.pageCount) : { groups: [], error: "" };
  const size = Math.max(1, Math.floor(chunk) || 1);
  const groups: number[][] = !pdf ? [] : mode === "each" ? Array.from({ length: pdf.pageCount }, (_, i) => [i])
    : mode === "ranges" ? parsed.groups
    : Array.from({ length: Math.ceil(pdf.pageCount / size) }, (_, g) => Array.from({ length: Math.min(size, pdf.pageCount - g * size) }, (_, i) => g * size + i));
  const split = () => task.run(async (setProgress) => {
    if (!pdf) return null;
    const [{ PDFDocument }, { default: JSZip }] = await Promise.all([import("pdf-lib"), import("jszip")]);
    const src = await loadPdf(pdf.bytes, pdf.file.name);
    const zip = new JSZip();
    const base = baseName(pdf.file.name);
    const digits = String(pdf.pageCount).length;
    const pad = (n: number) => String(n + 1).padStart(digits, "0");
    for (let g = 0; g < groups.length; g++) {
      const out = await PDFDocument.create();
      (await out.copyPages(src, groups[g])).forEach((p) => out.addPage(p));
      const label = groups[g].length === 1 ? `page-${pad(groups[g][0])}` : `pages-${pad(groups[g][0])}-${pad(groups[g][groups[g].length - 1])}`;
      zip.file(`${base}-${label}${zip.file(`${base}-${label}.pdf`) ? `-${g + 1}` : ""}.pdf`, await out.save());
      setProgress((g + 1) / groups.length);
    }
    return { blob: await zip.generateAsync({ type: "blob" }), name: `${base}-divise.zip`, info: `${groups.length} fichier${groups.length > 1 ? "s" : ""} PDF` };
  });
  if (!pdf) return f.loading ? <Loading /> : <FileDrop kind="pdf" onFiles={(x) => void f.load(x[0])} />;
  return (
    <div className="grid gap-5">
      <FileBar pdf={pdf} onClear={() => { f.clear(); task.setOutput(null); }} />
      <Segmented label="Mode de division" value={mode} onChange={(v) => { setMode(v); task.setOutput(null); }} options={[{ value: "each", label: "Une page par fichier" }, { value: "ranges", label: "Plages personnalisées" }, { value: "chunks", label: "Tous les N pages" }]} />
      {mode === "ranges" && <Field label="Plages de pages" hint={`Chaque plage séparée par une virgule devient un fichier. Exemple : 1-3, 4-${pdf.pageCount}`}>{(id) => <input id={id} className="field font-mono" value={ranges} maxLength={500} placeholder="1-3, 4-10" onChange={(e) => { setRanges(e.target.value); task.setOutput(null); }} aria-invalid={!!parsed.error} />}</Field>}
      {mode === "chunks" && <Field label="Nombre de pages par fichier" className="max-w-xs">{(id) => <input id={id} type="number" min={1} max={pdf.pageCount} className="field" value={chunk} onChange={(e) => { setChunk(Number(e.target.value)); task.setOutput(null); }} />}</Field>}
      {mode === "ranges" && parsed.error && <Alert tone="danger">{parsed.error}</Alert>}
      {mode === "each" && pdf.pageCount === 1 && <Alert>Ce document ne contient qu&apos;une seule page : il n&apos;y a rien à diviser.</Alert>}
      <Row className="justify-between">
        <p className="text-[13px] text-muted">{groups.length > 0 ? `${groups.length} fichier${groups.length > 1 ? "s" : ""} PDF seront créés, regroupés dans une archive ZIP.` : "Indique au moins une plage de pages."}</p>
        <Button variant="primary" loading={task.busy} disabled={groups.length === 0 || (mode === "each" && pdf.pageCount === 1)} onClick={split}>Diviser le PDF</Button>
      </Row>
      {task.busy && <Progress value={task.progress} label="Division en cours…" />}
      {task.output && <ResultCard output={task.output} />}
    </div>
  );
}

/* ---------- Compresser ---------- */
export function PdfCompress() {
  const f = usePdfFile();
  const task = useTask();
  const [mode, setMode] = useState<"light" | "strong">("light");
  const [quality, setQuality] = useState(65);
  const [dpi, setDpi] = useState("120");
  const [worse, setWorse] = useState(false);
  const pdf = f.pdf;
  const compress = () => { setWorse(false); void task.run(async (setProgress) => {
    if (!pdf) return null;
    const { PDFDocument } = await import("pdf-lib");
    let bytes: Uint8Array;
    if (mode === "light") {
      const doc = await loadPdf(pdf.bytes, pdf.file.name);
      bytes = await doc.save({ useObjectStreams: true });
    } else {
      const src = await openForRender(pdf.bytes, pdf.file.name);
      const out = await PDFDocument.create();
      for (let i = 1; i <= src.numPages; i++) {
        const page = await src.getPage(i);
        const pt = page.getViewport({ scale: 1 });
        const canvas = await renderPage(src, i, Number(dpi) / 72);
        const jpg = new Uint8Array(await (await canvasToBlob(canvas, "image/jpeg", quality / 100)).arrayBuffer());
        canvas.width = canvas.height = 0; // libère la mémoire sans attendre le ramasse-miettes
        const img = await out.embedJpg(jpg);
        out.addPage([pt.width, pt.height]).drawImage(img, { x: 0, y: 0, width: pt.width, height: pt.height });
        setProgress(i / src.numPages);
      }
      void src.loadingTask.destroy();
      bytes = await out.save({ useObjectStreams: true });
    }
    if (bytes.length >= pdf.file.size) { setWorse(true); return null; }
    return { blob: pdfBlob(bytes), name: `${baseName(pdf.file.name)}-compresse.pdf`, info: mode === "light" ? "optimisation sans perte" : `pages en images ${dpi} ppp` };
  }); };
  if (!pdf) return f.loading ? <Loading /> : <FileDrop kind="pdf" onFiles={(x) => void f.load(x[0])} />;
  return (
    <div className="grid gap-5">
      <FileBar pdf={pdf} onClear={() => { f.clear(); task.setOutput(null); setWorse(false); }} />
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mode de compression">
        {([["light", "Optimisation", "Sans perte. Le texte reste sélectionnable et la qualité intacte. Gain modéré."], ["strong", "Compression forte", "Chaque page devient une image JPEG. Gain important, mais le texte n'est plus sélectionnable."]] as const).map(([v, title, text]) => (
          <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => { setMode(v); task.setOutput(null); setWorse(false); }} className={cn("rounded-2xl border-2 p-4 text-left transition-all", mode === v ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong")}>
            <span className="font-semibold">{title}</span><span className="mt-1 block text-[13px] leading-relaxed text-muted">{text}</span>
          </button>
        ))}
      </div>
      {mode === "strong" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Qualité des images" value={quality} onChange={(v) => { setQuality(v); task.setOutput(null); }} min={20} max={95} suffix=" %" />
          <Field label="Résolution">{(id) => <select id={id} className="field" value={dpi} onChange={(e) => { setDpi(e.target.value); task.setOutput(null); }}><option value="96">96 ppp · écran, très léger</option><option value="120">120 ppp · équilibré</option><option value="150">150 ppp · lecture confortable</option><option value="200">200 ppp · impression</option></select>}</Field>
        </div>
      )}
      {mode === "strong" && <Alert tone="warning">Après une compression forte, le texte ne peut plus être sélectionné, recherché ni lu par un lecteur d&apos;écran, et les liens sont supprimés. Conserve ton fichier d&apos;origine.</Alert>}
      <div className="flex justify-end"><Button variant="primary" loading={task.busy} onClick={compress}>Compresser le PDF</Button></div>
      {task.busy && <Progress value={mode === "light" ? 0.5 : task.progress} label={mode === "light" ? "Optimisation en cours…" : `Compression des pages… ${Math.round(task.progress * 100)} %`} />}
      {worse && <Alert tone="info">Ce PDF est déjà bien optimisé : {mode === "light" ? "l'optimisation sans perte ne permet pas de le réduire davantage. Essaie la compression forte." : "avec ces réglages, le résultat serait plus lourd que l'original. Baisse la qualité ou la résolution."} Ton fichier d&apos;origine reste le meilleur choix.</Alert>}
      {task.output && <ResultCard output={task.output} original={pdf.file.size} />}
    </div>
  );
}

/* ---------- Extraire ---------- */
export function PdfExtract() {
  const f = usePdfFile();
  const task = useTask();
  const thumbs = useThumbnails(f.pdf);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const pdf = f.pdf;
  useEffect(() => { setSelected(new Set()); setText(""); setError(""); }, [pdf]);
  const apply = (s: Set<number>) => { setSelected(s); setText(formatRanges([...s])); setError(""); task.setOutput(null); };
  const onText = (v: string) => {
    setText(v); task.setOutput(null);
    if (!pdf) return;
    const p = parseRanges(v, pdf.pageCount);
    setError(p.error);
    if (!p.error) setSelected(new Set(p.groups.flat()));
  };
  const extract = () => task.run(async () => {
    if (!pdf) return null;
    const { PDFDocument } = await import("pdf-lib");
    const src = await loadPdf(pdf.bytes, pdf.file.name);
    const out = await PDFDocument.create();
    const idx = [...selected].sort((a, b) => a - b);
    (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
    return { blob: pdfBlob(await out.save()), name: `${baseName(pdf.file.name)}-extrait.pdf`, info: pages(idx.length) };
  });
  if (!pdf) return f.loading ? <Loading /> : <FileDrop kind="pdf" onFiles={(x) => void f.load(x[0])} />;
  const all = Array.from({ length: pdf.pageCount }, (_, i) => i);
  return (
    <div className="grid gap-5">
      <FileBar pdf={pdf} onClear={f.clear} />
      <Row className="items-end">
        <Field label="Pages à extraire" className="min-w-56 flex-1" hint="Clique sur les miniatures ou saisis une sélection, par exemple : 2, 5-8">{(id) => <input id={id} className="field font-mono" value={text} maxLength={2000} placeholder={`1-${Math.min(3, pdf.pageCount)}`} onChange={(e) => onText(e.target.value)} aria-invalid={!!error} />}</Field>
        <div className="flex gap-1.5 pb-6"><Button size="sm" onClick={() => apply(new Set(all))}>Tout sélectionner</Button><Button size="sm" onClick={() => apply(new Set(all.filter((i) => !selected.has(i))))}>Inverser</Button><Button size="sm" variant="ghost" onClick={() => apply(new Set())}>Effacer</Button></div>
      </Row>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid max-h-[32rem] grid-cols-3 gap-2.5 overflow-y-auto rounded-2xl border border-border bg-subtle/30 p-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {all.map((i) => <PageThumb key={i} number={i + 1} src={thumbs[i]} selected={selected.has(i)} onClick={() => { const s = new Set(selected); if (s.has(i)) s.delete(i); else s.add(i); apply(s); }} />)}
      </div>
      {pdf.pageCount > MAX_THUMBS && <p className="text-xs text-muted">Aperçus limités aux {MAX_THUMBS} premières pages ; la sélection reste possible sur tout le document.</p>}
      <Row className="justify-between">
        <p className="text-[13px] text-muted" aria-live="polite">{selected.size ? `${pages(selected.size)} sélectionnée${selected.size > 1 ? "s" : ""} sur ${pdf.pageCount}` : "Aucune page sélectionnée"}</p>
        <Button variant="primary" loading={task.busy} disabled={!selected.size || !!error} onClick={extract}>Extraire {selected.size ? pages(selected.size) : "les pages"}</Button>
      </Row>
      {task.output && <ResultCard output={task.output} />}
    </div>
  );
}

/* ---------- Réorganiser ---------- */
interface Slot { index: number; rotation: number }
export function PdfReorder() {
  const f = usePdfFile();
  const task = useTask();
  const thumbs = useThumbnails(f.pdf);
  const [order, setOrder] = useState<Slot[]>([]);
  const dragFrom = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const pdf = f.pdf;
  useEffect(() => { setOrder(pdf ? Array.from({ length: pdf.pageCount }, (_, index) => ({ index, rotation: 0 })) : []); }, [pdf]);
  const update = (fn: (o: Slot[]) => Slot[]) => { setOrder(fn); task.setOutput(null); };
  const changed = pdf ? order.length !== pdf.pageCount || order.some((s, i) => s.index !== i || s.rotation !== 0) : false;
  const save = () => task.run(async () => {
    if (!pdf) return null;
    const { PDFDocument, degrees } = await import("pdf-lib");
    const src = await loadPdf(pdf.bytes, pdf.file.name);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, order.map((s) => s.index));
    copied.forEach((p, i) => { if (order[i].rotation) p.setRotation(degrees((p.getRotation().angle + order[i].rotation) % 360)); out.addPage(p); });
    return { blob: pdfBlob(await out.save()), name: `${baseName(pdf.file.name)}-reorganise.pdf`, info: pages(order.length) };
  });
  if (!pdf) return f.loading ? <Loading /> : <FileDrop kind="pdf" onFiles={(x) => void f.load(x[0])} />;
  return (
    <div className="grid gap-5">
      <FileBar pdf={pdf} onClear={f.clear} />
      <p className="text-[13px] text-muted">Glisse une page pour la déplacer, ou utilise les flèches. Les boutons de chaque miniature permettent de la faire pivoter ou de la supprimer.</p>
      <div className="grid max-h-[36rem] grid-cols-2 gap-3 overflow-y-auto rounded-2xl border border-border bg-subtle/30 p-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {order.map((slot, pos) => (
          <PageThumb key={slot.index} number={slot.index + 1} src={thumbs[slot.index]} draggable
            className={cn("cursor-grab active:cursor-grabbing [&_img]:transition-transform [&_img]:duration-200", over === pos && "border-accent bg-accent-soft", slot.rotation === 90 && "[&_img]:rotate-90", slot.rotation === 180 && "[&_img]:rotate-180", slot.rotation === 270 && "[&_img]:-rotate-90")}
            onDragStart={(e) => { dragFrom.current = pos; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(pos)); }}
            onDragOver={(e) => { e.preventDefault(); setOver(pos); }}
            onDragLeave={() => setOver((o) => (o === pos ? null : o))}
            onDragEnd={() => { dragFrom.current = null; setOver(null); }}
            onDrop={(e) => { e.preventDefault(); const from = dragFrom.current; setOver(null); dragFrom.current = null; if (from !== null && from !== pos) update((o) => move(o, from, pos)); }}>
            <div className="mt-1 flex justify-center gap-0.5">
              <Button size="icon" variant="ghost" className="size-7" disabled={pos === 0} aria-label={`Déplacer la page ${slot.index + 1} vers la gauche`} onClick={() => update((o) => move(o, pos, pos - 1))}><ArrowLeft /></Button>
              <Button size="icon" variant="ghost" className="size-7" aria-label={`Faire pivoter la page ${slot.index + 1}`} title="Pivoter de 90°" onClick={() => update((o) => o.map((s, i) => (i === pos ? { ...s, rotation: (s.rotation + 90) % 360 } : s)))}><RotateCw /></Button>
              <Button size="icon" variant="ghost" className="size-7" disabled={order.length <= 1} aria-label={`Supprimer la page ${slot.index + 1}`} title="Supprimer" onClick={() => update((o) => o.filter((_, i) => i !== pos))}><Trash2 /></Button>
              <Button size="icon" variant="ghost" className="size-7" disabled={pos === order.length - 1} aria-label={`Déplacer la page ${slot.index + 1} vers la droite`} onClick={() => update((o) => move(o, pos, pos + 1))}><ArrowRight /></Button>
            </div>
            <span className="absolute top-2.5 left-2.5 rounded-md bg-fg/80 px-1.5 text-[10px] font-semibold text-bg tabular-nums" title="Nouvelle position">{pos + 1}</span>
          </PageThumb>
        ))}
      </div>
      <Row className="justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => update((o) => [...o].reverse())}>Inverser l&apos;ordre</Button>
          <Button size="sm" variant="ghost" disabled={!changed} onClick={() => update(() => Array.from({ length: pdf.pageCount }, (_, index) => ({ index, rotation: 0 })))}>Annuler les modifications</Button>
        </div>
        <Button variant="primary" loading={task.busy} disabled={!changed} onClick={save}>{changed ? "Enregistrer le PDF réorganisé" : "Aucune modification"}</Button>
      </Row>
      {task.output && <ResultCard output={task.output} />}
    </div>
  );
}

/* ---------- Images → PDF ---------- */
interface ImgItem { id: string; file: File; url: string }
const SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;

async function decode(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch { throw new Error(`Impossible de décoder « ${file.name} ».`); }
  finally { setTimeout(() => URL.revokeObjectURL(url), 30_000); }
}
async function reencodeJpeg(file: File): Promise<Uint8Array> {
  const img = await decode(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Mémoire insuffisante pour convertir cette image.");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return new Uint8Array(await (await canvasToBlob(canvas, "image/jpeg", 0.92)).arrayBuffer());
}

export function ImagesToPdf() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [size, setSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState(10);
  const task = useTask();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);
  const update = (fn: (l: ImgItem[]) => ImgItem[]) => { setItems(fn); task.setOutput(null); };
  const add = (files: File[]) => update((l) => {
    const room = 100 - l.length;
    if (files.length > room) toast.error("Limite de 100 images atteinte.");
    return [...l, ...files.slice(0, Math.max(0, room)).map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))];
  });
  const build = () => task.run(async (setProgress) => {
    const { PDFDocument } = await import("pdf-lib");
    const out = await PDFDocument.create();
    for (let i = 0; i < items.length; i++) {
      const { file } = items[i];
      const bytes = new Uint8Array(await file.arrayBuffer());
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50, isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
      let img;
      try {
        if (isPng) img = await out.embedPng(bytes);
        else if (isJpg && jpegOrientation(bytes) === 1) img = await out.embedJpg(bytes);
        else img = await out.embedJpg(await reencodeJpeg(file));
      } catch { img = await out.embedJpg(await reencodeJpeg(file)); }
      const iw = img.width * 0.75, ih = img.height * 0.75; // 96 ppp → points
      const m = size === "fit" ? 0 : (margin / 25.4) * 72;
      let [pw, ph]: readonly [number, number] = size === "fit" ? [iw, ih] : SIZES[size];
      const landscape = orientation === "landscape" || (orientation === "auto" && iw > ih);
      if (size !== "fit" && landscape) [pw, ph] = [ph, pw];
      const scale = size === "fit" ? 1 : Math.min((pw - 2 * m) / iw, (ph - 2 * m) / ih);
      const w = iw * scale, h = ih * scale;
      out.addPage([pw, ph]).drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      setProgress((i + 1) / items.length);
    }
    return { blob: pdfBlob(await out.save()), name: "images.pdf", info: pages(items.length) };
  });
  return (
    <div className="grid gap-5">
      <FileDrop kind="image" multiple compact={items.length > 0} onFiles={add} />
      {items.length > 0 && (
        <>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((it, i) => (
              <li key={it.id} className="rounded-xl border border-border bg-surface p-1.5 shadow-soft">
                <div className="checker flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt={it.file.name} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="mt-1 truncate px-1 text-center text-[11px] text-muted" title={it.file.name}>{i + 1}. {it.file.name}</p>
                <div className="flex justify-center gap-0.5">
                  <Button size="icon" variant="ghost" className="size-7" disabled={i === 0} aria-label={`Avancer ${it.file.name}`} onClick={() => update((l) => move(l, i, i - 1))}><ArrowLeft /></Button>
                  <Button size="icon" variant="ghost" className="size-7" aria-label={`Retirer ${it.file.name}`} onClick={() => { URL.revokeObjectURL(it.url); update((l) => l.filter((x) => x.id !== it.id)); }}><Trash2 /></Button>
                  <Button size="icon" variant="ghost" className="size-7" disabled={i === items.length - 1} aria-label={`Reculer ${it.file.name}`} onClick={() => update((l) => move(l, i, i + 1))}><ArrowRight /></Button>
                </div>
              </li>
            ))}
          </ol>
          <Row className="items-end">
            <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Format de page</span><Segmented label="Format de page" value={size} onChange={(v) => { setSize(v); task.setOutput(null); }} options={[{ value: "a4", label: "A4" }, { value: "letter", label: "Lettre US" }, { value: "fit", label: "Ajusté à l'image" }]} /></div>
            {size !== "fit" && <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Orientation</span><Segmented label="Orientation" value={orientation} onChange={(v) => { setOrientation(v); task.setOutput(null); }} options={[{ value: "auto", label: "Automatique" }, { value: "portrait", label: "Portrait" }, { value: "landscape", label: "Paysage" }]} /></div>}
            {size !== "fit" && <div className="w-48"><Slider label="Marge" value={margin} onChange={(v) => { setMargin(v); task.setOutput(null); }} min={0} max={40} suffix=" mm" /></div>}
          </Row>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); update(() => []); }}>Tout retirer</Button><Button variant="primary" loading={task.busy} onClick={build}>Créer le PDF ({pages(items.length)})</Button></div>
        </>
      )}
      {task.busy && <Progress value={task.progress} label="Création du PDF…" />}
      {task.output && <ResultCard output={task.output} />}
    </div>
  );
}

/* ---------- PDF → images ---------- */
interface PageImage { blob: Blob; url: string; name: string }
export function PdfToImages() {
  const f = usePdfFile();
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [scale, setScale] = useState("2");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<PageImage[]>([]);
  const [zipping, setZipping] = useState(false);
  const pdf = f.pdf;
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const reset = useCallback(() => { imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)); setImages([]); }, []);
  useEffect(() => reset, [reset]);
  useEffect(() => { reset(); }, [pdf, format, scale, reset]);
  const tooMany = !!pdf && pdf.pageCount > 200;
  async function convert() {
    if (!pdf) return;
    setBusy(true); setProgress(0); reset();
    try {
      const doc = await openForRender(pdf.bytes, pdf.file.name);
      const base = baseName(pdf.file.name), digits = String(doc.numPages).length;
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPage(doc, i, Number(scale));
        const blob = await canvasToBlob(canvas, format === "png" ? "image/png" : "image/jpeg", 0.9);
        canvas.width = canvas.height = 0;
        const item = { blob, url: URL.createObjectURL(blob), name: `${base}-page-${String(i).padStart(digits, "0")}.${format}` };
        setImages((l) => [...l, item]);
        setProgress(i / doc.numPages);
      }
      void doc.loadingTask.destroy();
      toast.success("Conversion terminée");
    } catch (e) { toast.error(errorMessage(e, "La conversion a échoué.")); }
    finally { setBusy(false); }
  }
  async function zipAll() {
    if (!pdf) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      images.forEach((i) => zip.file(i.name, i.blob));
      downloadBlob(await zip.generateAsync({ type: "blob", compression: "STORE" }), `${baseName(pdf.file.name)}-images.zip`);
    } catch (e) { toast.error(errorMessage(e, "La création de l'archive a échoué.")); }
    finally { setZipping(false); }
  }
  if (!pdf) return f.loading ? <Loading /> : <FileDrop kind="pdf" onFiles={(x) => void f.load(x[0])} />;
  return (
    <div className="grid gap-5">
      <FileBar pdf={pdf} onClear={f.clear} />
      <Row className="items-end">
        <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Format</span><Segmented label="Format d'image" value={format} onChange={setFormat} options={[{ value: "png", label: "PNG" }, { value: "jpg", label: "JPG" }]} /></div>
        <Field label="Résolution">{(id) => <select id={id} className="field" value={scale} onChange={(e) => setScale(e.target.value)}><option value="1.3333">Standard · 96 ppp</option><option value="2">Haute · 144 ppp</option><option value="3">Très haute · 216 ppp</option></select>}</Field>
        <Button variant="primary" loading={busy} disabled={tooMany} onClick={() => void convert()}>Convertir {pages(pdf.pageCount)}</Button>
      </Row>
      {tooMany && <Alert tone="warning">Ce document compte {pdf.pageCount} pages. La conversion est limitée à 200 pages : extrais d&apos;abord les pages utiles avec l&apos;outil « Extraire des pages ».</Alert>}
      {busy && <Progress value={progress} label={`Rendu des pages… ${Math.round(progress * 100)} %`} />}
      {images.length > 0 && (
        <>
          <Row className="justify-between">
            <p className="text-[13px] text-muted">{images.length} image{images.length > 1 ? "s" : ""} · {formatBytes(images.reduce((a, i) => a + i.blob.size, 0))}</p>
            {!busy && <DownloadButton variant="primary" size="md" loading={zipping} label={images.length > 1 ? "Tout télécharger (ZIP)" : "Télécharger l'image"} onClick={() => (images.length > 1 ? void zipAll() : downloadBlob(images[0].blob, images[0].name))} />}
          </Row>
          <ul className="grid max-h-[36rem] grid-cols-2 gap-3 overflow-y-auto rounded-2xl border border-border bg-subtle/30 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <li key={img.url} className="animate-fade-in rounded-xl border border-border bg-surface p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Page ${i + 1}`} loading="lazy" className="aspect-[3/4] w-full rounded-md bg-white object-contain" />
                <div className="mt-1 flex items-center justify-between pl-1.5"><span className="text-xs text-muted tabular-nums">Page {i + 1} · {formatBytes(img.blob.size)}</span><DownloadButton size="sm" variant="ghost" label="" onClick={() => downloadBlob(img.blob, img.name)} /></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
