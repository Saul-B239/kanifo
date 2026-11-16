import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

/** Normalise une chaîne pour la recherche : minuscules, sans accents. */
export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: v < 10 ? 2 : 1 })} ${units[i]}`;
}

/** Formate un nombre en évitant les artefacts de virgule flottante (0.1 + 0.2). */
export function formatNumber(n: number, maxDecimals = 10): string {
  if (!Number.isFinite(n)) return "—";
  const cleaned = Number.parseFloat(n.toPrecision(12));
  return cleaned.toLocaleString("fr-FR", { maximumFractionDigits: maxDecimals });
}

/** Parse un nombre saisi à la française (virgule, espaces) ; renvoie NaN si invalide. */
export function parseNumber(input: string): number {
  const s = input.replace(/[\s  ]/g, "").replace(",", ".");
  if (s === "" || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return Number.NaN;
  return Number(s);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const downloadText = (text: string, filename: string, type = "text/plain") =>
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);

/** Entier aléatoire non biaisé dans [0, max) via le générateur cryptographique. */
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % max;
}

export const pick = <T,>(arr: readonly T[]): T => arr[randomInt(arr.length)];

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const baseName = (filename: string) => filename.replace(/\.[^.]+$/, "") || "fichier";

export function errorMessage(e: unknown, fallback = "Une erreur inattendue est survenue."): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
