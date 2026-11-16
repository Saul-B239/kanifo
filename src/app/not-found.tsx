import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/content";
import { buttonClass } from "@/components/ui/button-class";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text"><Compass className="size-7" /></span>
      <p className="mt-6 text-sm font-semibold text-accent-text">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Cette page est introuvable</h1>
      <p className="mt-3 max-w-md text-muted">L&apos;adresse est peut-être erronée, ou l&apos;outil a changé de nom. Le catalogue te permettra de le retrouver.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/tools" className={buttonClass("primary")}>Voir tous les outils <ArrowRight /></Link>
        <Link href="/" className={buttonClass("secondary")}>Retour à l&apos;accueil</Link>
      </div>
    </Container>
  );
}
