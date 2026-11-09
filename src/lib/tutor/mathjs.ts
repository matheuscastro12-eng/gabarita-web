/**
 * Ferramentas de verificação matemática com mathjs: `calc` (avaliar uma expressão)
 * e `verify_answer` (equivalência simbólica simples + comparação numérica em 20
 * pontos aleatórios). Roda no servidor e, sob demanda, no Laboratório.
 */
import { create, all, type MathNode } from "mathjs";
import type { Letra, Questao } from "@/data/tipos";
import { criarAleatorio } from "@/lib/aleatorio";

const math = create(all as NonNullable<typeof all>);

/** Nomes que não são variáveis livres. */
/** Formato sem notação científica para os números do ENEM. */
const FORMATO = { notation: "auto", precision: 14, lowerExp: -9, upperExp: 15 } as const;

const RESERVADOS = new Set(["pi", "e", "i", "Infinity", "NaN", "true", "false", "tau", "phi"]);

export const PONTOS_NUMERICOS = 20;
export const TOLERANCIA_PADRAO = 1e-6;

/**
 * Normaliza a notação brasileira e símbolos de texto: vírgula decimal,
 * espaço/ponto de milhar, ×, ÷, −, porcentagem, R$, ponto final.
 */
export function normalizarExpressao(texto: string): string {
  let s = texto.trim();
  s = s.replace(/R\$\s*/g, "");
  s = s.replace(/\$+/g, " "); // delimitadores de LaTeX
  s = s.replace(/\\cdot|\\times/g, "*").replace(/\\div/g, "/");
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))");
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
  s = s.replace(/\\left|\\right/g, "");
  s = s.replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-");
  s = s.replace(/(\d)[   ](?=\d{3}(\D|$))/g, "$1"); // 115 600 → 115600
  s = s.replace(/(\d)\.(?=\d{3}(?:\.\d{3})*,\d)/g, "$1"); // 1.234,5 → 1234,5
  s = s.replace(/(\d),(\d)/g, "$1.$2"); // vírgula decimal
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
  s = s.replace(/\s*[.;]\s*$/g, "");
  return s.trim();
}

export interface ResultadoCalculo {
  ok: boolean;
  expressao: string;
  /** Resultado formatado (fração/decimal), ex.: "115600" ou "0.25". */
  resultado?: string;
  /** Aproximação decimal, quando faz sentido. */
  aproximado?: string;
  erro?: string;
}

/** Avalia uma expressão numérica/simbólica. Nunca lança. */
export function calcular(expressao: string): ResultadoCalculo {
  const exp = normalizarExpressao(expressao);
  if (!exp) return { ok: false, expressao: exp, erro: "Expressão vazia." };
  try {
    const no = math.parse(exp);
    const variaveis = variaveisLivres(no);
    if (variaveis.length > 0) {
      const simples = math.simplify(no);
      return { ok: true, expressao: exp, resultado: simples.toString() };
    }
    const valor: unknown = no.evaluate();
    const resultado = math.format(valor, FORMATO);
    const numero = typeof valor === "number" ? valor : math.isFraction(valor) ? Number(valor.valueOf()) : null;
    const aproximado =
      numero !== null && Number.isFinite(numero) && !Number.isInteger(numero)
        ? math.format(numero, { notation: "fixed", precision: 4 })
        : undefined;
    return { ok: true, expressao: exp, resultado, aproximado };
  } catch (e) {
    return { ok: false, expressao: exp, erro: e instanceof Error ? e.message : "Não consegui avaliar." };
  }
}

/** Variáveis livres (símbolos que não são constantes nem funções). */
export function variaveisLivres(no: MathNode): string[] {
  const nomes = new Set<string>();
  no.traverse((n, _caminho, pai) => {
    if (!math.isSymbolNode(n)) return;
    if (RESERVADOS.has(n.name)) return;
    if (pai && math.isFunctionNode(pai) && pai.fn === n) return;
    if (typeof (math as unknown as Record<string, unknown>)[n.name] === "function") return;
    nomes.add(n.name);
  });
  return [...nomes].sort();
}

