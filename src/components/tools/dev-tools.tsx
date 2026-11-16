"use client";
import DOMPurify from "dompurify";
import { Bold, CircleCheck, CircleX, Code, Heading2, Italic, Link as LinkIcon, List, ListChecks, Quote, RefreshCw, Table, TriangleAlert } from "lucide-react";
import { marked } from "marked";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, Button, CopyButton, DownloadButton, Field, InputArea, OutputArea, Segmented, Slider, Stat, Toggle, copyText } from "@/components/ui";
import { base64ToBytes, bytesToBase64, bytesToText, contrastRatio, hexToRgb, hslToRgb, rgbToHex, rgbToHsl, sniffBytes, toUrlSafe, uuidV4, uuidV7, type RGB } from "@/lib/codec";
import { analyzeJson, parseJson, sortKeysDeep } from "@/lib/json-tools";
import { useStored } from "@/lib/storage";
import { cn, downloadBlob, downloadText, formatBytes, randomInt, shuffle } from "@/lib/utils";
import { Row, StatGrid, TwoCols } from "./shared";

/* ---------- JSON ---------- */
const SAMPLE_JSON = '{"nom":"Toolify","gratuit":true,"outils":53,"categories":["texte","images","pdf"],"qr":{"formats":["png","svg"],"logo":null}}';

function JsonError({ text, line, column, message }: { text: string; line?: number; column?: number; message: string }) {
  const lines = text.split("\n");
  return (
    <div role="alert" className="rounded-xl bg-danger-soft p-3.5 text-[13px] text-danger">
      <p className="flex items-start gap-2 font-medium"><CircleX className="mt-0.5 size-4 shrink-0" />JSON invalide{line ? ` — ligne ${line}, colonne ${column}` : ""}</p>
      <p className="mt-1 pl-6 leading-relaxed">{message}</p>
      {line && lines[line - 1] !== undefined && (
        <pre className="mt-2 ml-6 overflow-x-auto rounded-lg bg-surface/70 p-2 font-mono text-xs text-fg">
          {lines[line - 1].slice(0, 300)}{"\n"}{" ".repeat(Math.max(0, Math.min((column ?? 1) - 1, 300)))}<span className="font-bold text-danger">^</span>
        </pre>
      )}
    </div>
  );
}

