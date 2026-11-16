"use client";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Badge, Button, CopyButton, DownloadButton, Field, InputArea, OutputArea, Segmented, Stat, Toggle } from "@/components/ui";
import { ADJECTIVES, EXTRA_NOUNS, LOREM, NOUNS, VERBS } from "@/lib/data/words";
import { cn, downloadText, formatBytes, normalize, shuffle } from "@/lib/utils";
import { Row, StatGrid, TwoCols } from "./shared";

/* ---------- Analyse ---------- */
export const graphemes = (s: string): string[] =>
  typeof Intl !== "undefined" && "Segmenter" in Intl ? [...new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(s)].map((x) => x.segment) : Array.from(s);

const wordsOf = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const STOP = new Set("le la les un une des de du d l et ou mais donc or ni car que qui quoi dont où à au aux en dans sur sous par pour avec sans ce cet cette ces son sa ses mon ma mes ton ta tes notre nos votre vos leur leurs je tu il elle on nous vous ils elles se s y ne n pas plus est sont a ont été être avoir c qu j m t the and of to in is it".split(" "));
const duration = (minutes: number) => {
  const sec = Math.round(minutes * 60);
  if (sec < 60) return `${sec} s`;
  return `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, "0")} s`;
};

export function WordCounter() {
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const words = wordsOf(text);
    const freq = new Map<string, number>();
    for (const w of words) {
      const k = w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/^[a-zà-ÿ]['’]/i, "");
      if (k.length >= 3 && !STOP.has(k)) freq.set(k, (freq.get(k) ?? 0) + 1);
    }
    return {
      words: words.length,
      chars: graphemes(text).length,
      sentences: text.split(/[.!?…]+(?=\s|$)/).filter((x) => /[\p{L}\p{N}]/u.test(x)).length,
      paragraphs: text.split(/\n+/).filter((x) => x.trim()).length,
      top: [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).slice(0, 8),
    };
  }, [text]);
  return (
    <div className="grid gap-5">
      <StatGrid>
        <Stat accent label="Mots" value={s.words.toLocaleString("fr-FR")} />
        <Stat label="Caractères" value={s.chars.toLocaleString("fr-FR")} />
        <Stat label="Phrases" value={s.sentences.toLocaleString("fr-FR")} />
        <Stat label="Paragraphes" value={s.paragraphs.toLocaleString("fr-FR")} />
      </StatGrid>
      <InputArea value={text} onChange={setText} rows={11} placeholder="Écris ou colle ton texte ici…" actions={<><CopyButton text={text} variant="ghost" /><DownloadButton variant="ghost" disabled={!text} onClick={() => downloadText(text, "texte.txt")} /></>} />
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Stat label="Temps de lecture (230 mots/min)" value={duration(s.words / 230)} />
        <Stat label="Temps de parole (150 mots/min)" value={duration(s.words / 150)} />
        <Stat label="Longueur moyenne d'une phrase" value={s.sentences ? `${(s.words / s.sentences).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} mots` : "—"} />
      </div>
      <div>
        <h3 className="mb-2 text-[13px] font-medium">Mots les plus fréquents</h3>
        {s.top.length === 0 ? <p className="text-sm text-muted">Les mots significatifs les plus répétés apparaîtront ici.</p> : (
          <div className="flex flex-wrap gap-2">
            {s.top.map(([w, n]) => <span key={w} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[13px]">{w}<span className="rounded-full bg-accent-soft px-1.5 text-xs font-semibold text-accent-text tabular-nums">{n}</span><span className="text-xs text-faint">{((n / s.words) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</span></span>)}
          </div>
        )}
      </div>
    </div>
  );
}

const LIMITS_UI = [
  { label: "Balise title (SEO)", max: 60 },
  { label: "Meta description", max: 160 },
  { label: "SMS (1 message)", max: 160 },
  { label: "Publication courte (X)", max: 280 },
];

export function CharCounter() {
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const g = graphemes(text);
    return {
      total: g.length,
      noSpaces: g.filter((c) => !/^\s+$/.test(c)).length,
      letters: (text.match(/\p{L}/gu) ?? []).length,
      digits: (text.match(/\p{Nd}/gu) ?? []).length,
      punct: (text.match(/\p{P}/gu) ?? []).length,
      spaces: (text.match(/[^\S\n\r]/g) ?? []).length,
      lines: text ? text.split(/\r\n|\r|\n/).length : 0,
      bytes: new TextEncoder().encode(text).length,
    };
  }, [text]);
  const n = (v: number) => v.toLocaleString("fr-FR");
  return (
    <div className="grid gap-5">
      <StatGrid>
        <Stat accent label="Caractères (avec espaces)" value={n(s.total)} />
        <Stat label="Caractères (sans espaces)" value={n(s.noSpaces)} />
        <Stat label="Lettres" value={n(s.letters)} />
        <Stat label="Chiffres" value={n(s.digits)} />
      </StatGrid>
      <InputArea value={text} onChange={setText} rows={9} placeholder="Écris ou colle ton texte ici…" actions={<CopyButton text={text} variant="ghost" />} />
      <StatGrid>
        <Stat label="Espaces" value={n(s.spaces)} />
        <Stat label="Ponctuation" value={n(s.punct)} />
        <Stat label="Lignes" value={n(s.lines)} />
        <Stat label="Poids (UTF-8)" value={formatBytes(s.bytes)} />
      </StatGrid>
      <div className="grid gap-3 sm:grid-cols-2">
        {LIMITS_UI.map((l) => {
          const ratio = s.total / l.max;
          return (
            <div key={l.label} className="rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between text-[13px]"><span className="font-medium">{l.label}</span><span className={cn("tabular-nums", ratio > 1 ? "font-semibold text-danger" : "text-muted")}>{n(s.total)} / {l.max}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle"><div className={cn("h-full rounded-full transition-all duration-200", ratio > 1 ? "bg-danger" : ratio > 0.85 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
              <p className="mt-1.5 text-xs text-muted">{ratio > 1 ? `Dépassement de ${n(s.total - l.max)} caractère${s.total - l.max > 1 ? "s" : ""}` : `${n(l.max - s.total)} caractère${l.max - s.total > 1 ? "s" : ""} restant${l.max - s.total > 1 ? "s" : ""}`}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Casse ---------- */
const deaccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/Œ/g, "OE").replace(/æ/g, "ae").replace(/Æ/g, "AE").replace(/ß/g, "ss");
const tokens = (s: string) => deaccent(s).replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter(Boolean).map((t) => t.toLowerCase());
const cap = (w: string) => w.charAt(0).toLocaleUpperCase("fr") + w.slice(1);
const perLine = (s: string, f: (l: string) => string) => s.split("\n").map(f).join("\n");
const SMALL = new Set(["de", "du", "des", "le", "la", "les", "un", "une", "et", "ou", "à", "au", "aux", "en", "d", "l"]);

const CASES: { id: string; label: string; fn: (s: string) => string }[] = [
  { id: "upper", label: "MAJUSCULES", fn: (s) => s.toLocaleUpperCase("fr") },
  { id: "lower", label: "minuscules", fn: (s) => s.toLocaleLowerCase("fr") },
  { id: "sentence", label: "Casse de phrase", fn: (s) => s.toLocaleLowerCase("fr").replace(/(^\s*|[.!?…]\s+|\n\s*)(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase("fr")) },
  { id: "title", label: "Casse De Titre", fn: (s) => s.toLocaleLowerCase("fr").replace(/[\p{L}\p{N}]+/gu, (w, i: number) => (i > 0 && SMALL.has(w) ? w : cap(w))) },
  { id: "capital", label: "Chaque Mot", fn: (s) => s.toLocaleLowerCase("fr").replace(/(^|[\s\-'’(])(\p{L})/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase("fr")) },
  { id: "toggle", label: "iNVERSER lA cASSE", fn: (s) => Array.from(s, (c) => (c === c.toLocaleUpperCase("fr") ? c.toLocaleLowerCase("fr") : c.toLocaleUpperCase("fr"))).join("") },
  { id: "camel", label: "camelCase", fn: (s) => perLine(s, (l) => tokens(l).map((t, i) => (i ? cap(t) : t)).join("")) },
  { id: "snake", label: "snake_case", fn: (s) => perLine(s, (l) => tokens(l).join("_")) },
  { id: "kebab", label: "kebab-case", fn: (s) => perLine(s, (l) => tokens(l).join("-")) },
];

export function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("upper");
  const out = useMemo(() => CASES.find((c) => c.id === mode)!.fn(text), [text, mode]);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Casse">
        {CASES.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={mode === c.id} onClick={() => setMode(c.id)}
            className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all active:scale-95", mode === c.id ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg")}>
            {c.label}
          </button>
        ))}
      </div>
      <TwoCols>
        <InputArea value={text} onChange={setText} rows={10} placeholder="Colle ton texte ici…" />
        <OutputArea value={out} rows={10} actions={<DownloadButton disabled={!out} onClick={() => downloadText(out, "texte-converti.txt")} />} />
      </TwoCols>
    </div>
  );
}

/* ---------- Nettoyage ---------- */
export function WhitespaceCleaner() {
  const [text, setText] = useState("");
  const [o, setO] = useState({ multi: true, trim: true, tabs: true, nbsp: false, oneLine: false });
  const out = useMemo(() => {
    let s = text.replace(/\r\n?/g, "\n");
    if (o.nbsp) s = s.replace(/[     　]/g, " ").replace(/[​﻿]/g, "");
    if (o.tabs) s = s.replace(/\t/g, " ");
    if (o.oneLine) s = s.replace(/\s*\n\s*/g, " ");
    if (o.multi) s = s.replace(/(?<=\S)[^\S\n]{2,}/g, " "); // l'indentation en début de ligne est gérée par l'option suivante
    if (o.trim) s = s.split("\n").map((l) => l.trim()).join("\n").trim();
    return s;
  }, [text, o]);
  const removed = graphemes(text).length - graphemes(out).length;
  const opt = (k: keyof typeof o, label: string) => <Toggle checked={o[k]} onChange={(v) => setO((p) => ({ ...p, [k]: v }))} label={label} />;
  return (
    <div className="grid gap-5">
      <Row>
        {opt("multi", "Espaces multiples")}{opt("trim", "Début et fin de ligne")}{opt("tabs", "Tabulations → espaces")}{opt("nbsp", "Espaces insécables → normales")}{opt("oneLine", "Tout mettre sur une seule ligne")}
      </Row>
      <TwoCols>
        <InputArea value={text} onChange={setText} rows={10} placeholder="Colle  le   texte à    nettoyer…" />
        <OutputArea value={out} rows={10} label="Texte nettoyé" />
      </TwoCols>
      {text && <Alert tone={removed > 0 ? "success" : "info"}>{removed > 0 ? `${removed.toLocaleString("fr-FR")} caractère${removed > 1 ? "s" : ""} superflu${removed > 1 ? "s" : ""} supprimé${removed > 1 ? "s" : ""}.` : "Aucun espace superflu détecté avec ces options."}</Alert>}
    </div>
  );
}

export function EmptyLineRemover() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"all" | "collapse">("all");
  const [blank, setBlank] = useState(true);
  const [dedupe, setDedupe] = useState(false);
  const { out, removed } = useMemo(() => {
    const lines = text.replace(/\r\n?/g, "\n").split("\n");
    const isEmpty = (l: string) => (blank ? l.trim() === "" : l === "");
    const seen = new Set<string>();
    const res: string[] = [];
    for (const l of lines) {
      if (isEmpty(l)) {
        if (mode === "collapse" && res.length && !isEmpty(res[res.length - 1])) res.push("");
        continue;
      }
      if (dedupe) { if (seen.has(l)) continue; seen.add(l); }
      res.push(l);
    }
    while (res.length && isEmpty(res[res.length - 1])) res.pop();
    return { out: res.join("\n"), removed: text ? lines.length - res.length : 0 };
  }, [text, mode, blank, dedupe]);
  return (
    <div className="grid gap-5">
      <Row>
        <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "all", label: "Supprimer toutes les lignes vides" }, { value: "collapse", label: "En garder une entre les blocs" }]} />
        <Toggle checked={blank} onChange={setBlank} label="Compter les lignes d'espaces comme vides" />
        <Toggle checked={dedupe} onChange={setDedupe} label="Supprimer les lignes en double" />
      </Row>
      <TwoCols>
        <InputArea value={text} onChange={setText} rows={11} placeholder={"Première ligne\n\n\nDeuxième ligne"} />
        <OutputArea value={out} rows={11} actions={<DownloadButton disabled={!out} onClick={() => downloadText(out, "texte-sans-lignes-vides.txt")} />} />
      </TwoCols>
      {text && <Alert tone={removed > 0 ? "success" : "info"}>{removed > 0 ? `${removed} ligne${removed > 1 ? "s" : ""} supprimée${removed > 1 ? "s" : ""}.` : "Aucune ligne à supprimer."}</Alert>}
    </div>
  );
}

