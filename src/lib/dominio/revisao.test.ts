import { describe, expect, it } from "vitest";
import { createEmptyCard, State } from "ts-fsrs";
import {
  desserializarCartao,
  dominioEfetivo,
  LIMIAR_REVISAO,
  notaPorEvidencia,
  novoCartao,
  precisaRevisao,
  retencao,
  revisarCartao,
  serializarCartao,
} from "./revisao";

const t0 = new Date(2026, 10, 9, 10);
const dias = (n: number) => new Date(t0.getTime() + n * 86_400_000);

describe("revisao", () => {
  it("serializa e desserializa (ida e volta)", () => {
    const novo = novoCartao(t0);
    expect(novo.due).toBe(t0.toISOString());
    expect(novo.last_review).toBeNull();
    expect(novo.state).toBe(State.New);
    const card = desserializarCartao(novo);
    expect(card.last_review).toBeUndefined();
    expect(card.due.getTime()).toBe(t0.getTime());

    const revisado = revisarCartao(novo, "good", t0);
    expect(revisado.last_review).toBe(t0.toISOString());
    const volta = desserializarCartao(revisado);
    expect(volta.last_review?.getTime()).toBe(t0.getTime());
    expect(serializarCartao(volta)).toEqual(revisado);
    expect(serializarCartao(createEmptyCard(t0)).due).toBe(t0.toISOString());
  });

  it("nota por evidência", () => {
    expect(notaPorEvidencia(1)).toBe("easy");
    expect(notaPorEvidencia(0.8)).toBe("good");
    expect(notaPorEvidencia(0.5)).toBe("hard");
    expect(notaPorEvidencia(0.4)).toBe("again");
    expect(notaPorEvidencia(0)).toBe("again");
  });

  it("revisões avançam o cartão de forma determinística", () => {
    const a = revisarCartao(novoCartao(t0), "easy", t0);
    const b = revisarCartao(novoCartao(t0), "easy", t0);
    expect(a).toEqual(b);
    expect(a.reps).toBe(1);
    expect(new Date(a.due).getTime()).toBeGreaterThan(t0.getTime());
    const again = revisarCartao(a, "again", dias(30));
    expect(again.lapses).toBe(1);
    const hard = revisarCartao(novoCartao(t0), "hard", t0);
    expect(hard.reps).toBe(1);
  });

  it("retenção: New → 1; logo após revisar ≈ 1; cai com o tempo", () => {
    const novo = novoCartao(t0);
    expect(retencao(novo, dias(100))).toBe(1);
    expect(precisaRevisao(novo, dias(100))).toBe(false);
    const rev = revisarCartao(novo, "easy", t0);
    expect(retencao(rev, t0)).toBeCloseTo(1, 5);
    expect(precisaRevisao(rev, t0)).toBe(false);
    const depois = retencao(rev, dias(365));
    expect(depois).toBeGreaterThanOrEqual(0);
    expect(depois).toBeLessThan(LIMIAR_REVISAO);
    expect(precisaRevisao(rev, dias(365))).toBe(true);
  });

  it("domínio efetivo = m·R", () => {
    expect(dominioEfetivo(0.9, 0.8)).toBeCloseTo(0.72);
  });
});
