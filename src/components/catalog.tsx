"use client";
import { QrCode, Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ToolGrid } from "@/components/tool-card";
import { ToolIcon } from "@/components/tool-icon";
import { Button } from "@/components/ui";
import { categories, categoryTone } from "@/lib/tools/categories";
import { tools, toolsByCategory } from "@/lib/tools/registry";
import { filterTools, type SortKey } from "@/lib/tools/search";
import type { CategoryId } from "@/lib/tools/types";
import { cn, normalize } from "@/lib/utils";

const sorts: { value: SortKey; label: string }[] = [
  { value: "popularite", label: "Popularité" },
  { value: "alpha", label: "Ordre alphabétique" },
  { value: "nouveaute", label: "Nouveauté" },
];
const isCategory = (v: string | null): v is CategoryId => categories.some((c) => c.id === v);
const isSort = (v: string | null): v is SortKey => sorts.some((s) => s.value === v);

export function Catalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortKey>("popularite");
  const [ready, setReady] = useState(false);

  // État initial lu depuis l'URL après hydratation : la liste complète reste rendue côté serveur pour le SEO.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery((p.get("q") ?? "").slice(0, 80));
    const c = p.get("categorie"); if (isCategory(c)) setCategory(c);
    const s = p.get("tri"); if (isSort(s)) setSort(s);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (category !== "all") p.set("categorie", category);
    if (sort !== "popularite") p.set("tri", sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/tools?${qs}` : "/tools");
  }, [query, category, sort, ready]);

  const results = useMemo(() => filterTools({ query, category, sort }), [query, category, sort]);
  const grouped = !query.trim() && category === "all" && sort === "popularite";
  const showQr = normalize(query).includes("qr");
  const reset = () => { setQuery(""); setCategory("all"); setSort("popularite"); };

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              type="search" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80}
              placeholder="Rechercher par nom, description ou mot-clé…" aria-label="Rechercher dans le catalogue"
              className="field h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-faint hover:bg-subtle hover:text-fg">
                <X className="size-4" />
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <span className="shrink-0">Trier par</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field h-10 w-auto py-0">
              {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrer par catégorie">
          {[{ id: "all" as const, name: "Tous", count: tools.length }, ...categories.map((c) => ({ id: c.id, name: c.name, count: toolsByCategory(c.id).length }))].map((c) => (
            <button
              key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all",
                category === c.id ? "border-fg bg-fg text-bg" : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg")}
            >
              {c.name}<span className={cn("tabular-nums", category === c.id ? "opacity-60" : "text-faint")}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 mb-4 text-[13px] text-muted" aria-live="polite">
        {results.length} outil{results.length > 1 ? "s" : ""}{query.trim() ? ` pour « ${query.trim()} »` : ""}
      </p>

      {showQr && (
        <Link href="/qr-studio" className="group mb-4 flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent-soft p-4 transition-colors hover:border-accent/60">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-fg"><QrCode className="size-5" /></span>
          <span><span className="block text-[15px] font-semibold">QR Studio</span><span className="text-[13px] text-muted">Crée et personnalise des QR codes : URL, Wi-Fi, vCard et plus.</span></span>
        </Link>
      )}

      {results.length === 0 && !showQr ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-subtle text-muted"><SearchX className="size-6" /></span>
          <h2 className="mt-4 text-lg font-semibold">Aucun outil trouvé</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">Aucun résultat pour cette recherche. Vérifie l&apos;orthographe ou essaie un terme plus général.</p>
          <Button className="mt-5" onClick={reset}>Réinitialiser les filtres</Button>
        </div>
      ) : grouped ? (
        <div className="space-y-12">
          {categories.map((c) => (
            <section key={c.id} id={c.id} aria-labelledby={`cat-${c.id}`}>
              <div className="mb-4 flex items-center gap-3">
                <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", categoryTone[c.id])}><ToolIcon name={c.icon} className="size-[18px]" /></span>
                <div>
                  <h2 id={`cat-${c.id}`} className="text-lg font-semibold tracking-tight">Outils {c.name}</h2>
                  <p className="text-[13px] text-muted">{c.description}</p>
                </div>
              </div>
              <ToolGrid tools={results.filter((t) => t.category === c.id)} />
            </section>
          ))}
        </div>
      ) : (
        <ToolGrid tools={results} />
      )}
    </div>
  );
}
