"use client";
import { lazy, Suspense } from "react";
import { useHydrated } from "@/lib/storage";

const Studio = lazy(() => import("./qr-studio").then((m) => ({ default: m.QrStudio })));

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement du QR Studio" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid gap-4"><div className="skeleton h-56" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div>
      <div className="skeleton h-[34rem]" />
    </div>
  );
}

export function QrStudioLoader() {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton />;
  return <Suspense fallback={<Skeleton />}><Studio /></Suspense>;
}
