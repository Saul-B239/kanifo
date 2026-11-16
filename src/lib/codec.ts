export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export const toUrlSafe = (b64: string) => b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Décode du Base64 standard ou URL-safe, avec ou sans remplissage. Lève une erreur explicite si la chaîne est invalide. */
export function base64ToBytes(input: string): Uint8Array {
  let s = input.replace(/^data:[^,]*,/, "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!s) throw new Error("La chaîne est vide.");
  const badChar = /[^A-Za-z0-9+/=]/.exec(s);
  if (badChar) throw new Error(`Caractère invalide en Base64 : « ${badChar[0]} ».`);
  if (/=/.test(s.replace(/={1,2}$/, ""))) throw new Error("Le caractère de remplissage « = » ne peut figurer qu'à la fin.");
  s = s.replace(/=+$/, "");
  if (s.length % 4 === 1) throw new Error("Longueur invalide : la chaîne Base64 est tronquée ou corrompue.");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  let bin: string;
  try { bin = atob(s); } catch { throw new Error("Chaîne Base64 invalide."); }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToText(bytes: Uint8Array): string | null {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Présence de caractères de contrôle (hors tabulation / fins de ligne) : contenu binaire.
    return /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text) ? null : text;
  } catch { return null; }
}

export function sniffBytes(b: Uint8Array): { mime: string; ext: string; image: boolean } {
  const at = (i: number, ...x: number[]) => x.every((v, k) => b[i + k] === v);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return { mime: "image/png", ext: "png", image: true };
  if (at(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg", image: true };
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return { mime: "image/gif", ext: "gif", image: true };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { mime: "image/webp", ext: "webp", image: true };
  if (at(0, 0x25, 0x50, 0x44, 0x46)) return { mime: "application/pdf", ext: "pdf", image: false };
  if (at(0, 0x50, 0x4b, 0x03, 0x04)) return { mime: "application/zip", ext: "zip", image: false };
  return { mime: "application/octet-stream", ext: "bin", image: false };
}

/* ---------- UUID ---------- */
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const dashed = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
export function uuidV4(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}
/** UUID v7 (RFC 9562) : 48 bits d'horodatage Unix en millisecondes, puis aléa. */
export function uuidV7(now = Date.now()): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let t = now;
  for (let i = 5; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256); }
  b[6] = (b[6] & 0x0f) | 0x70; b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

/* ---------- Couleurs ---------- */
export interface RGB { r: number; g: number; b: number }
export function hexToRgb(input: string): RGB | null {
  let h = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
export const rgbToHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: s * 100, l: l * 100 };
}
export function hslToRgb(h: number, s: number, l: number): RGB {
  const S = s / 100, L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = L - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
export function luminance({ r, g, b }: RGB): number {
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
/** Rapport de contraste WCAG entre deux couleurs (1 à 21). */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
