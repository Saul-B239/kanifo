export interface JsonIssue { message: string; line?: number; column?: number }
export interface JsonAnalysis { rootType: string; keys: number; depth: number; duplicates: string[]; unsafeNumbers: string[] }

const typeName = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "tableau" : typeof v === "object" ? "objet" : typeof v === "string" ? "chaîne" : typeof v === "number" ? "nombre" : "booléen");

/** Analyse réelle par JSON.parse ; en cas d'échec, tente de localiser l'erreur (ligne, colonne). */
export function parseJson(text: string): { ok: true; value: unknown } | { ok: false; issue: JsonIssue } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    let line: number | undefined, column: number | undefined;
    const lc = /line (\d+) column (\d+)/.exec(raw);
    const pos = /position (\d+)/.exec(raw);
    if (lc) { line = Number(lc[1]); column = Number(lc[2]); }
    else if (pos) {
      const before = text.slice(0, Number(pos[1]));
      line = before.split("\n").length;
      column = before.length - before.lastIndexOf("\n");
    }
    let message = "Syntaxe JSON invalide.";
    if (/Unexpected end|unterminated|end of data/i.test(raw)) message = "Le JSON est incomplet : il manque une accolade, un crochet ou un guillemet fermant.";
    else if (/Unexpected token '?,|Expected double-quoted property name|trailing comma/i.test(raw)) message = "Virgule en trop ou nom de propriété manquant (les virgules finales sont interdites en JSON).";
    else if (/Unexpected token '?'|single quote/i.test(raw)) message = "Guillemets simples détectés : le JSON exige des guillemets doubles.";
    else if (/Unexpected token|Unexpected non-whitespace|unexpected character|Expected/i.test(raw)) message = "Caractère inattendu : vérifie les guillemets, virgules et deux-points à cet endroit.";
    return { ok: false, issue: { message: `${message} (${raw})`, line, column } };
  }
}

/** Parcourt un JSON déjà validé pour détecter les clés en double et les nombres que JavaScript arrondirait. */
export function analyzeJson(text: string, value: unknown): JsonAnalysis {
  const duplicates = new Set<string>();
  const unsafeNumbers = new Set<string>();
  let keys = 0, maxDepth = 0, i = 0;
  const ws = () => { while (i < text.length && /\s/.test(text[i])) i++; };
  const str = (): string => {
    const start = i++;
    while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
    i++;
    try { return JSON.parse(text.slice(start, i)) as string; } catch { return text.slice(start + 1, i - 1); }
  };
  const walk = (depth: number) => {
    ws();
    maxDepth = Math.max(maxDepth, depth);
    const c = text[i];
    if (c === "{") {
      i++; const seen = new Set<string>(); ws();
      if (text[i] === "}") { i++; return; }
      for (;;) {
        ws(); const k = str(); keys++;
        if (seen.has(k)) duplicates.add(k); seen.add(k);
        ws(); i++; // « : »
        walk(depth + 1); ws();
        if (text[i] === ",") { i++; continue; }
        i++; return;
      }
    } else if (c === "[") {
      i++; ws();
      if (text[i] === "]") { i++; return; }
      for (;;) { walk(depth + 1); ws(); if (text[i] === ",") { i++; continue; } i++; return; }
    } else if (c === '"') { str(); }
    else {
      const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?|^true|^false|^null/.exec(text.slice(i, i + 400));
      const lit = m?.[0] ?? "";
      if (/^-?\d{16,}$/.test(lit) && !Number.isSafeInteger(Number(lit))) unsafeNumbers.add(lit);
      i += Math.max(1, lit.length);
    }
  };
  try { walk(0); } catch { /* le texte est valide : aucune erreur attendue */ }
  return { rootType: typeName(value), keys, depth: maxDepth, duplicates: [...duplicates].slice(0, 10), unsafeNumbers: [...unsafeNumbers].slice(0, 5) };
}

export function sortKeysDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v as object).sort((a, b) => a.localeCompare(b)).map((k) => [k, sortKeysDeep((v as Record<string, unknown>)[k])]));
  }
  return v;
}
