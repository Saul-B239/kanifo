import type { Metadata } from "next";
import { Breadcrumbs, Container, SectionHeading } from "@/components/content";
import { ToolGrid } from "@/components/tool-card";
import { tools } from "@/lib/tools/registry";
import { sortTools } from "@/lib/tools/search";

export const metadata: Metadata = {
  title: "Nouveautés : les derniers outils ajoutés",
  description: "Découvre les derniers outils gratuits ajoutés à Kanifo, classés du plus récent au plus ancien.",
  alternates: { canonical: "/new" },
};

const fmt = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export default function NewPage() {
  const groups = new Map<string, typeof tools>();
  for (const t of sortTools(tools, "nouveaute")) {
    const key = t.addedAt.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Nouveautés" }]} />
      <SectionHeading as="h1" title="Nouveautés" description="Le catalogue s'agrandit régulièrement. Retrouve ici tous les outils, du plus récent au plus ancien." />
      <div className="space-y-12">
        {[...groups].map(([key, list]) => (
          <section key={key} aria-labelledby={`m-${key}`}>
            <h2 id={`m-${key}`} className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight first-letter:uppercase">
              <span className="first-letter:uppercase">{fmt.format(new Date(`${key}-01T00:00:00Z`))}</span>
              <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted">{list.length} outil{list.length > 1 ? "s" : ""}</span>
              <span className="h-px flex-1 bg-border" />
            </h2>
            <ToolGrid tools={list} />
          </section>
        ))}
      </div>
    </Container>
  );
}