export function JsonTool({ mode }: { mode: "format" | "validate" | "minify" }) {
  const [text, setText] = useState("");
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [sort, setSort] = useState(false);
  const parsed = useMemo(() => (text.trim() ? parseJson(text) : null), [text]);
  const analysis = useMemo(() => (parsed?.ok ? analyzeJson(text, parsed.value) : null), [parsed, text]);
  const out = useMemo(() => {
    if (!parsed?.ok) return "";
    const v = sort && mode === "format" ? sortKeysDeep(parsed.value) : parsed.value;
    return mode === "minify" ? JSON.stringify(v) : JSON.stringify(v, null, indent === "tab" ? "\t" : Number(indent));
  }, [parsed, sort, mode, indent]);
  const size = (s: string) => new TextEncoder().encode(s).length;
  const gain = text && out ? 1 - size(out) / size(text) : 0;
  const warnings = analysis && (analysis.duplicates.length > 0 || analysis.unsafeNumbers.length > 0) && (
    <Alert tone="warning">
      {analysis.duplicates.length > 0 && <p><TriangleAlert className="mr-1 inline size-3.5" />Clé{analysis.duplicates.length > 1 ? "s" : ""} en double : {analysis.duplicates.map((k) => `« ${k} »`).join(", ")}. Seule la dernière valeur est conservée.</p>}
      {analysis.unsafeNumbers.length > 0 && <p><TriangleAlert className="mr-1 inline size-3.5" />Entier{analysis.unsafeNumbers.length > 1 ? "s" : ""} trop grand{analysis.unsafeNumbers.length > 1 ? "s" : ""} pour JavaScript ({analysis.unsafeNumbers.join(", ")}) : {mode === "validate" ? "ils seront arrondis par la plupart des parseurs" : "la valeur est arrondie dans le résultat"}. Utilise une chaîne pour conserver la précision.</p>}
    </Alert>
  );
  const input = (
    <InputArea mono label="JSON à traiter" value={text} onChange={setText} rows={mode === "validate" ? 12 : 14} placeholder='{"cle": "valeur"}'
      actions={<Button size="sm" variant="ghost" onClick={() => setText(mode === "minify" ? JSON.stringify(JSON.parse(SAMPLE_JSON), null, 2) : SAMPLE_JSON)}>Exemple</Button>} />
  );
  const error = parsed && !parsed.ok && <JsonError text={text} {...parsed.issue} />;

  if (mode === "validate") {
    return (
      <div className="grid gap-5">
        {input}
        {!parsed ? <p className="rounded-2xl border border-dashed border-border-strong p-5 text-center text-sm text-muted">Colle un JSON pour lancer la validation.</p> : error || (
          <>
            <div role="status" className="flex items-center gap-2.5 rounded-xl bg-success-soft p-3.5 text-sm font-medium text-success"><CircleCheck className="size-5" />JSON valide, conforme à la RFC 8259.</div>
            {warnings}
            {analysis && <StatGrid>
              <Stat label="Type racine" value={analysis.rootType} />
              <Stat label="Clés (total)" value={analysis.keys.toLocaleString("fr-FR")} />
              <Stat label="Profondeur max" value={analysis.depth} />
              <Stat label="Taille" value={formatBytes(size(text))} />
            </StatGrid>}
          </>
        )}
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      {mode === "format" && (
        <Row>
          <Segmented label="Indentation" value={indent} onChange={setIndent} options={[{ value: "2", label: "2 espaces" }, { value: "4", label: "4 espaces" }, { value: "tab", label: "Tabulation" }]} />
          <Toggle checked={sort} onChange={setSort} label="Trier les clés (A → Z)" />
        </Row>
      )}
      <TwoCols>
        {input}
        <OutputArea mono value={out} rows={14} label={mode === "minify" ? "JSON minifié" : "JSON formaté"} actions={<DownloadButton disabled={!out} onClick={() => downloadText(out, mode === "minify" ? "data.min.json" : "data.json", "application/json")} />} />
      </TwoCols>
      {error}
      {warnings}
      {parsed?.ok && mode === "minify" && (
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Stat label="Taille d'origine" value={formatBytes(size(text))} />
          <Stat label="Taille minifiée" value={formatBytes(size(out))} />
          <Stat accent label="Réduction" value={`${(Math.max(0, gain) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`} />
        </div>
      )}
    </div>
  );
}

/* ---------- Base64 ---------- */
export function Base64Encoder() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; type: string; bytes: Uint8Array } | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [dataUri, setDataUri] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const out = useMemo(() => {
    const bytes = file ? file.bytes : new TextEncoder().encode(text);
    if (!bytes.length) return "";
    const b64 = bytesToBase64(bytes);
    if (dataUri) return `data:${file ? file.type || "application/octet-stream" : "text/plain;charset=utf-8"};base64,${b64}`;
    return urlSafe ? toUrlSafe(b64) : b64;
  }, [text, file, urlSafe, dataUri]);
  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error(`Fichier trop volumineux (${formatBytes(f.size)}). Limite : 5 Mo.`); return; }
    setFile({ name: f.name, type: f.type, bytes: new Uint8Array(await f.arrayBuffer()) });
  }
  return (
    <div className="grid gap-5">
      <Row>
        <Toggle checked={urlSafe && !dataUri} onChange={(v) => { setUrlSafe(v); if (v) setDataUri(false); }} label="Variante URL-safe (- et _, sans =)" />
        <Toggle checked={dataUri} onChange={(v) => { setDataUri(v); if (v) setUrlSafe(false); }} label="Format Data URI" />
        <input ref={fileInput} type="file" className="sr-only" aria-label="Fichier à encoder" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <Button size="sm" onClick={() => fileInput.current?.click()}>Encoder un fichier…</Button>
      </Row>
      <TwoCols>
        {file ? (
          <div className="flex flex-col gap-1.5">
            <span className="flex min-h-8 items-center text-[13px] font-medium">Fichier à encoder</span>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-subtle/50 p-6 text-center">
              <p className="max-w-full truncate font-medium">{file.name}</p>
              <p className="text-[13px] text-muted">{formatBytes(file.bytes.length)}{file.type && ` · ${file.type}`}</p>
              <Button size="sm" variant="ghost" onClick={() => setFile(null)}>Retirer le fichier et saisir du texte</Button>
            </div>
          </div>
        ) : <InputArea label="Texte à encoder" value={text} onChange={setText} rows={9} placeholder="Bonjour, ça va ? 👋" maxLength={5_000_000} />}
        <OutputArea mono value={out} rows={9} label="Base64" />
      </TwoCols>
      {out && <p className="text-xs text-muted">Entrée : {formatBytes(file ? file.bytes.length : new TextEncoder().encode(text).length)} · Sortie : {formatBytes(out.length)}</p>}
    </div>
  );
}

