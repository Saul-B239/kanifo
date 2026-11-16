export type QrType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard" | "geo" | "event";
export type DotType = "square" | "rounded" | "dots" | "classy" | "classy-rounded" | "extra-rounded";
export type EyeFrameType = "square" | "extra-rounded" | "dot";
export type EyeDotType = "square" | "dot";
export type EcLevel = "L" | "M" | "Q" | "H";

export interface QrDesign {
  dotType: DotType;
  dotColor: string;
  gradient: boolean;
  gradientColor: string;
  gradientType: "linear" | "radial";
  gradientRotation: number; // degrés
  bgColor: string;
  eyeFrameType: EyeFrameType;
  eyeDotType: EyeDotType;
  customEyeColor: boolean;
  eyeColor: string;
  /** Marge extérieure (zone de silence), en nombre de modules. */
  margin: number;
  ec: EcLevel;
  /** Logo central en Data URL (PNG), ou null. */
  logo: string | null;
  logoSize: number; // fraction du QR code (0,12 à 0,30)
}

export type QrFields = Record<string, string>;

/**
 * QR code sauvegardé. `kind` prépare l'arrivée des QR codes dynamiques (redirection côté serveur) :
 * seuls les QR codes statiques sont générés aujourd'hui. Voir src/lib/qr/dynamic.ts.
 */
export interface SavedQr {
  id: string;
  name: string;
  createdAt: number;
  kind: "static" | "dynamic";
  type: QrType;
  fields: QrFields;
  design: QrDesign;
  thumb: string;
}

export const defaultDesign: QrDesign = {
  dotType: "square", dotColor: "#171717", gradient: false, gradientColor: "#6755e8", gradientType: "linear", gradientRotation: 45,
  bgColor: "#ffffff", eyeFrameType: "square", eyeDotType: "square", customEyeColor: false, eyeColor: "#171717",
  margin: 3, ec: "M", logo: null, logoSize: 0.22,
};
