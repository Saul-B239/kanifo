import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/content";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les conditions générales d'utilisation de Kanifo : accès au service, usages autorisés, propriété des contenus et limites de responsabilité.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage title="Conditions d'utilisation" crumbs={[{ label: "Conditions d'utilisation" }]} intro="En utilisant Kanifo, tu acceptes les présentes conditions. Elles sont volontairement courtes et rédigées simplement.">
      <h2>1. Objet du service</h2>
      <p>Kanifo met à disposition des outils en ligne (traitement de texte, d&apos;images et de PDF, calculs, utilitaires pour développeurs, productivité) ainsi qu&apos;un studio de création de QR codes. Le service est accessible gratuitement, sans inscription.</p>
      <h2>2. Utilisation autorisée</h2>
      <p>Tu peux utiliser Kanifo à titre personnel comme professionnel. Tu t&apos;engages à ne pas :</p>
      <ul>
        <li>utiliser le service à des fins illégales, frauduleuses ou portant atteinte aux droits de tiers ;</li>
        <li>créer des QR codes ou des contenus redirigeant vers des sites malveillants, trompeurs ou illicites ;</li>
        <li>tenter de perturber le fonctionnement du site, d&apos;en contourner les protections ou d&apos;en extraire le contenu de manière automatisée et massive.</li>
      </ul>
      <h2>3. Tes contenus</h2>
      <p>Tu restes seul propriétaire des fichiers et textes que tu traites avec Kanifo, ainsi que des résultats obtenus (images, PDF, QR codes…). Ces contenus étant traités dans ton navigateur, nous n&apos;y avons pas accès. Tu es responsable de disposer des droits nécessaires sur les contenus que tu utilises.</p>
      <h2>4. Disponibilité</h2>
      <p>Nous faisons de notre mieux pour que le service soit disponible et fiable, sans pouvoir garantir une disponibilité permanente. Des outils peuvent être ajoutés, modifiés ou retirés.</p>
      <h2>5. Limitation de responsabilité</h2>
      <p>Les outils sont fournis « en l&apos;état ». Malgré le soin apporté à leur conception, nous ne pouvons garantir l&apos;absence totale d&apos;erreur. Les résultats (calculs, conversions, fichiers produits) doivent être vérifiés avant tout usage important, notamment juridique, fiscal, médical ou financier. Pense à conserver une copie de tes fichiers d&apos;origine et à tester tes QR codes avant impression. Dans les limites permises par la loi, Kanifo ne saurait être tenu responsable des dommages résultant de l&apos;utilisation du service.</p>
      <h2>6. Propriété intellectuelle</h2>
      <p>Le nom Kanifo, l&apos;interface, les textes et le code du site sont protégés. Les contenus que tu crées avec les outils t&apos;appartiennent et peuvent être utilisés librement, y compris commercialement.</p>
      <h2>7. Évolution des conditions</h2>
      <p>Ces conditions peuvent être mises à jour. La version en vigueur est celle publiée sur cette page. Le droit applicable est le droit français.</p>
      <h2>8. Contact</h2>
      <p>Pour toute question relative à ces conditions, utilise la <Link href="/contact">page de contact</Link>. Voir aussi notre <Link href="/privacy">politique de confidentialité</Link> et les <Link href="/legal">mentions légales</Link>.</p>
    </ProsePage>
  );
}
