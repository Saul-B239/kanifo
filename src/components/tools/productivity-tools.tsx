"use client";
import { Bell, BellOff, Check, Flag, Pause, Pencil, Play, Plus, RefreshCw, RotateCcw, Star, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, Button, CopyButton, DownloadButton, Field, InputArea, OutputArea, Segmented, Slider, Stat, Toggle, copyText } from "@/components/ui";
import { FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES, NOUNS } from "@/lib/data/words";
import { countWeekdays, DAY, formatLongDate, parseDate, todayISO } from "@/lib/dates";
import { useHydrated, useStored } from "@/lib/storage";
import { cn, downloadText, pick, randomInt, shuffle } from "@/lib/utils";
import { StrengthMeter } from "./dev-tools";
import { Row, StatGrid, TwoCols } from "./shared";

const isTyping = (e: KeyboardEvent) => { const t = e.target as HTMLElement; return ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(t.tagName) || t.isContentEditable; };
const p2 = (n: number) => String(n).padStart(2, "0");

/* ---------- Chronomètre ---------- */
function fmtChrono(ms: number): string {
  const cs = Math.floor(ms / 10);
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), s = Math.floor((cs % 6000) / 100);
  return `${h ? `${p2(h)}:` : ""}${p2(m)}:${p2(s)},${p2(cs % 100)}`;
}

