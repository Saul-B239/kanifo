export type CategoryId = "texte" | "images" | "pdf" | "maths" | "dev" | "productivite";

export interface Faq { q: string; a: string }

export interface ToolDef {
  slug: string;
  name: string;
  /** Description courte affichée sur les cartes et dans la recherche. */
  short: string;
  category: CategoryId;
  keywords: string[];
  icon: string;
  /** Score éditorial de popularité (0-100) utilisé pour le tri. */
  popularity: number;
  /** Date d'ajout ISO (AAAA-MM-JJ). */
  addedAt: string;
  /** Prévu pour une future offre Pro ; tous les outils sont gratuits au lancement. */
  tier: "free" | "pro";
  seo: {
    title: string;
    description: string;
    h1: string;
    intro: string;
    /** Étapes « Comment ça marche ». */
    steps: string[];
    /** Paragraphe d'approfondissement unique à l'outil. */
    details: string;
    faq: Faq[];
  };
  related: string[];
}

export type ToolInput = Omit<ToolDef, "category" | "tier" | "related"> & { related?: string[] };

export interface CategoryDef {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
}
