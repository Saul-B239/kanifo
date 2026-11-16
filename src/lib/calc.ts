/**
 * Évaluateur d'expressions arithmétiques par descente récursive.
 * Aucune exécution de code : seuls nombres, + - × ÷ ^ % √ π et parenthèses sont reconnus.
 */
export class CalcError extends Error {}

type Tok = { t: "num"; v: number } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const s = src.replace(/[\s  ]/g, "").replace(/×|x|X/g, "*").replace(/÷|:/g, "/").replace(/−|–/g, "-").replace(/,/g, ".");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (!m) throw new CalcError("Nombre invalide");
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if ("+-*/^()%√".includes(c)) { out.push({ t: "op", v: c }); i++; }
    else if (c === "π") { out.push({ t: "num", v: Math.PI }); i++; }
    else throw new CalcError(`Caractère non reconnu : « ${c} »`);
  }
  return out;
}

export function evaluate(src: string): number {
  const toks = tokenize(src);
  if (toks.length === 0) throw new CalcError("Expression vide");
  if (toks.length > 500) throw new CalcError("Expression trop longue");
  let pos = 0;
  const peek = () => toks[pos];
  const isOp = (v: string) => peek()?.t === "op" && peek().v === v;

  function expr(): number {
    let v = term();
    while (isOp("+") || isOp("-")) { const op = toks[pos++].v; const r = term(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = toks[pos++].v; const r = unary();
        if (op === "/" && r === 0) throw new CalcError("Division par zéro");
        v = op === "*" ? v * r : v / r;
      } else if (isOp("(") || isOp("√") || (peek()?.t === "num" && toks[pos - 1]?.t === "op" && (toks[pos - 1].v === ")" || toks[pos - 1].v === "%"))) {
        v *= unary(); // multiplication implicite : 2(3+4), 3√9
      } else return v;
    }
  }
  function unary(): number {
    if (isOp("-")) { pos++; return -unary(); }
    if (isOp("+")) { pos++; return unary(); }
    return power();
  }
  function power(): number {
    const base = postfix();
    if (isOp("^")) { pos++; const e = unary(); const r = Math.pow(base, e); if (Number.isNaN(r)) throw new CalcError("Puissance non définie"); return r; }
    return base;
  }
  function postfix(): number {
    let v = primary();
    while (isOp("%")) { pos++; v /= 100; }
    return v;
  }
  function primary(): number {
    const tk = toks[pos++];
    if (!tk) throw new CalcError("Expression incomplète");
    if (tk.t === "num") return tk.v;
    if (tk.v === "(") {
      const v = expr();
      if (!isOp(")")) throw new CalcError("Parenthèse fermante manquante");
      pos++;
      return v;
    }
    if (tk.v === "√") {
      const v = primary();
      if (v < 0) throw new CalcError("Racine d'un nombre négatif");
      return Math.sqrt(v);
    }
    throw new CalcError(tk.v === ")" ? "Parenthèse fermante inattendue" : "Opérateur mal placé");
  }

  const result = expr();
  if (pos < toks.length) throw new CalcError(peek().t === "op" && peek().v === ")" ? "Parenthèse fermante inattendue" : "Expression mal formée");
  if (!Number.isFinite(result)) throw new CalcError("Résultat hors limites");
  return Number.parseFloat(result.toPrecision(12));
}
