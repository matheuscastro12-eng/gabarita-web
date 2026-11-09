/**
 * "Modo fáceis": só para rodar localmente. Com NEXT_PUBLIC_MODO=faceis, o banco
 * carregado pelo app (carregarQuestoes) passa a ter só as questões fáceis.
 *
 * Sem a variável (produção), nada muda. O corte segue `dificuldadeDoB` em tipos.ts
 * (fácil = b < 0,5) e pode ser trocado por NEXT_PUBLIC_FACEIS_B_MAX.
 *
 * As variáveis ficam escritas por extenso em `process.env.NEXT_PUBLIC_...` para o
 * Next embutir os valores no pacote do navegador (como em src/lib/tutor/visivel.ts).
 */
import { limiarFacil } from "@/lib/dominio/tri";
import type { Questao } from "./tipos";

export const B_MAX_PADRAO = 0.5;

export interface ConfigModo {
  soFaceis: boolean;
  /** Questões com TRI entram no modo fáceis quando tri.b < bMax. */
  bMax: number;
}

export interface EnvModo {
  NEXT_PUBLIC_MODO?: string;
  NEXT_PUBLIC_FACEIS_B_MAX?: string;
}

/** Lê a configuração do modo a partir das variáveis (pura, para testar). */
export function configModo(env: EnvModo): ConfigModo {
  const soFaceis = env.NEXT_PUBLIC_MODO?.trim().toLowerCase() === "faceis";
  const bruto = env.NEXT_PUBLIC_FACEIS_B_MAX?.trim();
  const numero = bruto ? Number(bruto.replace(",", ".")) : Number.NaN;
  return { soFaceis, bMax: Number.isFinite(numero) ? numero : B_MAX_PADRAO };
}

export const MODO: ConfigModo = configModo({
  NEXT_PUBLIC_MODO: process.env.NEXT_PUBLIC_MODO,
  NEXT_PUBLIC_FACEIS_B_MAX: process.env.NEXT_PUBLIC_FACEIS_B_MAX,
});

/** Questão fácil no modo: com TRI, b < bMax; sem TRI, dificuldade_estimada === "facil". */
export function entraNoModoFaceis(q: Questao, bMax: number): boolean {
  if (q.tri) return q.tri.b < bMax;
  return q.dificuldade_estimada === "facil";
}

/** Aplica o modo ao banco: devolve a mesma lista quando o modo está desligado. */
export function aplicarModo(questoes: Questao[], config: ConfigModo = MODO): Questao[] {
  if (!config.soFaceis) return questoes;
  return questoes.filter((q) => entraNoModoFaceis(q, config.bMax));
}

/**
 * Limiar de "fácil" usado na fila e no simulado. No modo fáceis, o pool inteiro já é
 * fácil: usar o tercil do pool deixaria só 1/3 dele como fácil (e o simulado de 15
 * fáceis ficaria sem questões). Por isso o limiar vira o próprio bMax.
 */
export function limiarFacilDoModo(bs: number[], config: ConfigModo = MODO): number | null {
  if (config.soFaceis) return config.bMax;
  return limiarFacil(bs);
}
