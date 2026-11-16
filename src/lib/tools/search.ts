import { normalize } from "@/lib/utils";
import { categoryById } from "./categories";
import { tools } from "./registry";
import type { CategoryId, ToolDef } from "./types";

export type SortKey = "popularite" | "alpha" | "nouveaute";

interface Indexed { tool: ToolDef; name: string; short: string; category: string; keywords: string[] }

const index: Indexed[] = tools.map((tool) => ({
  tool,
  name: normalize(tool.name),
  short: normalize(tool.short),
  category: normalize(categoryById[tool.category].name),
  keywords: tool.keywords.map(normalize),
}));

/** Score d'un outil pour une requête : tous les termes doivent correspondre (nom, description, catégorie ou mots-clés). */
const STOP = new Set(["un", "une", "des", "de", "du", "d", "le", "la", "les", "l", "en", "a", "au", "aux", "pour", "mon", "ma", "mes", "et", "ou", "vers", "sur", "avec", "comment"]);

/** Racine approximative : « calculer » → « calcul », « images » → « imag ». */
const stem = (t: string) => (t.length > 4 ? t.replace(/(er|ez|es|s|e|r)$/, "") : t);

function termScore(entry: Indexed, term: string): number {
    let s = 0;
    if (entry.name.startsWith(term)) s = 100;
    else if (entry.name.split(" ").some((w) => w.startsWith(term))) s = 80;
    else if (entry.name.includes(term)) s = 60;
    else if (entry.keywords.some((k) => k.split(" ").some((w) => w.startsWith(term)))) s = 45;
    else if (entry.keywords.some((k) => k.includes(term))) s = 35;
    else if (entry.category.startsWith(term)) s = 30;
    else if (entry.short.split(" ").some((w) => w.startsWith(term))) s = 20;
    else if (term.length >= 3 && entry.short.includes(term)) s = 10;
    return s;
}

function score(entry: Indexed, terms: string[], full: string): number {
  let total = 0;
  for (const term of terms) {
    let s = termScore(entry, term);
    if (s === 0 && stem(term) !== term) s = termScore(entry, stem(term)) * 0.6;
    if (s === 0) return 0;
    total += s;
  }
  if (entry.name === full) total += 200;
  else if (entry.name.includes(full)) total += 50;
  else if (entry.keywords.includes(full)) total += 40;
  return total + entry.tool.popularity / 100;
}

export function searchTools(query: string): ToolDef[] {
  const full = normalize(query);
  if (!full) return [];
  const all = full.split(" ").filter(Boolean);
  const meaningful = all.filter((t) => !STOP.has(t));
  const terms = meaningful.length ? meaningful : all;
  return index
    .map((entry) => ({ tool: entry.tool, s: score(entry, terms, full) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.tool);
}

export function sortTools(list: ToolDef[], sort: SortKey): ToolDef[] {
  const copy = [...list];
  if (sort === "alpha") return copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  if (sort === "nouveaute") return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.popularity - a.popularity);
  return copy.sort((a, b) => b.popularity - a.popularity);
}

export function filterTools(opts: { query?: string; category?: CategoryId | "all"; sort?: SortKey }): ToolDef[] {
  const q = opts.query?.trim() ?? "";
  let list = q ? searchTools(q) : tools;
  if (opts.category && opts.category !== "all") list = list.filter((t) => t.category === opts.category);
  // Avec une requête, l'ordre de pertinence prime sauf tri explicite différent de la popularité.
  if (q && (!opts.sort || opts.sort === "popularite")) return list;
  return sortTools(list, opts.sort ?? "popularite");
}
