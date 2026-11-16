"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useFavorites } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function FavoriteButton({ slug, name, className, withLabel }: { slug: string; name: string; className?: string; withLabel?: boolean }) {
  const { isFavorite, toggle } = useFavorites();
  const [pop, setPop] = useState(false);
  const active = isFavorite(slug);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(slug);
        setPop(true);
        setTimeout(() => setPop(false), 350);
        toast(added ? "Ajouté aux favoris" : "Retiré des favoris", { description: name, duration: 1800 });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium transition-colors duration-150",
        withLabel ? "h-10 border border-border-strong bg-surface px-3.5 shadow-soft hover:bg-subtle" : "size-8 hover:bg-subtle",
        active ? "text-[#e5484d]" : "text-faint hover:text-fg",
        className,
      )}
    >
      <Heart className={cn("size-4", pop && "heart-pop")} fill={active ? "currentColor" : "none"} aria-hidden="true" />
      {withLabel && <span className="text-fg">{active ? "Dans tes favoris" : "Ajouter aux favoris"}</span>}
    </button>
  );
}
