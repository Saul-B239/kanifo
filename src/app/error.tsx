"use client";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger"><TriangleAlert className="size-7" /></span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
      <p className="mt-3 text-muted">Quelque chose ne s&apos;est pas passé comme prévu. Tes fichiers n&apos;ont pas été affectés : réessaie, ou recharge la page.</p>
      <Button variant="primary" className="mt-8" onClick={reset}>Réessayer</Button>
    </div>
  );
}
