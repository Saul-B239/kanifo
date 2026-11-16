import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Container, FaqList } from "@/components/content";
import { JsonLd } from "@/components/json-ld";
import { QrStudioLoader } from "@/components/qr/qr-studio-loader";
import { absoluteUrl } from "@/lib/site";
import type { Faq } from "@/lib/tools/types";

const title = "QR Studio : générateur de QR code gratuit et personnalisable";
const description = "Crée des QR codes personnalisés : URL, Wi-Fi, vCard, e-mail, SMS, localisation, événement. Couleurs, formes, logo, export PNG, SVG et WebP. Gratuit, sans inscription ni expiration.";

export const metadata: Metadata = {
  title, description, alternates: { canonical: "/qr-studio" },
  keywords: ["générateur qr code", "qr code gratuit", "qr code wifi", "qr code vcard", "qr code avec logo", "qr code personnalisé", "créer qr code"],
  openGraph: { title, description, url: "/qr-studio", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const steps = [
  ["Choisis le type de contenu", "Lien vers un site, réseau Wi-Fi, carte de contact, e-mail, SMS, numéro de téléphone, position géographique, événement ou simple texte : chaque type dispose de son formulaire."],
  ["Personnalise l'apparence", "Pars d'un style prédéfini ou règle chaque détail : couleurs, dégradé, forme des modules et des yeux, marge, logo central. L'aperçu se met à jour à chaque modification."],
  ["Vérifie la lisibilité", "Le studio contrôle le contraste en continu et décode réellement le code généré. Si une personnalisation le rendait illisible, l'export est bloqué et la cause t'est indiquée."],
  ["Exporte en haute définition", "Télécharge en PNG ou WebP jusqu'à 4096 px, ou en SVG vectoriel pour l'impression, avec ou sans fond transparent. Tu peux aussi copier l'image ou sauvegarder ta création."],
];

const faq: Faq[] = [
  { q: "Le générateur de QR code est-il vraiment gratuit ?", a: "Oui. La création, la personnalisation et l'export en haute définition sont gratuits, sans inscription, sans filigrane et sans limite de nombre." },
  { q: "Les QR codes expirent-ils ?", a: "Non. Ce sont des QR codes statiques : le contenu est inscrit dans l'image elle-même. Ils fonctionnent indéfiniment, sans dépendre de Kanifo ni d'un abonnement." },
  { q: "Puis-je modifier la destination d'un QR code déjà imprimé ?", a: "Non, car un QR code statique ne peut pas être modifié après sa création. Les QR codes dynamiques, dont la destination reste modifiable, nécessitent un service de redirection qui n'est pas encore proposé par Kanifo." },
  { q: "Comment créer un QR code Wi-Fi ?", a: "Choisis le type « Wi-Fi », saisis le nom du réseau (SSID), le type de sécurité et le mot de passe. En scannant le code, tes invités se connectent sans rien taper. Le mot de passe reste dans ton navigateur : il n'est pas transmis." },
  { q: "Puis-je ajouter mon logo au centre du QR code ?", a: "Oui. Importe une image JPG, PNG ou WebP : le niveau de correction d'erreur est automatiquement relevé et la taille du logo plafonnée pour que le code reste scannable." },
  { q: "Quel format choisir : PNG, SVG ou WebP ?", a: "SVG pour l'impression (affiches, emballages, cartes de visite) car il reste net à toutes les tailles. PNG pour un usage universel à l'écran et dans les documents. WebP pour un site web, grâce à son poids réduit." },
  { q: "Pourquoi l'export est-il parfois bloqué ?", a: "Lorsque le contraste entre les modules et le fond est trop faible, ou que le contenu dépasse la capacité d'un QR code, le résultat ne serait pas lisible. Le studio refuse alors l'export et indique comment corriger." },
  { q: "Quelle taille minimale pour imprimer un QR code ?", a: "Compte au moins 2 × 2 cm pour un code simple scanné de près, et environ un dixième de la distance de lecture : 10 cm de côté pour un scan à 1 mètre. Conserve la marge blanche autour du code et teste toujours avant d'imprimer en série." },
];

export default function QrStudioPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "QR Studio" }]} />
      <header className="mb-8 max-w-3xl">
        <p className="mb-2 text-[13px] font-semibold text-accent-text">QR Studio</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Générateur de QR code personnalisé</h1>
        <p className="mt-3 leading-relaxed text-pretty text-muted">Crée un QR code à ton image en quelques secondes : neuf types de contenu, personnalisation complète, contrôle de lisibilité en direct et export haute définition. Tout est généré dans ton navigateur.</p>
      </header>

      <QrStudioLoader />

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="comment">
          <h2 id="comment" className="text-xl font-semibold tracking-tight sm:text-2xl">Comment créer un QR code ?</h2>
          <ol className="mt-5 space-y-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent-text">{i + 1}</span>
                <div><h3 className="font-medium">{t}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{d}</p></div>
              </li>
            ))}
          </ol>
          <h2 className="mt-10 text-xl font-semibold tracking-tight sm:text-2xl">Un QR code qui reste lisible</h2>
          <p className="mt-4 leading-relaxed text-muted">Un QR code trop stylisé peut devenir impossible à scanner. Le QR Studio calcule le rapport de contraste entre chaque couleur et le fond, vérifie la zone de silence, adapte la correction d&apos;erreur lorsqu&apos;un logo est présent, puis décode le résultat final avec un véritable lecteur. Ces contrôles ne remplacent pas un essai avec ton téléphone avant impression, mais ils évitent les erreurs les plus courantes.</p>
          <p className="mt-4 text-sm text-muted">Besoin d&apos;autre chose ? Découvre <Link href="/tools" className="font-medium text-accent-text underline-offset-4 hover:underline">tous les outils Kanifo</Link>, comme le <Link href="/tools/compresseur-image" className="font-medium text-accent-text underline-offset-4 hover:underline">compresseur d&apos;images</Link> ou le <Link href="/tools/generateur-mot-de-passe" className="font-medium text-accent-text underline-offset-4 hover:underline">générateur de mots de passe</Link>.</p>
        </section>
        <section aria-labelledby="faq-qr">
          <h2 id="faq-qr" className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">Questions fréquentes sur les QR codes</h2>
          <FaqList items={faq} />
        </section>
      </div>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication", name: "Kanifo QR Studio", url: absoluteUrl("/qr-studio"), description,
        applicationCategory: "DesignApplication", operatingSystem: "Tous (navigateur web)", inLanguage: "fr", isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        featureList: ["QR code URL", "QR code Wi-Fi", "QR code vCard", "Logo central", "Export PNG, SVG, WebP", "Contrôle de lisibilité"],
      }} />
    </Container>
  );
}
