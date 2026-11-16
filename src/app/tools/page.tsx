import type { Metadata } from "next";
import { Catalog } from "@/components/catalog";
import { Breadcrumbs, Container, SectionHeading } from "@/components/content";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";
import { tools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Tous les outils en ligne gratuits",
  description: `Le catalogue complet de Kanifo : ${tools.length} outils gratuits pour le texte, les images, les PDF, les calculs, le développement et la productivité.`,
  alternates: { canonical: "/tools" },
  openGraph: { title: "Tous les outils en ligne gratuits | Kanifo", url: "/tools" },
};

export default function ToolsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Tous les outils" }]} />
      <SectionHeading as="h1" title="Tous les outils" description={`${tools.length} outils gratuits, sans inscription. Recherche, filtre par catégorie et ajoute tes préférés aux favoris.`} />
      <Catalog />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ItemList", name: "Outils Kanifo", numberOfItems: tools.length,
        itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absoluteUrl(`/tools/${t.slug}`) })),
      }} />
    </Container>
  );
}