export function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]); // temps cumulés
  const base = useRef(0);      // temps accumulé avant le dernier démarrage
  const startedAt = useRef(0); // performance.now() du dernier démarrage
  const current = useCallback(() => base.current + (running ? performance.now() - startedAt.current : 0), [running]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => { setElapsed(base.current + performance.now() - startedAt.current); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const toggle = useCallback(() => {
    if (running) { base.current += performance.now() - startedAt.current; setElapsed(base.current); setRunning(false); }
    else { startedAt.current = performance.now(); setRunning(true); }
  }, [running]);
  const lap = useCallback(() => { const t = current(); if (t > 0) setLaps((l) => (l.length >= 500 ? l : [...l, t])); }, [current]);
  const reset = useCallback(() => { setRunning(false); base.current = 0; setElapsed(0); setLaps([]); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.ctrlKey || e.metaKey) return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.key.toLowerCase() === "l") lap();
      else if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, lap, reset]);

  const splits = laps.map((t, i) => t - (laps[i - 1] ?? 0));
  const best = splits.length >= 3 ? Math.min(...splits) : -1, worst = splits.length >= 3 ? Math.max(...splits) : -1;
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <div className="rounded-3xl border border-border bg-subtle/50 py-10 text-center">
        <div role="timer" aria-live="off" className="font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-7xl">{fmtChrono(elapsed)}</div>
        {laps.length > 0 && <p className="mt-2 font-mono text-sm text-muted tabular-nums">Tour en cours : {fmtChrono(elapsed - laps[laps.length - 1])}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" variant={running ? "secondary" : "primary"} onClick={toggle} className="min-w-36">{running ? <><Pause /> Pause</> : <><Play /> {elapsed > 0 ? "Reprendre" : "Démarrer"}</>}</Button>
        <Button size="lg" onClick={lap} disabled={!running}><Flag /> Tour</Button>
        <Button size="lg" variant="ghost" onClick={reset} disabled={elapsed === 0}><RotateCcw /> Réinitialiser</Button>
      </div>
      <p className="text-center text-xs text-muted">Raccourcis : <kbd className="rounded border border-border bg-subtle px-1">Espace</kbd> démarrer/pause · <kbd className="rounded border border-border bg-subtle px-1">L</kbd> tour · <kbd className="rounded border border-border bg-subtle px-1">R</kbd> réinitialiser</p>
      {laps.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between"><h3 className="text-[13px] font-medium">{laps.length} tour{laps.length > 1 ? "s" : ""}</h3><CopyButton text={laps.map((t, i) => `Tour ${i + 1}\t${fmtChrono(splits[i])}\t${fmtChrono(t)}`).join("\n")} label="Copier les temps" /></div>
          <div className="max-h-72 overflow-y-auto rounded-2xl border border-border">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-subtle text-left text-xs text-muted"><tr><th className="px-4 py-2 font-medium">Tour</th><th className="px-4 py-2 font-medium">Temps du tour</th><th className="px-4 py-2 text-right font-medium">Temps total</th></tr></thead>
              <tbody>
                {[...laps].map((_, k) => { const i = laps.length - 1 - k; return (
                  <tr key={i} className="border-t border-border font-mono">
                    <td className="px-4 py-2 font-sans">{i + 1}</td>
                    <td className={cn("px-4 py-2", splits[i] === best && "font-semibold text-success", splits[i] === worst && "text-danger")}>{fmtChrono(splits[i])}{splits[i] === best && <span className="ml-2 font-sans text-xs">meilleur</span>}{splits[i] === worst && <span className="ml-2 font-sans text-xs">plus lent</span>}</td>
                    <td className="px-4 py-2 text-right text-muted">{fmtChrono(laps[i])}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Minuteur ---------- */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7, 1.4, 1.75, 2.1].forEach((t, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = i % 3 === 2 ? 1175 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.3);
    });
    setTimeout(() => void ctx.close(), 3200);
  } catch { /* audio indisponible : l'alerte visuelle reste affichée */ }
}
const PRESETS = [[1, "1 min"], [5, "5 min"], [10, "10 min"], [15, "15 min"], [25, "25 min · Pomodoro"], [60, "1 h"]] as const;

export function TimerTool() {
  const [h, setH] = useState(0), [m, setM] = useState(5), [s, setS] = useState(0);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [state, setState] = useState<"idle" | "running" | "paused" | "done">("idle");
  const [sound, setSound] = useState(true);
  const endAt = useRef(0);
  const soundRef = useRef(sound);
  useEffect(() => { soundRef.current = sound; }, [sound]);
  const configured = (h * 3600 + m * 60 + s) * 1000;

  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => {
      const left = endAt.current - Date.now();
      if (left <= 0) { setRemaining(0); setState("done"); if (soundRef.current) beep(); toast.success("Le minuteur est terminé !", { duration: 8000 }); }
      else setRemaining(left);
    }, 100);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    const original = document.title;
    if (state === "running" || state === "paused") document.title = `${fmt(remaining)} · Minuteur`;
    else if (state === "done") document.title = "⏰ Terminé ! · Minuteur";
    return () => { document.title = original; };
  }, [state, remaining]);

  const start = (ms = configured) => { if (ms <= 0) return; setTotal(ms); setRemaining(ms); endAt.current = Date.now() + ms; setState("running"); };
  const pause = () => { setRemaining(Math.max(0, endAt.current - Date.now())); setState("paused"); };
  const resume = () => { endAt.current = Date.now() + remaining; setState("running"); };
  const reset = () => { setState("idle"); setRemaining(0); };
  function fmt(ms: number) { const t = Math.ceil(ms / 1000); return `${Math.floor(t / 3600) ? `${p2(Math.floor(t / 3600))}:` : ""}${p2(Math.floor((t % 3600) / 60))}:${p2(t % 60)}`; }
  const clamp = (v: string, max: number) => Math.min(max, Math.max(0, Math.floor(Number(v)) || 0));
  const progress = total ? 1 - remaining / total : 0;
  const R = 130, C = 2 * Math.PI * R;
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      {state === "idle" ? (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map(([min, label]) => <button key={min} type="button" onClick={() => { setH(Math.floor(min / 60)); setM(min % 60); setS(0); }} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all active:scale-95", configured === min * 60000 ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg")}>{label}</button>)}
          </div>
          <div className="flex items-end justify-center gap-2">
            {([["Heures", h, setH, 23], ["Minutes", m, setM, 59], ["Secondes", s, setS, 59]] as const).map(([label, val, set, max], i) => (
              <div key={label} className="flex items-end gap-2">
                {i > 0 && <span className="pb-4 text-3xl font-light text-faint">:</span>}
                <Field label={label} className="items-center">{(id) => <input id={id} type="number" min={0} max={max} value={val} onChange={(e) => set(clamp(e.target.value, max))} onFocus={(e) => e.target.select()} className="field h-20 w-24 text-center font-mono text-4xl font-semibold tabular-nums sm:w-28" />}</Field>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" variant="primary" disabled={configured <= 0} onClick={() => start()} className="min-w-40"><Play /> Démarrer</Button>
            <Toggle checked={sound} onChange={setSound} label="Alarme sonore" />
          </div>
        </>
      ) : (
        <>
          <div className="relative mx-auto aspect-square w-full max-w-[19rem]">
            <svg viewBox="0 0 300 300" className="size-full -rotate-90" aria-hidden="true">
              <circle cx="150" cy="150" r={R} fill="none" stroke="var(--subtle)" strokeWidth="12" />
              <circle cx="150" cy="150" r={R} fill="none" stroke={state === "done" ? "var(--success)" : "var(--accent)"} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * progress} className="transition-[stroke-dashoffset] duration-150 ease-linear" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div role="timer" aria-live="off" className={cn("font-mono text-5xl font-semibold tabular-nums sm:text-6xl", state === "done" && "text-success")}>{fmt(remaining)}</div>
              <p className="mt-1 text-sm text-muted" aria-live="polite">{state === "done" ? "Terminé !" : state === "paused" ? "En pause" : `sur ${fmt(total)}`}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {state === "running" && <Button size="lg" onClick={pause} className="min-w-36"><Pause /> Pause</Button>}
            {state === "paused" && <Button size="lg" variant="primary" onClick={resume} className="min-w-36"><Play /> Reprendre</Button>}
            {state === "done" && <Button size="lg" variant="primary" onClick={() => start(total)} className="min-w-36"><RefreshCw /> Relancer</Button>}
            <Button size="lg" variant="ghost" onClick={reset}><RotateCcw /> {state === "done" ? "Nouveau minuteur" : "Annuler"}</Button>
            <Button size="icon" variant="ghost" className="size-12" onClick={() => setSound((v) => !v)} aria-label={sound ? "Couper l'alarme sonore" : "Activer l'alarme sonore"} title={sound ? "Alarme activée" : "Alarme coupée"}>{sound ? <Bell /> : <BellOff />}</Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Générateur de listes ---------- */
const escHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const FORMATS = {
  numbered: { label: "Numérotée (1. 2. 3.)", fn: (l: string[]) => l.map((x, i) => `${i + 1}. ${x}`).join("\n") },
  bullets: { label: "À puces (•)", fn: (l: string[]) => l.map((x) => `• ${x}`).join("\n") },
  dashes: { label: "Markdown (-)", fn: (l: string[]) => l.map((x) => `- ${x}`).join("\n") },
  tasks: { label: "Cases à cocher Markdown", fn: (l: string[]) => l.map((x) => `- [ ] ${x}`).join("\n") },
  ul: { label: "HTML <ul>", fn: (l: string[]) => `<ul>\n${l.map((x) => `  <li>${escHtml(x)}</li>`).join("\n")}\n</ul>` },
  ol: { label: "HTML <ol>", fn: (l: string[]) => `<ol>\n${l.map((x) => `  <li>${escHtml(x)}</li>`).join("\n")}\n</ol>` },
  comma: { label: "Séparée par des virgules", fn: (l: string[]) => l.join(", ") },
  csv: { label: "CSV (une ligne, guillemets)", fn: (l: string[]) => l.map((x) => (/[",;\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x)).join(",") },
  json: { label: "Tableau JSON", fn: (l: string[]) => JSON.stringify(l, null, 2) },
} as const;

export function ListGenerator() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<keyof typeof FORMATS>("numbered");
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");
  const [dedupe, setDedupe] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const items = useMemo(() => {
    let l = text.split(/\r?\n/).map((x) => x.trim().replace(/^(?:[-*•]|\d+[.)])\s+(?:\[[ x]\]\s+)?/i, "")).filter(Boolean);
    if (dedupe) { const seen = new Set<string>(); l = l.filter((x) => { const k = x.toLocaleLowerCase("fr"); if (seen.has(k)) return false; seen.add(k); return true; }); }
    if (sort !== "none") { const c = new Intl.Collator("fr", { numeric: true, sensitivity: "base" }); l = [...l].sort(c.compare); if (sort === "desc") l.reverse(); }
    return l.map((x) => prefix + x + suffix);
  }, [text, sort, dedupe, prefix, suffix]);
  const out = items.length ? FORMATS[format].fn(items) : "";
  return (
    <div className="grid gap-5">
      <Row className="items-end">
        <Field label="Format de sortie" className="min-w-56">{(id) => <select id={id} className="field" value={format} onChange={(e) => setFormat(e.target.value as keyof typeof FORMATS)}>{Object.entries(FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}</select>}</Field>
        <Field label="Tri">{(id) => <select id={id} className="field" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="none">Ordre d&apos;origine</option><option value="asc">A → Z</option><option value="desc">Z → A</option></select>}</Field>
        <Field label="Préfixe" className="w-28">{(id) => <input id={id} className="field" value={prefix} maxLength={40} onChange={(e) => setPrefix(e.target.value)} />}</Field>
        <Field label="Suffixe" className="w-28">{(id) => <input id={id} className="field" value={suffix} maxLength={40} onChange={(e) => setSuffix(e.target.value)} />}</Field>
        <div className="pb-2.5"><Toggle checked={dedupe} onChange={setDedupe} label="Supprimer les doublons" /></div>
      </Row>
      <TwoCols>
        <InputArea label="Éléments, un par ligne" value={text} onChange={setText} rows={11} placeholder={"Pommes\nPoires\nBananes"} />
        <OutputArea value={out} rows={11} mono={["ul", "ol", "json", "csv"].includes(format)} label={`Liste formatée · ${items.length} élément${items.length > 1 ? "s" : ""}`} actions={<DownloadButton disabled={!out} onClick={() => downloadText(out, `liste.${format === "json" ? "json" : format === "csv" ? "csv" : ["ul", "ol"].includes(format) ? "html" : "txt"}`)} />} />
      </TwoCols>
      <p className="text-xs text-muted">Les puces et numéros déjà présents au début des lignes sont retirés automatiquement avant la mise en forme.</p>
    </div>
  );
}

/* ---------- To-do ---------- */
interface Todo { id: string; text: string; done: boolean; star: boolean }
const NO_TODOS: Todo[] = [];
export function TodoList() {
  const [todos, setTodos] = useStored<Todo[]>("todos", NO_TODOS);
  const hydrated = useHydrated();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const save = (fn: (t: Todo[]) => Todo[]) => { if (!setTodos(fn)) toast.error("Stockage local indisponible : la liste n'a pas pu être enregistrée."); };
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    if (todos.length >= 500) { toast.error("Limite de 500 tâches atteinte."); return; }
    save((t) => [{ id: crypto.randomUUID(), text: text.slice(0, 300), done: false, star: false }, ...t]);
    setDraft("");
  };
  const commitEdit = () => { const v = editText.trim(); if (editing && v) save((t) => t.map((x) => (x.id === editing ? { ...x, text: v.slice(0, 300) } : x))); setEditing(null); };
  const visible = todos.filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done)).sort((a, b) => Number(a.done) - Number(b.done) || Number(b.star) - Number(a.star));
  const doneCount = todos.filter((t) => t.done).length;
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-2">
        <input aria-label="Nouvelle tâche" className="field h-11" placeholder="Ajouter une tâche et appuyer sur Entrée…" value={draft} maxLength={300} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit" variant="primary" className="h-11" disabled={!draft.trim()}><Plus /> Ajouter</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filtre" value={filter} onChange={setFilter} options={[{ value: "all", label: `Toutes (${todos.length})` }, { value: "active", label: `À faire (${todos.length - doneCount})` }, { value: "done", label: `Terminées (${doneCount})` }]} />
        <div className="flex gap-1.5">
          <DownloadButton variant="ghost" label="Exporter" disabled={!todos.length} onClick={() => downloadText(todos.map((t) => `[${t.done ? "x" : " "}] ${t.text}`).join("\n"), "taches.txt")} />
          <Button size="sm" variant="ghost" disabled={!doneCount} onClick={() => save((t) => t.filter((x) => !x.done))}><Trash2 /> Effacer les terminées</Button>
        </div>
      </div>
      {todos.length > 0 && <div className="h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label="Progression" aria-valuenow={Math.round((doneCount / todos.length) * 100)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${(doneCount / todos.length) * 100}%` }} /></div>}
      {!hydrated ? <div className="skeleton h-40" /> : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center">
          <span className="mx-auto inline-flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Check className="size-5" /></span>
          <p className="mt-3 font-medium">{todos.length === 0 ? "Ta liste est vide" : filter === "done" ? "Aucune tâche terminée" : "Tout est fait, bravo !"}</p>
          <p className="mt-1 text-sm text-muted">{todos.length === 0 ? "Ajoute ta première tâche ci-dessus." : "Change de filtre pour voir les autres tâches."}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {visible.map((t) => (
            <li key={t.id} className="group flex animate-fade-in items-center gap-3 px-3.5 py-2.5">
              <button type="button" role="checkbox" aria-checked={t.done} aria-label={t.done ? `Marquer « ${t.text} » comme à faire` : `Marquer « ${t.text} » comme terminée`} onClick={() => save((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150", t.done ? "border-success bg-success text-white" : "border-border-strong hover:border-accent")}>{t.done && <Check className="size-3.5" strokeWidth={3} />}</button>
              {editing === t.id ? (
                <input autoFocus aria-label="Modifier la tâche" className="field h-8 flex-1 py-0" value={editText} maxLength={300} onChange={(e) => setEditText(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }} />
              ) : (
                <span onDoubleClick={() => { setEditing(t.id); setEditText(t.text); }} className={cn("min-w-0 flex-1 text-[15px] break-words transition-colors", t.done && "text-faint line-through")}>{t.text}</span>
              )}
              <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <Button size="icon" variant="ghost" className="size-8" aria-label="Modifier" onClick={() => { setEditing(t.id); setEditText(t.text); }}><Pencil /></Button>
                <Button size="icon" variant="ghost" className="size-8" aria-label="Supprimer" onClick={() => save((l) => l.filter((x) => x.id !== t.id))}><Trash2 /></Button>
              </div>
              <button type="button" aria-pressed={t.star} aria-label={t.star ? "Retirer la priorité" : "Marquer comme prioritaire"} title="Prioritaire" onClick={() => save((l) => l.map((x) => (x.id === t.id ? { ...x, star: !x.star } : x)))} className={cn("shrink-0 rounded-md p-1.5 transition-colors", t.star ? "text-[#e0a100]" : "text-faint hover:text-fg")}><Star className="size-4" fill={t.star ? "currentColor" : "none"} /></button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-center text-xs text-muted">Enregistré uniquement dans ce navigateur. Double-clique sur une tâche pour la modifier.</p>
    </div>
  );
}

/* ---------- Noms aléatoires ---------- */
export function RandomNames() {
  const [gender, setGender] = useState<"all" | "f" | "m">("all");
  const [format, setFormat] = useState<"full" | "first" | "last">("full");
  const [count, setCount] = useState(10);
  const [names, setNames] = useState<string[]>([]);
  const n = Math.min(100, Math.max(1, Math.floor(count) || 1));
  const generate = () => {
    const firsts = gender === "f" ? FIRST_NAMES_F : gender === "m" ? FIRST_NAMES_M : [...FIRST_NAMES_F, ...FIRST_NAMES_M];
    const out = new Set<string>();
    let guard = 0;
    while (out.size < n && guard++ < n * 30) out.add(format === "first" ? pick(firsts) : format === "last" ? pick(LAST_NAMES) : `${pick(firsts)} ${pick(LAST_NAMES)}`);
    setNames([...out]);
  };
  return (
    <div className="grid gap-5">
      <Row className="items-end">
        <Segmented label="Prénoms" value={gender} onChange={setGender} options={[{ value: "all", label: "Tous" }, { value: "f", label: "Féminins" }, { value: "m", label: "Masculins" }]} />
        <Segmented label="Format" value={format} onChange={setFormat} options={[{ value: "full", label: "Prénom + nom" }, { value: "first", label: "Prénom" }, { value: "last", label: "Nom" }]} />
        <Field label="Quantité (1 à 100)" className="w-36">{(id) => <input id={id} type="number" min={1} max={100} className="field" value={count} onChange={(e) => setCount(Number(e.target.value))} />}</Field>
        <Button variant="primary" onClick={generate}><RefreshCw /> Générer</Button>
        <CopyButton text={names.join("\n")} label="Copier la liste" size="md" />
      </Row>
      {names.length === 0 ? <p className="rounded-2xl border border-dashed border-border-strong p-10 text-center text-sm text-muted">Clique sur « Générer » pour créer des noms fictifs.</p> : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {names.map((name, i) => (
            <li key={name}><button type="button" onClick={() => void copyText(name, `« ${name} » copié`)} style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }} title="Cliquer pour copier" className="flex w-full animate-pop items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-left text-[15px] transition-colors hover:bg-subtle">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">{name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>{name}
            </button></li>
          ))}
        </ul>
      )}
      {names.length > 0 && names.length < n && <Alert>Seulement {names.length} noms distincts sont disponibles pour cette combinaison.</Alert>}
    </div>
  );
}

/* ---------- Sélecteur aléatoire ---------- */
export function RandomPicker() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"pick" | "teams">("pick");
  const [count, setCount] = useState(1);
  const [dedupe, setDedupe] = useState(true);
  const [result, setResult] = useState<string[][] | null>(null);
  const [rolling, setRolling] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);
  const entries = useMemo(() => { const l = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean); return dedupe ? [...new Set(l)] : l; }, [text, dedupe]);
  const max = mode === "pick" ? entries.length : Math.max(1, entries.length);
  const n = Math.min(Math.max(1, Math.floor(count) || 1), Math.max(1, max));
  const draw = () => {
    if (!entries.length) return;
    const shuffled = shuffle(entries);
    const final = mode === "pick" ? [shuffled.slice(0, n)] : Array.from({ length: n }, (_, i) => shuffled.filter((_, k) => k % n === i));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || entries.length < 2) { setResult(final); return; }
    setResult(null);
    let ticks = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setRolling(entries[randomInt(entries.length)]);
      if (++ticks >= 14) { clearInterval(timer.current); setRolling(null); setResult(final); }
    }, 70);
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid content-start gap-4">
        <InputArea label={`Participants ou options, un par ligne · ${entries.length} entrée${entries.length > 1 ? "s" : ""}`} value={text} onChange={(v) => { setText(v); setResult(null); }} rows={10} placeholder={"Alice\nBruno\nChloé\nDavid"} maxLength={200_000} />
        <Toggle checked={dedupe} onChange={setDedupe} label="Supprimer les doublons" />
      </div>
      <div className="grid content-start gap-4">
        <Row className="items-end">
          <Segmented label="Mode" value={mode} onChange={(v) => { setMode(v); setResult(null); setCount(v === "teams" ? 2 : 1); }} options={[{ value: "pick", label: "Tirer au sort" }, { value: "teams", label: "Former des équipes" }]} />
          <Field label={mode === "pick" ? "Nombre de gagnants" : "Nombre d'équipes"} className="w-40">{(id) => <input id={id} type="number" min={1} max={Math.max(1, max)} className="field" value={count} onChange={(e) => setCount(Number(e.target.value))} />}</Field>
        </Row>
        <Button variant="primary" size="lg" onClick={draw} disabled={!entries.length || rolling !== null}>{mode === "pick" ? <><RefreshCw /> {result ? "Relancer le tirage" : "Lancer le tirage"}</> : <><Users /> {result ? "Mélanger à nouveau" : "Former les équipes"}</>}</Button>
        <div className="flex min-h-48 flex-col justify-center rounded-2xl border border-border bg-subtle/40 p-5" aria-live="polite">
          {rolling !== null ? <p className="text-center text-3xl font-semibold tracking-tight text-faint">{rolling}</p>
            : !result ? <p className="text-center text-sm text-muted">{entries.length ? "Prêt pour le tirage." : "Saisis au moins une entrée pour commencer."}</p>
            : mode === "pick" ? (
              <div className="text-center">
                <p className="text-[13px] text-muted">{result[0].length > 1 ? "Les gagnants sont" : "Le résultat est"}</p>
                <ul className="mt-2 space-y-1.5">{result[0].map((w, i) => <li key={`${w}-${i}`} style={{ animationDelay: `${i * 80}ms` }} className="animate-pop text-2xl font-semibold tracking-tight text-accent-text sm:text-3xl">{result[0].length > 1 && <span className="mr-2 text-base text-faint">{i + 1}.</span>}{w}</li>)}</ul>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {result.map((team, i) => (
                  <div key={i} className="animate-pop rounded-xl border border-border bg-surface p-3.5" style={{ animationDelay: `${i * 60}ms` }}>
                    <p className="text-xs font-semibold text-accent-text">Équipe {i + 1} · {team.length}</p>
                    <ul className="mt-1.5 space-y-0.5 text-sm">{team.map((m, k) => <li key={`${m}-${k}`}>{m}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
        </div>
        {result && <CopyButton className="justify-self-start" text={mode === "pick" ? result[0].join("\n") : result.map((t, i) => `Équipe ${i + 1} : ${t.join(", ")}`).join("\n")} label="Copier le résultat" />}
      </div>
    </div>
  );
}

/* ---------- Phrase de passe ---------- */
export function PassphraseGenerator() {
  const [words, setWords] = useState(5);
  const [sep, setSep] = useState("-");
  const [caps, setCaps] = useState(false);
  const [number, setNumber] = useState(false);
  const [phrase, setPhrase] = useState("");
  const generate = () => {
    const w = Array.from({ length: words }, () => pick(NOUNS)).map((x) => (caps ? x[0].toUpperCase() + x.slice(1) : x));
    if (number) w.push(String(randomInt(100)).padStart(2, "0"));
    setPhrase(w.join(sep === "space" ? " " : sep));
  };
  useEffect(() => { generate(); }, [words, sep, caps, number]); // eslint-disable-line react-hooks/exhaustive-deps
  const bits = words * Math.log2(NOUNS.length) + (number ? Math.log2(100) : 0);
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-subtle/60 p-3 pl-5">
        <output aria-live="polite" className="min-w-0 flex-1 font-mono text-lg font-medium break-words sm:text-xl">{phrase}</output>
        <Button size="icon" variant="ghost" onClick={generate} aria-label="Générer une nouvelle phrase de passe" title="Régénérer"><RefreshCw /></Button>
        <CopyButton text={phrase} variant="primary" size="md" />
      </div>
      <StrengthMeter bits={bits} />
      <Slider label="Nombre de mots" value={words} onChange={setWords} min={4} max={10} suffix=" mots" />
      <Row>
        <Segmented label="Séparateur" value={sep} onChange={setSep} options={[{ value: "-", label: "Tiret" }, { value: ".", label: "Point" }, { value: "_", label: "Underscore" }, { value: "space", label: "Espace" }]} />
        <Toggle checked={caps} onChange={setCaps} label="Majuscule à chaque mot" />
        <Toggle checked={number} onChange={setNumber} label="Ajouter un nombre" />
      </Row>
      <p className="text-xs text-muted">Mots tirés au hasard dans un lexique de {NOUNS.length} mots français ({Math.log2(NOUNS.length).toFixed(1)} bits par mot), avec le générateur cryptographique du navigateur. Les majuscules et le séparateur n&apos;ajoutent pas d&apos;entropie : pour un compte sensible, augmente le nombre de mots.</p>
    </div>
  );
}

/* ---------- Compteur de jours ---------- */
export function DayCounter() {
  const [mode, setMode] = useState<"count" | "add">("count");
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [inclusive, setInclusive] = useState(false);
  const [days, setDays] = useState("30");
  const [op, setOp] = useState<"add" | "sub">("add");
  const [business, setBusiness] = useState(false);
  const a = parseDate(d1), b = parseDate(d2);
  let count: { total: number; week: number; weekend: number; swapped: boolean } | null = null;
  if (mode === "count" && a !== null && b !== null) {
    const start = Math.min(a, b), end = Math.max(a, b) + (inclusive ? DAY : 0);
    const total = Math.round((end - start) / DAY), week = countWeekdays(start, end);
    count = { total, week, weekend: total - week, swapped: a > b };
  }
  const n = /^\d{1,6}$/.test(days.trim()) ? Number(days) : Number.NaN;
  let target: number | null = null;
  if (mode === "add" && a !== null && !Number.isNaN(n)) {
    const dir = op === "add" ? 1 : -1;
    if (!business) target = a + dir * n * DAY;
    else { let t = a, left = n; while (left > 0) { t += dir * DAY; const dow = new Date(t).getUTCDay(); if (dow !== 0 && dow !== 6) left--; } target = t; }
    if (new Date(target).getUTCFullYear() > 9999 || new Date(target).getUTCFullYear() < 1) target = null;
  }
  const dateField = (label: string, v: string, set: (s: string) => void) => (
    <div className="grid gap-2">
      <Field label={label}>{(id) => <input id={id} type="date" className="field" value={v} min="0001-01-01" max="9999-12-31" onChange={(e) => set(e.target.value)} />}</Field>
      <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => set(todayISO())}>Aujourd&apos;hui</Button>
    </div>
  );
  return (
    <div className="grid gap-5">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "count", label: "Compter les jours" }, { value: "add", label: "Ajouter ou retirer des jours" }]} />
      {mode === "count" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">{dateField("Date de début", d1, setD1)}{dateField("Date de fin", d2, setD2)}</div>
          <Toggle checked={inclusive} onChange={setInclusive} label="Inclure le dernier jour dans le décompte" />
          {count ? (
            <>
              {count.swapped && <Alert>La date de fin précède la date de début : elles ont été inversées pour le calcul.</Alert>}
              <StatGrid>
                <Stat accent label="Jours calendaires" value={count.total.toLocaleString("fr-FR")} />
                <Stat label="Jours ouvrés (lun. → ven.)" value={count.week.toLocaleString("fr-FR")} />
                <Stat label="Jours de week-end" value={count.weekend.toLocaleString("fr-FR")} />
                <Stat label="Semaines" value={`${Math.floor(count.total / 7).toLocaleString("fr-FR")} sem. ${count.total % 7} j`} />
              </StatGrid>
              <p className="text-xs text-muted">Les jours fériés ne sont pas déduits des jours ouvrés.</p>
            </>
          ) : <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Sélectionne deux dates pour lancer le décompte.</p>}
        </>
      ) : (
        <>
          <div className="grid items-start gap-4 sm:grid-cols-3">
            {dateField("Date de départ", d1, setD1)}
            <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Opération</span><Segmented label="Opération" value={op} onChange={setOp} options={[{ value: "add", label: "+ Ajouter" }, { value: "sub", label: "− Retirer" }]} /></div>
            <Field label="Nombre de jours">{(id) => <input id={id} inputMode="numeric" className="field" value={days} maxLength={6} onChange={(e) => setDays(e.target.value)} aria-invalid={Number.isNaN(n)} />}</Field>
          </div>
          <Toggle checked={business} onChange={setBusiness} label="Compter uniquement les jours ouvrés (lundi à vendredi)" />
          {Number.isNaN(n) ? <Alert tone="danger">Le nombre de jours doit être un entier positif.</Alert> : target !== null ? (
            <div className="rounded-2xl bg-accent-soft p-5">
              <p className="text-[13px] text-muted">{n.toLocaleString("fr-FR")} jour{n > 1 ? "s" : ""}{business ? " ouvré" + (n > 1 ? "s" : "") : ""} {op === "add" ? "après" : "avant"} le {formatLongDate(a!)}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-accent-text first-letter:uppercase sm:text-3xl">{formatLongDate(target)}</p>
            </div>
          ) : <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Sélectionne une date de départ.</p>}
        </>
      )}
    </div>
  );
}