export function TextReverser() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"chars" | "words" | "lines">("chars");
  const out = useMemo(() => {
    if (mode === "chars") return graphemes(text).reverse().join("");
    if (mode === "words") return text.split("\n").map((l) => l.split(/(\s+)/).reverse().join("")).join("\n");
    return text.split("\n").reverse().join("\n");
  }, [text, mode]);
  const letters = normalize(text).replace(/ /g, "");
  const palindrome = letters.length >= 3 && letters === [...letters].reverse().join("");
  return (
    <div className="grid gap-5">
      <Row>
        <Segmented label="Mode d'inversion" value={mode} onChange={setMode} options={[{ value: "chars", label: "Lettres" }, { value: "words", label: "Mots" }, { value: "lines", label: "Lignes" }]} />
        {letters.length >= 3 && <Badge tone={palindrome ? "success" : "neutral"} className="px-3 py-1 text-xs">{palindrome ? "✓ C'est un palindrome" : "Pas un palindrome"}</Badge>}
      </Row>
      <TwoCols>
        <InputArea value={text} onChange={setText} rows={9} placeholder="Ésope reste ici et se repose" />
        <OutputArea value={out} rows={9} label="Texte inversé" />
      </TwoCols>
    </div>
  );
}

/* ---------- Générateurs ---------- */
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
function loremSentence(): string {
  const n = rnd(6, 16);
  const w = Array.from({ length: n }, () => LOREM[rnd(0, LOREM.length - 1)]);
  if (n > 9) { const i = rnd(3, n - 4); w[i] += ","; }
  return cap(w.join(" ")) + ".";
}
const loremParagraph = () => Array.from({ length: rnd(3, 6) }, loremSentence).join(" ");
const CLASSIC = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

