"use client";
import { ThemeProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right" theme={resolvedTheme === "dark" ? "dark" : "light"} closeButton={false}
      toastOptions={{ style: { background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-lg)" } }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
