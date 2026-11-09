/** Eventos do tutor (dica, erro, equívoco, pedido de resposta, verificação) gravados no estado do aluno. */
import type { EntradaCaderno, EstadoAluno, EventoTutor, TipoEventoTutor } from "./tipos";
import { gerarId, type GeradorId } from "./id";

export const TIPOS_EVENTO: readonly TipoEventoTutor[] = ["dica", "erro", "equivoco", "pedido_resposta", "verificacao", "gemea"];

/** Quantos eventos ficam guardados (os mais antigos saem). */
export const MAX_EVENTOS = 2000;

export interface EntradaEvento {
  tipo: TipoEventoTutor;
  questaoId: string;
  /** Texto curto (ex.: o equívoco identificado). */
  detalhe: string;
  degrau?: number;
}

/**
 * Registra o evento. Quando é um equívoco e a questão tem erro aberto no
 * caderno sem explicação, preenche `porQue` com o detalhe.
 */
export function registrarEventoTutor(
  estado: EstadoAluno,
  entrada: EntradaEvento,
  agora: Date,
  idFn: GeradorId = (prefixo) => gerarId(prefixo),
): { estado: EstadoAluno; evento: EventoTutor } {
  const evento: EventoTutor = {
    id: idFn("evento"),
    tipo: entrada.tipo,
    questaoId: entrada.questaoId,
    detalhe: entrada.detalhe.slice(0, 500),
    degrau: entrada.degrau ?? null,
    em: agora.toISOString(),
  };
  const eventos = [...(estado.eventosTutor ?? []), evento].slice(-MAX_EVENTOS);
  const caderno: EntradaCaderno[] =
    entrada.tipo === "equivoco" && evento.detalhe
      ? estado.caderno.map((e) =>
          e.questaoId === entrada.questaoId && e.resolvidaEm === null && e.porQue === null
            ? { ...e, porQue: evento.detalhe }
            : e,
        )
      : estado.caderno;
  return { estado: { ...estado, eventosTutor: eventos, caderno, atualizadoEm: agora.toISOString() }, evento };
}

/** Os equívocos mais frequentes (por texto), para o resumo do aluno. */
export function equivocosRecorrentes(estado: EstadoAluno, maximo = 3): { detalhe: string; vezes: number }[] {
  const contagem = new Map<string, number>();
  for (const e of estado.eventosTutor ?? []) {
    if (e.tipo !== "equivoco") continue;
    const chave = e.detalhe.trim().toLowerCase();
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  for (const c of estado.caderno) {
    if (!c.porQue) continue;
    const chave = c.porQue.trim().toLowerCase();
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maximo)
    .map(([detalhe, vezes]) => ({ detalhe, vezes }));
}
