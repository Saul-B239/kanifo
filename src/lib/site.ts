/** Configuration centrale du site. Toute valeur dépendante du déploiement passe par les variables d'environnement. */
export const site = {
  name: "Kanifo",
  slogan: "Tous les outils dont tu as besoin. Au même endroit.",
  description:
    "Kanifo regroupe des dizaines d'outils gratuits en ligne : texte, images, PDF, calculs, développement, productivité et un studio complet de QR codes. Sans inscription, directement dans ton navigateur.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "fr",
  ogLocale: "fr_FR",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  /** Informations légales de l'éditeur, à renseigner avant la mise en production. */
  legal: {
    publisher: process.env.NEXT_PUBLIC_LEGAL_PUBLISHER ?? "",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "",
    host: process.env.NEXT_PUBLIC_LEGAL_HOST ?? "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  },
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
