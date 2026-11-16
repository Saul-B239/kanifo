import { ArrowRight, Download, Gauge, Heart, Layers, Lock, Palette, QrCode, ScanLine, ShieldCheck, Sparkles, Wand2, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { Container, FaqList, SectionHeading } from "@/components/content";
import { HeroSearch } from "@/components/hero-search";
import { JsonLd } from "@/components/json-ld";
import { QrShowcase } from "@/components/qr/qr-showcase";
import { ToolGrid } from "@/components/tool-card";
import { ToolIcon } from "@/components/tool-icon";
import { buttonClass } from "@/components/ui/button-class";
import { homeFaq } from "@/content/fr/faq";
import { absoluteUrl, site } from "@/lib/site";
import { categories, categoryTone } from "@/lib/tools/categories";
import { newestTools, popularTools, tools, toolsByCategory } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Kanifo — Tous tes outils en ligne gratuits, au même endroit" },
  description: site.description,
  alternates: { canonical: "/" },
};

const reasons = [
  { icon: Zap, title: "Instantané", text: "Aucun logiciel à installer, aucun compte à créer. Tu ouvres l'outil, tu obtiens ton résultat." },
  { icon: Lock, title: "Privé par conception", text: "Tes fichiers et tes textes sont traités dans ton navigateur. Ils ne quittent jamais ton appareil." },
  { icon: Sparkles, title: "100 % gratuit", text: "Tous les outils sont en accès libre, sans filigrane, sans limite cachée et sans publicité agressive." },
  { icon: Layers, title: "Tout au même endroit", text: `${tools.length} outils et un studio de QR codes réunis dans une interface cohérente et soignée.` },
  { icon: Gauge, title: "Rapide partout", text: "Une interface légère qui se charge vite, pensée pour le mobile comme pour les grands écrans." },
  { icon: Heart, title: "À ta main", text: "Favoris, recherche au clavier, thème clair ou sombre : Kanifo s'adapte à ta façon de travailler." },
];

