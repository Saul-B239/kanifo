import { formatBytes } from "@/lib/utils";

export type FileKind = "image" | "pdf";

export const LIMITS = {
  image: 25 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  pdfTotal: 150 * 1024 * 1024,
  maxPixels: 60_000_000,
} as const;

export const ACCEPT: Record<FileKind, string> = {
  image: "image/jpeg,image/png,image/webp",
  pdf: "application/pdf",
};

type ImageType = "image/jpeg" | "image/png" | "image/webp";

/** Identifie le type réel d'un fichier par sa signature binaire (l'extension et le type MIME déclaré ne sont pas fiables). */
export async function sniff(file: File): Promise<ImageType | "application/pdf" | null> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const at = (i: number, ...bytes: number[]) => bytes.every((b, k) => head[i + k] === b);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  const text = String.fromCharCode(...head);
  if (text.includes("%PDF-")) return "application/pdf";
  return null;
}

/** Valide un fichier ; renvoie un message d'erreur en français, ou null s'il est acceptable. */
export async function validateFile(file: File, kind: FileKind, allowed?: ImageType[]): Promise<string | null> {
  if (file.size === 0) return `« ${file.name} » est vide.`;
  const max = LIMITS[kind];
  if (file.size > max) return `« ${file.name} » dépasse la taille maximale de ${formatBytes(max)} (${formatBytes(file.size)}).`;
  const type = await sniff(file);
  if (kind === "pdf") return type === "application/pdf" ? null : `« ${file.name} » n'est pas un fichier PDF valide.`;
  if (!type || type === "application/pdf") return `« ${file.name} » n'est pas une image JPG, PNG ou WebP valide.`;
  if (allowed && !allowed.includes(type)) {
    const names = allowed.map((t) => t.replace("image/", "").replace("jpeg", "JPG").toUpperCase()).join(" ou ");
    return `Cet outil attend une image ${names} ; « ${file.name} » est au format ${type.replace("image/", "").toUpperCase()}.`;
  }
  return null;
}
