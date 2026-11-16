import { Lock, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { Breadcrumbs, Container, FaqList } from "@/components/content";
import { FavoriteButton } from "@/components/favorite-button";
import { JsonLd } from "@/components/json-ld";
import { ToolCard } from "@/components/tool-card";
import { ToolIcon } from "@/components/tool-icon";
import { ToolRenderer } from "@/components/tools/tool-renderer";
import { absoluteUrl, site } from "@/lib/site";
import { categoryById, categoryTone } from "@/lib/tools/categories";
import { getTool, relatedTools, tools } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = () => tools.map((t) => ({ slug: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tool = getTool((await params).slug);
  if (!tool) return {};
  const url = `/tools/${tool.slug}`;
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: { title: `${tool.seo.title} | ${site.name}`, description: tool.seo.description, url, type: "website" },
    twitter: { card: "summary_large_image", title: tool.seo.title, description: tool.seo.description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const cat = categoryById[tool.category];
  const related = relatedTools(tool, 4);

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Tous les outils", href: "/tools" }, { label: cat.name, href: `/tools?categorie=${cat.id}` }, { label: tool.name }]} />
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-2xl", categoryTone[tool.category])}><ToolIcon name={tool.icon} className="size-6" /></span>
          <div>
            <h1 className="text-[1.7rem] leading-tight font-semibold tracking-tight text-balance sm:text-4xl">{tool.seo.h1}</h1>
            <p className="mt-2.5 max-w-3xl leading-relaxed text-pretty text-muted">{tool.seo.intro}</p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-success"><Sparkles className="size-3" /> Gratuit, sans inscription</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-muted"><Lock className="size-3" /> Traitement local dans ton navigateur</span>
            </div>
          </div>
        </div>
        <FavoriteButton slug={tool.slug} name={tool.name} withLabel className="shrink-0 self-start" />
      </header>

      <section aria-label={tool.name} className="rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-7">
        <ToolRenderer slug={tool.slug} />
      </section>

      <AdSlot id="tool-below" />

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-12">
          <section aria-labelledby="comment">
            <h2 id="comment" className="text-xl font-semibold tracking-tight sm:text-2xl">Comment utiliser l&apos;outil {tool.name.toLowerCase()} ?</h2>
            <ol className="mt-5 space-y-3">
              {tool.seo.steps.map((s, i) => (
                <li key={s} className="flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent-text">{i + 1}</span>
                  <p className="pt-0.5 text-[15px] leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="details">
            <h2 id="details" className="text-xl font-semibold tracking-tight sm:text-2xl">Bon à savoir</h2>
            <p className="mt-4 leading-relaxed text-pretty text-muted">{tool.seo.details}</p>
          </section>
          <section aria-labelledby="faq">
            <h2 id="faq" className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">Questions fréquentes</h2>
            <FaqList items={tool.seo.faq} />
          </section>
        </div>
        <aside aria-labelledby="associes" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="associes" className="mb-4 text-lg font-semibold tracking-tight">Outils associés</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {related.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
          <Link href={`/tools?categorie=${cat.id}`} className="mt-4 inline-block text-sm font-medium text-accent-text underline-offset-4 hover:underline">Tous les outils {cat.name} →</Link>
        </aside>
      </div>

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication", name: tool.name, url: absoluteUrl(`/tools/${tool.slug}`),
        description: tool.seo.description, applicationCategory: "UtilitiesApplication", operatingSystem: "Tous (navigateur web)", inLanguage: "fr",
        isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      }} />
    </Container>
  );
}
