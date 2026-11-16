"use client";
import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { ToolGrid } from "@/components/tool-card";
import { Button } from "@/components/ui";
import { buttonClass } from "@/components/ui/button-class";
import { useFavorites, useHydrated, writeStore } from "@/lib/storage";
import { getTool, popularTools } from "@/lib/tools/registry";
import type { ToolDef } from "@/lib/tools/types";

export function FavoritesList() {
  const { favorites } = useFavorites();
  const hydrated = useHydrated();
  if (!hydrated) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-44" />)}</div>;
  }
  const list = favorites.map(getTool).filter((t): t is ToolDef => !!t);
  if (list.length === 0) {
    return (
      <>
        <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-dashed border-border-strong px-6 py-16 text-center">
          <div aria-hidden="true" className="bg-grid absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)]" />
          <span className="relative inline-flex size-16 animate-float items-center justify-center rounded-2xl border border-border bg-surface text-[#e5484d] shadow-card"><Heart className="size-7" fill="currentColor" fillOpacity={0.15} /></span>
          <h2 className="relative mt-6 text-xl font-semibold tracking-tight">Aucun favori pour l&apos;instant</h2>
          <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-muted">Clique sur le cœur d&apos;un outil pour l&apos;épingler ici et le retrouver instantanément à ta prochaine visite.</p>
          <Link href="/tools" className={buttonClass("primary", "md", "relative mt-6")}>Explorer les outils <ArrowRight /></Link>
        </div>
        <h2 className="mt-12 mb-4 text-lg font-semibold tracking-tight">Pour commencer, les plus populaires</h2>
        <ToolGrid tools={popularTools(4)} />
      </>
    );
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-muted">{list.length} outil{list.length > 1 ? "s" : ""} en favori</p>
        <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Retirer tous les outils de tes favoris ?")) writeStore("favorites", []); }}>Tout retirer</Button>
      </div>
      <ToolGrid tools={list} />
    </>
  );
}
