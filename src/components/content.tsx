import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";
import type { Faq } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, description, action, as: Tag = "h2" }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode; as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-[13px] font-semibold text-accent-text">{eyebrow}</p>}
        <Tag className={cn("font-semibold tracking-tight text-balance", Tag === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-[28px]")}>{title}</Tag>
        {description && <p className="mt-2.5 leading-relaxed text-pretty text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export interface Crumb { label: string; href?: string }
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: "Accueil", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
          {all.map((c, i) => (
            <li key={c.label} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 text-faint" aria-hidden="true" />}
              {c.href && i < all.length - 1 ? <Link href={c.href} className="transition-colors hover:text-fg">{c.label}</Link> : <span aria-current="page" className="text-fg">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: absoluteUrl(c.href) } : {}) })),
      }} />
    </>
  );
}

export function FaqList({ items, structured = true }: { items: Faq[]; structured?: boolean }) {
  return (
    <>
      <div className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-soft">
        {items.map((f) => (
          <details key={f.q} className="group px-5">
            <summary className="flex list-none items-center justify-between gap-4 py-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="size-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      {structured && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />}
    </>
  );
}

export function ProsePage({ title, intro, crumbs, children }: { title: string; intro?: string; crumbs: Crumb[]; children: ReactNode }) {
  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">{intro}</p>}
      <div className="prose mt-8">{children}</div>
    </Container>
  );
}
