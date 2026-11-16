import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/content";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Kanifo traite tes données : traitement local des fichiers, stockage dans le navigateur, absence de compte et de traceurs publicitaires.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Politique de confidentialité" crumbs={[{ label: "Confidentialité" }]} intro="Kanifo est conçu pour fonctionner sans collecter tes données personnelles. Cette page explique précisément ce qui est traité, où, et pourquoi.">
      <h2>1. L&apos;essentiel</h2>
      <ul>
        <li>Les fichiers (images, PDF) et les textes que tu utilises dans les outils sont traités <strong>localement, dans ton navigateur</strong>. Ils ne sont pas envoyés à nos serveurs.</li>
        <li>Aucun compte n&apos;est nécessaire. Nous ne te demandons ni nom, ni adresse e-mail pour utiliser les outils.</li>
        <li>Tes préférences sont enregistrées sur ton appareil et ne nous sont pas transmises.</li>
      </ul>
      <h2>2. Données stockées sur ton appareil</h2>
      <p>Pour te proposer certaines fonctionnalités sans compte, Kanifo utilise le stockage local de ton navigateur (<code>localStorage</code>). Y sont enregistrés uniquement :</p>
      <ul>
        <li>la liste de tes outils favoris ;</li>
        <li>ton choix de thème (clair ou sombre) ;</li>
        <li>les derniers outils ouverts depuis la recherche ;</li>
        <li>les QR codes que tu choisis de sauvegarder dans le QR Studio ;</li>
        <li>le contenu de la to-do list et le brouillon de l&apos;éditeur Markdown.</li>
      </ul>
      <p>Ces informations restent sur ton appareil. Tu peux les supprimer à tout moment depuis les pages concernées ou en effaçant les données de site dans les réglages de ton navigateur.</p>
      <h2>3. Formulaire de contact</h2>
      <p>Si tu nous écris via le <Link href="/contact">formulaire de contact</Link>, nous traitons ton nom, ton adresse e-mail et ton message dans le seul but de te répondre. Ces données sont transmises à notre prestataire d&apos;envoi d&apos;e-mails et conservées le temps nécessaire au traitement de ta demande. Elles ne sont ni revendues ni utilisées à des fins publicitaires.</p>
      <h2>4. Données techniques</h2>
      <p>Comme tout site web, notre hébergeur traite des données techniques (adresse IP, type de navigateur, pages demandées) dans des journaux serveur, afin d&apos;assurer la sécurité et le bon fonctionnement du service.</p>
      <h2>5. Cookies et publicité</h2>
      <p>Kanifo ne dépose aucun cookie publicitaire ni traceur tiers à ce jour. Si des emplacements publicitaires ou un outil de mesure d&apos;audience étaient ajoutés, cette politique serait mise à jour au préalable et ton consentement serait demandé lorsque la réglementation l&apos;exige.</p>
      <h2>6. Tes droits</h2>
      <p>Conformément au Règlement général sur la protection des données (RGPD), tu disposes d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et d&apos;opposition concernant les données personnelles que nous détiendrions (en pratique, les messages envoyés via le formulaire de contact). Pour exercer ces droits, utilise la <Link href="/contact">page de contact</Link>. Tu peux également introduire une réclamation auprès de la CNIL.</p>
      <h2>7. Modifications</h2>
      <p>Cette politique peut évoluer avec le service. En cas de changement important, la nouvelle version sera publiée sur cette page.</p>
    </ProsePage>
  );
}
