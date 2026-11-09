/** Caderno de erros. */
import type { EntradaCaderno, Tentativa } from "./tipos";

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
