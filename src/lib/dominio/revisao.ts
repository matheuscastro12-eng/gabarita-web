/**
 * Repetição espaçada por habilidade (FSRS, via ts-fsrs).
 * O domínio efetivo é m·R, onde R é a retenção prevista pelo FSRS.
 */
import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";
import type { CartaoSerializado } from "./tipos";

/** Sem fuzz: o agendamento é determinístico (testável). */
const agendador = fsrs({ enable_fuzz: false });

export type NotaRevisao = "again" | "hard" | "good" | "easy";

const RATING: Record<NotaRevisao, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** Abaixo desta retenção a habilidade volta para a revisão. */
export const LIMIAR_REVISAO = 0.9;

export function serializarCartao(card: Card): CartaoSerializado {
  const { due, last_review, ...resto } = card;
  return {
    ...resto,
    due: due.toISOString(),
    last_review: last_review ? last_review.toISOString() : null,
  };
}

export function desserializarCartao(c: CartaoSerializado): Card {
  const { due, last_review, ...resto } = c;
  const card: Card = { ...resto, due: new Date(due) };
  if (last_review) card.last_review = new Date(last_review);
  return card;
}

export function novoCartao(agora: Date): CartaoSerializado {
  return serializarCartao(createEmptyCard(agora));
}

export function revisarCartao(
  cartao: CartaoSerializado,
  nota: NotaRevisao,
  agora: Date,
): CartaoSerializado {
  const { card } = agendador.next(desserializarCartao(cartao), agora, RATING[nota]);
  return serializarCartao(card);
}

/** Nota do FSRS derivada da evidência: e ≥ 1 → easy; ≥ 0,8 → good; ≥ 0,5 → hard; senão again. */
export function notaPorEvidencia(e: number): NotaRevisao {
  if (e >= 1) return "easy";
  if (e >= 0.8) return "good";
  if (e >= 0.5) return "hard";
  return "again";
}

/** Retenção prevista em [0, 1]. Cartão nunca revisado (New) → 1. */
export function retencao(cartao: CartaoSerializado, agora: Date): number {
  if (cartao.state === State.New) return 1;
  const r = agendador.get_retrievability(desserializarCartao(cartao), agora, false);
  return Math.min(1, Math.max(0, r));
}

export function precisaRevisao(cartao: CartaoSerializado, agora: Date): boolean {
  return retencao(cartao, agora) < LIMIAR_REVISAO;
}

/** Domínio efetivo m·R. */
export function dominioEfetivo(dominio: number, ret: number): number {
  return dominio * ret;
}