export type MetodoVerificacao = "simbolico" | "numerico" | "nenhum";

export interface ResultadoEquivalencia {
  equivalente: boolean;
  metodo: MetodoVerificacao;
  /** Diferença relativa máxima observada nos pontos (quando numérico). */
  diferencaMax?: number;
  variaveis: string[];
  erro?: string;
}

/**
 * `a` ≡ `b`? Primeiro `simplify(a − b) == 0`; depois os mesmos 20 pontos
 * aleatórios (semente fixa) para as variáveis livres, com tolerância relativa.
 */
export function verificarEquivalencia(a: string, b: string, tolerancia = TOLERANCIA_PADRAO): ResultadoEquivalencia {
  let noA: MathNode;
  let noB: MathNode;
  try {
    noA = math.parse(normalizarExpressao(a));
    noB = math.parse(normalizarExpressao(b));
  } catch (e) {
    return { equivalente: false, metodo: "nenhum", variaveis: [], erro: e instanceof Error ? e.message : "parse" };
  }
  const variaveis = [...new Set([...variaveisLivres(noA), ...variaveisLivres(noB)])].sort();

  try {
    const dif = math.simplify(new math.OperatorNode("-", "subtract", [noA, noB]));
    if (math.isConstantNode(dif) && Number(dif.value) === 0) {
      return { equivalente: true, metodo: "simbolico", variaveis, diferencaMax: 0 };
    }
  } catch {
    /* segue para a verificação numérica */
  }

  const rnd = criarAleatorio(20240607);
  let diferencaMax = 0;
  let pontosValidos = 0;
  const pontos = variaveis.length === 0 ? 1 : PONTOS_NUMERICOS;
  for (let i = 0; i < pontos; i++) {
    const escopo: Record<string, number> = {};
    for (const v of variaveis) escopo[v] = rnd.proximo() * 10 - 5;
    let va: unknown;
    let vb: unknown;
    try {
      va = noA.evaluate(escopo);
      vb = noB.evaluate(escopo);
    } catch (e) {
      return { equivalente: false, metodo: "nenhum", variaveis, erro: e instanceof Error ? e.message : "avaliação" };
    }
    const na = paraNumero(va);
    const nb = paraNumero(vb);
    if (na === null || nb === null) {
      if (variaveis.length === 0 || (!ehNumerico(va) && !ehNumerico(vb))) {
        return { equivalente: false, metodo: "nenhum", variaveis, erro: "O resultado não é um número real." };
      }
      continue; // complexo num ponto fora do domínio real: ignora o ponto
    }
    if (!Number.isFinite(na) || !Number.isFinite(nb)) continue; // ponto fora do domínio: ignora
    pontosValidos++;
    const escala = Math.max(1, Math.abs(na), Math.abs(nb));
    const d = Math.abs(na - nb) / escala;
    diferencaMax = Math.max(diferencaMax, d);
    if (d > tolerancia) return { equivalente: false, metodo: "numerico", variaveis, diferencaMax: d };
  }
  if (pontosValidos === 0) {
    return { equivalente: false, metodo: "nenhum", variaveis, erro: "Nenhum ponto válido para comparar." };
  }
  return { equivalente: true, metodo: "numerico", variaveis, diferencaMax };
}

/** Número, fração, BigNumber, complexo ou unidade (algo que `paraNumero` entende em algum ponto). */
function ehNumerico(v: unknown): boolean {
  return (
    typeof v === "number" ||
    typeof v === "boolean" ||
    math.isBigNumber(v) ||
    math.isFraction(v) ||
    math.isComplex(v) ||
    math.isUnit(v)
  );
}