export function Base64Decoder() {
  const [text, setText] = useState("");
  const res = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const bytes = base64ToBytes(text);
      return { bytes, text: bytesToText(bytes), kind: sniffBytes(bytes), error: "" };
    } catch (e) { return { bytes: null, text: null, kind: null, error: e instanceof Error ? e.message : "Chaîne invalide." }; }
  }, [text]);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!res?.bytes || !res.kind?.image) { setPreview(null); return; }
    const url = URL.createObjectURL(new Blob([res.bytes as BlobPart], { type: res.kind.mime }));
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [res]);
  return (
    <div className="grid gap-5">
      <TwoCols>
        <InputArea mono label="Base64 à décoder" value={text} onChange={setText} rows={9} placeholder="Qm9uam91ciwgw6dhIHZhID8g8J+Riw==" maxLength={8_000_000} />
        {res?.bytes && res.text === null ? (
          <div className="flex flex-col gap-1.5">
            <span className="flex min-h-8 items-center text-[13px] font-medium">Contenu binaire</span>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-subtle/50 p-5 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview && <img src={preview} alt="Aperçu de l'image décodée" className="checker max-h-40 max-w-full rounded-lg border border-border" />}
              <p className="text-[13px] text-muted">Ce contenu n&apos;est pas du texte : {res.kind!.mime} · {formatBytes(res.bytes.length)}</p>
              <DownloadButton variant="primary" label={`Télécharger le fichier .${res.kind!.ext}`} onClick={() => downloadBlob(new Blob([res.bytes as BlobPart], { type: res.kind!.mime }), `fichier-decode.${res.kind!.ext}`)} />
            </div>
          </div>
        ) : <OutputArea value={res?.text ?? ""} rows={9} label="Texte décodé" />}
      </TwoCols>
      {res?.error && <Alert tone="danger">{res.error}</Alert>}
      {res?.bytes && <p className="text-xs text-muted">{formatBytes(res.bytes.length)} décodés{res.text !== null ? " · texte UTF-8 valide" : ""}</p>}
    </div>
  );
}

/* ---------- URL ---------- */
export function UrlEncoder() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"component" | "full">("component");
  const out = useMemo(() => {
    try { return { v: mode === "component" ? encodeURIComponent(text) : encodeURI(text), e: "" }; }
    catch { return { v: "", e: "Le texte contient un caractère Unicode incomplet (demi-paire de substitution) impossible à encoder." }; }
  }, [text, mode]);
  return (
    <div className="grid gap-5">
      <Segmented label="Mode d'encodage" value={mode} onChange={setMode} options={[{ value: "component", label: "Composant (valeur de paramètre)" }, { value: "full", label: "URL complète" }]} />
      <p className="-mt-2 text-xs text-muted">{mode === "component" ? "Encode tout, y compris / ? & = # — à utiliser pour une valeur insérée dans une URL." : "Conserve la structure de l'adresse ( : / ? & = # ) et n'encode que les caractères invalides."}</p>
      <TwoCols>
        <InputArea label="Texte ou URL" value={text} onChange={setText} rows={7} placeholder={mode === "component" ? "crème brûlée & café" : "https://exemple.fr/recherche?q=crème brûlée"} />
        <OutputArea mono value={out.v} rows={7} label="Résultat encodé" />
      </TwoCols>
      {out.e && <Alert tone="danger">{out.e}</Alert>}
    </div>
  );
}

