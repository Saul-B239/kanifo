import { Clock, Lightbulb, Mail } from "lucide-react";
import type { Metadata } from "next";
import { Breadcrumbs, Container } from "@/components/content";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Une question, un bug à signaler ou une idée d'outil ? Contacte l'équipe Kanifo via le formulaire.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="max-w-5xl py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contacte-nous</h1>
          <p className="mt-4 leading-relaxed text-muted">Une question, un bug, une suggestion d&apos;outil ? Écris-nous : chaque message est lu.</p>
          <ul className="mt-8 space-y-5 text-sm">
            <li className="flex gap-3"><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text"><Lightbulb className="size-[18px]" /></span><span><strong className="block font-medium">Propose un outil</strong><span className="text-muted">Il te manque quelque chose ? Dis-nous quoi, les idées les plus demandées sont développées en priorité.</span></span></li>
            <li className="flex gap-3"><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text"><Clock className="size-[18px]" /></span><span><strong className="block font-medium">Signale un problème</strong><span className="text-muted">Indique l&apos;outil concerné, ton navigateur et ce que tu observes : cela nous aide à corriger rapidement.</span></span></li>
            {site.contactEmail && (
              <li className="flex gap-3"><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text"><Mail className="size-[18px]" /></span><span><strong className="block font-medium">Par e-mail</strong><a className="text-accent-text underline-offset-4 hover:underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></span></li>
            )}
          </ul>
        </div>
        <ContactForm contactEmail={site.contactEmail} />
      </div>
    </Container>
  );
}
