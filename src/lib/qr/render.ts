import type { Options } from "qr-code-styling";
import { effectiveEc, maxLogoSize } from "./design";
import { toQrData } from "./payload";
import type { QrDesign } from "./types";

export function buildOptions(payload: string, d: QrDesign, size: number, moduleCount: number, opts: { transparent?: boolean; type?: "svg" | "canvas" } = {}): Options {
  const ec = effectiveEc(d);
  const eye = d.customEyeColor ? d.eyeColor : d.dotColor;
  const margin = Math.round((d.margin * size) / (moduleCount + 2 * d.margin));
  const gradient = d.gradient ? { type: d.gradientType, rotation: (d.gradientRotation * Math.PI) / 180, colorStops: [{ offset: 0, color: d.dotColor }, { offset: 1, color: d.gradientColor }] } : undefined;
  return {
    type: opts.type ?? "svg", width: size, height: size, margin, data: toQrData(payload),
    image: d.logo ?? undefined,
    qrOptions: { errorCorrectionLevel: ec, mode: "Byte" },
    imageOptions: { hideBackgroundDots: true, imageSize: Math.min(d.logoSize, maxLogoSize(ec)), margin: Math.round(size / 100), crossOrigin: "anonymous" },
    dotsOptions: { type: d.dotType, color: d.dotColor, gradient, roundSize: true },
    // Sans dégradé personnalisé sur les yeux, ils héritent du dégradé des modules ; une couleur dédiée le remplace.
    cornersSquareOptions: { type: d.eyeFrameType, color: eye, gradient: d.gradient && !d.customEyeColor ? gradient : undefined },
    cornersDotOptions: { type: d.eyeDotType, color: eye, gradient: d.gradient && !d.customEyeColor ? gradient : undefined },
    backgroundOptions: { color: opts.transparent ? "transparent" : d.bgColor },
  };
}

type QrInstance = import("qr-code-styling").default;
let lib: Promise<typeof import("qr-code-styling").default> | null = null;
export const loadQr = () => (lib ??= import("qr-code-styling").then((m) => m.default));

export const moduleCountOf = (qr: QrInstance): number => qr._qr?.getModuleCount() ?? 33;

/** Nombre de modules pour ce contenu (dépend de la longueur et du niveau de correction). */
export async function measure(payload: string, d: QrDesign): Promise<number> {
  const Qr = await loadQr();
  return moduleCountOf(new Qr({ data: toQrData(payload), qrOptions: { errorCorrectionLevel: effectiveEc(d), mode: "Byte" } }));
}

export async function exportQr(payload: string, d: QrDesign, size: number, format: "png" | "svg" | "webp", transparent: boolean): Promise<Blob> {
  const Qr = await loadQr();
  const count = await measure(payload, d);
  const qr = new Qr(buildOptions(payload, d, size, count, { transparent, type: format === "svg" ? "svg" : "canvas" }));
  const data = await qr.getRawData(format);
  if (!(data instanceof Blob)) throw new Error("La génération de l'image a échoué.");
  if (format === "webp" && data.type !== "image/webp") throw new Error("Ton navigateur ne sait pas exporter en WebP. Choisis le format PNG.");
  return data;
}

/** Test de lecture : décode le rendu réel avec jsQR et compare au contenu attendu. */
export async function selfTest(payload: string, d: QrDesign): Promise<boolean> {
  const [{ default: jsQR }, blob] = await Promise.all([import("jsqr"), exportQr(payload, d, 720, "png", false)]);
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width; canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
  if (!res) return false;
  return new TextDecoder().decode(new Uint8Array(res.binaryData)) === payload || res.data === payload;
}