export function LoremIpsum() {
  const [unit, setUnit] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [seed, setSeed] = useState(0);
  const max = unit === "words" ? 2000 : unit === "sentences" ? 200 : 50;
  const n = Math.min(Math.max(1, Math.floor(count) || 1), max);
  const out = useMemo(() => {
    void seed;
    let blocks: string[];
    if (unit === "paragraphs") {
      blocks = Array.from({ length: n }, loremParagraph);
      if (classic) blocks[0] = `${CLASSIC} ${blocks[0]}`;
    } else if (unit === "sentences") {
      const s = Array.from({ length: n }, loremSentence);
      if (classic) s[0] = CLASSIC;
      blocks = [s.join(" ")];
    } else {
      const base = classic ? ["lorem", "ipsum", "dolor", "sit", "amet"] : [];
      const w = [...base, ...Array.from({ length: Math.max(0, n - base.length) }, () => LOREM[rnd(0, LOREM.length - 1)])].slice(0, n);
      blocks = [cap(w.join(" ")) + "."];
    }
    return html ? blocks.map((b) => `<p>${b}</p>`).join("\n") : blocks.join("\n\n");
  }, [unit, n, classic, html, seed]);
  return (
    <div className="grid gap-5">
      <Row className="items-end">
        <Segmented label="Unité" value={unit} onChange={setUnit} options={[{ value: "paragraphs", label: "Paragraphes" }, { value: "sentences", label: "Phrases" }, { value: "words", label: "Mots" }]} />
        <Field label={`Quantité (max ${max})`} className="w-32">{(id) => <input id={id} type="number" min={1} max={max} value={count} onChange={(e) => setCount(Number(e.target.value))} className="field" />}</Field>
        <Toggle checked={classic} onChange={setClassic} label="Commencer par « Lorem ipsum »" />
        <Toggle checked={html} onChange={setHtml} label="Balises <p>" />
        <Button variant="primary" onClick={() => setSeed((s) => s + 1)}><RefreshCw /> Régénérer</Button>
      </Row>
      <OutputArea value={out} rows={12} label={`Texte généré · ${wordsOf(out.replace(/<[^>]+>/g, "")).length} mots`} actions={<DownloadButton onClick={() => downloadText(out, html ? "lorem-ipsum.html" : "lorem-ipsum.txt")} />} />
    </div>
  );
}

