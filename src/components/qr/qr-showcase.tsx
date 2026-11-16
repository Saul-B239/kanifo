"use client";
import { useEffect, useRef } from "react";
import { PRESETS } from "@/lib/qr/design";
import { buildOptions, loadQr, measure } from "@/lib/qr/render";
import { defaultDesign } from "@/lib/qr/types";
import { absoluteUrl } from "@/lib/site";

const picks = ["gradient", "modern", "nature"];

/** Trois véritables QR codes (pointant vers le QR Studio) générés avec les styles du studio. */
export function QrShowcase() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const Qr = await loadQr();
      const payload = absoluteUrl("/qr-studio");
      for (let i = 0; i < picks.length; i++) {
        const design = { ...defaultDesign, ...PRESETS.find((p) => p.id === picks[i])!.design };
        const count = await measure(payload, design);
        const el = refs.current[i];
        if (cancelled || !el) return;
        el.replaceChildren();
        new Qr(buildOptions(payload, design, 400, count)).append(el);
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const pos = ["z-10 mx-auto w-[58%]", "absolute top-[8%] left-0 w-[34%] -rotate-6 opacity-90", "absolute right-0 bottom-[6%] w-[34%] rotate-6 opacity-90"];
  return (
    <div className="relative mx-auto w-full max-w-md py-6" aria-hidden="true">
      {picks.map((p, i) => (
        <div key={p} className={`${pos[i]} ${i === 0 ? "relative" : "hidden sm:block"}`}>
          <div ref={(el) => { refs.current[i] = el; }} style={{ "--r": i === 1 ? "-6deg" : i === 2 ? "6deg" : "0deg", animationDelay: `${i * 0.8}s` } as React.CSSProperties}
            className="aspect-square animate-float overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-pop [&>svg]:size-full">
            <div className="skeleton size-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
