import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { ToolIcon } from "@/components/tool-icon";
import { categoryById, categoryTone } from "@/lib/tools/categories";
import { newSlugs } from "@/lib/tools/registry";
import type { ToolDef } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, className }: { tool: ToolDef; className?: string }) {
  const cat = categoryById[tool.category];
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card focus-within:border-accent/50",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("inline-flex size-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", categoryTone[tool.category])}>
          <ToolIcon name={tool.icon} className="size-5" />
        </span>
        <FavoriteButton slug={tool.slug} name={tool.name} className="relative z-10 -mt-1 -mr-1.5" />
      </div>
      <h3 className="mt-4 text-[15px] leading-snug font-semibold tracking-tight">
        <Link href={`/tools/${tool.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
          {tool.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{tool.short}</p>
      <div className="mt-4 flex items-center gap-1.5 pt-1 text-[11px] font-medium">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-muted">{cat.name}</span>
        <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">Gratuit</span>
        {newSlugs.has(tool.slug) && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-text">Nouveau</span>}
        <ArrowUpRight className="ml-auto size-4 -translate-x-1 text-faint opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100" aria-hidden="true" />
      </div>
    </article>
  );
}

export function ToolGrid({ tools, className }: { tools: ToolDef[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {tools.map((t) => <ToolCard key={t.slug} tool={t} />)}
    </div>
  );
}