const POOLS = { all: [...NOUNS, ...EXTRA_NOUNS, ...VERBS, ...ADJECTIVES], nouns: [...NOUNS, ...EXTRA_NOUNS], verbs: VERBS, adjectives: ADJECTIVES };
export function RandomWords() {
  const [type, setType] = useState<keyof typeof POOLS>("all");
  const [count, setCount] = useState(5);
  const n = Math.min(Math.max(1, Math.floor(count) || 1), 50);
  const [words, setWords] = useState<string[]>([]);
  const generate = () => setWords(shuffle(POOLS[type]).slice(0, n));
  return (
    <div className="grid gap-5">
      <Row className="items-end">
        <Segmented label="Type de mots" value={type} onChange={setType} options={[{ value: "all", label: "Tous" }, { value: "nouns", label: "Noms" }, { value: "verbs", label: "Verbes" }, { value: "adjectives", label: "Adjectifs" }]} />
        <Field label="Nombre (1 à 50)" className="w-32">{(id) => <input id={id} type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="field" />}</Field>
        <Button variant="primary" onClick={generate}><RefreshCw /> Générer</Button>
        <CopyButton text={words.join("\n")} label="Copier la liste" size="md" />
      </Row>
      <div className="flex min-h-40 flex-wrap content-start gap-2.5 rounded-2xl border border-border bg-subtle/40 p-5" aria-live="polite">
        {words.length === 0 ? <p className="m-auto text-sm text-muted">Clique sur « Générer » pour tirer des mots au hasard.</p> : words.map((w, i) => (
          <span key={`${w}-${i}`} style={{ animationDelay: `${i * 25}ms` }} className="animate-pop rounded-xl border border-border bg-surface px-4 py-2 text-[15px] font-medium shadow-soft">{w}</span>
        ))}
      </div>
      <p className="text-xs text-muted">Lexique : {POOLS[type].length} mots français courants.</p>
    </div>
  );
}

