import { contrastRatio, hexToRgb, luminance } from "@/lib/codec";
import { byteLength, CAPACITY } from "./payload";
import { defaultDesign, type EcLevel, type QrDesign } from "./types";

export const PRESETS: { id: string; name: string; design: Partial<QrDesign> }[] = [
  { id: "minimal", name: "Minimaliste", design: { dotType: "square", dotColor: "#171717", bgColor: "#ffffff", eyeFrameType: "square", eyeDotType: "square" } },
  { id: "modern", name: "Moderne", design: { dotType: "rounded", dotColor: "#4f3fd1", bgColor: "#ffffff", eyeFrameType: "extra-rounded", eyeDotType: "dot" } },
  { id: "dark", name: "Dark", design: { dotType: "rounded", dotColor: "#f4f4f8", bgColor: "#111118", eyeFrameType: "extra-rounded", eyeDotType: "dot" } },
  { id: "color", name: "Coloré", design: { dotType: "classy-rounded", dotColor: "#c2257f", bgColor: "#fff7fb", eyeFrameType: "extra-rounded", eyeDotType: "dot", customEyeColor: true, eyeColor: "#4f3fd1" } },
  { id: "pro", name: "Professionnel", design: { dotType: "square", dotColor: "#1e3a5f", bgColor: "#ffffff", eyeFrameType: "square", eyeDotType: "square" } },
  { id: "elegant", name: "Élégant", design: { dotType: "classy", dotColor: "#2b2118", bgColor: "#faf6ef", eyeFrameType: "extra-rounded", eyeDotType: "square", customEyeColor: true, eyeColor: "#7a5c2e" } },
  { id: "nature", name: "Nature", design: { dotType: "extra-rounded", dotColor: "#1f6b45", bgColor: "#f3faf5", eyeFrameType: "extra-rounded", eyeDotType: "dot", customEyeColor: true, eyeColor: "#14532d" } },
  { id: "gradient", name: "Dégradé", design: { dotType: "dots", dotColor: "#5b47e0", gradient: true, gradientColor: "#c2257f", gradientType: "linear", gradientRotation: 45, bgColor: "#ffffff", eyeFrameType: "extra-rounded", eyeDotType: "dot" } },
];

/** Applique un style prédéfini en conservant le logo, la marge et le niveau de correction choisis. */
export const applyPreset = (current: QrDesign, preset: Partial<QrDesign>): QrDesign =>
  ({ ...defaultDesign, ...preset, logo: current.logo, logoSize: current.logoSize, margin: current.margin, ec: current.ec });

const EC_ORDER: EcLevel[] = ["L", "M", "Q", "H"];
/** Avec un logo, une partie des modules est masquée : la correction d'erreur doit être au moins « Q ». */
export const effectiveEc = (d: QrDesign): EcLevel => (d.logo && EC_ORDER.indexOf(d.ec) < 2 ? "Q" : d.ec);
/** Taille maximale du logo selon la correction d'erreur disponible. */
export const maxLogoSize = (ec: EcLevel) => (ec === "H" ? 0.3 : 0.22);

export interface Check { level: "error" | "warning" | "info"; message: string }

/** Contrôles de lisibilité. Une entrée « error » bloque l'export : le code ne serait pas scannable de façon fiable. */
export function checkDesign(d: QrDesign, payload: string, transparent: boolean): { checks: Check[]; ratio: number; blocked: boolean } {
  const checks: Check[] = [];
  const bg = hexToRgb(transparent ? "#ffffff" : d.bgColor) ?? { r: 255, g: 255, b: 255 };
  const fgs = [d.dotColor, d.gradient ? d.gradientColor : null, d.customEyeColor ? d.eyeColor : null].filter((c): c is string => !!c).map((c) => hexToRgb(c) ?? { r: 0, g: 0, b: 0 });
  const ratio = Math.min(...fgs.map((c) => contrastRatio(c, bg)));
  if (ratio < 2.5) checks.push({ level: "error", message: `Contraste insuffisant (${ratio.toFixed(1)}:1) : les modules se confondent avec le fond et le code ne serait pas lisible. Choisis des couleurs plus contrastées.` });
  else if (ratio < 4) checks.push({ level: "warning", message: `Contraste faible (${ratio.toFixed(1)}:1). Certains lecteurs auront du mal à scanner ce code, surtout en faible lumière. Vise au moins 4:1.` });
  const inverted = fgs.some((c) => luminance(c) > luminance(bg));
  if (inverted && ratio >= 2.5) checks.push({ level: "info", message: "Couleurs inversées (modules clairs sur fond sombre) : lisible par la plupart des smartphones récents, mais pas par certains lecteurs plus anciens. Teste avant d'imprimer." });
  if (transparent) checks.push({ level: "info", message: "Fond transparent : la lisibilité dépendra de la surface sur laquelle tu poseras le code. Le contrôle de contraste suppose un fond blanc." });
  if (d.margin < 2) checks.push({ level: "warning", message: "Marge très étroite : sans zone vide autour du code, la détection peut échouer. Deux modules minimum sont recommandés, quatre dans l'idéal." });
  const ec = effectiveEc(d);
  if (d.logo && ec !== d.ec) checks.push({ level: "info", message: "Un logo masque une partie du code : la correction d'erreur a été relevée automatiquement au niveau Q." });
  const bytes = byteLength(payload);
  if (bytes > CAPACITY[ec]) checks.push({ level: "error", message: `Contenu trop long : ${bytes} octets pour ${CAPACITY[ec]} au maximum avec la correction ${ec}. Raccourcis le contenu ou baisse le niveau de correction.` });
  else if (bytes > 400) checks.push({ level: "warning", message: "Contenu long : le code sera dense. Imprime-le en grand format (au moins 4 cm de côté) et teste-le." });
  return { checks, ratio, blocked: checks.some((c) => c.level === "error") };
}
