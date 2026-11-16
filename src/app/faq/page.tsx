import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Container, FaqList } from "@/components/content";
import { JsonLd } from "@/components/json-ld";
import { generalFaq } from "@/content/fr/faq";

export const metadata: Metadata = {
  title: "FAQ : questions fréquentes",
  description: "Gratuité, confidentialité, limites de fichiers, QR codes : toutes les réponses aux questions fréquentes sur Kanifo.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "FAQ" }]} />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions fréquentes</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">Les réponses aux questions que l&apos;on nous pose le plus souvent. Chaque outil dispose aussi de sa propre FAQ sur sa page.</p>
      <div className="mt-10 space-y-10">
        {generalFaq.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`}>
            <h2 id={`faq-${g.title}`} className="mb-4 text-xl font-semibold tracking-tight">{g.title}</h2>
            <FaqList items={g.items} structured={false} />
          </section>
        ))}
      </div>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: generalFaq.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <p className="mt-10 rounded-2xl border border-border bg-surface p-5 text-sm text-muted shadow-soft">Tu n&apos;as pas trouvé ta réponse ? <Link href="/contact" className="font-medium text-accent-text underline-offset-4 hover:underline">Contacte-nous</Link>, nous lisons tous les messages.</p>
    </Container>
  );
}
