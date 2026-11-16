"use client";
import { ArrowRight, QrCode, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ToolIcon } from "@/components/tool-icon";
import { useRecentSearches } from "@/lib/storage";
import { categoryById, categoryTone } from "@/lib/tools/categories";
import { searchTools } from "@/lib/tools/search";
import { cn, normalize } from "@/lib/utils";

const suggestions = ["Compresser une image", "Fusionner des PDF", "QR code Wi-Fi", "Calculer une TVA", "Formater du JSON"];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const { push } = useRecentSearches();
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const results = useMemo(() => {
    const list: { href: string; slug?: string; name: string; sub: string; icon: React.ReactNode }[] = searchTools(query).slice(0, 6).map((t) => ({
      href: `/tools/${t.slug}`, slug: t.slug, name: t.name, sub: categoryById[t.category].name,
      icon: <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", categoryTone[t.category])}><ToolIcon name={t.icon} className="size-[18px]" /></span>,
    }));
    if (normalize(query).includes("qr")) {
      list.unshift({ href: "/qr-studio", name: "QR Studio", sub: "Créer et personnaliser un QR code", icon: <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-accent-fg"><QrCode className="size-[18px]" /></span> });
    }
    return list;
  }, [query]);

  const open = focused && query.trim().length > 0;
  const go = (r: (typeof results)[number]) => { if (r.slug) push(r.slug); router.push(r.href); };

  return (
    <div className="relative mx-auto w-full max-w-2xl text-left">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[active]) go(results[active]);
          else if (query.trim()) router.push(`/tools?q=${encodeURIComponent(query.trim())}`);
        }}
        className={cn("flex items-center gap-3 rounded-2xl border bg-surface pr-2 pl-4 shadow-card transition-all duration-200", focused ? "border-accent ring-4 ring-accent/15" : "border-border-strong")}
      >
        <Search className="size-5 shrink-0 text-faint" aria-hidden="true" />
        <input
          value={query} maxLength={80} autoComplete="off" spellCheck={false}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onFocus={() => { clearTimeout(blurTimer.current); setFocused(true); }}
          onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 150); }}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
            if (e.key === "Escape") (e.target as HTMLInputElement).blur();
          }}
          placeholder="Que souhaites-tu faire aujourd'hui ?" aria-label="Rechercher un outil"
          role="combobox" aria-expanded={open} aria-controls="hero-results"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-faint"
        />
        <button type="submit" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-all hover:bg-accent-hover active:scale-[0.97]">
          <span className="hidden sm:inline">Rechercher</span><ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>

      {open && (
        <div id="hero-results" role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 animate-pop overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-pop">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Aucun outil ne correspond à « {query.trim()} ».</p>
          ) : (
            <>
              {results.map((r, i) => (
                <button
                  key={r.href} type="button" role="option" aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()} onMouseMove={() => setActive(i)} onClick={() => go(r)}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left", i === active && "bg-subtle")}
                >
                  {r.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.name}</span>
                    <span className="block truncate text-xs text-muted">{r.sub}</span>
                  </span>
                </button>
              ))}
              <Link href={`/tools?q=${encodeURIComponent(query.trim())}`} onMouseDown={(e) => e.preventDefault()} className="mt-1 flex items-center justify-between rounded-xl border-t border-border px-3 pt-3 pb-2 text-[13px] font-medium text-accent-text">
                Voir tous les résultats dans le catalogue <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
        <span className="text-faint">Essaie :</span>
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => { setQuery(s); setFocused(true); }} className="rounded-full border border-border bg-surface px-3 py-1 text-muted transition-colors hover:border-border-strong hover:text-fg">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
