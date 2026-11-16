"use client";
import { lazy, Suspense, type ComponentType } from "react";
import { useHydrated } from "@/lib/storage";

function ToolSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de l'outil" className="grid gap-4">
      <div className="skeleton h-9 w-2/3 max-w-md" />
      <div className="skeleton h-56" />
      <div className="skeleton h-9 w-40" />
    </div>
  );
}

/** Charge un composant à la demande : chaque famille d'outils forme son propre lot JavaScript. */
const dynamic = (loader: () => Promise<ComponentType>) => lazy(() => loader().then((C) => ({ default: C })));
const text = <K extends keyof typeof import("./text-tools")>(k: K) => dynamic(() => import("./text-tools").then((m) => m[k] as ComponentType));
const image = () => import("./image-tools");
const pdf = <K extends keyof typeof import("./pdf-tools")>(k: K) => dynamic(() => import("./pdf-tools").then((m) => m[k] as ComponentType));
const math = <K extends keyof typeof import("./math-tools")>(k: K) => dynamic(() => import("./math-tools").then((m) => m[k] as ComponentType));
const dev = () => import("./dev-tools");
const prod = <K extends keyof typeof import("./productivity-tools")>(k: K) => dynamic(() => import("./productivity-tools").then((m) => m[k] as ComponentType));

/** Association slug → composant. Chaque famille d'outils est chargée à la demande. */
const registry: Record<string, ComponentType> = {
  // Texte
  "compteur-de-mots": text("WordCounter"),
  "compteur-de-caracteres": text("CharCounter"),
  "convertisseur-majuscules-minuscules": text("CaseConverter"),
  "supprimer-espaces-inutiles": text("WhitespaceCleaner"),
  "supprimer-lignes-vides": text("EmptyLineRemover"),
  "inverser-texte": text("TextReverser"),
  "generateur-lorem-ipsum": text("LoremIpsum"),
  "generateur-mots-aleatoires": text("RandomWords"),
  "comparateur-de-textes": text("TextDiff"),
  "generateur-slug": text("SlugGenerator"),
  // Images
  "compresseur-image": dynamic(() => image().then((m) => m.ImageCompressor)),
  "convertisseur-png-jpg": dynamic(() => image().then((m) => { const C = m.ImageConverter; return function PngToJpg() { return <C from="image/png" to="image/jpeg" />; }; })),
  "convertisseur-jpg-png": dynamic(() => image().then((m) => { const C = m.ImageConverter; return function JpgToPng() { return <C from="image/jpeg" to="image/png" />; }; })),
  "convertisseur-webp": dynamic(() => image().then((m) => m.ImageConverter as ComponentType)),
  "redimensionner-image": dynamic(() => image().then((m) => m.ImageResizer)),
  "recadrer-image": dynamic(() => image().then((m) => m.ImageCropper)),
  "rotation-image": dynamic(() => image().then((m) => m.ImageRotator)),
  "image-noir-et-blanc": dynamic(() => image().then((m) => m.ImageGrayscale)),
  // PDF
  "fusionner-pdf": pdf("PdfMerge"),
  "diviser-pdf": pdf("PdfSplit"),
  "compresser-pdf": pdf("PdfCompress"),
  "extraire-pages-pdf": pdf("PdfExtract"),
  "reorganiser-pages-pdf": pdf("PdfReorder"),
  "images-en-pdf": pdf("ImagesToPdf"),
  "pdf-en-images": pdf("PdfToImages"),
  // Mathématiques
  "calculatrice": math("CalculatorTool"),
  "calculateur-pourcentage": math("PercentageTool"),
  "calculateur-tva": math("VatTool"),
  "calculateur-moyenne": math("AverageTool"),
  "calculateur-proportion": math("ProportionTool"),
  "convertisseur-unites": math("UnitConverter"),
  "calculateur-duree": math("DurationTool"),
  "difference-entre-dates": math("DateDiffTool"),
  // Développeurs
  "formateur-json": dynamic(() => dev().then((m) => { const C = m.JsonTool; return function Format() { return <C mode="format" />; }; })),
  "validateur-json": dynamic(() => dev().then((m) => { const C = m.JsonTool; return function Validate() { return <C mode="validate" />; }; })),
  "minificateur-json": dynamic(() => dev().then((m) => { const C = m.JsonTool; return function Minify() { return <C mode="minify" />; }; })),
  "encodeur-base64": dynamic(() => dev().then((m) => m.Base64Encoder)),
  "decodeur-base64": dynamic(() => dev().then((m) => m.Base64Decoder)),
  "encodeur-url": dynamic(() => dev().then((m) => m.UrlEncoder)),
  "decodeur-url": dynamic(() => dev().then((m) => m.UrlDecoder)),
  "generateur-uuid": dynamic(() => dev().then((m) => m.UuidGenerator)),
  "generateur-mot-de-passe": dynamic(() => dev().then((m) => m.PasswordGenerator)),
  "generateur-couleurs": dynamic(() => dev().then((m) => m.ColorTool)),
  "convertisseur-timestamp": dynamic(() => dev().then((m) => m.TimestampTool)),
  "editeur-markdown": dynamic(() => dev().then((m) => m.MarkdownEditor)),
  // Productivité
  "chronometre": prod("Stopwatch"),
  "minuteur": prod("TimerTool"),
  "generateur-de-listes": prod("ListGenerator"),
  "to-do-list": prod("TodoList"),
  "generateur-noms-aleatoires": prod("RandomNames"),
  "selecteur-aleatoire": prod("RandomPicker"),
  "generateur-phrase-de-passe": prod("PassphraseGenerator"),
  "compteur-de-jours": prod("DayCounter"),
};

export const implementedSlugs = Object.keys(registry);

export function ToolRenderer({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const Tool = registry[slug];
  if (!Tool) return <p className="text-sm text-muted">Cet outil n&apos;est pas disponible pour le moment.</p>;
  if (!hydrated) return <ToolSkeleton />;
  return <Suspense fallback={<ToolSkeleton />}><Tool /></Suspense>;
}
