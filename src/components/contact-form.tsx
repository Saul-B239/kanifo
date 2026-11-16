"use client";
import { CircleCheck, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, Button, Card, Field } from "@/components/ui";
import { contactSchema, subjectLabels, type ContactInput } from "@/lib/contact-schema";

const empty: ContactInput = { name: "", email: "", subject: "question", message: "", website: "" };

export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [form, setForm] = useState<ContactInput>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInput, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback">("idle");
  const set = <K extends keyof ContactInput>(k: K, v: ContactInput[K]) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const mailto = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(`[Toolify] ${subjectLabels[form.subject]}`)}&body=${encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)}`
    : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const errs: typeof errors = {};
      for (const issue of parsed.error.issues) { const k = issue.path[0] as keyof ContactInput; errs[k] ??= issue.message; }
      setErrors(errs);
      toast.error("Vérifie les champs du formulaire.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; error?: string };
      if (res.ok && data.ok) { setStatus("sent"); setForm(empty); toast.success("Message envoyé. Merci !"); return; }
      if (data.code === "not_configured") { setStatus("fallback"); return; }
      toast.error(data.error ?? "L'envoi a échoué.");
      setStatus("idle");
    } catch {
      toast.error("Impossible de joindre le serveur. Vérifie ta connexion.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <Card className="flex flex-col items-center p-10 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success"><CircleCheck className="size-7" /></span>
        <h2 className="mt-5 text-xl font-semibold">Message bien envoyé</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">Merci pour ton message. Nous te répondrons à l&apos;adresse indiquée dès que possible.</p>
        <Button className="mt-6" onClick={() => setStatus("idle")}>Envoyer un autre message</Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-7">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom">{(id) => (<><input id={id} className="field" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} autoComplete="name" aria-invalid={!!errors.name} />{errors.name && <p className="text-xs text-danger">{errors.name}</p>}</>)}</Field>
          <Field label="Adresse e-mail">{(id) => (<><input id={id} type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={160} autoComplete="email" aria-invalid={!!errors.email} />{errors.email && <p className="text-xs text-danger">{errors.email}</p>}</>)}</Field>
        </div>
        <Field label="Sujet">{(id) => (
          <select id={id} className="field" value={form.subject} onChange={(e) => set("subject", e.target.value as ContactInput["subject"])}>
            {Object.entries(subjectLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}</Field>
        <Field label="Message" hint={`${form.message.length} / 4 000 caractères`}>{(id) => (<><textarea id={id} className="field" rows={7} value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={4000} aria-invalid={!!errors.message} />{errors.message && <p className="text-xs text-danger">{errors.message}</p>}</>)}</Field>
        <div className="hidden" aria-hidden="true">
          <label>Ne pas remplir ce champ<input tabIndex={-1} autoComplete="off" value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} /></label>
        </div>
        {status === "fallback" && (
          <Alert tone="warning">
            L&apos;envoi direct n&apos;est pas encore configuré sur ce site.{" "}
            {mailto ? <>Tu peux envoyer ton message depuis ta messagerie : <a className="font-semibold underline" href={mailto}>ouvrir mon application e-mail</a>.</> : <>Aucune adresse de contact n&apos;a été renseignée par l&apos;éditeur pour le moment.</>}
          </Alert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xs text-xs text-muted">Tes informations servent uniquement à répondre à ta demande.</p>
          <Button type="submit" variant="primary" loading={status === "sending"}>{status !== "sending" && <Send />}Envoyer le message</Button>
        </div>
      </form>
    </Card>
  );
}
