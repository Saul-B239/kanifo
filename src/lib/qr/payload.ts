import type { EcLevel, QrFields, QrType } from "./types";

export interface FieldDef { key: string; label: string; type?: "text" | "textarea" | "tel" | "email" | "url" | "password" | "select" | "datetime-local" | "date" | "checkbox" | "number"; placeholder?: string; options?: [string, string][]; max?: number; half?: boolean }

export const QR_TYPES: { id: QrType; label: string; icon: string; fields: FieldDef[] }[] = [
  { id: "url", label: "URL", icon: "Link", fields: [{ key: "url", label: "Adresse du site web", type: "url", placeholder: "https://exemple.fr", max: 1500 }] },
  { id: "text", label: "Texte", icon: "Type", fields: [{ key: "text", label: "Texte libre", type: "textarea", placeholder: "Ton message…", max: 1500 }] },
  { id: "email", label: "E-mail", icon: "Mail", fields: [
    { key: "to", label: "Adresse e-mail", type: "email", placeholder: "contact@exemple.fr", max: 160 },
    { key: "subject", label: "Sujet", placeholder: "Demande d'information", max: 200 },
    { key: "body", label: "Message", type: "textarea", max: 800 } ] },
  { id: "phone", label: "Téléphone", icon: "Phone", fields: [{ key: "phone", label: "Numéro de téléphone", type: "tel", placeholder: "+33 6 12 34 56 78", max: 24 }] },
  { id: "sms", label: "SMS", icon: "MessageSquare", fields: [
    { key: "phone", label: "Numéro de téléphone", type: "tel", placeholder: "+33 6 12 34 56 78", max: 24 },
    { key: "message", label: "Message", type: "textarea", max: 600 } ] },
  { id: "wifi", label: "Wi-Fi", icon: "Wifi", fields: [
    { key: "ssid", label: "Nom du réseau (SSID)", placeholder: "MaBox-1234", max: 32 },
    { key: "security", label: "Sécurité", type: "select", options: [["WPA", "WPA / WPA2 / WPA3"], ["WEP", "WEP"], ["nopass", "Aucune (réseau ouvert)"]], half: true },
    { key: "password", label: "Mot de passe", type: "password", max: 63, half: true },
    { key: "hidden", label: "Réseau masqué", type: "checkbox" } ] },
  { id: "vcard", label: "Contact", icon: "Contact", fields: [
    { key: "firstName", label: "Prénom", max: 60, half: true }, { key: "lastName", label: "Nom", max: 60, half: true },
    { key: "phone", label: "Téléphone", type: "tel", max: 24, half: true }, { key: "email", label: "E-mail", type: "email", max: 160, half: true },
    { key: "org", label: "Entreprise", max: 100, half: true }, { key: "title", label: "Fonction", max: 100, half: true },
    { key: "website", label: "Site web", type: "url", max: 200 }, { key: "address", label: "Adresse", max: 200 } ] },
  { id: "geo", label: "Localisation", icon: "MapPin", fields: [
    { key: "lat", label: "Latitude", placeholder: "48.8584", max: 20, half: true }, { key: "lng", label: "Longitude", placeholder: "2.2945", max: 20, half: true } ] },
  { id: "event", label: "Événement", icon: "CalendarPlus", fields: [
    { key: "title", label: "Titre de l'événement", max: 120 },
    { key: "allDay", label: "Toute la journée", type: "checkbox" },
    { key: "start", label: "Début", type: "datetime-local", half: true }, { key: "end", label: "Fin", type: "datetime-local", half: true },
    { key: "location", label: "Lieu", max: 160 }, { key: "description", label: "Description", type: "textarea", max: 500 } ] },
];

export const defaultFields: Record<QrType, QrFields> = {
  url: { url: "" }, text: { text: "" }, email: { to: "", subject: "", body: "" }, phone: { phone: "" }, sms: { phone: "", message: "" },
  wifi: { ssid: "", security: "WPA", password: "", hidden: "" }, vcard: { firstName: "", lastName: "", phone: "", email: "", org: "", title: "", website: "", address: "" },
  geo: { lat: "", lng: "" }, event: { title: "", allDay: "", start: "", end: "", location: "", description: "" },
};

/** Capacité maximale en octets (mode binaire, version 40) par niveau de correction. */
export const CAPACITY: Record<EcLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cleanPhone = (p: string) => p.replace(/[\s.\-()]/g, "");
const validPhone = (p: string) => /^\+?\d{3,15}$/.test(cleanPhone(p));
const escWifi = (s: string) => s.replace(/([\;,:"])/g, "\\$1");
const escV = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
const dt = (v: string, dateOnly: boolean) => { const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v); if (!m) return null; return dateOnly ? `${m[1]}${m[2]}${m[3]}` : `${m[1]}${m[2]}${m[3]}T${m[4] ?? "00"}${m[5] ?? "00"}00`; };

export function normalizeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.href;
  } catch { return null; }
}

