"use client";
import { ArrowLeftRight, Delete, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, CopyButton, Field, Segmented, Stat, Toggle } from "@/components/ui";
import { CalcError, evaluate } from "@/lib/calc";
import { breakdown, DAY, formatLongDate, parseDate, todayISO } from "@/lib/dates";
import { cn, formatNumber, parseNumber } from "@/lib/utils";
import { StatGrid } from "./shared";

const num = (id: string, value: string, set: (v: string) => void, placeholder = "0") => (
  <input id={id} inputMode="decimal" className="field tabular-nums" value={value} placeholder={placeholder} maxLength={24} onChange={(e) => set(e.target.value)} aria-invalid={value !== "" && Number.isNaN(parseNumber(value))} />
);
const bad = (...vals: string[]) => vals.some((v) => v.trim() !== "" && Number.isNaN(parseNumber(v)));
const InvalidNote = () => <Alert tone="danger">Saisie invalide : utilise uniquement des chiffres, avec une virgule ou un point pour les décimales.</Alert>;

/* ---------- Calculatrice ---------- */
const KEYS = ["C", "(", ")", "⌫", "√", "^", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ",", "π", "="];

export function CalculatorTool() {
  const [expr, setExpr] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [justDone, setJustDone] = useState(false);
  const exprRef = useRef(expr);
  useEffect(() => { exprRef.current = expr; }, [expr]);

  const preview = useMemo(() => { if (!/[+\-−×÷*/^%√(]/.test(expr)) return ""; try { return formatNumber(evaluate(expr)); } catch { return ""; } }, [expr]);

  const press = useCallback((k: string) => {
    setError("");
    if (k === "C") { setExpr(""); setJustDone(false); return; }
    if (k === "⌫") { setExpr((e) => e.slice(0, -1)); setJustDone(false); return; }
    if (k === "=") {
      const e = exprRef.current;
      if (!e.trim()) return;
      try {
        const r = evaluate(e);
        const result = String(r).replace(".", ",");
        setHistory((h) => [{ expr: e, result: formatNumber(r) }, ...h].slice(0, 12));
        setJustDone(true);
        setExpr(result.includes("e") ? String(r) : result);
      } catch (err) { setError(err instanceof CalcError ? err.message : "Expression invalide"); }
      return;
    }
    setExpr((e) => {
      if (e.length >= 120) return e;
      const startsFresh = justDone && /[0-9,π√(]/.test(k);
      return (startsFresh ? "" : e) + k;
    });
    setJustDone(false);
  }, [justDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const map: Record<string, string> = { "*": "×", "/": "÷", "-": "−", ".": ",", Enter: "=", Backspace: "⌫", Escape: "C", Delete: "C" };
      const k = map[e.key] ?? e.key;
      if (KEYS.includes(k)) { e.preventDefault(); press(k); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-subtle/60 p-4 text-right" aria-live="polite">
          <div className="min-h-9 overflow-x-auto font-mono text-2xl font-medium tracking-tight whitespace-nowrap">{expr || <span className="text-faint">0</span>}</div>
          <div className={cn("mt-1 min-h-5 text-sm", error ? "text-danger" : "text-muted")}>{error || (preview && !justDone ? `= ${preview}` : " ")}</div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => press(k)} aria-label={({ "⌫": "Effacer le dernier caractère", C: "Tout effacer", "=": "Calculer", "√": "Racine carrée", "^": "Puissance", "÷": "Diviser", "×": "Multiplier", "−": "Soustraire", "+": "Additionner" } as Record<string, string>)[k] ?? k}
              className={cn("flex h-13 items-center justify-center rounded-xl py-3.5 text-lg font-medium transition-all duration-100 select-none active:scale-95",
                k === "=" ? "bg-accent text-accent-fg hover:bg-accent-hover" : /[0-9,]/.test(k) ? "border border-border bg-surface shadow-soft hover:bg-subtle" : k === "C" ? "bg-danger-soft text-danger" : "bg-subtle text-accent-text hover:brightness-95 dark:hover:brightness-125")}>
              {k === "⌫" ? <Delete className="size-5" /> : k}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted">Clavier pris en charge : chiffres, + − * / ^ ( ), Entrée, Retour arrière, Échap.</p>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><h3 className="text-[13px] font-medium">Historique</h3>{history.length > 0 && <Button size="sm" variant="ghost" onClick={() => setHistory([])}>Effacer</Button>}</div>
        {history.length === 0 ? <p className="rounded-2xl border border-dashed border-border-strong p-6 text-center text-sm text-muted">Tes calculs apparaîtront ici.</p> : (
          <ul className="space-y-1.5">
            {history.map((h, i) => (
              <li key={i}><button type="button" onClick={() => { setExpr(h.expr); setJustDone(false); setError(""); }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5 text-left font-mono text-sm transition-colors hover:bg-subtle" title="Réutiliser ce calcul">
                <span className="truncate text-muted">{h.expr}</span><span className="shrink-0 font-semibold">= {h.result}</span>
              </button></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Pourcentage ---------- */
type PctMode = "of" | "ratio" | "increase" | "decrease" | "change";
const PCT: Record<PctMode, { tab: string; a: string; b: string; compute: (a: number, b: number) => { value: number; unit: string; label: string; formula: string; extra?: string } | string }> = {
  of: { tab: "X % de Y", a: "Pourcentage (%)", b: "Valeur", compute: (a, b) => ({ value: (b * a) / 100, unit: "", label: `${formatNumber(a)} % de ${formatNumber(b)}`, formula: `${formatNumber(b)} × ${formatNumber(a)} ÷ 100` }) },
  ratio: { tab: "X est quel % de Y", a: "Valeur partielle (X)", b: "Valeur totale (Y)", compute: (a, b) => b === 0 ? "La valeur totale ne peut pas être égale à zéro." : ({ value: (a / b) * 100, unit: " %", label: `${formatNumber(a)} représente`, formula: `${formatNumber(a)} ÷ ${formatNumber(b)} × 100` }) },
  increase: { tab: "Augmentation", a: "Valeur de départ", b: "Hausse (%)", compute: (a, b) => ({ value: a * (1 + b / 100), unit: "", label: `${formatNumber(a)} augmenté de ${formatNumber(b)} %`, formula: `${formatNumber(a)} × (1 + ${formatNumber(b)} ÷ 100)`, extra: `Montant de la hausse : ${formatNumber((a * b) / 100)}` }) },
  decrease: { tab: "Réduction", a: "Valeur de départ", b: "Remise (%)", compute: (a, b) => ({ value: a * (1 - b / 100), unit: "", label: `${formatNumber(a)} réduit de ${formatNumber(b)} %`, formula: `${formatNumber(a)} × (1 − ${formatNumber(b)} ÷ 100)`, extra: `Économie réalisée : ${formatNumber((a * b) / 100)}` }) },
  change: { tab: "Taux de variation", a: "Valeur initiale", b: "Valeur finale", compute: (a, b) => a === 0 ? "La valeur initiale ne peut pas être égale à zéro : le taux de variation n'est pas défini." : ({ value: ((b - a) / Math.abs(a)) * 100, unit: " %", label: `Variation de ${formatNumber(a)} à ${formatNumber(b)}`, formula: `(${formatNumber(b)} − ${formatNumber(a)}) ÷ ${formatNumber(Math.abs(a))} × 100`, extra: `Différence : ${b - a >= 0 ? "+" : ""}${formatNumber(b - a)}` }) },
};

export function PercentageTool() {
  const [mode, setMode] = useState<PctMode>("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const cfg = PCT[mode];
  const x = parseNumber(a), y = parseNumber(b);
  const res = Number.isNaN(x) || Number.isNaN(y) ? null : cfg.compute(x, y);
  return (
    <div className="grid gap-5">
      <Segmented label="Type de calcul" value={mode} onChange={setMode} options={(Object.keys(PCT) as PctMode[]).map((k) => ({ value: k, label: PCT[k].tab }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={cfg.a}>{(id) => num(id, a, setA)}</Field>
        <Field label={cfg.b}>{(id) => num(id, b, setB)}</Field>
      </div>
      {bad(a, b) ? <InvalidNote /> : typeof res === "string" ? <Alert tone="warning">{res}</Alert> : res ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-accent-soft p-5">
          <div>
            <p className="text-[13px] text-muted">{res.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-accent-text tabular-nums">{mode === "change" && res.value > 0 ? "+" : ""}{formatNumber(res.value, 6)}{res.unit}</p>
            <p className="mt-2 font-mono text-xs text-muted">Formule : {res.formula}</p>
            {res.extra && <p className="mt-1 text-[13px]">{res.extra}</p>}
          </div>
          <CopyButton text={formatNumber(res.value, 6)} label="Copier le résultat" />
        </div>
      ) : <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Saisis les deux valeurs pour obtenir le résultat.</p>}
    </div>
  );
}

/* ---------- TVA ---------- */
const round2 = (x: number) => Number(`${Math.round(Number(`${x}e2`))}e-2`);
const euro = (x: number) => x.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function VatTool() {
  const [dir, setDir] = useState<"ht" | "ttc">("ht");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("20");
  const [custom, setCustom] = useState("");
  const r = rate === "custom" ? parseNumber(custom) : Number(rate);
  const v = parseNumber(amount);
  const valid = !Number.isNaN(v) && !Number.isNaN(r) && r >= 0 && r <= 100 && v >= 0 && v < 1e13;
  const ht = valid ? (dir === "ht" ? round2(v) : round2(v / (1 + r / 100))) : 0;
  const ttc = valid ? (dir === "ht" ? round2(ht + round2((ht * r) / 100)) : round2(v)) : 0;
  const tva = round2(ttc - ht);
  return (
    <div className="grid gap-5">
      <Segmented label="Sens du calcul" value={dir} onChange={setDir} options={[{ value: "ht", label: "HT → TTC" }, { value: "ttc", label: "TTC → HT" }]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dir === "ht" ? "Montant HT (€)" : "Montant TTC (€)"}>{(id) => num(id, amount, setAmount, "100,00")}</Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Taux de TVA</span>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Taux de TVA" value={rate} onChange={setRate} options={[{ value: "20", label: "20 %" }, { value: "10", label: "10 %" }, { value: "5.5", label: "5,5 %" }, { value: "2.1", label: "2,1 %" }, { value: "custom", label: "Personnalisé" }]} />
            {rate === "custom" && <input aria-label="Taux personnalisé en %" inputMode="decimal" className="field w-24" placeholder="8,5" value={custom} maxLength={8} onChange={(e) => setCustom(e.target.value)} />}
          </div>
        </div>
      </div>
      {bad(amount, rate === "custom" ? custom : "") ? <InvalidNote /> : amount.trim() && !valid ? <Alert tone="warning">Saisis un montant positif et un taux compris entre 0 et 100 %.</Alert> : valid ? (
        <>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Stat label="Montant HT" value={euro(ht)} accent={dir === "ttc"} />
            <Stat label={`TVA (${formatNumber(r)} %)`} value={euro(tva)} />
            <Stat label="Montant TTC" value={euro(ttc)} accent={dir === "ht"} />
          </div>
          <p className="font-mono text-xs text-muted">{dir === "ht" ? `TTC = ${formatNumber(ht)} × (1 + ${formatNumber(r)} ÷ 100)` : `HT = ${formatNumber(ttc)} ÷ (1 + ${formatNumber(r)} ÷ 100)`}</p>
        </>
      ) : <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Saisis un montant pour calculer la TVA.</p>}
    </div>
  );
}

/* ---------- Moyenne ---------- */
function stats(values: number[], weights?: number[]) {
  const n = values.length;
  const w = weights ?? values.map(() => 1);
  const sw = w.reduce((a, b) => a + b, 0);
  const mean = values.reduce((a, v, i) => a + v * w[i], 0) / sw;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = values.reduce((a, v, i) => a + w[i] * (v - mean) ** 2, 0) / sw;
  return { n, sum: values.reduce((a, b) => a + b, 0), mean, median, min: sorted[0], max: sorted[n - 1], sd: Math.sqrt(variance), sw };
}

export function AverageTool() {
  const [mode, setMode] = useState<"series" | "weighted">("series");
  const [series, setSeries] = useState("");
  const [rows, setRows] = useState([{ v: "", c: "1" }, { v: "", c: "1" }, { v: "", c: "1" }]);
  const parsed = useMemo(() => {
    if (mode === "series") {
      const toks = series.split(/[\s;]+/).filter(Boolean);
      const invalid = toks.filter((t) => Number.isNaN(parseNumber(t)));
      return { values: toks.map(parseNumber).filter((x) => !Number.isNaN(x)), weights: undefined as number[] | undefined, invalid, error: "" };
    }
    const used = rows.filter((r) => r.v.trim() !== "");
    const invalid = used.filter((r) => Number.isNaN(parseNumber(r.v)) || Number.isNaN(parseNumber(r.c || "1"))).map((r) => r.v);
    const ok = used.filter((r) => !Number.isNaN(parseNumber(r.v)) && !Number.isNaN(parseNumber(r.c || "1")));
    const weights = ok.map((r) => parseNumber(r.c || "1"));
    const error = weights.some((w) => w < 0) ? "Les coefficients doivent être positifs." : ok.length && weights.reduce((a, b) => a + b, 0) === 0 ? "La somme des coefficients ne peut pas être nulle." : "";
    return { values: ok.map((r) => parseNumber(r.v)), weights, invalid, error };
  }, [mode, series, rows]);
  const s = parsed.values.length && !parsed.error ? stats(parsed.values, parsed.weights) : null;
  const setRow = (i: number, k: "v" | "c", val: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  return (
    <div className="grid gap-5">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "series", label: "Série de nombres" }, { value: "weighted", label: "Notes avec coefficients" }]} />
      {mode === "series" ? (
        <Field label="Valeurs" hint="Sépare les nombres par un espace, un point-virgule ou un retour à la ligne. La virgule sert de séparateur décimal.">{(id) => <textarea id={id} className="field font-mono" rows={5} value={series} maxLength={100000} onChange={(e) => setSeries(e.target.value)} placeholder="12,5  14  9  16,25  11" />}</Field>
      ) : (
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_1fr_2.25rem] gap-2 text-[13px] font-medium"><span>Note</span><span>Coefficient</span><span /></div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_2.25rem] gap-2">
              <input aria-label={`Note ${i + 1}`} inputMode="decimal" className="field" value={r.v} maxLength={16} onChange={(e) => setRow(i, "v", e.target.value)} placeholder="12,5" />
              <input aria-label={`Coefficient ${i + 1}`} inputMode="decimal" className="field" value={r.c} maxLength={16} onChange={(e) => setRow(i, "c", e.target.value)} placeholder="1" />
              <Button size="icon" variant="ghost" aria-label={`Supprimer la ligne ${i + 1}`} disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button size="sm" className="justify-self-start" disabled={rows.length >= 60} onClick={() => setRows((rs) => [...rs, { v: "", c: "1" }])}><Plus /> Ajouter une note</Button>
        </div>
      )}
      {parsed.invalid.length > 0 && <Alert tone="warning">Valeur{parsed.invalid.length > 1 ? "s" : ""} ignorée{parsed.invalid.length > 1 ? "s" : ""} car non numérique{parsed.invalid.length > 1 ? "s" : ""} : {parsed.invalid.slice(0, 5).map((t) => `« ${t} »`).join(", ")}{parsed.invalid.length > 5 ? "…" : ""}</Alert>}
      {parsed.error && <Alert tone="danger">{parsed.error}</Alert>}
      {s ? (
        <>
          <StatGrid>
            <Stat accent label={mode === "weighted" ? "Moyenne pondérée" : "Moyenne"} value={formatNumber(s.mean, 4)} />
            <Stat label="Médiane" value={formatNumber(s.median, 4)} />
            <Stat label="Minimum" value={formatNumber(s.min, 4)} />
            <Stat label="Maximum" value={formatNumber(s.max, 4)} />
          </StatGrid>
          <StatGrid>
            <Stat label="Nombre de valeurs" value={s.n} />
            <Stat label={mode === "weighted" ? "Somme des coefficients" : "Somme"} value={formatNumber(mode === "weighted" ? s.sw : s.sum, 4)} />
            <Stat label="Étendue" value={formatNumber(s.max - s.min, 4)} />
            <Stat label="Écart-type" value={formatNumber(s.sd, 4)} />
          </StatGrid>
        </>
      ) : !parsed.error && <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Saisis au moins une valeur pour calculer la moyenne.</p>}
    </div>
  );
}

/* ---------- Proportion ---------- */
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export function ProportionTool() {
  const [v, setV] = useState({ a: "", b: "", c: "", d: "" });
  const keys = ["a", "b", "c", "d"] as const;
  const empties = keys.filter((k) => v[k].trim() === "");
  const n = { a: parseNumber(v.a), b: parseNumber(v.b), c: parseNumber(v.c), d: parseNumber(v.d) };
  let result: { key: string; value: number; formula: string } | null = null, error = "";
  if (!bad(v.a, v.b, v.c, v.d) && empties.length === 1) {
    const k = empties[0];
    const f = { a: [n.b, n.c, n.d, "B × C ÷ D"], b: [n.a, n.d, n.c, "A × D ÷ C"], c: [n.a, n.d, n.b, "A × D ÷ B"], d: [n.b, n.c, n.a, "B × C ÷ A"] }[k] as [number, number, number, string];
    if (f[2] === 0) error = "Calcul impossible : la division se ferait par zéro.";
    else result = { key: k.toUpperCase(), value: (f[0] * f[1]) / f[2], formula: `${k.toUpperCase()} = ${f[3]} = ${formatNumber(f[0])} × ${formatNumber(f[1])} ÷ ${formatNumber(f[2])}` };
  }
  const allFilled = empties.length === 0 && !bad(v.a, v.b, v.c, v.d);
  const proportional = allFilled && Math.abs(n.a * n.d - n.b * n.c) <= 1e-9 * Math.max(1, Math.abs(n.a * n.d));
  const ratio = Number.isInteger(n.a) && Number.isInteger(n.b) && n.a > 0 && n.b > 0 ? `${n.a / gcd(n.a, n.b)}:${n.b / gcd(n.a, n.b)}` : null;
  const cell = (k: (typeof keys)[number]) => (
    <input aria-label={`Valeur ${k.toUpperCase()}`} inputMode="decimal" maxLength={20} placeholder={result?.key === k.toUpperCase() ? formatNumber(result.value, 6) : k.toUpperCase()} value={v[k]} onChange={(e) => setV((p) => ({ ...p, [k]: e.target.value }))}
      className={cn("field h-14 text-center text-lg tabular-nums", result?.key === k.toUpperCase() && "border-accent bg-accent-soft placeholder:font-semibold placeholder:text-accent-text")} />
  );
  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted">Remplis trois cases et laisse vide celle à calculer.</p>
      <div className="mx-auto grid w-full max-w-lg grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-2">
        {cell("a")}<span className="row-span-3 text-3xl font-light text-faint">=</span>{cell("c")}
        <div className="h-0.5 rounded bg-fg/70" /><div className="h-0.5 rounded bg-fg/70" />
        {cell("b")}{cell("d")}
      </div>
      <div className="flex justify-center"><Button size="sm" variant="ghost" onClick={() => setV({ a: "", b: "", c: "", d: "" })}>Tout effacer</Button></div>
      {bad(v.a, v.b, v.c, v.d) ? <InvalidNote /> : error ? <Alert tone="danger">{error}</Alert> : result ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-accent-soft p-5">
          <div><p className="text-[13px] text-muted">Valeur manquante</p><p className="text-3xl font-semibold text-accent-text tabular-nums">{result.key} = {formatNumber(result.value, 6)}</p><p className="mt-2 font-mono text-xs text-muted">{result.formula}</p></div>
          <CopyButton text={formatNumber(result.value, 6)} label="Copier" />
        </div>
      ) : allFilled ? <Alert tone={proportional ? "success" : "warning"}>{proportional ? "Les deux rapports sont bien proportionnels : A × D = B × C." : `Les deux rapports ne sont pas proportionnels : A × D = ${formatNumber(n.a * n.d)} alors que B × C = ${formatNumber(n.b * n.c)}.`}</Alert>
        : <p className="text-center text-sm text-muted">{empties.length > 1 ? `Encore ${empties.length - 1} valeur${empties.length > 2 ? "s" : ""} à saisir.` : ""}</p>}
      {ratio && <p className="text-center text-sm text-muted">Ratio A:B simplifié : <strong className="text-fg">{ratio}</strong></p>}
    </div>
  );
}

/* ---------- Unités ---------- */
type Unit = { id: string; label: string; f: number };
const U: Record<string, { label: string; units: Unit[] }> = {
  length: { label: "Longueur", units: [{ id: "mm", label: "Millimètre (mm)", f: 0.001 }, { id: "cm", label: "Centimètre (cm)", f: 0.01 }, { id: "m", label: "Mètre (m)", f: 1 }, { id: "km", label: "Kilomètre (km)", f: 1000 }, { id: "in", label: "Pouce (in)", f: 0.0254 }, { id: "ft", label: "Pied (ft)", f: 0.3048 }, { id: "yd", label: "Yard (yd)", f: 0.9144 }, { id: "mi", label: "Mile (mi)", f: 1609.344 }, { id: "nmi", label: "Mille marin", f: 1852 }] },
  mass: { label: "Masse", units: [{ id: "mg", label: "Milligramme (mg)", f: 1e-6 }, { id: "g", label: "Gramme (g)", f: 0.001 }, { id: "kg", label: "Kilogramme (kg)", f: 1 }, { id: "t", label: "Tonne (t)", f: 1000 }, { id: "oz", label: "Once (oz)", f: 0.028349523125 }, { id: "lb", label: "Livre (lb)", f: 0.45359237 }, { id: "st", label: "Stone (st)", f: 6.35029318 }] },
  temp: { label: "Température", units: [{ id: "c", label: "Celsius (°C)", f: 1 }, { id: "f", label: "Fahrenheit (°F)", f: 1 }, { id: "k", label: "Kelvin (K)", f: 1 }] },
  volume: { label: "Volume", units: [{ id: "ml", label: "Millilitre (mL)", f: 0.001 }, { id: "cl", label: "Centilitre (cL)", f: 0.01 }, { id: "l", label: "Litre (L)", f: 1 }, { id: "m3", label: "Mètre cube (m³)", f: 1000 }, { id: "tsp", label: "Cuillère à café (5 mL)", f: 0.005 }, { id: "tbsp", label: "Cuillère à soupe (15 mL)", f: 0.015 }, { id: "cup", label: "Tasse US (cup)", f: 0.2365882365 }, { id: "floz", label: "Once liquide US (fl oz)", f: 0.0295735295625 }, { id: "pt", label: "Pinte US", f: 0.473176473 }, { id: "gal", label: "Gallon US", f: 3.785411784 }] },
  area: { label: "Surface", units: [{ id: "cm2", label: "Centimètre carré (cm²)", f: 1e-4 }, { id: "m2", label: "Mètre carré (m²)", f: 1 }, { id: "a", label: "Are (a)", f: 100 }, { id: "ha", label: "Hectare (ha)", f: 1e4 }, { id: "km2", label: "Kilomètre carré (km²)", f: 1e6 }, { id: "ft2", label: "Pied carré (ft²)", f: 0.09290304 }, { id: "ac", label: "Acre", f: 4046.8564224 }] },
  speed: { label: "Vitesse", units: [{ id: "ms", label: "Mètre par seconde (m/s)", f: 1 }, { id: "kmh", label: "Kilomètre par heure (km/h)", f: 1 / 3.6 }, { id: "mph", label: "Mile par heure (mph)", f: 0.44704 }, { id: "kn", label: "Nœud (kn)", f: 1852 / 3600 }] },
  time: { label: "Durée", units: [{ id: "ms", label: "Milliseconde", f: 0.001 }, { id: "s", label: "Seconde", f: 1 }, { id: "min", label: "Minute", f: 60 }, { id: "h", label: "Heure", f: 3600 }, { id: "d", label: "Jour", f: 86400 }, { id: "w", label: "Semaine", f: 604800 }, { id: "y", label: "Année (365 j)", f: 31536000 }] },
  data: { label: "Données", units: [{ id: "bit", label: "Bit", f: 0.125 }, { id: "o", label: "Octet (o)", f: 1 }, { id: "ko", label: "Kilooctet (ko)", f: 1e3 }, { id: "mo", label: "Mégaoctet (Mo)", f: 1e6 }, { id: "go", label: "Gigaoctet (Go)", f: 1e9 }, { id: "to", label: "Téraoctet (To)", f: 1e12 }, { id: "kio", label: "Kibioctet (Kio)", f: 1024 }, { id: "mio", label: "Mébioctet (Mio)", f: 1024 ** 2 }, { id: "gio", label: "Gibioctet (Gio)", f: 1024 ** 3 }, { id: "tio", label: "Tébioctet (Tio)", f: 1024 ** 4 }] },
};
function convert(cat: string, v: number, from: string, to: string): number {
  if (cat === "temp") {
    const c = from === "c" ? v : from === "f" ? (v - 32) / 1.8 : v - 273.15;
    return to === "c" ? c : to === "f" ? c * 1.8 + 32 : c + 273.15;
  }
  const units = U[cat].units;
  return (v * units.find((u) => u.id === from)!.f) / units.find((u) => u.id === to)!.f;
}
const fmtUnit = (x: number) => (x !== 0 && (Math.abs(x) < 1e-6 || Math.abs(x) >= 1e15) ? x.toExponential(6).replace(".", ",") : formatNumber(x, 8));

export function UnitConverter() {
  const [cat, setCat] = useState("length");
  const [from, setFrom] = useState("km");
  const [to, setTo] = useState("mi");
  const [value, setValue] = useState("1");
  const units = U[cat].units;
  const v = parseNumber(value);
  const belowZero = cat === "temp" && !Number.isNaN(v) && convert("temp", v, from, "k") < -1e-9;
  const pickCat = (c: string) => { setCat(c); setFrom(U[c].units[c === "temp" ? 0 : Math.min(2, U[c].units.length - 1)].id); setTo(U[c].units[c === "temp" ? 1 : Math.min(3, U[c].units.length - 1)].id); };
  const result = Number.isNaN(v) ? null : convert(cat, v, from, to);
  return (
    <div className="grid gap-5">
      <Segmented label="Grandeur" value={cat} onChange={pickCat} options={Object.entries(U).map(([k, c]) => ({ value: k, label: c.label }))} />
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="grid gap-2">
          <Field label="Valeur">{(id) => num(id, value, setValue)}</Field>
          <select aria-label="Unité de départ" className="field" value={from} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
        </div>
        <Button size="icon" className="mb-0.5 justify-self-center" aria-label="Inverser les unités" title="Inverser les unités" onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight /></Button>
        <div className="grid gap-2">
          <div className="flex flex-col gap-1.5"><span className="text-[13px] font-medium">Résultat</span><div className="field flex min-h-[2.4rem] items-center justify-between gap-2 bg-accent-soft font-semibold text-accent-text tabular-nums" aria-live="polite"><span className="truncate">{result === null ? "—" : fmtUnit(result)}</span>{result !== null && <CopyButton text={fmtUnit(result)} size="icon" variant="ghost" className="-mr-2 size-7" />}</div></div>
          <select aria-label="Unité d'arrivée" className="field" value={to} onChange={(e) => setTo(e.target.value)}>{units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
        </div>
      </div>
      {bad(value) && <InvalidNote />}
      {belowZero && <Alert tone="warning">Cette température est inférieure au zéro absolu (−273,15 °C) : elle n&apos;existe pas physiquement.</Alert>}
      {result !== null && (
        <div>
          <h3 className="mb-2 text-[13px] font-medium">{fmtUnit(v)} {units.find((u) => u.id === from)!.label.toLowerCase()} équivaut à</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {units.filter((u) => u.id !== from).map((u) => (
              <button key={u.id} type="button" onClick={() => setTo(u.id)} className={cn("flex items-baseline justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-subtle", u.id === to ? "border-accent/50 bg-accent-soft" : "border-border")}>
                <span className="truncate text-muted">{u.label}</span><span className="shrink-0 font-medium tabular-nums">{fmtUnit(convert(cat, v, from, u.id))}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Durée ---------- */
/** Analyse « 1:30 », « 1:30:15 », « 1h30 », « 1 h 30 min 15 s », « 90min », « 45s », « 1,5h ». Renvoie des secondes ou NaN. */
export function parseDuration(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/,/g, ".");
  if (!s) return Number.NaN;
  const colon = /^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/.exec(s);
  if (colon) return Number(colon[1]) * 3600 + Number(colon[2]) * 60 + Number(colon[3] ?? 0);
  const m = /^(?:(\d+(?:\.\d+)?)\s*(?:h|heures?))?\s*(?:(\d+(?:\.\d+)?)\s*(?:m|mn|min|minutes?)?)?\s*(?:(\d+(?:\.\d+)?)\s*(?:s|sec|secondes?))?$/.exec(s);
  if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) return Number.NaN;
  if (m[1] === undefined && m[3] === undefined && !/[a-z]/.test(s)) return Number(m[2]) * 60; // nombre seul = minutes
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}
export function formatDuration(totalSec: number): string {
  const sign = totalSec < 0 ? "−" : "";
  const t = Math.round(Math.abs(totalSec));
  return `${sign}${Math.floor(t / 3600)} h ${String(Math.floor((t % 3600) / 60)).padStart(2, "0")} min ${String(t % 60).padStart(2, "0")} s`;
}

export function DurationTool() {
  const [mode, setMode] = useState<"sum" | "between">("sum");
  const [rows, setRows] = useState([{ sign: 1, v: "" }, { sign: 1, v: "" }]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:30");
  const [pause, setPause] = useState("0");
  let total: number | null = null, error = "", note = "";
  if (mode === "sum") {
    const used = rows.filter((r) => r.v.trim());
    const invalid = used.filter((r) => Number.isNaN(parseDuration(r.v)));
    if (invalid.length) error = `Durée non reconnue : « ${invalid[0].v} ». Formats acceptés : 1:30, 1h30, 90min, 1h 30min 15s.`;
    else if (used.length) total = used.reduce((a, r) => a + r.sign * parseDuration(r.v), 0);
  } else {
    const a = /^(\d{2}):(\d{2})$/.exec(start), b = /^(\d{2}):(\d{2})$/.exec(end), p = parseNumber(pause || "0");
    if (a && b) {
      if (Number.isNaN(p) || p < 0) error = "La pause doit être un nombre de minutes positif.";
      else {
        let diff = Number(b[1]) * 60 + Number(b[2]) - (Number(a[1]) * 60 + Number(a[2]));
        if (diff < 0) { diff += 1440; note = "L'heure de fin est antérieure à l'heure de début : le calcul passe par minuit."; }
        if (p > diff) error = "La pause est plus longue que la plage horaire."; else total = (diff - p) * 60;
      }
    }
  }
  return (
    <div className="grid gap-5">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "sum", label: "Additionner des durées" }, { value: "between", label: "Entre deux horaires" }]} />
      {mode === "sum" ? (
        <div className="grid gap-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <button type="button" aria-label={r.sign > 0 ? "Addition (cliquer pour soustraire)" : "Soustraction (cliquer pour additionner)"} title="Basculer + / −" onClick={() => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, sign: -x.sign } : x)))} className={cn("flex h-[2.4rem] w-10 shrink-0 items-center justify-center rounded-[10px] text-lg font-semibold", r.sign > 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{r.sign > 0 ? "+" : "−"}</button>
              <input aria-label={`Durée ${i + 1}`} className="field font-mono" maxLength={30} value={r.v} placeholder={i === 0 ? "1h45" : "1:30"} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
              <Button size="icon" variant="ghost" aria-label={`Supprimer la durée ${i + 1}`} disabled={rows.length <= 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button size="sm" className="justify-self-start" disabled={rows.length >= 50} onClick={() => setRows((rs) => [...rs, { sign: 1, v: "" }])}><Plus /> Ajouter une durée</Button>
          <p className="text-xs text-muted">Formats acceptés : 1:30 · 1:30:15 · 1h30 · 1h 30min 15s · 90min · 45s · 1,5h. Un nombre seul est compté en minutes.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Heure de début">{(id) => <input id={id} type="time" className="field" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
          <Field label="Heure de fin">{(id) => <input id={id} type="time" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />}</Field>
          <Field label="Pause (minutes)">{(id) => num(id, pause, setPause)}</Field>
        </div>
      )}
      {error ? <Alert tone="danger">{error}</Alert> : total !== null ? (
        <>
          {note && <Alert>{note}</Alert>}
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Stat accent label="Durée totale" value={formatDuration(total)} />
            <Stat label="En heures décimales" value={`${formatNumber(total / 3600, 4)} h`} />
            <Stat label="En minutes" value={`${formatNumber(total / 60, 2)} min`} />
          </div>
        </>
      ) : <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Saisis au moins une durée.</p>}
    </div>
  );
}

/* ---------- Différence entre deux dates ---------- */
const plural = (n: number, s: string, p = `${s}s`) => `${n.toLocaleString("fr-FR")} ${n > 1 ? p : s}`;
export function DateDiffTool() {
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [withTime, setWithTime] = useState(false);
  const [t1, setT1] = useState("00:00");
  const [t2, setT2] = useState("00:00");
  const a = parseDate(d1, withTime ? t1 : "00:00"), b = parseDate(d2, withTime ? t2 : "00:00");
  const swapped = a !== null && b !== null && a > b;
  const bd = a !== null && b !== null ? breakdown(Math.min(a, b), Math.max(a, b)) : null;
  const parts = bd ? [bd.years && plural(bd.years, "an"), bd.months && `${bd.months} mois`, bd.days && plural(bd.days, "jour"), withTime && bd.hours && plural(bd.hours, "heure"), withTime && bd.minutes && plural(bd.minutes, "minute")].filter(Boolean) : [];
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Field label="Date de début">{(id) => <input id={id} type="date" className="field" value={d1} min="0001-01-01" max="9999-12-31" onChange={(e) => setD1(e.target.value)} />}</Field>
          {withTime && <input aria-label="Heure de début" type="time" className="field" value={t1} onChange={(e) => setT1(e.target.value)} />}
          <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => setD1(todayISO())}>Aujourd&apos;hui</Button>
        </div>
        <div className="grid gap-2">
          <Field label="Date de fin">{(id) => <input id={id} type="date" className="field" value={d2} min="0001-01-01" max="9999-12-31" onChange={(e) => setD2(e.target.value)} />}</Field>
          {withTime && <input aria-label="Heure de fin" type="time" className="field" value={t2} onChange={(e) => setT2(e.target.value)} />}
          <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => setD2(todayISO())}>Aujourd&apos;hui</Button>
        </div>
      </div>
      <Toggle checked={withTime} onChange={setWithTime} label="Préciser les heures" />
      {bd && a !== null && b !== null ? (
        <>
          {swapped && <Alert>La date de fin précède la date de début : elles ont été inversées pour le calcul.</Alert>}
          <div className="rounded-2xl bg-accent-soft p-5">
            <p className="text-[13px] text-muted">Du {formatLongDate(Math.min(a, b))} au {formatLongDate(Math.max(a, b))}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-accent-text sm:text-3xl">{parts.length ? parts.join(", ") : "Aucun écart : les deux dates sont identiques"}</p>
          </div>
          <StatGrid>
            <Stat label="Semaines" value={formatNumber(bd.totalMs / (7 * DAY), 2)} />
            <Stat label="Jours" value={formatNumber(bd.totalMs / DAY, 2)} />
            <Stat label="Heures" value={formatNumber(bd.totalMs / 3_600_000, 1)} />
            <Stat label="Minutes" value={formatNumber(bd.totalMs / 60_000, 0)} />
          </StatGrid>
        </>
      ) : <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Sélectionne deux dates pour calculer l&apos;écart.</p>}
    </div>
  );
}
