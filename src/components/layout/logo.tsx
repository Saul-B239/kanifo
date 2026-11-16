import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8576F5" />
          <stop offset="1" stopColor="#5340DB" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#tl-g)" />
      <rect x="8" y="9" width="16" height="4.4" rx="2.2" fill="#fff" />
      <rect x="13.8" y="9" width="4.4" height="14.5" rx="2.2" fill="#fff" />
      <circle cx="23" cy="21.3" r="2.2" fill="#fff" fillOpacity="0.55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Toolify — Accueil">
      <LogoMark className="size-7 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className="text-[17px] font-semibold tracking-tight">Toolify</span>
    </Link>
  );
}