/* ---------- Diff ---------- */
type Op<T> = { type: "eq" | "del" | "add"; value: T };
/** Diff par plus longue sous-séquence commune. Renvoie null si la matrice dépasserait la limite mémoire. */
function lcsDiff<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean, maxCells = 16_000_000): Op<T>[] | null {
  let start = 0;
  while (start < a.length && start < b.length && eq(a[start], b[start])) start++;
  let endA = a.length, endB = b.length;
  while (endA > start && endB > start && eq(a[endA - 1], b[endB - 1])) { endA--; endB--; }
  const A = a.slice(start, endA), B = b.slice(start, endB);
  const n = A.length, m = B.length;
  if ((n + 1) * (m + 1) > maxCells) return null;
  const w = m + 1;
  const dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i * w + j] = eq(A[i], B[j]) ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
  }
  const ops: Op<T>[] = a.slice(0, start).map((value) => ({ type: "eq", value }));
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (eq(A[i], B[j])) { ops.push({ type: "eq", value: B[j] }); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) ops.push({ type: "del", value: A[i++] });
    else ops.push({ type: "add", value: B[j++] });
  }
  while (i < n) ops.push({ type: "del", value: A[i++] });
  while (j < m) ops.push({ type: "add", value: B[j++] });
  for (const value of b.slice(endB)) ops.push({ type: "eq", value });
  return ops;
}

