/**
 * Fallback do `run_python` quando o Pyodide não carrega (CDN fora, sem
 * internet, navegador sem WebAssembly): expressões simples viram uma conta
 * no mathjs. Puro e testado; a execução de verdade fica no Web Worker.
 */
import type { ResultadoCalculo } from "@/lib/tutor/mathjs";
import type { SaidaPython } from "@/lib/tutor/ferramentas";

export const ERRO_CARGA_PREFIXO = "Pyodide indisponível";
export const NOTA_MATHJS = "Conta feita com mathjs: o Pyodide (SymPy) não carregou.";

const PROIBIDO = /\b(import|from|def|class|for|while|if|lambda|print|solve|symbols|simplify|expand|factor|diff|integrate|Eq|float|int|len|list|range|sum|mean|median|mode)\b|[=:\[\]{}]/;

/**
 * Traduz a última linha útil de um código Python para uma expressão do mathjs,
 * ou devolve null quando não dá (atribuições, chamadas do SymPy, laços…).
 */
export function expressaoParaMathjs(codigo: string): string | null {
  const linhas = codigo
    .split("\n")
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter((l) => l.length > 0);
  // Qualquer linha anterior com atribuição ou importação torna a última dependente delas.
  if (linhas.length === 0) return null;
  const ultima = linhas[linhas.length - 1]!;
  if (linhas.slice(0, -1).some((l) => /[=]/.test(l.replace(/==/g, "")) || /\b(import|from)\b/.test(l))) return null;
  let exp = ultima
    .replace(/\bRational\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g, "($1/$2)")
    .replace(/\bsqrt\(/g, "sqrt(")
    .replace(/\*\*/g, "^")
    .replace(/\bpi\b/g, "pi")
    .replace(/\bE\b/g, "e");
  exp = exp.trim();
  if (!exp || PROIBIDO.test(exp)) return null;
  if (!/\d/.test(exp)) return null;
  return exp;
}

/** Monta a saída de `run_python` a partir da conta do mathjs, ou null se não houve como. */
export function saidaViaMathjs(codigo: string, calcular: (expressao: string) => ResultadoCalculo, ms = 0): SaidaPython | null {
  const exp = expressaoParaMathjs(codigo);
  if (!exp) return null;
  const r = calcular(exp);
  if (!r.ok || r.resultado === undefined) return null;
  const resultado = r.aproximado && r.aproximado !== r.resultado ? `${r.resultado} ≈ ${r.aproximado}` : r.resultado;
  return { ok: true, saida: NOTA_MATHJS, resultado, erro: null, ms };
}

/** Mensagem única para falha de carga, para a interface reconhecer (`ehErroDeCarga`). */
export function mensagemErroCarga(detalhe?: string | null): string {
  const base = `${ERRO_CARGA_PREFIXO}: não consegui baixar o Pyodide e o SymPy do CDN (jsdelivr).`;
  const dica = " Confira a conexão e tente de novo; contas simples saem pelo mathjs enquanto isso.";
  return detalhe && detalhe.trim() ? `${base} (${detalhe.trim()})${dica}` : `${base}${dica}`;
}

export function ehErroDeCarga(saida: Pick<SaidaPython, "ok" | "erro">): boolean {
  return !saida.ok && typeof saida.erro === "string" && saida.erro.startsWith(ERRO_CARGA_PREFIXO);
}

/**
 * Se a saída foi uma falha de carga, tenta a conta pelo mathjs; senão devolve
 * a saída como veio. Quando nem o mathjs resolve, mantém o erro de carga.
 */
export function comFallbackMathjs(codigo: string, saida: SaidaPython, calcular: (expressao: string) => ResultadoCalculo): SaidaPython {
  if (!ehErroDeCarga(saida)) return saida;
  return saidaViaMathjs(codigo, calcular, saida.ms) ?? saida;
}