/** Construit le contenu encodé. Renvoie `empty` tant que rien n'est saisi, ou `error` si la saisie est invalide. */
export function buildPayload(type: QrType, f: QrFields): { payload: string; error: string; empty: boolean } {
  const ok = (payload: string) => ({ payload, error: "", empty: false });
  const err = (error: string) => ({ payload: "", error, empty: false });
  const empty = { payload: "", error: "", empty: true };
  const v = (k: string) => (f[k] ?? "").trim();
  switch (type) {
    case "url": { if (!v("url")) return empty; const u = normalizeUrl(v("url")); return u ? ok(u) : err("Cette adresse web n'est pas valide. Exemple : https://exemple.fr"); }
    case "text": return f.text?.trim() ? ok(f.text) : empty;
    case "email": {
      if (!v("to")) return empty;
      if (!EMAIL.test(v("to"))) return err("L'adresse e-mail n'est pas valide.");
      const q = [v("subject") && `subject=${encodeURIComponent(v("subject"))}`, v("body") && `body=${encodeURIComponent(f.body.trim())}`].filter(Boolean).join("&");
      return ok(`mailto:${v("to")}${q ? `?${q}` : ""}`);
    }
    case "phone": { if (!v("phone")) return empty; return validPhone(v("phone")) ? ok(`tel:${cleanPhone(v("phone"))}`) : err("Numéro invalide : utilise uniquement des chiffres, avec un + éventuel pour l'indicatif."); }
    case "sms": { if (!v("phone")) return empty; return validPhone(v("phone")) ? ok(`SMSTO:${cleanPhone(v("phone"))}:${f.message?.trim() ?? ""}`) : err("Numéro invalide : utilise uniquement des chiffres, avec un + éventuel pour l'indicatif."); }
    case "wifi": {
      if (!v("ssid")) return empty;
      const sec = f.security || "WPA";
      if (sec !== "nopass" && !f.password) return err("Saisis le mot de passe du réseau, ou choisis « Aucune » s'il est ouvert.");
      if (sec === "WPA" && f.password.length < 8) return err("Un mot de passe WPA contient au moins 8 caractères.");
      return ok(`WIFI:T:${sec};S:${escWifi(v("ssid"))};${sec !== "nopass" ? `P:${escWifi(f.password)};` : ""}${f.hidden ? "H:true;" : ""};`);
    }
    case "vcard": {
      if (!v("firstName") && !v("lastName") && !v("org")) return empty;
      if (v("email") && !EMAIL.test(v("email"))) return err("L'adresse e-mail du contact n'est pas valide.");
      if (v("phone") && !validPhone(v("phone"))) return err("Le numéro de téléphone du contact n'est pas valide.");
      const site = v("website") ? normalizeUrl(v("website")) : "";
      if (site === null) return err("L'adresse du site web n'est pas valide.");
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${escV(v("lastName"))};${escV(v("firstName"))};;;`, `FN:${escV([v("firstName"), v("lastName")].filter(Boolean).join(" ") || v("org"))}`,
        v("org") && `ORG:${escV(v("org"))}`, v("title") && `TITLE:${escV(v("title"))}`, v("phone") && `TEL;TYPE=CELL:${cleanPhone(v("phone"))}`,
        v("email") && `EMAIL:${v("email")}`, site && `URL:${site}`, v("address") && `ADR:;;${escV(v("address"))};;;;`, "END:VCARD"];
      return ok(lines.filter(Boolean).join("\n"));
    }
    case "geo": {
      if (!v("lat") && !v("lng")) return empty;
      const lat = Number(v("lat").replace(",", ".")), lng = Number(v("lng").replace(",", "."));
      if (!v("lat") || !v("lng") || Number.isNaN(lat) || Number.isNaN(lng)) return err("Saisis une latitude et une longitude en degrés décimaux (ex. 48.8584 et 2.2945).");
      if (lat < -90 || lat > 90) return err("La latitude doit être comprise entre −90 et 90.");
      if (lng < -180 || lng > 180) return err("La longitude doit être comprise entre −180 et 180.");
      return ok(`geo:${lat},${lng}`);
    }
    case "event": {
      if (!v("title") && !v("start")) return empty;
      if (!v("title")) return err("Donne un titre à l'événement.");
      const allDay = !!f.allDay, s = dt(v("start"), allDay), e = v("end") ? dt(v("end"), allDay) : null;
      if (!s) return err("Indique la date de début de l'événement.");
      if (e && e < s) return err("La date de fin doit être postérieure à la date de début.");
      const p = allDay ? ";VALUE=DATE" : "";
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${escV(v("title"))}`, `DTSTART${p}:${s}`, e && `DTEND${p}:${e}`,
        v("location") && `LOCATION:${escV(v("location"))}`, v("description") && `DESCRIPTION:${escV(f.description.trim())}`, "END:VEVENT", "END:VCALENDAR"];
      return ok(lines.filter(Boolean).join("\n"));
    }
  }
}

export const byteLength = (s: string) => new TextEncoder().encode(s).length;

/** qr-code-styling écrit un octet par caractère : on lui fournit donc les octets UTF-8 sous forme de chaîne binaire. */
export function toQrData(payload: string): string {
  const bytes = new TextEncoder().encode(payload);
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return out;
}
