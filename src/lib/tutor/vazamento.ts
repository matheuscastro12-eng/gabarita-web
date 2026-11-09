/**
 * Filtro de vazamento: detecta se um texto do tutor revela a alternativa
 * correta (letra) ou o valor final da resposta antes do degrau 4 ou de um
 * pedido explícito. Puro e testado; usado no stream do servidor e na UI.
 */
import type { Letra, Questao } from "@/data/tipos";
import type { DegrauDica } from "@/lib/dominio/tipos";
import { valorDaAlternativa } from "./mathjs";

export interface ContextoGuarda {
  degrau: DegrauDica;
  /** O aluno pediu a resposta direta (⌥R ou texto). */
  pedidoExplicito: boolean;
  /** A resposta já foi confirmada: o gabarito está na tela, a guarda não faz sentido. */
  confirmada: boolean;
}

/** A guarda só vale antes do degrau 4, sem pedido explícito e antes de confirmar. */
export function guardaAtiva(ctx: ContextoGuarda): boolean {
  return ctx.degrau < 4 && !ctx.pedidoExplicito && !ctx.confirmada;
}

export interface Deteccao {
  vazou: boolean;
  /** Trechos encontrados (para o teste e para o registro). */
  motivos: string[];
  /** Expressões regulares que casaram, para redigir o texto. */
  padroes: RegExp[];
}

const PALAVRAS_LETRA = "alternativa|letra|op[cç][aã]o|resposta|gabarito|correta|certa|item";

/** Padrões em que a letra do gabarito aparece como "a resposta". */
function padroesLetra(letra: Letra): RegExp[] {
  const L = letra;
  return [
    // "alternativa C", "letra C", "a resposta é C", "gabarito: C", "opção (C)"
    new RegExp(`\\b(?:${PALAVRAS_LETRA})\\b[^.!?\\n]{0,20}?\\b\\(?${L}\\)?(?![\\p{L}\\d])`, "iu"),
    // "é a C", "marque C", "fique com a C", "é (C)"
    new RegExp(`(?<!\\p{L})(?:é|e|seria|fica|marque|marca|escolha|escolhe|assinale)\\s+(?:a|com a|na)?\\s*\\(?${L}\\)(?![\\p{L}\\d])`, "iu"),
    new RegExp(`(?<!\\p{L})(?:é|seria|marque|marca|escolha|escolhe|assinale)\\s+(?:a|com a|na)\\s+${L}(?![\\p{L}\\d])`, "iu"),
    // "Marque C", "assinale C"
    new RegExp(`(?<!\\p{L})(?:marque|marca|assinale|escolha|escolhe)\\s+\\(?${L}\\)?(?![\\p{L}\\d])`, "iu"),
    // "C)" ou "(C)" no começo de linha/frase, como quem lista a resposta
    new RegExp(`(?:^|[\\n:])\\s*\\(?${L}\\)\\s*(?:é|$)`, "imu"),
  ];
}

/** Números do texto, normalizados (115 600 → 115600; 0,25 → 0.25). */
export function extrairNumeros(texto: string): number[] {
  const limpo = texto
    .replace(/(\d)\\[,;!]\s*(?=\d{3})/g, "$1") // 115\,600 (LaTeX)
    .replace(/(\d)[   ](?=\d{3}(\D|$))/g, "$1")
    .replace(/(\d)\.(?=\d{3}(?:\.\d{3})*(?:,\d|\D|$))/g, "$1")
    .replace(/(\d),(\d)/g, "$1.$2");
  const nums: number[] = [];
  for (const m of limpo.matchAll(/-?\d+(?:\.\d+)?/g)) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) nums.push(n);
  }
  return nums;
}

function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Detecta vazamento da resposta de `questao` em `texto`.
 * - Letra: menções do tipo "alternativa C", "é a C".
 * - Valor: o número da alternativa correta (quando não aparece no enunciado).
 * - Texto: alternativa textual citada por inteiro (quando não aparece no enunciado).
 */
export function detectarVazamento(texto: string, questao: Pick<Questao, "enunciado" | "alternativas" | "gabarito">): Deteccao {
  const motivos: string[] = [];
  const padroes: RegExp[] = [];
  const letra = questao.gabarito;

  for (const re of padroesLetra(letra)) {
    const m = re.exec(texto);
    if (m) {
      motivos.push(`letra: "${m[0].trim()}"`);
      padroes.push(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"));
    }
  }

  const correta = questao.alternativas.find((a) => a.letra === letra);
  if (correta) {
    const valor = valorDaAlternativa(correta.texto);
    const numerosEnunciado = new Set(extrairNumeros(questao.enunciado));
    if (valor !== null && !numerosEnunciado.has(valor)) {
      const numerosTexto = extrairNumeros(texto);
      if (numerosTexto.some((n) => Math.abs(n - valor) <= Math.abs(valor) * 1e-9)) {
        motivos.push(`valor: ${correta.texto.trim()}`);
        padroes.push(padraoNumero(valor));
        if (/%/.test(correta.texto) && Math.abs(valor) < 1) padroes.push(padraoNumero(valor * 100));
      }
    } else if (valor === null) {
      const alvo = normalizarTexto(correta.texto.replace(/[.;]\s*$/, ""));
      const enunciadoNorm = normalizarTexto(questao.enunciado);
      if (alvo.length >= 4 && !enunciadoNorm.includes(alvo) && normalizarTexto(texto).includes(alvo)) {
        motivos.push(`texto: "${correta.texto.trim()}"`);
        padroes.push(new RegExp(escaparRegex(correta.texto.replace(/[.;]\s*$/, "").trim()), "giu"));
      }
    }
  }

  return { vazou: motivos.length > 0, motivos, padroes };
}

/** Regex que casa o número nas grafias comuns (115600, 115 600, 115.600, 0,25, 0.25). */
function padraoNumero(valor: number): RegExp {
  const abs = Math.abs(valor);
  const [inteira, decimal] = String(abs).split(".");
  const grupos = (inteira ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, "|").split("|");
  const inteiraRe = grupos.map(escaparRegex).join("[ .\\u00a0\\u202f]?");
  const decimalRe = decimal ? `[.,]${escaparRegex(decimal)}` : "";
  return new RegExp(`(?<![\\d,.])-?${inteiraRe}${decimalRe}(?![\\d])`, "g");
}

export const SUBSTITUTO = "▮▮▮";

/** Substitui os trechos vazados por ▮▮▮, mantendo o resto da mensagem. */
export function redigir(texto: string, deteccao: Deteccao): string {
  let saida = texto;
  for (const re of deteccao.padroes) saida = saida.replace(re, SUBSTITUTO);
  return saida;
}

export const AVISO_REDACAO =
  "_(Trecho oculto: o tutor quase revelou a resposta. Peça a resposta direta com ⌥R se quiser vê-la.)_";

/** Aplica a guarda a um texto completo: devolve o texto (redigido se preciso) e se houve vazamento. */
export function aplicarGuarda(
  texto: string,
  questao: Pick<Questao, "enunciado" | "alternativas" | "gabarito">,
  ctx: ContextoGuarda,
): { texto: string; vazou: boolean; motivos: string[] } {
  if (!guardaAtiva(ctx)) return { texto, vazou: false, motivos: [] };
  const d = detectarVazamento(texto, questao);
  if (!d.vazou) return { texto, vazou: false, motivos: [] };
  return { texto: `${redigir(texto, d)}\n\n${AVISO_REDACAO}`, vazou: true, motivos: d.motivos };
}
