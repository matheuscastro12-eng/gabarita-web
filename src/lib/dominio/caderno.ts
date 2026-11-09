/** Caderno de erros. */
import { precisaRevisao } from "./revisao";
import type { EntradaCaderno, EstadoAluno, Tentativa } from "./tipos";

/** Registra o erro da tentativa (não duplica a mesma tentativa). ID: `erro-${tentativa.id}`. */
export function registrarErro(
  caderno: EntradaCaderno[],
  tentativa: Tentativa,
  porQue: string | null,
  agora: Date,
): EntradaCaderno[] {
  if (caderno.some((e) => e.tentativaId === tentativa.id)) return caderno;
  return [
    ...caderno,
    {
      id: `erro-${tentativa.id}`,
      tentativaId: tentativa.id,
      questaoId: tentativa.questaoId,
      habilidade: tentativa.habilidade,
      escolha: tentativa.escolha,
      gabarito: tentativa.gabarito,
      porQue,
      em: agora.toISOString(),
      resolvidaEm: null,
    },
  ];
}

/** Marca como resolvidas as entradas abertas da questão. */
export function marcarResolvida(
  caderno: EntradaCaderno[],
  questaoId: string,
  agora: Date,
): EntradaCaderno[] {
  return caderno.map((e) =>
    e.questaoId === questaoId && e.resolvidaEm === null
      ? { ...e, resolvidaEm: agora.toISOString() }
      : e,
  );
}

export function agruparPorHabilidade(caderno: EntradaCaderno[]): Record<string, EntradaCaderno[]> {
  const grupos: Record<string, EntradaCaderno[]> = {};
  for (const e of caderno) (grupos[e.habilidade] ??= []).push(e);
  return grupos;
}

export function errosAbertos(caderno: EntradaCaderno[]): EntradaCaderno[] {
  return caderno.filter((e) => e.resolvidaEm === null);
}

export interface EntradaCadernoDetalhada extends EntradaCaderno {
  /** A habilidade do erro está com revisão FSRS vencida (retenção < 90%). */
  revisaoVencida: boolean;
  /** Quantas vezes a mesma questão foi errada. */
  vezes: number;
}

/**
 * Entradas do caderno para a tela: abertas primeiro (mais recentes no topo), depois as
 * resolvidas; cada uma diz se a revisão da habilidade venceu e quantas vezes a questão foi errada.
 */
export function listarCaderno(estado: EstadoAluno, agora: Date): EntradaCadernoDetalhada[] {
  const vezesPorQuestao = new Map<string, number>();
  for (const e of estado.caderno) vezesPorQuestao.set(e.questaoId, (vezesPorQuestao.get(e.questaoId) ?? 0) + 1);
  const detalhadas = estado.caderno.map((e) => {
    const h = estado.habilidades[e.habilidade];
    return { ...e, revisaoVencida: !!h && precisaRevisao(h.cartao, agora), vezes: vezesPorQuestao.get(e.questaoId) ?? 1 };
  });
  return detalhadas.sort((a, b) => {
    const ra = a.resolvidaEm === null ? 0 : 1;
    const rb = b.resolvidaEm === null ? 0 : 1;
    if (ra !== rb) return ra - rb;
    return a.em < b.em ? 1 : a.em > b.em ? -1 : 0;
  });
}
