import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { tools } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/tools"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/qr-studio"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/new"), changeFrequency: "weekly", priority: 0.6 },
    ...["/about", "/faq", "/contact"].map((p) => ({ url: absoluteUrl(p), changeFrequency: "monthly" as const, priority: 0.4 })),
    ...["/privacy", "/terms", "/legal"].map((p) => ({ url: absoluteUrl(p), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
  return [
    ...pages,
    ...tools.map((t) => ({ url: absoluteUrl(`/tools/${t.slug}`), lastModified: t.addedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
