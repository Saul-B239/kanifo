import type { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";

const ASSETS = "/pdfjs";
const MAX_CANVAS_PIXELS = 16_000_000;

/** Charge un PDF avec pdf-lib et traduit les erreurs courantes en messages compréhensibles. */
export async function loadPdf(bytes: Uint8Array | ArrayBuffer, name = "ce fichier"): Promise<PDFDocument> {
  const { PDFDocument } = await import("pdf-lib");
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    // pdf-lib est tolérant : un fichier tronqué peut se charger sans aucune page exploitable.
    if (doc.getPageCount() < 1) throw new Error("vide");
    doc.getPage(0).getSize();
    return doc;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/encrypt/i.test(msg)) throw new Error(`« ${name} » est protégé par mot de passe. Déverrouille-le dans un lecteur PDF, puis réessaie.`);
    throw new Error(`Impossible de lire « ${name} » : le PDF semble corrompu ou dans un format non pris en charge.`);
  }
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function pdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = `${ASSETS}/pdf.worker.min.mjs`;
    return lib;
  });
  return pdfjsPromise;
}

/** Ouvre un PDF pour le rendu (PDF.js). Les octets sont copiés car PDF.js transfère le tampon à son worker. */
export async function openForRender(bytes: Uint8Array, name = "ce fichier"): Promise<PDFDocumentProxy> {
  const lib = await pdfjs();
  try {
    return await lib.getDocument({
      data: bytes.slice(), cMapUrl: `${ASSETS}/cmaps/`, cMapPacked: true,
      standardFontDataUrl: `${ASSETS}/standard_fonts/`, wasmUrl: `${ASSETS}/wasm/`,
    }).promise;
  } catch (e) {
    const n = e instanceof Error ? e.name : "";
    if (n === "PasswordException") throw new Error(`« ${name} » est protégé par mot de passe. Déverrouille-le dans un lecteur PDF, puis réessaie.`);
    throw new Error(`Impossible d'afficher « ${name} » : le PDF semble corrompu.`);
  }
}

/** Rend une page dans un canvas. `scale` = 1 correspond à 72 ppp (1 point = 1 pixel). */
export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, scale: number, background = "#ffffff"): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  let viewport = page.getViewport({ scale });
  const pixels = viewport.width * viewport.height;
  if (pixels > MAX_CANVAS_PIXELS) viewport = page.getViewport({ scale: scale * Math.sqrt(MAX_CANVAS_PIXELS / pixels) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Mémoire insuffisante pour afficher cette page.");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvas;
}

export const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("L'encodage de la page a échoué."))), type, quality));

/**
 * Analyse une sélection de pages du type « 1-3, 5, 8-10 ».
 * Renvoie un groupe d'indices (base 0) par élément séparé par une virgule.
 */
export function parseRanges(input: string, pageCount: number): { groups: number[][]; error: string } {
  const groups: number[][] = [];
  const parts = input.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return { groups, error: "" };
  for (const part of parts) {
    const m = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(part);
    if (!m) return { groups: [], error: `Sélection non reconnue : « ${part} ». Exemple valide : 1-3, 5, 8-10.` };
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < 1 || a > pageCount || b > pageCount) return { groups: [], error: `La page ${a > pageCount || a < 1 ? a : b} n'existe pas : le document compte ${pageCount} page${pageCount > 1 ? "s" : ""}.` };
    if (a > b) return { groups: [], error: `Plage inversée : « ${part} ». Écris la plus petite page en premier.` };
    groups.push(Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
  }
  return { groups, error: "" };
}

/** Écrit une liste d'indices (base 0) sous forme compacte : [0,1,2,4] → « 1-3, 5 ». */
export function formatRanges(indices: number[]): string {
  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    out.push(i === j ? `${sorted[i] + 1}` : `${sorted[i] + 1}-${sorted[j] + 1}`);
    i = j;
  }
  return out.join(", ");
}

/** Lit l'orientation EXIF d'un JPEG (1 = normale). pdf-lib n'en tient pas compte : il faut alors réencoder. */
export function jpegOrientation(bytes: Uint8Array): number {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return 1;
  let o = 2;
  while (o + 4 < v.byteLength) {
    const marker = v.getUint16(o), size = v.getUint16(o + 2);
    if (marker === 0xffe1 && o + 10 < v.byteLength && v.getUint32(o + 4) === 0x45786966) {
      const tiff = o + 10;
      if (tiff + 8 > v.byteLength) return 1;
      const le = v.getUint16(tiff) === 0x4949;
      const ifd = tiff + v.getUint32(tiff + 4, le);
      if (ifd + 2 > v.byteLength) return 1;
      const count = v.getUint16(ifd, le);
      for (let i = 0; i < count; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > v.byteLength) return 1;
        if (v.getUint16(entry, le) === 0x0112) return v.getUint16(entry + 8, le);
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break;
    o += 2 + size;
  }
  return 1;
}