function InlineDiff({ from, to, side }: { from: string; to: string; side: "del" | "add" }) {
  const ops = lcsDiff(from.split(/(\s+)/), to.split(/(\s+)/), (x, y) => x === y, 250_000);
  if (!ops) return <>{side === "del" ? from : to}</>;
  return <>{ops.filter((o) => o.type === "eq" || o.type === side).map((o, i) => o.type === "eq" ? <span key={i}>{o.value}</span> : <mark key={i} className={cn("rounded-sm text-inherit", side === "del" ? "bg-danger/25" : "bg-success/30")}>{o.value}</mark>)}</>;
}

export function TextDiff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreSpace, setIgnoreSpace] = useState(false);
  const result = useMemo(() => {
    if (!a && !b) return { rows: [] as { type: string; left?: string; right?: string }[], error: "" };
    const la = a.replace(/\r\n?/g, "\n").split("\n"), lb = b.replace(/\r\n?/g, "\n").split("\n");
    if (la.length > 3000 || lb.length > 3000) return { rows: [], error: "Chaque texte est limité à 3 000 lignes pour la comparaison." };
    const key = (s: string) => { let k = s; if (ignoreSpace) k = k.replace(/\s+/g, " ").trim(); if (ignoreCase) k = k.toLowerCase(); return k; };
    const ops = lcsDiff(la, lb, (x, y) => key(x) === key(y));
    if (!ops) return { rows: [], error: "Les textes sont trop volumineux et trop différents pour être comparés ici." };
    // Apparie les suppressions et ajouts consécutifs pour afficher les lignes « modifiées » avec le détail des mots.
    const rows: { type: string; left?: string; right?: string }[] = [];
    for (let i = 0; i < ops.length;) {
      if (ops[i].type === "eq") { rows.push({ type: "eq", left: ops[i].value, right: ops[i].value }); i++; continue; }
      const dels: string[] = [], adds: string[] = [];
      while (i < ops.length && ops[i].type !== "eq") { (ops[i].type === "del" ? dels : adds).push(ops[i].value); i++; }
      const pairs = Math.min(dels.length, adds.length);
      for (let k = 0; k < pairs; k++) rows.push({ type: "mod", left: dels[k], right: adds[k] });
      for (let k = pairs; k < dels.length; k++) rows.push({ type: "del", left: dels[k] });
      for (let k = pairs; k < adds.length; k++) rows.push({ type: "add", right: adds[k] });
    }
    return { rows, error: "" };
  }, [a, b, ignoreCase, ignoreSpace]);
  const count = (t: string) => result.rows.filter((r) => r.type === t).length;
  const identical = result.rows.length > 0 && result.rows.every((r) => r.type === "eq");
  let ln = 0, rn = 0;
  return (
    <div className="grid gap-5">
      <TwoCols>
        <InputArea label="Texte original" value={a} onChange={setA} rows={9} placeholder="Colle la première version…" />
        <InputArea label="Texte modifié" value={b} onChange={setB} rows={9} placeholder="Colle la seconde version…" />
      </TwoCols>
      <Row>
        <Toggle checked={ignoreCase} onChange={setIgnoreCase} label="Ignorer la casse" />
        <Toggle checked={ignoreSpace} onChange={setIgnoreSpace} label="Ignorer les espaces" />
        {result.rows.length > 0 && !identical && <span className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full bg-success-soft px-2.5 py-1 text-success">+{count("add")} ajoutée{count("add") > 1 ? "s" : ""}</span><span className="rounded-full bg-danger-soft px-2.5 py-1 text-danger">−{count("del")} supprimée{count("del") > 1 ? "s" : ""}</span><span className="rounded-full bg-warning-soft px-2.5 py-1 text-warning">~{count("mod")} modifiée{count("mod") > 1 ? "s" : ""}</span></span>}
      </Row>
      {result.error && <Alert tone="danger">{result.error}</Alert>}
      {identical && <Alert tone="success">Les deux textes sont identiques{ignoreCase || ignoreSpace ? " (avec les options d'ignorance actives)" : ""}.</Alert>}
      {result.rows.length > 0 && !identical && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse font-mono text-[12.5px] leading-relaxed">
            <caption className="sr-only">Différences ligne par ligne</caption>
            <thead className="bg-subtle text-left font-sans text-xs text-muted"><tr><th className="w-10 px-2 py-2 font-medium">#</th><th className="w-1/2 px-3 py-2 font-medium">Original</th><th className="w-10 px-2 py-2 font-medium">#</th><th className="w-1/2 px-3 py-2 font-medium">Modifié</th></tr></thead>
            <tbody>
              {result.rows.map((r, i) => {
                const L = r.left !== undefined ? ++ln : null, R = r.right !== undefined ? ++rn : null;
                const lc = r.type === "del" || r.type === "mod" ? "bg-danger-soft" : "", rc = r.type === "add" || r.type === "mod" ? "bg-success-soft" : "";
                return (
                  <tr key={i} className="border-t border-border align-top">
                    <td className={cn("px-2 py-1 text-right text-faint select-none", lc)}>{L}</td>
                    <td className={cn("px-3 py-1 break-all whitespace-pre-wrap", lc)}>{r.type === "mod" ? <InlineDiff from={r.left!} to={r.right!} side="del" /> : r.left}</td>
                    <td className={cn("border-l border-border px-2 py-1 text-right text-faint select-none", rc)}>{R}</td>
                    <td className={cn("px-3 py-1 break-all whitespace-pre-wrap", rc)}>{r.type === "mod" ? <InlineDiff from={r.left!} to={r.right!} side="add" /> : r.right}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Slug ---------- */
const SLUG_STOP = new Set("le la les un une des de du d l et ou a au aux en pour par sur dans avec ce ces".split(" "));
export function slugify(input: string, o: { sep: string; lower: boolean; stop: boolean; max: number }): string {
  let words = deaccent(input).replace(/['’]/g, " ").split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (o.lower) words = words.map((w) => w.toLowerCase());
  if (o.stop) { const kept = words.filter((w) => !SLUG_STOP.has(w.toLowerCase())); if (kept.length) words = kept; }
  let slug = "";
  for (const w of words) {
    const next = slug ? slug + o.sep + w : w;
    if (o.max > 0 && next.length > o.max) { if (!slug) slug = w.slice(0, o.max); break; }
    slug = next;
  }
  return slug;
}

export function SlugGenerator() {
  const [text, setText] = useState("");
  const [sep, setSep] = useState<"-" | "_">("-");
  const [lower, setLower] = useState(true);
  const [stop, setStop] = useState(false);
  const [max, setMax] = useState(0);
  const out = useMemo(() => text.split("\n").map((l) => slugify(l, { sep, lower, stop, max })).filter((s, i, arr) => s || arr.length === 1).join("\n"), [text, sep, lower, stop, max]);
  return (
    <div className="grid gap-5">
      <InputArea label="Titre(s) à convertir, un par ligne" value={text} onChange={setText} rows={4} placeholder="Les 10 Meilleures Recettes d'Été !" />
      <Row className="items-end">
        <Segmented label="Séparateur" value={sep} onChange={setSep} options={[{ value: "-", label: "Tiret (-)" }, { value: "_", label: "Underscore (_)" }]} />
        <Toggle checked={lower} onChange={setLower} label="Minuscules" />
        <Toggle checked={stop} onChange={setStop} label="Retirer les mots vides (le, de, et…)" />
        <Field label="Longueur max (0 = illimitée)" className="w-48">{(id) => <input id={id} type="number" min={0} max={200} value={max} onChange={(e) => setMax(Math.min(200, Math.max(0, Math.floor(Number(e.target.value)) || 0)))} className="field" />}</Field>
      </Row>
      <OutputArea value={out} rows={4} mono label="Slug généré" placeholder="les-10-meilleures-recettes-d-ete" />
      {out && !out.includes("\n") && <p className="truncate rounded-xl bg-subtle px-3.5 py-2.5 font-mono text-[13px] text-muted">https://exemple.fr/blog/<span className="font-semibold text-accent-text">{out}</span></p>}
    </div>
  );
}
