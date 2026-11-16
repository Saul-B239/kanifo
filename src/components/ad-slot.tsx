import { site } from "@/lib/site";

/**
 * Emplacement publicitaire réservé. Ne rend rien tant que NEXT_PUBLIC_ADS_ENABLED n'est pas « true »,
 * afin de ne jamais afficher d'espace vide ou de fausse publicité. Brancher ici la régie choisie.
 */
export function AdSlot({ id }: { id: string }) {
  if (!site.adsEnabled) return null;
  return (
    <aside aria-label="Publicité" data-ad-slot={id} className="mx-auto my-8 flex min-h-24 w-full max-w-3xl items-center justify-center rounded-2xl border border-dashed border-border text-xs text-faint">
      Publicité
    </aside>
  );
}
