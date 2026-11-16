"use client";
import { FileUp, Loader2 } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ACCEPT, LIMITS, validateFile, type FileKind } from "@/lib/files";
import { cn, formatBytes } from "@/lib/utils";

/** Zone d'import par glisser-déposer, clic ou clavier, avec validation réelle du contenu des fichiers. */
export function FileDrop({ kind, multiple, onFiles, allowed, compact, hint }: {
  kind: FileKind; multiple?: boolean; onFiles: (files: File[]) => void;
  allowed?: ("image/jpeg" | "image/png" | "image/webp")[]; compact?: boolean; hint?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handle(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const files = multiple ? [...list] : [list[0]];
    const ok: File[] = [];
    for (const f of files) {
      const err = await validateFile(f, kind, allowed).catch(() => `Impossible de lire « ${f.name} ».`);
      if (err) toast.error(err); else ok.push(f);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (ok.length) onFiles(ok);
  }

  const formats = kind === "pdf" ? "PDF" : (allowed ?? ["image/jpeg", "image/png", "image/webp"]).map((t) => t.replace("image/", "").replace("jpeg", "JPG").toUpperCase()).join(", ");
  return (
    <label
      htmlFor={id}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files); }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all duration-200 focus-within:border-accent",
        compact ? "gap-1 px-4 py-5" : "gap-2 px-6 py-12 sm:py-16",
        over ? "scale-[1.01] border-accent bg-accent-soft" : "border-border-strong bg-subtle/40 hover:border-accent/60 hover:bg-accent-soft/50",
      )}
    >
      <input ref={input} id={id} type="file" className="sr-only" accept={allowed?.join(",") ?? ACCEPT[kind]} multiple={multiple} onChange={(e) => void handle(e.target.files)} />
      <span className={cn("inline-flex items-center justify-center rounded-2xl bg-surface text-accent-text shadow-soft ring-1 ring-border transition-transform duration-200 group-hover:-translate-y-0.5", compact ? "size-9" : "size-14")}>
        {busy ? <Loader2 className="size-5 animate-spin" /> : <FileUp className={compact ? "size-4" : "size-6"} aria-hidden="true" />}
      </span>
      <span className={cn("font-medium", compact ? "text-sm" : "mt-2 text-base")}>
        {over ? "Dépose ici" : multiple ? "Glisse tes fichiers ici, ou clique pour parcourir" : "Glisse un fichier ici, ou clique pour parcourir"}
      </span>
      <span className="text-xs text-muted">{hint ?? `${formats} · ${formatBytes(LIMITS[kind])} max${multiple ? " par fichier" : ""} · traité sur ton appareil`}</span>
    </label>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progression"}>
      {label && <p className="mb-1.5 text-[13px] text-muted">{label}</p>}
      <div className="h-1.5 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.round(value * 100)}%` }} /></div>
    </div>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>{children}</div>;
}

export function TwoCols({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 lg:grid-cols-2", className)}>{children}</div>;
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={cn("grid grid-cols-2 gap-2.5", cols === 4 && "sm:grid-cols-4", cols === 3 && "sm:grid-cols-3")}>{children}</div>;
}
