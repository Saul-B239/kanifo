import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="kn-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8576F5" />
          <stop offset="1" stopColor="#5340DB" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#kn-g)" />
      <path d="M11 9v14M21.5 9l-8 7 8 7" fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Kanifo — Accueil">
      <LogoMark className="size-7 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className="text-[17px] font-semibold tracking-tight">Kanifo</span>
    </Link>
  );
}