function paraNumero(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (math.isBigNumber(v) || math.isFraction(v)) return Number(v.valueOf());
  if (math.isComplex(v)) return Math.abs(v.im) < 1e-12 ? v.re : null;
  if (math.isUnit(v)) {
    try {
      return v.toNumber();
    } catch {
      return null;
    }
  }
  return null;
}

/** Valor numérico de uma alternativa textual ("115 600.", "R$ 1.250,00", "25%"). null se não for número. */
export function valorDaAlternativa(texto: string): number | null {
  const limpo = normalizarExpressao(texto.replace(/\*\*|__|\\,|\;|\\!|~/g, " "))
    .replace(/^[a-zA-Z]+\s*=\s*/, "")
    .replace(/\s*(km|m|cm|mm|kg|g|L|l|mL|ml|h|min|s|anos?|meses|dias?|reais|unidades?|pessoas|litros?|metros?|quilômetros?|graus?|°|º)\b\.?$/i, "")
    .trim();
  if (!limpo || !/\d/.test(limpo)) return null;
  if (/[a-zA-Z]{3,}/.test(limpo.replace(/sqrt|pi/g, ""))) return null; // texto, não número
  try {
    const no = math.parse(limpo);
    if (variaveisLivres(no).length > 0) return null;
    const n = paraNumero(no.evaluate());
    return n !== null && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export interface ResultadoVerificacaoResposta {
  /** A expressão do tutor bate com o gabarito oficial. */
  bateu: boolean;
  gabarito: Letra;
  /** Alternativa cujo valor coincide com a expressão (null se nenhuma). */
  letraCorrespondente: Letra | null;
  valorCalculado: string | null;
  metodo: MetodoVerificacao;
  observacao: string;
}

/**
 * Confere o valor afirmado pelo tutor contra as alternativas da questão.
 * Quem decide é o gabarito oficial: `bateu` só é true se o valor corresponde à letra certa.
 */
export function verificarResposta(
  questao: Pick<Questao, "alternativas" | "gabarito">,
  expressao: string,
  tolerancia = 1e-3,
): ResultadoVerificacaoResposta {
  const calc = calcular(expressao);
  if (!calc.ok || calc.resultado === undefined) {
    return {
      bateu: false,
      gabarito: questao.gabarito,
      letraCorrespondente: null,
      valorCalculado: null,
      metodo: "nenhum",
      observacao: `Não consegui avaliar "${expressao}": ${calc.erro ?? "sem resultado"}.`,
    };
  }
  let letra: Letra | null = null;
  let metodo: MetodoVerificacao = "nenhum";
  for (const alt of questao.alternativas) {
    const valor = valorDaAlternativa(alt.texto);
    if (valor === null) continue;
    const r = verificarEquivalencia(calc.resultado, String(valor), tolerancia);
    if (r.equivalente) {
      letra = alt.letra;
      metodo = r.metodo;
      break;
    }
  }
  const bateu = letra === questao.gabarito;
  const observacao =
    letra === null
      ? `O valor ${calc.resultado} não corresponde a nenhuma alternativa numérica.`
      : bateu
        ? `O valor ${calc.resultado} corresponde ao gabarito oficial (${letra}).`
        : `O valor ${calc.resultado} corresponde à alternativa ${letra}, mas o gabarito oficial é ${questao.gabarito}. Reveja a leitura do enunciado.`;
  return { bateu, gabarito: questao.gabarito, letraCorrespondente: letra, valorCalculado: calc.resultado, metodo, observacao };
}

/** Compila uma expressão em x (e parâmetros) para desenhar gráficos. Lança se inválida. */
export function compilarFuncao(expressao: string): (escopo: Record<string, number>) => number {
  const no = math.parse(normalizarExpressao(expressao.replace(/^\s*[yf]\s*(\(\s*x\s*\))?\s*=\s*/i, "")));
  const compilada = no.compile();
  return (escopo) => {
    const v = paraNumero(compilada.evaluate(escopo));
    return v === null ? NaN : v;
  };
}