export function UrlDecoder() {
  const [text, setText] = useState("");
  const [plus, setPlus] = useState(false);
  const res = useMemo(() => {
    if (!text.trim()) return null;
    const src = plus ? text.replace(/\+/g, " ") : text;
    try { return { v: decodeURIComponent(src), e: "" }; }
    catch {
      const bad = /%(?![0-9a-fA-F]{2})/.exec(src);
      return { v: "", e: bad ? `Séquence invalide à la position ${bad.index + 1} : « % » doit être suivi de deux chiffres hexadécimaux.` : "Séquence UTF-8 invalide ou incomplète : l'URL semble tronquée ou encodée dans un autre jeu de caractères." };
    }
  }, [text, plus]);
  const url = useMemo(() => {
    const t = text.trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return null;
    try { return new URL(t); } catch { return null; }
  }, [text]);
  const params = url ? [...url.searchParams.entries()] : [];
  return (
    <div className="grid gap-5">
      <Toggle checked={plus} onChange={setPlus} label="Interpréter « + » comme un espace (formulaires)" />
      <TwoCols>
        <InputArea mono label="URL ou texte encodé" value={text} onChange={setText} rows={6} placeholder="https://exemple.fr/recherche?q=cr%C3%A8me%20br%C3%BBl%C3%A9e&page=2" />
        <OutputArea value={res?.v ?? ""} rows={6} label="Résultat décodé" />
      </TwoCols>
      {res?.e && <Alert tone="danger">{res.e}</Alert>}
      {url && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-[13px]">
            <caption className="bg-subtle px-3.5 py-2 text-left text-xs font-medium text-muted">Décomposition de l&apos;URL (analyse locale, aucune requête envoyée)</caption>
            <tbody>
              {[["Protocole", url.protocol.replace(":", "")], ["Domaine", url.hostname], ["Port", url.port], ["Chemin", decodeSafe(url.pathname)], ["Ancre", decodeSafe(url.hash)]].filter(([, v]) => v).map(([k, v]) => (
                <tr key={k} className="border-t border-border"><th className="w-32 px-3.5 py-2 font-medium text-muted">{k}</th><td className="px-3.5 py-2 font-mono break-all">{v}</td></tr>
              ))}
              {params.map(([k, v], i) => (
                <tr key={`${k}-${i}`} className="border-t border-border"><th className="px-3.5 py-2 font-medium text-accent-text">{i === 0 ? "Paramètres" : ""}</th><td className="px-3.5 py-2 font-mono break-all"><span className="font-semibold">{k}</span> = {v || <span className="text-faint">(vide)</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
const decodeSafe = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

/* ---------- UUID ---------- */
export function UuidGenerator() {
  const [version, setVersion] = useState<"v4" | "v7">("v4");
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [noDash, setNoDash] = useState(false);
  const [braces, setBraces] = useState(false);
  const [raw, setRaw] = useState<string[]>([]);
  const n = Math.min(500, Math.max(1, Math.floor(count) || 1));
  const generate = () => setRaw(Array.from({ length: n }, () => (version === "v4" ? uuidV4() : uuidV7())));
  useEffect(() => { generate(); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = raw.map((u) => { let s = noDash ? u.replace(/-/g, "") : u; if (upper) s = s.toUpperCase(); return braces ? `{${s}}` : s; });
  return (
    <div className="grid gap-5">
      <Row className="items-end">
        <Segmented label="Version" value={version} onChange={setVersion} options={[{ value: "v4", label: "v4 · aléatoire" }, { value: "v7", label: "v7 · triable par date" }]} />
        <Field label="Quantité (1 à 500)" className="w-36">{(id) => <input id={id} type="number" min={1} max={500} className="field" value={count} onChange={(e) => setCount(Number(e.target.value))} />}</Field>
        <Button variant="primary" onClick={generate}><RefreshCw /> Générer</Button>
      </Row>
      <Row>
        <Toggle checked={upper} onChange={setUpper} label="Majuscules" />
        <Toggle checked={noDash} onChange={setNoDash} label="Sans tirets" />
        <Toggle checked={braces} onChange={setBraces} label="Entre accolades" />
      </Row>
      <div className="flex items-center justify-between"><span className="text-[13px] font-medium">{list.length} UUID généré{list.length > 1 ? "s" : ""}</span><div className="flex gap-1.5"><DownloadButton disabled={!list.length} onClick={() => downloadText(list.join("\n"), "uuid.txt")} /><CopyButton text={list.join("\n")} label="Tout copier" /></div></div>
      <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-2xl border border-border">
        {list.map((u, i) => (
          <li key={`${u}-${i}`}><button type="button" onClick={() => void copyText(u, "UUID copié")} title="Cliquer pour copier" className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left font-mono text-[13px] transition-colors hover:bg-subtle sm:text-sm"><span className="break-all">{u}</span><span className="shrink-0 font-sans text-xs text-faint">Copier</span></button></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Mot de passe ---------- */
const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.?/" };
const AMBIGUOUS = /[0O1lI|]/g;
export function strengthLabel(bits: number): { label: string; tone: string; pct: number } {
  if (bits < 40) return { label: "Faible", tone: "bg-danger", pct: 25 };
  if (bits < 60) return { label: "Moyen", tone: "bg-warning", pct: 50 };
  if (bits < 80) return { label: "Fort", tone: "bg-success", pct: 75 };
  return { label: "Très fort", tone: "bg-success", pct: 100 };
}
export function StrengthMeter({ bits }: { bits: number }) {
  const s = strengthLabel(bits);
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]"><span className="font-medium">Robustesse : {s.label}</span><span className="text-muted tabular-nums">{Math.round(bits)} bits d&apos;entropie</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle"><div className={cn("h-full rounded-full transition-all duration-300", s.tone)} style={{ width: `${s.pct}%` }} /></div>
    </div>
  );
}

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [o, setO] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [pwd, setPwd] = useState("");
  const active = (Object.keys(SETS) as (keyof typeof SETS)[]).filter((k) => o[k]).map((k) => (noAmbiguous ? SETS[k].replace(AMBIGUOUS, "") : SETS[k]));
  const alphabet = active.join("");
  const generate = () => {
    if (!active.length) { setPwd(""); return; }
    // Un caractère garanti par jeu sélectionné, le reste tiré dans tout l'alphabet, puis mélange non biaisé.
    const chars = active.slice(0, length).map((set) => set[randomInt(set.length)]);
    while (chars.length < length) chars.push(alphabet[randomInt(alphabet.length)]);
    setPwd(shuffle(chars).join(""));
  };
  useEffect(() => { generate(); }, [length, o, noAmbiguous]); // eslint-disable-line react-hooks/exhaustive-deps
  const bits = alphabet.length > 1 ? length * Math.log2(alphabet.length) : 0;
  const opt = (k: keyof typeof SETS, label: string) => <Toggle checked={o[k]} onChange={(v) => setO((p) => ({ ...p, [k]: v }))} label={label} />;
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-subtle/60 p-3 pl-5">
        <output aria-live="polite" className="min-w-0 flex-1 font-mono text-lg font-medium tracking-wide break-all sm:text-xl">{pwd || <span className="text-sm text-muted">Sélectionne au moins un type de caractères.</span>}</output>
        <Button size="icon" variant="ghost" onClick={generate} aria-label="Générer un nouveau mot de passe" title="Régénérer"><RefreshCw /></Button>
        <CopyButton text={pwd} variant="primary" size="md" />
      </div>
      {pwd && <StrengthMeter bits={bits} />}
      <Slider label="Longueur" value={length} onChange={setLength} min={6} max={128} suffix=" caractères" />
      <div className="grid gap-3 sm:grid-cols-2">
        {opt("lower", "Minuscules (a-z)")}{opt("upper", "Majuscules (A-Z)")}{opt("digits", "Chiffres (0-9)")}{opt("symbols", "Symboles (!@#$…)")}
        <Toggle checked={noAmbiguous} onChange={setNoAmbiguous} label="Exclure les caractères ambigus (0 O 1 l I)" />
      </div>
      <p className="text-xs text-muted">Généré localement avec le générateur cryptographique de ton navigateur. Rien n&apos;est transmis ni enregistré.</p>
    </div>
  );
}

/* ---------- Couleurs ---------- */
const randomColor = (): RGB => ({ r: randomInt(256), g: randomInt(256), b: randomInt(256) });
export function ColorTool() {
  const [rgb, setRgb] = useState<RGB>({ r: 103, g: 85, b: 232 });
  const [hexInput, setHexInput] = useState("#6755E8");
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const apply = (c: RGB) => { setRgb(c); setHexInput(rgbToHex(c)); };
  const hslStr = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const cWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 }), cBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const rot = (deg: number) => hslToRgb((hsl.h + deg + 360) % 360, hsl.s, hsl.l);
  const groups: { title: string; colors: RGB[] }[] = [
    { title: "Nuances (claires → foncées)", colors: [92, 80, 68, 56, 44, 32, 20, 10].map((l) => hslToRgb(hsl.h, hsl.s, l)) },
    { title: "Complémentaire", colors: [rgb, rot(180)] },
    { title: "Analogues", colors: [rot(-30), rgb, rot(30)] },
    { title: "Triade", colors: [rgb, rot(120), rot(240)] },
  ];
  const channel = (k: keyof RGB, label: string) => (
    <Field label={label}>{(id) => <input id={id} type="number" min={0} max={255} className="field tabular-nums" value={rgb[k]} onChange={(e) => apply({ ...rgb, [k]: Math.min(255, Math.max(0, Math.round(Number(e.target.value)) || 0)) })} />}</Field>
  );
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="grid min-w-0 grid-cols-1 content-start gap-4">
        <div className="relative h-44 overflow-hidden rounded-2xl border border-border shadow-soft transition-colors duration-200" style={{ background: hex }}>
          <input type="color" aria-label="Sélecteur de couleur" value={hex.toLowerCase()} onChange={(e) => { const c = hexToRgb(e.target.value); if (c) apply(c); }} className="absolute inset-0 !h-full !w-full cursor-pointer opacity-0" />
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1 font-mono text-sm font-semibold" style={{ color: cWhite >= cBlack ? "#fff" : "#000", background: cWhite >= cBlack ? "rgb(0 0 0 / 0.2)" : "rgb(255 255 255 / 0.4)" }}>{hex}</span>
          <span className="pointer-events-none absolute top-3 right-3 text-xs font-medium" style={{ color: cWhite >= cBlack ? "#fff" : "#000" }}>Clique pour choisir</span>
        </div>
        <Button variant="primary" onClick={() => apply(randomColor())}><RefreshCw /> Couleur aléatoire</Button>
        <div className="grid gap-1.5 text-[13px]">
          {[["Texte blanc", cWhite], ["Texte noir", cBlack]].map(([l, c]) => (
            <div key={l as string} className="flex items-center justify-between rounded-xl border border-border px-3 py-2"><span>{l}</span><span className="tabular-nums">{(c as number).toFixed(2)}:1 <span className={cn("ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", (c as number) >= 4.5 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{(c as number) >= 7 ? "AAA" : (c as number) >= 4.5 ? "AA" : "Insuffisant"}</span></span></div>
          ))}
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 content-start gap-5">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-[1.2fr_repeat(3,1fr)] [&>*:first-child]:col-span-3 sm:[&>*:first-child]:col-span-1">
          <Field label="HEX">{(id) => <input id={id} className="field font-mono uppercase" value={hexInput} maxLength={7} aria-invalid={!hexToRgb(hexInput)} onChange={(e) => { setHexInput(e.target.value); const c = hexToRgb(e.target.value); if (c) setRgb(c); }} onBlur={() => setHexInput(hex)} />}</Field>
          {channel("r", "Rouge")}{channel("g", "Vert")}{channel("b", "Bleu")}
        </div>
        <div className="grid gap-2">
          {[["HEX", hex], ["RGB", rgbStr], ["HSL", hslStr]].map(([l, v]) => (
            <div key={l} className="flex items-center gap-3 rounded-xl border border-border py-1.5 pr-1.5 pl-3.5"><span className="w-10 text-xs font-semibold text-muted">{l}</span><code className="flex-1 font-mono text-sm">{v}</code><CopyButton text={v} variant="ghost" /></div>
          ))}
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-2 text-[13px] font-medium">{g.title}</h3>
            <div className="flex overflow-hidden rounded-xl border border-border">
              {g.colors.map((c, i) => { const h = rgbToHex(c); return (
                <button key={`${h}-${i}`} type="button" onClick={() => void copyText(h, `${h} copié`)} onDoubleClick={() => apply(c)} title={`${h} — clic : copier, double-clic : utiliser`} aria-label={`Copier ${h}`} className="group flex h-14 flex-1 items-end justify-center pb-1 transition-[flex] duration-200 hover:flex-[1.6]" style={{ background: h }}>
                  <span className="rounded bg-black/45 px-1 font-mono text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{h}</span>
                </button>
              ); })}
            </div>
          </div>
        ))}
        <p className="text-xs text-muted">Clic sur une teinte pour copier son code, double-clic pour l&apos;utiliser comme couleur principale.</p>
      </div>
    </div>
  );
}

/* ---------- Timestamp ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
const localInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
function relative(ms: number, now: number): string {
  const diff = ms - now, abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31_557_600_000], ["month", 2_629_800_000], ["day", 86_400_000], ["hour", 3_600_000], ["minute", 60_000], ["second", 1000]];
  for (const [u, size] of units) if (abs >= size || u === "second") return rtf.format(Math.round(diff / size), u);
  return "";
}

export function TimestampTool() {
  const [now, setNow] = useState<number | null>(null);
  const [ts, setTs] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const parsed = useMemo(() => {
    const s = ts.trim();
    if (!s) return null;
    if (!/^-?\d{1,16}$/.test(s)) return { error: "Un timestamp est un nombre entier (ex. 1767225600)." };
    const n = Number(s);
    const isMs = Math.abs(n) >= 1e11;
    const ms = isMs ? n : n * 1000;
    if (Math.abs(ms) > 8.64e15) return { error: "Valeur hors de la plage de dates prise en charge." };
    return { ms, isMs, d: new Date(ms) };
  }, [ts]);
  const dateMs = date ? new Date(date).getTime() : Number.NaN;
  const row = (label: string, value: string) => (
    <div key={label} className="flex items-center gap-3 border-t border-border py-2 pr-1.5 pl-3.5 first:border-t-0"><span className="w-28 shrink-0 text-xs font-medium text-muted">{label}</span><code className="min-w-0 flex-1 font-mono text-[13px] break-all">{value}</code><CopyButton text={value} variant="ghost" size="icon" className="size-7" /></div>
  );
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-soft p-4 sm:p-5">
        <div><p className="text-[13px] text-muted">Timestamp Unix actuel</p><p className="font-mono text-2xl font-semibold text-accent-text tabular-nums sm:text-3xl">{now === null ? "…" : Math.floor(now / 1000)}</p></div>
        <div className="flex gap-2"><CopyButton text={now === null ? "" : String(Math.floor(now / 1000))} /><Button size="sm" onClick={() => now !== null && setTs(String(Math.floor(now / 1000)))}>Utiliser</Button></div>
      </div>
      <TwoCols>
        <div className="grid content-start gap-3">
          <h3 className="font-semibold tracking-tight">Timestamp → date</h3>
          <Field label="Timestamp (secondes ou millisecondes)">{(id) => <input id={id} inputMode="numeric" className="field font-mono" value={ts} maxLength={18} placeholder="1767225600" onChange={(e) => setTs(e.target.value)} />}</Field>
          {parsed && "error" in parsed && <Alert tone="danger">{parsed.error}</Alert>}
          {parsed && "d" in parsed && parsed.d && (
            <>
              <p className="text-xs text-muted">Unité détectée : <strong className="text-fg">{parsed.isMs ? "millisecondes" : "secondes"}</strong></p>
              <div className="rounded-2xl border border-border">
                {row("Heure locale", new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "medium" }).format(parsed.d))}
                {row("UTC", new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "medium", timeZone: "UTC" }).format(parsed.d))}
                {row("ISO 8601", parsed.d.toISOString())}
                {now !== null && row("Relatif", relative(parsed.ms, now))}
              </div>
            </>
          )}
        </div>
        <div className="grid content-start gap-3">
          <h3 className="font-semibold tracking-tight">Date → timestamp</h3>
          <Field label="Date et heure (fuseau local)">{(id) => <input id={id} type="datetime-local" step={1} className="field" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => setDate(localInput(new Date()))}>Maintenant</Button>
          {!Number.isNaN(dateMs) && (
            <div className="rounded-2xl border border-border">
              {row("Secondes", String(Math.floor(dateMs / 1000)))}
              {row("Millisecondes", String(dateMs))}
              {row("ISO 8601", new Date(dateMs).toISOString())}
            </div>
          )}
        </div>
      </TwoCols>
    </div>
  );
}

/* ---------- Markdown ---------- */
const MD_SAMPLE = `# Bienvenue dans l'éditeur Markdown

Écris à gauche, le **rendu** s'affiche à droite *en direct*.

## Listes

- Un élément
- Un autre, avec un [lien](https://example.com)

- [x] Tâche terminée
- [ ] Tâche à faire

## Code

\`\`\`js
const salut = (nom) => \`Bonjour \${nom} !\`;
\`\`\`

| Format | Export |
| ------ | ------ |
| Markdown | .md |
| HTML | .html |

> Ton brouillon est enregistré dans ton navigateur.
`;

export function MarkdownEditor() {
  const [stored, setStored] = useStored<string | null>("markdown-draft", null);
  const md = stored ?? MD_SAMPLE;
  const [view, setView] = useState<"split" | "edit" | "preview">("split");
  const area = useRef<HTMLTextAreaElement>(null);
  const html = useMemo(() => {
    const raw = (marked.parse(md, { gfm: true, breaks: false, async: false }) as string)
      .replace(/<input[^>]*\bchecked\b[^>]*>/gi, "☑ ")
      .replace(/<input[^>]*type="checkbox"[^>]*>/gi, "☐ ");
    if (typeof window === "undefined") return "";
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true }, FORBID_TAGS: ["style", "form", "input", "button", "iframe"] });
  }, [md]);
  const setMd = (v: string) => { if (!setStored(v)) toast.error("Stockage local plein : le brouillon n'a pas pu être enregistré."); };
  function insert(before: string, after = "", placeholder = "texte") {
    const el = area.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = md.slice(s, e) || placeholder;
    setMd(md.slice(0, s) + before + sel + after + md.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  }
  const tools: [React.ReactNode, string, () => void][] = [
    [<Heading2 key="h" />, "Titre", () => insert("\n## ", "\n", "Titre")],
    [<Bold key="b" />, "Gras", () => insert("**", "**")],
    [<Italic key="i" />, "Italique", () => insert("*", "*")],
    [<LinkIcon key="l" />, "Lien", () => insert("[", "](https://)", "libellé")],
    [<List key="u" />, "Liste", () => insert("\n- ", "\n", "élément")],
    [<ListChecks key="t" />, "Liste de tâches", () => insert("\n- [ ] ", "\n", "tâche")],
    [<Quote key="q" />, "Citation", () => insert("\n> ", "\n", "citation")],
    [<Code key="c" />, "Code", () => insert("`", "`", "code")],
    [<Table key="tb" />, "Tableau", () => insert("\n| Colonne A | Colonne B |\n| --- | --- |\n| ", " | valeur |\n", "valeur")],
  ];
  const fullHtml = `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>Document</title>\n</head>\n<body>\n${html}\n</body>\n</html>\n`;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">{tools.map(([icon, label, fn]) => <Button key={label} size="icon" variant="ghost" aria-label={label} title={label} onClick={fn} className="size-8">{icon}</Button>)}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Segmented label="Affichage" value={view} onChange={setView} options={[{ value: "edit", label: "Éditeur" }, { value: "split", label: "Les deux" }, { value: "preview", label: "Aperçu" }]} />
          <DownloadButton label=".md" onClick={() => downloadText(md, "document.md", "text/markdown")} />
          <DownloadButton label=".html" onClick={() => downloadText(fullHtml, "document.html", "text/html")} />
          <CopyButton text={html} label="Copier le HTML" />
        </div>
      </div>
      <div className={cn("grid gap-4", view === "split" && "lg:grid-cols-2")}>
        {view !== "preview" && <textarea ref={area} aria-label="Éditeur Markdown" value={md} onChange={(e) => setMd(e.target.value)} spellCheck={false} maxLength={500_000} className="field min-h-[28rem] font-mono text-[13px] leading-relaxed" />}
        {view !== "edit" && <div aria-label="Aperçu" className="prose min-h-[28rem] overflow-auto rounded-[10px] border border-border bg-bg p-5" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{md.length.toLocaleString("fr-FR")} caractères · brouillon enregistré localement</span>
        <button type="button" className="underline-offset-4 hover:text-fg hover:underline" onClick={() => { if (window.confirm("Effacer le brouillon et revenir à l'exemple ?")) setStored(null); }}>Réinitialiser</button>
      </div>
    </div>
  );
}
