import { NextResponse } from "next/server";
import { contactSchema, subjectLabels } from "@/lib/contact-schema";

/**
 * Réception du formulaire de contact.
 * L'envoi passe par l'API Resend lorsque RESEND_API_KEY et CONTACT_TO_EMAIL sont définies (côté serveur uniquement).
 * Sans configuration, la route répond 503 « not_configured » et l'interface propose l'envoi par e-mail classique.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>(); // limitation de débit en mémoire (au mieux, par instance)

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 20_000) {
    return NextResponse.json({ ok: false, error: "Requête trop volumineuse." }, { status: 413 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Trop de messages envoyés. Réessaie dans quelques minutes." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  }
  const { name, email, subject, message, website } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // robot : réponse neutre, rien n'est envoyé

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ ok: false, code: "not_configured", error: "L'envoi de messages n'est pas configuré sur ce serveur." }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Kanifo <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `[Kanifo] ${subjectLabels[subject]} — ${name.replace(/[\r\n]+/g, " ")}`,
        html: `<p><strong>De :</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Sujet :</strong> ${escapeHtml(subjectLabels[subject])}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact] échec d'envoi", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué. Réessaie dans un instant." }, { status: 502 });
  }
}
