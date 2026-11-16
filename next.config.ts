import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/pdfjs/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  async redirects() {
    return [
      { source: "/tools/convertisseur-base64", destination: "/tools/encodeur-base64", permanent: true },
      { source: "/tools/convertisseur-pdf", destination: "/tools/images-en-pdf", permanent: true },
      { source: "/nouveautes", destination: "/new", permanent: true },
      { source: "/favoris", destination: "/favorites", permanent: true },
    ];
  },
};

export default nextConfig;
