/** Calculs de dates en « heure murale » (UTC interne), insensibles aux changements d'heure. */
export const DAY = 86_400_000;

export function parseDate(date: string, time = "00:00"): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})/.exec(time || "00:00");
  if (!d || !t) return null;
  const [y, m, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const ts = Date.UTC(y, m - 1, day, Number(t[1]), Number(t[2]));
  const check = new Date(ts);
  if (y < 1 || check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== day) return null;
  return ts;
}

export const todayISO = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
export const toISO = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/** Ajoute des mois en ramenant au dernier jour du mois si nécessaire (31 janv. + 1 mois = 28/29 févr.). */
export function addMonths(ts: number, months: number): number {
  const d = new Date(ts);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes()));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return target.getTime();
}

export interface Breakdown { years: number; months: number; days: number; hours: number; minutes: number; totalMs: number }

/** Décompose l'écart start → end (start ≤ end) en années, mois, jours, heures, minutes calendaires. */
export function breakdown(start: number, end: number): Breakdown {
  const a = new Date(start), b = new Date(end);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (addMonths(start, months) > end) months--;
  const rest = end - addMonths(start, months);
  return {
    years: Math.floor(months / 12), months: months % 12,
    days: Math.floor(rest / DAY), hours: Math.floor((rest % DAY) / 3_600_000), minutes: Math.floor((rest % 3_600_000) / 60_000),
    totalMs: end - start,
  };
}

/** Compte les jours du lundi au vendredi dans [start, end[ (dates à minuit UTC). */
export function countWeekdays(start: number, end: number): number {
  const total = Math.round((end - start) / DAY);
  const weeks = Math.floor(total / 7);
  let count = weeks * 5;
  let dow = new Date(start + weeks * 7 * DAY).getUTCDay();
  for (let i = 0; i < total % 7; i++) { if (dow !== 0 && dow !== 6) count++; dow = (dow + 1) % 7; }
  return count;
}

export const formatLongDate = (ts: number) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(ts);
