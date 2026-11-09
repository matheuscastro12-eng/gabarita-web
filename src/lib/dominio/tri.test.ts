import { describe, expect, it } from "vitest";
import {
  ehFacil,
  estimarTheta,
  limiarFacil,
  notaEstimada,
  probabilidade3PL,
  respostasTRI,
} from "./tri";
import { questaoFake, tentativaFake } from "./teste-fixtures";

const item = { a: 1.5, b: 1, c: 0.2 };

describe("probabilidade3PL", () => {
  it("em θ = b vale c + (1 − c)/2", () => {
    expect(probabilidade3PL(1, item)).toBeCloseTo(0.2 + 0.8 / 2);
    expect(probabilidade3PL(1, item, 1.7)).toBeCloseTo(0.6);
  });
  it("tende a c e a 1 nos extremos", () => {
    expect(probabilidade3PL(-20, item)).toBeCloseTo(0.2);
    expect(probabilidade3PL(20, item)).toBeCloseTo(1);
  });
});

describe("estimarTheta (EAP)", () => {
  it("sem respostas → prior", () => {
    expect(estimarTheta([])).toEqual({ theta: 0, erroPadrao: 1, itens: 0 });
    expect(estimarTheta([], { priorMedia: 0.5, priorDesvio: 2 })).toEqual({
      theta: 0.5,
      erroPadrao: 2,
      itens: 0,
    });
  });
  it("muitos acertos em b = 1 → θ > 0,5; muitos erros → θ < 0", () => {
    const acertos = Array.from({ length: 20 }, () => ({ ...item, acertou: true }));
    const erros = Array.from({ length: 20 }, () => ({ ...item, acertou: false }));
    expect(estimarTheta(acertos).theta).toBeGreaterThan(0.5);
    expect(estimarTheta(erros).theta).toBeLessThan(0);
    expect(estimarTheta(acertos).itens).toBe(20);
  });
  it("EP diminui com mais itens", () => {
    const mix = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ a: 1.5, b: 0, c: 0.2, acertou: i % 2 === 0 }));
    const ep2 = estimarTheta(mix(2)).erroPadrao;
    const ep10 = estimarTheta(mix(10)).erroPadrao;
    const ep40 = estimarTheta(mix(40)).erroPadrao;
    expect(ep10).toBeLessThan(ep2);
    expect(ep40).toBeLessThan(ep10);
    expect(ep2).toBeLessThan(1);
  });
  it("não sofre underflow com muitos itens e D = 1,7", () => {
    const muitos = Array.from({ length: 2000 }, () => ({ a: 3, b: 0, c: 0, acertou: true }));
    const r = estimarTheta(muitos, { D: 1.7, pontos: 41, limite: 5 });
    expect(Number.isFinite(r.theta)).toBe(true);
    expect(r.theta).toBeGreaterThan(1.5);
    const erros = muitos.map((m) => ({ ...m, acertou: false }));
    const e = estimarTheta(erros, { D: 1.7 });
    expect(Number.isFinite(e.theta)).toBe(true);
    expect(Number.isFinite(e.erroPadrao)).toBe(true);
    expect(e.theta).toBeLessThan(-1.5);
  });
});

describe("notaEstimada", () => {
  it("500 + 100θ com intervalo de 1,96·100·EP", () => {
    expect(notaEstimada(1, 0.3, 10)).toEqual({
      nota: 600,
      inferior: 541,
      superior: 659,
      theta: 1,
      erroPadrao: 0.3,
      itens: 10,
    });
  });
  it("nunca negativa", () => {
    const n = notaEstimada(-10, 0.1, 1);
    expect(n.nota).toBe(0);
    expect(n.inferior).toBe(0);
    expect(n.superior).toBe(0);
  });
});

describe("respostasTRI", () => {
  const q1 = questaoFake({ id: "enem-2023-136", tri: { a: 1, b: 0.5, c: 0.2 } });
  const q2 = questaoFake({ id: "enem-2023-137", tri: null });
  const q3 = questaoFake({ id: "enem-2023-138", anulada: true });
  const q4 = questaoFake({ id: "enem-2023-139", tri: { a: 2, b: 1, c: 0.1 } });
  const mapa = new Map([q1, q2, q3, q4].map((q) => [q.id, q]));
  const tentativas = [
    tentativaFake({ questaoId: q1.id, acertou: false }),
    tentativaFake({ questaoId: q1.id, acertou: true }),
    tentativaFake({ questaoId: q2.id }),
    tentativaFake({ questaoId: q3.id }),
    tentativaFake({ questaoId: q4.id, origem: "gemea" }),
    tentativaFake({ questaoId: "inexistente" }),
    tentativaFake({ questaoId: q4.id, acertou: true }),
  ];
  it("só oficiais com TRI, não anuladas, primeira tentativa de cada questão", () => {
    expect(respostasTRI(tentativas, mapa)).toEqual([
      { a: 1, b: 0.5, c: 0.2, acertou: false },
      { a: 2, b: 1, c: 0.1, acertou: true },
    ]);
  });
  it("aceita função de busca", () => {
    expect(respostasTRI(tentativas, (id) => mapa.get(id))).toHaveLength(2);
  });
});

describe("limiarFacil e ehFacil", () => {
  it("percentil 33 (posto mais próximo)", () => {
    expect(limiarFacil([])).toBeNull();
    expect(limiarFacil([2])).toBe(2);
    expect(limiarFacil([3, 1, 2])).toBe(1);
    expect(limiarFacil([6, 5, 4, 3, 2, 1])).toBe(2);
    expect(limiarFacil([1, 2, 3, 4, 5, 6, 7])).toBe(3);
  });
  it("com TRI usa b ≤ limiar; sem limiar, b < 0,5", () => {
    const q = questaoFake({ tri: { a: 1, b: 0.4, c: 0.2 } });
    expect(ehFacil(q, 0.4)).toBe(true);
    expect(ehFacil(q, 0.3)).toBe(false);
    expect(ehFacil(q, null)).toBe(true);
    expect(ehFacil(questaoFake({ tri: { a: 1, b: 0.6, c: 0.2 } }), null)).toBe(false);
  });
  it("sem TRI usa a dificuldade estimada (null → não fácil)", () => {
    expect(ehFacil(questaoFake({ tri: null, dificuldade_estimada: "facil" }), 0)).toBe(true);
    expect(ehFacil(questaoFake({ tri: null, dificuldade_estimada: "media" }), 0)).toBe(false);
    expect(ehFacil(questaoFake({ tri: null, dificuldade_estimada: null }), 0)).toBe(false);
  });
});
