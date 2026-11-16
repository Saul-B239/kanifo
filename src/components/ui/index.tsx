"use client";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonClass, type Size, type Variant } from "./button-class";

/* ---------- Bouton ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; loading?: boolean }
export function Button({ variant, size, loading, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ---------- Copie / téléchargement ---------- */
export async function copyText(text: string, message = "Copié dans le presse-papiers"): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error("Impossible d'accéder au presse-papiers.");
    return false;
  }
}

export function CopyButton({ text, label = "Copier", size = "sm", variant = "secondary", className }: {
  text: string; label?: string; size?: Size; variant?: Variant; className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size={size} variant={variant} className={className} disabled={!text}
      aria-label={size === "icon" ? label : undefined} title={size === "icon" ? label : undefined}
      onClick={async () => {
        if (await copyText(text)) { setDone(true); setTimeout(() => setDone(false), 1500); }
      }}
    >
      {done ? <Check className="text-success" /> : <Copy />}
      {size !== "icon" && (done ? "Copié" : label)}
    </Button>
  );
}

export function DownloadButton({ onClick, label = "Télécharger", disabled, variant = "secondary", size = "sm", loading }: {
  onClick: () => void; label?: string; disabled?: boolean; variant?: Variant; size?: Size; loading?: boolean;
}) {
  return (
    <Button size={size} variant={variant} onClick={onClick} disabled={disabled} loading={loading}>
      {!loading && <Download />}{label}
    </Button>
  );
}

/* ---------- Structure ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-border bg-surface shadow-soft", className)}>{children}</div>;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-fg">{label}</label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border px-3.5 py-3", accent ? "bg-accent-soft border-transparent" : "bg-surface")}>
      <div className={cn("text-xl font-semibold tabular-nums tracking-tight break-words", accent && "text-accent-text")}>{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string; label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-xl bg-subtle p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value} type="button" role="radio" aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
            value === o.value ? "bg-surface text-fg shadow-soft ring-1 ring-border" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200", checked ? "bg-accent" : "bg-border-strong")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200", checked && "translate-x-4")} />
        <span className="sr-only">{label}</span>
      </button>
      <span onClick={() => onChange(!checked)}>{label}</span>
    </label>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[13px]">
        <label htmlFor={id} className="font-medium">{label}</label>
        <span className="tabular-nums text-muted">{value}{suffix}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Alert({ tone = "info", children, className }: { tone?: "info" | "success" | "warning" | "danger"; children: ReactNode; className?: string }) {
  const tones = {
    info: "bg-accent-soft text-accent-text",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  };
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed", tones[tone], className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "success"; className?: string }) {
  const tones = {
    neutral: "bg-subtle text-muted",
    accent: "bg-accent-soft text-accent-text",
    success: "bg-success-soft text-success",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>{children}</span>;
}

/** Zone de sortie en lecture seule avec actions. */
export function OutputArea({ value, label = "Résultat", rows = 8, actions, mono, placeholder = "Le résultat apparaîtra ici." }: {
  value: string; label?: string; rows?: number; actions?: ReactNode; mono?: boolean; placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium">{label}</label>
        <div className="flex flex-wrap gap-1.5">{actions}<CopyButton text={value} /></div>
      </div>
      <textarea id={id} readOnly value={value} rows={rows} placeholder={placeholder} className={cn("field bg-subtle/60", mono && "font-mono text-[13px]")} />
    </div>
  );
}

export function InputArea({ value, onChange, label = "Ton texte", rows = 8, placeholder, mono, actions, maxLength = 2_000_000 }: {
  value: string; onChange: (v: string) => void; label?: string; rows?: number; placeholder?: string; mono?: boolean; actions?: ReactNode; maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium">{label}</label>
        <div className="flex flex-wrap gap-1.5">
          {actions}
          <Button size="sm" variant="ghost" onClick={() => onChange("")} disabled={!value}>Effacer</Button>
        </div>
      </div>
      <textarea
        id={id} value={value} rows={rows} placeholder={placeholder} maxLength={maxLength} spellCheck={false}
        onChange={(e) => onChange(e.target.value)} className={cn("field", mono && "font-mono text-[13px]")}
      />
    </div>
  );
}
