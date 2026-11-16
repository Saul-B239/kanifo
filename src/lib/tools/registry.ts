import { texte } from "@/content/fr/tools/texte";
import { images } from "@/content/fr/tools/images";
import { pdf } from "@/content/fr/tools/pdf";
import { maths } from "@/content/fr/tools/maths";
import { dev } from "@/content/fr/tools/dev";
import { productivite } from "@/content/fr/tools/productivite";
import type { CategoryId, ToolDef, ToolInput } from "./types";

/**
 * Registre central des outils. Pour ajouter un outil :
 * 1. décrire sa fiche dans src/content/<langue>/tools/<catégorie>.ts ;
 * 2. associer son slug à un composant dans src/components/tools/tool-renderer.tsx.
 */
const withCategory = (list: ToolInput[], category: CategoryId): ToolDef[] =>
  list.map((t) => ({ ...t, category, tier: "free" as const, related: t.related ?? [] }));

export const tools: ToolDef[] = [
  ...withCategory(texte, "texte"),
  ...withCategory(images, "images"),
  ...withCategory(pdf, "pdf"),
  ...withCategory(maths, "maths"),
  ...withCategory(dev, "dev"),
  ...withCategory(productivite, "productivite"),
];

const bySlug = new Map(tools.map((t) => [t.slug, t]));
export const getTool = (slug: string) => bySlug.get(slug);

export const toolsByCategory = (category: CategoryId) => tools.filter((t) => t.category === category);

export const popularTools = (n = 8) => [...tools].sort((a, b) => b.popularity - a.popularity).slice(0, n);

export const newestTools = (n = 8) =>
  [...tools].sort((a, b) => b.addedAt.localeCompare(a.addedAt) || b.popularity - a.popularity).slice(0, n);

/** Slugs considérés comme « nouveaux » : les 8 derniers ajouts (déterministe, sans horloge). */
export const newSlugs = new Set(newestTools(8).map((t) => t.slug));

/** Outils associés : liens éditoriaux, complétés par la même catégorie pour le maillage interne. */
export function relatedTools(tool: ToolDef, n = 4): ToolDef[] {
  const out: ToolDef[] = [];
  for (const slug of tool.related) {
    const t = bySlug.get(slug);
    if (t && t.slug !== tool.slug) out.push(t);
  }
  for (const t of toolsByCategory(tool.category)) {
    if (out.length >= n) break;
    if (t.slug !== tool.slug && !out.includes(t)) out.push(t);
  }
  return out.slice(0, n);
}
