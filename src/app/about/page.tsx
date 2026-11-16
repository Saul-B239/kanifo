import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/content";
import { categories } from "@/lib/tools/categories";
import { tools, toolsByCategory } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "À propos de Toolify",
  description: "Toolify est une plateforme d'outils en ligne gratuits, rapides et respectueux de la vie privée. Découvre le projet, ses principes et son fonctionnement.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ProsePage title="À propos de Toolify" crumbs={[{ label: "À propos" }]} intro="Tous les outils dont tu as besoin, au même endroit : c'est l'idée simple à l'origine de Toolify.">
      <h2>Notre mission</h2>
      <p>Compresser une photo, fusionner deux PDF, calculer une TVA, générer un QR code… Ces petites tâches reviennent sans cesse, et chacune oblige trop souvent à chercher un nouveau site, à fermer des fenêtres publicitaires ou à créer un compte. Toolify réunit ces outils dans une interface unique, claire et rapide.</p>
      <h2>Ce que tu trouveras ici</h2>
      <p>Toolify propose aujourd&apos;hui <strong>{tools.length} outils</strong> répartis en {categories.length} catégories, ainsi qu&apos;un studio complet de création de QR codes :</p>
      <ul>
        {categories.map((c) => (
          <li key={c.id}><Link href={`/tools?categorie=${c.id}`}>{c.name}</Link> ({toolsByCategory(c.id).length} outils) : {c.description.charAt(0).toLowerCase() + c.description.slice(1)}</li>
        ))}
        <li><Link href="/qr-studio">QR Studio</Link> : neuf types de QR codes, personnalisation avancée et export haute définition.</li>
      </ul>
      <h2>Nos principes</h2>
      <h3>Tes données restent chez toi</h3>
      <p>Les outils de Toolify fonctionnent dans ton navigateur. Lorsque tu compresses une image ou fusionnes des PDF, les fichiers sont traités par ton appareil : ils ne sont pas envoyés sur nos serveurs. C&apos;est plus rapide, et c&apos;est surtout plus sûr pour tes documents personnels.</p>
      <h3>Gratuit, vraiment</h3>
      <p>Toutes les fonctionnalités présentes sont gratuites, sans inscription et sans filigrane. Pour financer le projet, des emplacements publicitaires discrets ou une offre Pro avec des fonctions avancées pourront voir le jour ; les outils existants resteront en accès libre.</p>
      <h3>Honnête sur ce que font les outils</h3>
      <p>Chaque outil effectue réellement l&apos;opération annoncée, et ses limites sont indiquées clairement. Quand un compromis existe (par exemple pour la compression forte d&apos;un PDF), il est expliqué avant que tu ne lances le traitement.</p>
      <h2>Une question, une idée d&apos;outil ?</h2>
      <p>Toolify évolue grâce aux retours de ses utilisateurs. Si un outil te manque ou si tu rencontres un problème, <Link href="/contact">écris-nous</Link>. Tu peux aussi consulter la <Link href="/faq">foire aux questions</Link>.</p>
    </ProsePage>
  );
}
