import { cn } from "@/lib/utils";

/** Classes de bouton utilisables aussi bien côté serveur (liens) que côté client. */
export type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
export type Size = "sm" | "md" | "lg" | "icon";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-[0_1px_0_rgb(255_255_255/0.2)_inset,0_1px_2px_rgb(23_23_40/0.2)]",
  secondary: "bg-surface text-fg border border-border-strong hover:bg-subtle shadow-soft",
  soft: "bg-accent-soft text-accent-text hover:brightness-95 dark:hover:brightness-125",
  ghost: "text-muted hover:text-fg hover:bg-subtle",
  danger: "bg-danger-soft text-danger hover:brightness-95 dark:hover:brightness-125",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-[10px]",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-[10px] justify-center",
};
export const buttonClass = (variant: Variant = "secondary", size: Size = "md", className?: string) =>
  cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-[background,color,transform,filter,box-shadow] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    variants[variant], sizes[size], className,
  );

