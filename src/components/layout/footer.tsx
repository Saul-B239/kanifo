import Link from "next/link";
import { categories } from "@/lib/tools/categories";
import { popularTools } from "@/lib/tools/registry";
import { site } from "@/lib/site";
import { Logo } from "./logo";

const cols = [
  { title: "Catégories", links: categories.map((c) => ({ href: `/tools?categorie=${c.id}`, label: `Outils ${c.name}` })) },
  { title: "Outils populaires", links: popularTools(6).map((t) => ({ href: `/tools/${t.slug}`, label: t.name })) },
  {
    title: "Kanifo",
    links: [
      { href: "/tools", label: "Tous les outils" },
      { href: "/qr-studio", label: "QR Studio" },
      { href: "/new", label: "Nouveautés" },
      { href: "/favorites", label: "Mes favoris" },
      { href: "/about", label: "À propos" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Informations légales",
    links: [
      { href: "/privacy", label: "Politique de confidentialité" },
      { href: "/terms", label: "Conditions d'utilisation" },
      { href: "/legal", label: "Mentions légales" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{site.slogan} Des outils gratuits, rapides et respectueux de ta vie privée : la plupart des traitements se font directement dans ton navigateur.</p>
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-[13px] font-semibold">{col.title}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-muted transition-colors hover:text-fg">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© Kanifo. Tous droits réservés.</p>
          <p>Conçu pour être rapide, simple et gratuit.</p>
        </div>
      </div>
    </footer>
  );
}