const qrFeatures = [
  { icon: ScanLine, text: "9 types : URL, Wi-Fi, vCard, e-mail, SMS, événement…" },
  { icon: Palette, text: "Couleurs, dégradés, formes des modules et des yeux, logo" },
  { icon: ShieldCheck, text: "Contrôle de lisibilité en direct pour un code toujours scannable" },
  { icon: Download, text: "Export PNG, SVG et WebP, jusqu'à 4096 px, fond transparent" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.url, description: site.description, inLanguage: "fr",
          potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/tools")}?q={search_term_string}` }, "query-input": "required name=search_term_string" } },
        { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, logo: absoluteUrl("/icon.svg") },
      ]} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-[-14rem] left-1/2 h-[30rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]" />
        <Container className="relative pt-16 pb-16 text-center sm:pt-24 sm:pb-20">
          <Link href="/qr-studio" className="group mx-auto mb-7 inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-surface/80 py-1 pr-3 pl-1 text-[13px] text-muted shadow-soft backdrop-blur transition-colors hover:border-border-strong hover:text-fg">
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">Nouveau</span>
            QR Studio : crée des QR codes à ton image
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <h1 className="mx-auto max-w-4xl animate-fade-up text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance [animation-delay:60ms] sm:text-6xl lg:text-7xl">
            Tous tes outils. <span className="text-gradient block pb-1">Une seule plateforme.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-[17px] leading-relaxed text-pretty text-muted [animation-delay:120ms] sm:text-lg">
            Convertis, calcules, crées et simplifies ton quotidien grâce à une collection d&apos;outils gratuits, rapides et accessibles directement depuis ton navigateur.
          </p>
          <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-3 [animation-delay:180ms]">
            <Link href="/tools" className={buttonClass("primary", "lg")}>Explorer les outils <ArrowRight /></Link>
            <Link href="/qr-studio" className={buttonClass("secondary", "lg")}><QrCode /> Créer un QR code</Link>
          </div>
          <div className="relative z-20 mt-10 animate-fade-up [animation-delay:240ms]"><HeroSearch /></div>
          <dl className="mx-auto mt-12 grid max-w-xl animate-fade-up grid-cols-3 gap-4 [animation-delay:300ms]">
            {[[String(tools.length), "outils gratuits"], ["0", "inscription requise"], ["100 %", "dans ton navigateur"]].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{v}</dd>
                <dd className="mt-0.5 text-[13px] text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Populaires */}
      <Container className="py-12">
        <SectionHeading eyebrow="Les plus utilisés" title="Outils populaires" description="Les indispensables que nos visiteurs utilisent chaque jour."
          action={<Link href="/tools" className={buttonClass("secondary", "sm")}>Voir tout le catalogue <ArrowRight /></Link>} />
        <ToolGrid tools={popularTools(8)} />
      </Container>

      {/* Catégories */}
      <Container className="py-12">
        <SectionHeading eyebrow="Catégories" title="Trouve l'outil qu'il te faut" description="Six familles d'outils pour couvrir tes besoins du quotidien." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const list = toolsByCategory(c.id);
            return (
              <Link key={c.id} href={`/tools?categorie=${c.id}`} className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card">
                <div className="flex items-center gap-3.5">
                  <span className={cn("inline-flex size-11 items-center justify-center rounded-xl", categoryTone[c.id])}><ToolIcon name={c.icon} className="size-[22px]" /></span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{c.name}</h3>
                    <p className="text-[13px] text-muted">{list.length} outils</p>
                  </div>
                  <ArrowRight className="ml-auto size-4 text-faint transition-all group-hover:translate-x-1 group-hover:text-accent" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{c.description}</p>
                <p className="mt-3 truncate text-[13px] text-faint">{list.slice(0, 3).map((t) => t.name).join(" · ")}</p>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* QR Studio */}
      <Container className="py-12">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-surface shadow-card">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_18%,transparent),transparent)]" />
          <div className="relative grid items-center gap-10 p-7 sm:p-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text"><Wand2 className="size-3.5" /> QR Studio</p>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Des QR codes à ton image, prêts à imprimer.</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-muted">Un véritable studio de création : choisis le type de contenu, personnalise chaque détail et exporte en haute définition. Gratuit, sans filigrane et sans date d&apos;expiration.</p>
              <ul className="mt-6 space-y-3">
                {qrFeatures.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <span className="mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text"><f.icon className="size-3.5" aria-hidden="true" /></span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/qr-studio" className={buttonClass("primary", "lg", "mt-8")}><QrCode /> Ouvrir le QR Studio</Link>
            </div>
            <QrShowcase />
          </div>
        </div>
      </Container>

      {/* Récents */}
      <Container className="py-12">
        <SectionHeading eyebrow="Nouveautés" title="Outils récemment ajoutés" description="Le catalogue s'enrichit régulièrement. Voici les derniers arrivés."
          action={<Link href="/new" className={buttonClass("secondary", "sm")}>Toutes les nouveautés <ArrowRight /></Link>} />
        <ToolGrid tools={newestTools(8)} />
      </Container>

      <Container><AdSlot id="home-mid" /></Container>

      {/* Pourquoi */}
      <Container className="py-12">
        <SectionHeading eyebrow="Nos engagements" title="Pourquoi choisir Kanifo ?" description="Des outils simples, qui font ce qu'ils annoncent, dans le respect de tes données." />
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="bg-surface p-6 transition-colors hover:bg-subtle/40">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent-text"><r.icon className="size-[18px]" aria-hidden="true" /></span>
              <h3 className="mt-4 font-semibold tracking-tight">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{r.text}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* FAQ */}
      <Container className="max-w-3xl py-12">
        <SectionHeading eyebrow="FAQ" title="Questions fréquentes" description="Tout ce qu'il faut savoir avant de commencer." />
        <FaqList items={homeFaq} />
        <p className="mt-5 text-center text-sm text-muted">Une autre question ? Consulte la <Link href="/faq" className="font-medium text-accent-text underline-offset-4 hover:underline">FAQ complète</Link> ou <Link href="/contact" className="font-medium text-accent-text underline-offset-4 hover:underline">contacte-nous</Link>.</p>
      </Container>
    </>
  );
}
