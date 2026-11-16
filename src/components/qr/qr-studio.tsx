"use client";
import { CalendarPlus, CircleCheck, Contact, Copy, Download, ImagePlus, Info, Link, Loader2, Mail, MapPin, MessageSquare, Moon, Pencil, Phone, Save, Sun, Trash2, TriangleAlert, Type, Wifi, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, Button, Field, Segmented, Slider, Toggle } from "@/components/ui";
import { sniff } from "@/lib/files";
import { applyPreset, checkDesign, effectiveEc, maxLogoSize, PRESETS } from "@/lib/qr/design";
import { buildPayload, byteLength, defaultFields, QR_TYPES, type FieldDef } from "@/lib/qr/payload";
import { buildOptions, exportQr, loadQr, measure, selfTest } from "@/lib/qr/render";
import { defaultDesign, type DotType, type EcLevel, type EyeDotType, type EyeFrameType, type QrDesign, type QrFields, type QrType, type SavedQr } from "@/lib/qr/types";
import { useHydrated, useStored } from "@/lib/storage";
import { cn, downloadBlob, errorMessage, formatBytes } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { Link, Type, Mail, Phone, MessageSquare, Wifi, Contact, MapPin, CalendarPlus };
const DOTS: [DotType, string][] = [["square", "Carrés"], ["rounded", "Arrondis"], ["dots", "Points"], ["extra-rounded", "Très arrondis"], ["classy", "Stylisés"], ["classy-rounded", "Stylisés doux"]];
const EYE_FRAMES: [EyeFrameType, string][] = [["square", "Carré"], ["extra-rounded", "Arrondi"], ["dot", "Cercle"]];
const EYE_DOTS: [EyeDotType, string][] = [["square", "Carré"], ["dot", "Point"]];
const EC: [EcLevel, string][] = [["L", "L · 7 %"], ["M", "M · 15 %"], ["Q", "Q · 25 %"], ["H", "H · 30 %"]];
const SIZES = [512, 1024, 2048, 4096];
const NO_SAVED: SavedQr[] = [];
const PLACEHOLDER = "https://toolify.app";

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-soft sm:p-5">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <Field label={label}>{(id) => (
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} (sélecteur)`} value={value} onChange={(e) => onChange(e.target.value)} />
        <input id={id} className="field font-mono uppercase" value={text} maxLength={7} onChange={(e) => { setText(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase()); }} onBlur={() => setText(value)} />
      </div>
    )}</Field>
  );
}

function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className={cn("rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all active:scale-95", value === v ? "border-accent bg-accent-soft text-accent-text" : "border-border text-muted hover:border-border-strong hover:text-fg")}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function ContentField({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  if (def.type === "checkbox") return <div className="sm:col-span-2"><Toggle checked={!!value} onChange={(v) => onChange(v ? "1" : "")} label={def.label} /></div>;
  return (
    <Field label={def.label} className={def.half ? "" : "sm:col-span-2"}>{(id) =>
      def.type === "textarea" ? <textarea id={id} className="field !min-h-24" rows={3} value={value} maxLength={def.max} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />
      : def.type === "select" ? <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>{def.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      : <input id={id} className="field" type={def.type === "password" ? "text" : def.type ?? "text"} value={value} maxLength={def.max} placeholder={def.placeholder} autoComplete="off" spellCheck={false} onChange={(e) => onChange(e.target.value)} />
    }</Field>
  );
}

/** Réduit le logo à 320 px maximum et le convertit en PNG (Data URL) pour pouvoir le sauvegarder localement. */
async function prepareLogo(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Logo trop volumineux (5 Mo maximum).");
  const type = await sniff(file);
  if (!type || type === "application/pdf") throw new Error("Le logo doit être une image JPG, PNG ou WebP.");
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error("Impossible de lire cette image."); });
  const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export function QrStudio() {
  const hydrated = useHydrated();
  const [type, setType] = useState<QrType>("url");
  const [fields, setFields] = useState<Record<QrType, QrFields>>(defaultFields);
  const [design, setDesign] = useState<QrDesign>(defaultDesign);
  const [format, setFormat] = useState<"png" | "svg" | "webp">("png");
  const [size, setSize] = useState(1024);
  const [transparent, setTransparent] = useState(false);
  const [darkBg, setDarkBg] = useState(false);
  const [modules, setModules] = useState(25);
  const [scan, setScan] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [busy, setBusy] = useState<"" | "download" | "copy" | "save">("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useStored<SavedQr[]>("qr-saved", NO_SAVED);
  const holder = useRef<HTMLDivElement>(null);
  const instance = useRef<import("qr-code-styling").default | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setDesign((d) => ({ ...d, [k]: v }));
  const built = useMemo(() => buildPayload(type, fields[type]), [type, fields]);
  const payload = built.payload || PLACEHOLDER;
  const isPlaceholder = !built.payload;
  const ec = effectiveEc(design);
  const { checks, blocked } = useMemo(() => checkDesign(design, payload, transparent), [design, payload, transparent]);
  const canExport = !isPlaceholder && !blocked && !built.error;

  // Aperçu en direct
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (byteLength(payload) > 2953) return;
        const count = await measure(payload, design);
        if (cancelled || !holder.current) return;
        setModules(count);
        const options = buildOptions(payload, design, 600, count, { transparent });
        if (!instance.current) {
          const Qr = await loadQr();
          if (cancelled || !holder.current) return;
          instance.current = new Qr(options);
          holder.current.replaceChildren();
          instance.current.append(holder.current);
        } else instance.current.update(options);
      } catch { /* contenu trop long pour ce niveau de correction : signalé par les contrôles */ }
    })();
    return () => { cancelled = true; };
  }, [payload, design, transparent]);

  // Test de lecture automatique (anti-rebond)
  useEffect(() => {
    if (blocked) { setScan("idle"); return; }
    setScan("testing");
    let cancelled = false;
    const t = setTimeout(() => { selfTest(payload, design).then((ok) => { if (!cancelled) setScan(ok ? "ok" : "fail"); }).catch(() => { if (!cancelled) setScan("fail"); }); }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [payload, design, blocked]);

  const guard = (): boolean => {
    if (built.error) { toast.error(built.error); return false; }
    if (isPlaceholder) { toast.error("Renseigne d'abord le contenu de ton QR code."); return false; }
    if (blocked) { toast.error("Corrige les problèmes de lisibilité signalés avant d'exporter."); return false; }
    return true;
  };
  async function download() {
    if (!guard()) return;
    setBusy("download");
    try { downloadBlob(await exportQr(payload, design, size, format, transparent), `qr-code-${type}.${format}`); toast.success("QR code téléchargé"); }
    catch (e) { toast.error(errorMessage(e, "L'export a échoué.")); }
    finally { setBusy(""); }
  }
  async function copyImage() {
    if (!guard()) return;
    setBusy("copy");
    try {
      if (!("ClipboardItem" in window) || !navigator.clipboard?.write) throw new Error("Ton navigateur ne permet pas de copier une image. Utilise le téléchargement.");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": exportQr(payload, design, Math.min(size, 1024), "png", transparent) })]);
      toast.success("Image copiée dans le presse-papiers");
    } catch (e) { toast.error(errorMessage(e, "La copie de l'image a échoué.")); }
    finally { setBusy(""); }
  }
  async function save() {
    if (!guard()) return;
    setBusy("save");
    try {
      const blob = await exportQr(payload, design, 160, "png", false);
      const thumb = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error("Lecture impossible.")); r.readAsDataURL(blob); });
      const label = name.trim() || `${QR_TYPES.find((t) => t.id === type)!.label} · ${new Date().toLocaleDateString("fr-FR")}`;
      const entry: SavedQr = { id: editingId ?? crypto.randomUUID(), name: label.slice(0, 60), createdAt: Date.now(), kind: "static", type, fields: fields[type], design, thumb };
      const ok = setSaved((l) => [entry, ...l.filter((x) => x.id !== entry.id)].slice(0, 30));
      if (!ok) throw new Error("Stockage local plein : supprime d'anciens QR codes ou retire le logo.");
      setEditingId(entry.id); setName(entry.name);
      toast.success(editingId ? "QR code mis à jour" : "QR code sauvegardé sur cet appareil");
    } catch (e) { toast.error(errorMessage(e, "La sauvegarde a échoué.")); }
    finally { setBusy(""); }
  }
  const open = (q: SavedQr) => {
    setType(q.type); setFields((f) => ({ ...f, [q.type]: { ...defaultFields[q.type], ...q.fields } })); setDesign({ ...defaultDesign, ...q.design });
    setEditingId(q.id); setName(q.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("QR code chargé dans l'éditeur", { description: q.name });
  };
  async function redownload(q: SavedQr) {
    const b = buildPayload(q.type, q.fields);
    if (!b.payload) { toast.error("Ce QR code sauvegardé est invalide."); return; }
    try { downloadBlob(await exportQr(b.payload, { ...defaultDesign, ...q.design }, 1024, "png", false), `${q.name.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase() || "qr-code"}.png`); }
    catch (e) { toast.error(errorMessage(e, "L'export a échoué.")); }
  }
  async function onLogo(file: File | undefined) {
    if (!file) return;
    try { const logo = await prepareLogo(file); setDesign((d) => ({ ...d, logo })); }
    catch (e) { toast.error(errorMessage(e)); }
  }

  const def = QR_TYPES.find((t) => t.id === type)!;
  const exportPx = format === "svg" ? "vectoriel" : `${size} × ${size} px`;
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23.5rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        {/* Panneau de personnalisation */}
        <div className="order-2 grid content-start gap-4 lg:order-1">
          <Section title="1. Contenu" hint="Choisis ce que ton QR code doit ouvrir, puis remplis le formulaire.">
            <div role="radiogroup" aria-label="Type de QR code" className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-9">
              {QR_TYPES.map((t) => { const Icon = ICONS[t.icon]; return (
                <button key={t.id} type="button" role="radio" aria-checked={type === t.id} onClick={() => setType(t.id)}
                  className={cn("flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-xs font-medium transition-all active:scale-95", type === t.id ? "border-accent bg-accent-soft text-accent-text" : "border-border text-muted hover:border-border-strong hover:text-fg")}>
                  <Icon className="size-[18px]" aria-hidden="true" />{t.label}
                </button>
              ); })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {def.fields.filter((fd) => !(type === "wifi" && fd.key === "password" && fields.wifi.security === "nopass")).map((fd) => {
                const allDay = type === "event" && !!fields.event.allDay && (fd.key === "start" || fd.key === "end");
                const value = fields[type][fd.key] ?? "";
                return <ContentField key={`${type}-${fd.key}`} def={allDay ? { ...fd, type: "date" } : fd} value={allDay ? value.slice(0, 10) : value} onChange={(v) => setFields((f) => ({ ...f, [type]: { ...f[type], [fd.key]: v } }))} />;
              })}
            </div>
            {built.error && <Alert tone="danger">{built.error}</Alert>}
          </Section>

          <Section title="2. Styles prédéfinis" hint="Un point de départ que tu peux ensuite ajuster librement.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => { const d = { ...defaultDesign, ...p.design }; return (
                <button key={p.id} type="button" onClick={() => setDesign((cur) => applyPreset(cur, p.design))} className="group flex items-center gap-2.5 rounded-xl border border-border p-2 text-left text-[13px] font-medium transition-all hover:border-border-strong hover:shadow-soft active:scale-[0.98]">
                  <span className="grid size-9 shrink-0 grid-cols-3 gap-[3px] rounded-lg border border-black/5 p-1.5" style={{ background: d.bgColor }} aria-hidden="true">
                    {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ background: i === 4 && d.customEyeColor ? d.eyeColor : d.gradient && i > 4 ? d.gradientColor : d.dotColor, borderRadius: d.dotType === "square" ? 0 : d.dotType === "dots" ? "50%" : 2, opacity: [1, 3, 8].includes(i) ? 0 : 1 }} />)}
                  </span>
                  {p.name}
                </button>
              ); })}
            </div>
          </Section>

          <Section title="3. Couleurs">
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Couleur des modules" value={design.dotColor} onChange={(v) => set("dotColor", v)} />
              <ColorField label="Couleur de fond" value={design.bgColor} onChange={(v) => set("bgColor", v)} />
            </div>
            <Toggle checked={design.gradient} onChange={(v) => set("gradient", v)} label="Dégradé sur les modules" />
            {design.gradient && (
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField label="Seconde couleur du dégradé" value={design.gradientColor} onChange={(v) => set("gradientColor", v)} />
                <div className="grid gap-2"><span className="text-[13px] font-medium">Type de dégradé</span><Segmented label="Type de dégradé" value={design.gradientType} onChange={(v) => set("gradientType", v)} options={[{ value: "linear", label: "Linéaire" }, { value: "radial", label: "Radial" }]} /></div>
                {design.gradientType === "linear" && <div className="sm:col-span-2"><Slider label="Angle" value={design.gradientRotation} onChange={(v) => set("gradientRotation", v)} min={0} max={360} step={5} suffix="°" /></div>}
              </div>
            )}
            <Toggle checked={design.customEyeColor} onChange={(v) => set("customEyeColor", v)} label="Couleur spécifique pour les yeux (repères d'angle)" />
            {design.customEyeColor && <div className="sm:max-w-xs"><ColorField label="Couleur des yeux" value={design.eyeColor} onChange={(v) => set("eyeColor", v)} /></div>}
          </Section>

          <Section title="4. Formes">
            <Choice label="Forme des modules" value={design.dotType} onChange={(v) => set("dotType", v)} options={DOTS} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Choice label="Contour des yeux" value={design.eyeFrameType} onChange={(v) => set("eyeFrameType", v)} options={EYE_FRAMES} />
              <Choice label="Centre des yeux" value={design.eyeDotType} onChange={(v) => set("eyeDotType", v)} options={EYE_DOTS} />
            </div>
          </Section>

          <Section title="5. Logo central" hint="Facultatif. JPG, PNG ou WebP, 5 Mo maximum. Le logo reste sur ton appareil.">
            <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Importer un logo" onChange={(e) => { void onLogo(e.target.files?.[0]); e.target.value = ""; }} />
            {design.logo ? (
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={design.logo} alt="Logo sélectionné" className="checker size-14 rounded-xl border border-border object-contain p-1" />
                  <Button size="sm" onClick={() => logoInput.current?.click()}>Changer</Button>
                  <Button size="sm" variant="ghost" onClick={() => set("logo", null)}><X /> Retirer</Button>
                </div>
                <Slider label="Taille du logo" value={Math.round(Math.min(design.logoSize, maxLogoSize(ec)) * 100)} onChange={(v) => set("logoSize", v / 100)} min={12} max={Math.round(maxLogoSize(ec) * 100)} suffix=" %" />
                <p className="text-xs text-muted">Taille plafonnée à {Math.round(maxLogoSize(ec) * 100)} % avec la correction {ec}{ec !== "H" ? " (jusqu'à 30 % au niveau H)" : ""}, pour que le code reste lisible.</p>
              </div>
            ) : <Button className="justify-self-start" onClick={() => logoInput.current?.click()}><ImagePlus /> Ajouter un logo</Button>}
          </Section>

          <Section title="6. Réglages">
            <Slider label="Marge extérieure" value={design.margin} onChange={(v) => set("margin", v)} min={0} max={8} suffix={design.margin > 1 ? " modules" : " module"} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Niveau de correction d&apos;erreur</span>
              <div role="radiogroup" aria-label="Niveau de correction d'erreur" className="flex flex-wrap gap-1.5">
                {EC.map(([v, l]) => { const disabled = !!design.logo && (v === "L" || v === "M"); return (
                  <button key={v} type="button" role="radio" aria-checked={ec === v} disabled={disabled} title={disabled ? "Indisponible avec un logo" : undefined} onClick={() => set("ec", v)}
                    className={cn("rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all disabled:opacity-40", ec === v ? "border-accent bg-accent-soft text-accent-text" : "border-border text-muted hover:border-border-strong hover:text-fg")}>{l}</button>
                ); })}
              </div>
              <p className="text-xs text-muted">Plus le niveau est élevé, plus le code tolère les salissures et les logos, mais plus il est dense.</p>
            </div>
          </Section>
        </div>

        {/* Aperçu */}
        <div className="order-1 lg:order-2">
          <div className="rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight">Aperçu en direct</h2>
              <div className="flex rounded-lg bg-subtle p-0.5" role="group" aria-label="Fond de l'aperçu">
                {([[false, Sun, "Aperçu sur fond clair"], [true, Moon, "Aperçu sur fond foncé"]] as const).map(([v, Icon, label]) => (
                  <button key={label} type="button" aria-pressed={darkBg === v} aria-label={label} title={label} onClick={() => setDarkBg(v)} className={cn("rounded-md p-1.5 transition-colors", darkBg === v ? "bg-surface text-fg shadow-soft" : "text-faint hover:text-fg")}><Icon className="size-4" /></button>
                ))}
              </div>
            </div>
            <div className={cn("mt-3 flex items-center justify-center rounded-2xl p-5 transition-colors duration-300 sm:p-7", darkBg ? "bg-[#101014]" : "bg-[#f1f1f6]", transparent && "checker")}>
              <div className="relative w-full max-w-[12rem] sm:max-w-[17rem]">
                <div ref={holder} role="img" aria-label="Aperçu du QR code" className={cn("aspect-square w-full overflow-hidden rounded-xl shadow-lg transition-opacity duration-200 [&>canvas]:size-full [&>svg]:size-full", blocked && "opacity-40")}>
                  <div className="skeleton size-full" />
                </div>
                {isPlaceholder && hydrated && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-fg px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-bg">Exemple · renseigne ton contenu</span>}
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[["Export", exportPx], ["Correction", `Niveau ${ec}`], ["Grille", `${modules} × ${modules}`]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-subtle px-2 py-2"><dt className="text-[11px] text-muted">{k}</dt><dd className="text-[13px] font-semibold tabular-nums">{v}</dd></div>
              ))}
            </dl>

            <div className="mt-3 grid gap-2" aria-live="polite">
              {!blocked && (
                <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium", scan === "ok" ? "bg-success-soft text-success" : scan === "fail" ? "bg-warning-soft text-warning" : "bg-subtle text-muted")}>
                  {scan === "ok" ? <CircleCheck className="size-4 shrink-0" /> : scan === "fail" ? <TriangleAlert className="size-4 shrink-0" /> : <Loader2 className="size-4 shrink-0 animate-spin" />}
                  {scan === "ok" ? "Test de lecture réussi : le code est décodé correctement." : scan === "fail" ? "Notre décodeur de test n'a pas réussi à lire ce code. Simplifie le style ou augmente le contraste, et teste avec ton téléphone." : "Test de lecture en cours…"}
                </div>
              )}
              {checks.map((c) => (
                <div key={c.message} role={c.level === "error" ? "alert" : undefined} className={cn("flex gap-2 rounded-xl px-3 py-2 text-[13px] leading-relaxed", c.level === "error" ? "bg-danger-soft text-danger" : c.level === "warning" ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent-text")}>
                  {c.level === "info" ? <Info className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}<span>{c.message}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Segmented label="Format d'export" value={format} onChange={setFormat} options={[{ value: "png", label: "PNG" }, { value: "svg", label: "SVG" }, { value: "webp", label: "WebP" }]} />
                {format !== "svg" && (
                  <select aria-label="Taille d'export" className="field h-9 w-auto py-0 text-[13px]" value={size} onChange={(e) => setSize(Number(e.target.value))}>{SIZES.map((s) => <option key={s} value={s}>{s} px</option>)}</select>
                )}
              </div>
              <Toggle checked={transparent} onChange={setTransparent} label="Fond transparent" />
              <Button variant="primary" size="lg" className="w-full" loading={busy === "download"} disabled={!canExport} onClick={() => void download()}>{busy !== "download" && <Download />}Télécharger mon QR code</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button loading={busy === "copy"} disabled={!canExport} onClick={() => void copyImage()}>{busy !== "copy" && <Copy />}Copier l&apos;image</Button>
                <Button loading={busy === "save"} disabled={!canExport} onClick={() => void save()}>{busy !== "save" && <Save />}{editingId ? "Mettre à jour" : "Sauvegarder"}</Button>
              </div>
              <input aria-label="Nom du QR code (pour la sauvegarde)" className="field" placeholder="Nom pour la sauvegarde (facultatif)" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
              {editingId && <button type="button" className="justify-self-start text-xs text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => { setEditingId(null); setName(""); }}>Enregistrer comme nouveau QR code</button>}
              {!canExport && <p className="text-xs text-muted">{isPlaceholder ? "Renseigne le contenu pour activer l'export." : "L'export est désactivé tant que les problèmes signalés ne sont pas corrigés."}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Historique */}
      <section aria-labelledby="mes-qr" className="mt-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 id="mes-qr" className="text-xl font-semibold tracking-tight">Mes QR codes</h2><p className="text-[13px] text-muted">Sauvegardés uniquement dans ce navigateur ({saved.length}/30).</p></div>
        </div>
        {!hydrated ? <div className="skeleton h-28" /> : saved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center"><p className="font-medium">Aucun QR code sauvegardé</p><p className="mt-1 text-sm text-muted">Clique sur « Sauvegarder » pour retrouver tes créations ici et les modifier plus tard.</p></div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((q) => (
              <li key={q.id} className={cn("flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft transition-colors", editingId === q.id ? "border-accent" : "border-border")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.thumb} alt="" className="size-16 shrink-0 rounded-lg border border-border" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{q.name}</p>
                  <p className="text-xs text-muted">{QR_TYPES.find((t) => t.id === q.type)?.label} · {new Date(q.createdAt).toLocaleDateString("fr-FR")} · {formatBytes(byteLength(buildPayload(q.type, q.fields).payload))}</p>
                  <div className="mt-1.5 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => open(q)}><Pencil /> Modifier</Button>
                    <Button size="icon" variant="ghost" className="size-7" aria-label={`Télécharger ${q.name}`} title="Télécharger (PNG 1024 px)" onClick={() => void redownload(q)}><Download /></Button>
                    <Button size="icon" variant="ghost" className="size-7" aria-label={`Supprimer ${q.name}`} title="Supprimer" onClick={() => { setSaved((l) => l.filter((x) => x.id !== q.id)); if (editingId === q.id) { setEditingId(null); setName(""); } toast("QR code supprimé"); }}><Trash2 /></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
