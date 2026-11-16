import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = "Kanifo — Tous tes outils. Une seule plateforme.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "linear-gradient(135deg, #fafafc 0%, #ece9ff 100%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 76, height: 76, borderRadius: 22, background: "linear-gradient(135deg, #8576F5, #5340DB)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 50, fontWeight: 800 }}>K</div>
          <div style={{ fontSize: 46, fontWeight: 700, color: "#171717", letterSpacing: -1 }}>{site.name}</div>
        </div>
        <div style={{ marginTop: 50, fontSize: 82, fontWeight: 700, color: "#171717", letterSpacing: -3, lineHeight: 1.05, display: "flex", flexDirection: "column" }}>
          <span>Tous tes outils.</span>
          <span style={{ color: "#6755E8" }}>Une seule plateforme.</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 30, color: "#6a6a78" }}>Texte · Images · PDF · Calculs · Développeurs · QR Studio</div>
      </div>
    ),
    size,
  );
}
