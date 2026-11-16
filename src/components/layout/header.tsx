"use client";
import { Heart, Menu, Moon, Search, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useFavorites, useHydrated } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { openSearch } from "./command-palette";
import { Logo } from "./logo";

export const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/tools", label: "Tous les outils" },
  { href: "/qr-studio", label: "QR Studio" },
  { href: "/favorites", label: "Favoris" },
  { href: "/new", label: "Nouveautés" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";
  return (
    <button
      type="button" onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"} title={dark ? "Thème clair" : "Thème sombre"}
      className="inline-flex size-9 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-subtle hover:text-fg"
    >
      <span key={String(dark)} className="animate-pop">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</span>
    </button>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { favorites } = useFavorites();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-50 border-b transition-[background,border-color] duration-200", scrolled || menu ? "border-border bg-bg/80 backdrop-blur-xl" : "border-transparent bg-bg/0")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Navigation principale" className="ml-6 hidden items-center gap-0.5 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", isActive(l.href) ? "bg-subtle text-fg" : "text-muted hover:text-fg")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button" onClick={openSearch} aria-label="Rechercher un outil (Ctrl+K)"
            className="group hidden h-9 w-56 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-[13px] text-faint shadow-soft transition-colors hover:border-border-strong hover:text-muted md:flex"
          >
            <Search className="size-4" aria-hidden="true" />
            <span>Rechercher…</span>
            <kbd className="ml-auto rounded-md border border-border bg-subtle px-1.5 py-px font-sans text-[11px] font-medium text-muted">Ctrl K</kbd>
          </button>
          <button type="button" onClick={openSearch} aria-label="Rechercher un outil" className="inline-flex size-9 items-center justify-center rounded-[10px] text-muted hover:bg-subtle hover:text-fg md:hidden">
            <Search className="size-[18px]" />
          </button>
          <Link href="/favorites" aria-label={`Mes favoris (${favorites.length})`} title="Mes favoris" className="relative inline-flex size-9 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-subtle hover:text-fg">
            <Heart className="size-[18px]" />
            {favorites.length > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">{favorites.length}</span>
            )}
          </Link>
          <ThemeToggle />
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"} className="inline-flex size-9 items-center justify-center rounded-[10px] text-muted hover:bg-subtle hover:text-fg lg:hidden">
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {menu && (
        <nav id="mobile-menu" aria-label="Navigation mobile" className="animate-pop border-t border-border px-4 py-3 lg:hidden">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={cn("block rounded-xl px-3 py-2.5 text-[15px] font-medium", isActive(l.href) ? "bg-subtle text-fg" : "text-muted")}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
