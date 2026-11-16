"use client";
import { ArrowRight, CornerDownLeft, History, QrCode, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolIcon } from "@/components/tool-icon";
import { useRecentSearches } from "@/lib/storage";
import { categoryById, categoryTone } from "@/lib/tools/categories";
import { getTool, popularTools } from "@/lib/tools/registry";
import { searchTools } from "@/lib/tools/search";
import { cn, normalize } from "@/lib/utils";

export const openSearch = () => window.dispatchEvent(new Event("kanifo:search"));

interface Item { key: string; href: string; title: string; subtitle: string; icon: React.ReactNode; slug?: string }

const qrMatches = (q: string) => {
  const n = normalize(q);
  return n.length >= 2 && ["qr", "qr code", "qr studio", "qrcode", "flashcode", "wifi", "vcard"].some((k) => k.startsWith(n) || n.includes(k));
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { recent, push, clear } = useRecentSearches();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("kanifo:search", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("kanifo:search", onOpen); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery(""); setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => { document.body.style.overflow = prev; clearTimeout(t); };
  }, [open]);

  const { groups, flat } = useMemo(() => {
    const toItem = (slug: string): Item | null => {
      const t = getTool(slug);
      if (!t) return null;
      return {
        key: t.slug, slug: t.slug, href: `/tools/${t.slug}`, title: t.name, subtitle: categoryById[t.category].name,
        icon: <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", categoryTone[t.category])}><ToolIcon name={t.icon} className="size-4" /></span>,
      };
    };
    const qr: Item = {
      key: "qr-studio", href: "/qr-studio", title: "QR Studio", subtitle: "Créer et personnaliser un QR code",
      icon: <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg"><QrCode className="size-4" /></span>,
    };
    const groups: { label: string; items: Item[]; clearable?: boolean }[] = [];
    if (query.trim()) {
      const items = searchTools(query).slice(0, 8).map((t) => toItem(t.slug)!).filter(Boolean);
      if (qrMatches(query)) items.unshift(qr);
      if (items.length) groups.push({ label: "Résultats", items });
    } else {
      const rec = recent.map(toItem).filter((i): i is Item => !!i);
      if (rec.length) groups.push({ label: "Consultés récemment", items: rec, clearable: true });
      groups.push({ label: "Suggestions", items: [qr, ...popularTools(5).map((t) => toItem(t.slug)!)] });
    }
    return { groups, flat: groups.flatMap((g) => g.items) };
  }, [query, recent]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: Item) => {
    if (item.slug) push(item.slug);
    setOpen(false);
    router.push(item.href);
  };

  if (!open) return null;
  let index = -1;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]" role="dialog" aria-modal="true" aria-label="Recherche d'outils">
      <div className="absolute inset-0 animate-fade-in bg-black/30 backdrop-blur-sm dark:bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-[18px] shrink-0 text-faint" aria-hidden="true" />
          <input
            ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80}
            placeholder="Rechercher un outil…" aria-label="Rechercher un outil" autoComplete="off" spellCheck={false}
            role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={flat[active] ? `palette-${flat[active].key}` : undefined}
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (flat.length ? (a + 1) % flat.length : 0)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0)); }
              else if (e.key === "Enter" && flat[active]) { e.preventDefault(); go(flat[active]); }
              else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
            }}
          />
          <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted hover:bg-subtle" aria-label="Fermer la recherche">
            <span className="hidden sm:inline">Échap</span><X className="size-3.5 sm:hidden" />
          </button>
        </div>
        <div ref={listRef} id="palette-list" role="listbox" className="max-h-[min(55vh,420px)] overflow-y-auto p-2">
          {flat.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium">Aucun outil ne correspond à « {query.trim()} »</p>
              <p className="mt-1 text-[13px] text-muted">Essaie un autre mot-clé, par exemple « pdf », « image » ou « json ».</p>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.label} className="mb-1">
              <div className="flex items-center justify-between px-2.5 pt-2 pb-1.5 text-[11px] font-medium tracking-wide text-faint uppercase">
                <span className="inline-flex items-center gap-1.5">{g.clearable && <History className="size-3" />}{g.label}</span>
                {g.clearable && <button type="button" onClick={clear} className="normal-case tracking-normal hover:text-fg">Effacer</button>}
              </div>
              {g.items.map((item) => {
                index++;
                const i = index;
                return (
                  <button
                    key={`${g.label}-${item.key}`} id={`palette-${item.key}`} type="button" role="option" aria-selected={i === active} data-index={i}
                    onMouseMove={() => setActive(i)} onClick={() => go(item)}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors", i === active && "bg-subtle")}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                    </span>
                    {i === active && <ArrowRight className="size-4 text-faint" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="hidden items-center gap-4 border-t border-border bg-subtle/50 px-4 py-2.5 text-[11px] text-muted sm:flex">
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-border bg-surface px-1">↑</kbd><kbd className="rounded border border-border bg-surface px-1">↓</kbd> naviguer</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-border bg-surface px-1"><CornerDownLeft className="inline size-2.5" /></kbd> ouvrir</span>
          <span className="ml-auto">{flat.length} résultat{flat.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
