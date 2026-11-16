import type { CategoryDef, CategoryId } from "./types";

export const categories: CategoryDef[] = [
  { id: "texte", name: "Texte", icon: "Type", description: "Compter, nettoyer, transformer et comparer du texte en un instant." },
  { id: "images", name: "Images", icon: "Image", description: "Compresser, convertir, redimensionner et retoucher tes images localement." },
  { id: "pdf", name: "PDF", icon: "FileText", description: "Fusionner, diviser, compresser et convertir tes documents PDF." },
  { id: "maths", name: "Mathématiques", icon: "Calculator", description: "Calculs du quotidien : pourcentages, TVA, moyennes, unités et dates." },
  { id: "dev", name: "Développeurs", icon: "Braces", description: "JSON, Base64, URL, UUID, timestamps et autres indispensables du dev." },
  { id: "productivite", name: "Productivité", icon: "Zap", description: "Chronomètre, minuteur, listes et générateurs pour gagner du temps." },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, CategoryDef>;

/** Teintes par catégorie (icônes et pastilles). */
export const categoryTone: Record<CategoryId, string> = {
  texte: "text-[#6755e8] bg-[#6755e8]/10 dark:text-[#a79cff]",
  images: "text-[#d6409f] bg-[#d6409f]/10 dark:text-[#f27fc3]",
  pdf: "text-[#e5484d] bg-[#e5484d]/10 dark:text-[#ff8589]",
  maths: "text-[#12996a] bg-[#12996a]/10 dark:text-[#4cd6a0]",
  dev: "text-[#0d8bd9] bg-[#0d8bd9]/10 dark:text-[#62bdf5]",
  productivite: "text-[#c77700] bg-[#c77700]/10 dark:text-[#f5b84f]",
};
