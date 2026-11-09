import type { Area, Letra, Questao } from "@/data/tipos";
import { AREAS } from "@/data/tipos";

/** Tempo de referência do simulado das apostas (o mesmo do simulado de fáceis). */
export const SEGUNDOS_POR_QUESTAO_APOSTAS = 180;

export interface Correcao {
  acertos: number;
  total: number;
  emBranco: number;
  porArea: Record<Area, { acertos: number; total: number }>;
}

/** Corrige um simulado das apostas (pura; não grava nada no store). */
export function corrigirSimulado(questoes: readonly Questao[], escolhas: readonly (Letra | null)[]): Correcao {
  const porArea = Object.fromEntries(AREAS.map((a) => [a, { acertos: 0, total: 0 }])) as Correcao["porArea"];
  let acertos = 0;
  let emBranco = 0;
  questoes.forEach((q, i) => {
    const e = escolhas[i] ?? null;
    porArea[q.area].total += 1;
    if (e === null) emBranco += 1;
    else if (e === q.gabarito) {
      acertos += 1;
      porArea[q.area].acertos += 1;
    }
  });
  return { acertos, total: questoes.length, emBranco, porArea };
}
