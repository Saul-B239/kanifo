import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Kanifo : éditeur, hébergeur et contact.",
  alternates: { canonical: "/legal" },
};

const missing = <em>à renseigner par l&apos;éditeur avant la mise en ligne</em>;

export default function LegalPage() {
  return (
    <ProsePage title="Mentions légales" crumbs={[{ label: "Mentions légales" }]}>
      <h2>Éditeur du site</h2>
      <p>{site.legal.publisher || missing}</p>
      <p>Adresse : {site.legal.address || missing}</p>
      <p>Contact : {site.contactEmail ? <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> : <Link href="/contact">formulaire de contact</Link>}</p>
      <h2>Hébergement</h2>
      <p>{site.legal.host}</p>
      <h2>Propriété intellectuelle</h2>
      <p>L&apos;ensemble des éléments du site (interface, textes, logo, code) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite. Les contenus créés par les utilisateurs à l&apos;aide des outils leur appartiennent.</p>
      <h2>Données personnelles</h2>
      <p>Le traitement des données est détaillé dans la <Link href="/privacy">politique de confidentialité</Link>.</p>
    </ProsePage>
  );
}
