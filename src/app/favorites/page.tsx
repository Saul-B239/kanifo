import type { Metadata } from "next";
import { Breadcrumbs, Container, SectionHeading } from "@/components/content";
import { FavoritesList } from "@/components/favorites-list";

export const metadata: Metadata = {
  title: "Mes outils favoris",
  description: "Retrouve en un clic les outils Toolify que tu as ajoutés à tes favoris. Enregistrés localement, sans compte.",
  alternates: { canonical: "/favorites" },
  robots: { index: false, follow: true },
};

export default function FavoritesPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Favoris" }]} />
      <SectionHeading as="h1" title="Mes favoris" description="Tes outils préférés, enregistrés sur cet appareil. Aucun compte nécessaire." />
      <FavoritesList />
    </Container>
  );
}
