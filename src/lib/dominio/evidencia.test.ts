import { describe, expect, it } from "vitest";
import {
  aplicarTentativa,
  atualizarDominio,
  calcularEvidencia,
  detectarChute,
  DOMINIO_INICIAL,
  medianaSegundos,
  novoEstadoHabilidade,
  pesoTentativa,
} from "./evidencia";
import { tentativaFake } from "./teste-fixtures";

const agora = new Date(2026, 10, 9, 10);

describe("calcularEvidencia", () => {
  const base = { acertou: true, degrauMaximo: 0 as const, pediuResposta: false };
  it("segue a tabela da seção 6", () => {
    expect(calcularEvidencia({ ...base, acertou: false })).toBe(0);
    expect(calcularEvidencia({ ...base, acertou: false, pediuResposta: true })).toBe(0);
    expect(calcularEvidencia(base)).toBe(1);
    expect(calcularEvidencia({ ...base, degrauMaximo: 1 })).toBe(0.8);
    expect(calcularEvidencia({ ...base, degrauMaximo: 2 })).toBe(0.5);
    expect(calcularEvidencia({ ...base, degrauMaximo: 3 })).toBe(0.1);
    expect(calcularEvidencia({ ...base, degrauMaximo: 4 })).toBe(0.1);
    expect(calcularEvidencia({ ...base, pediuResposta: true })).toBe(0.1);
  });
});

describe("detectarChute", () => {
  it("acerto abaixo de 25% da mediana", () => {
    expect(detectarChute({ acertou: true, segundos: 20, medianaSegundos: 100 })).toBe(true);
    expect(detectarChute({ acertou: true, segundos: 25, medianaSegundos: 100 })).toBe(false);
    expect(detectarChute({ acertou: false, segundos: 1, medianaSegundos: 100 })).toBe(false);
  });
  it("sem mediana válida → false", () => {
    expect(detectarChute({ acertou: true, segundos: 0, medianaSegundos: 0 })).toBe(false);
    expect(detectarChute({ acertou: true, segundos: 0, medianaSegundos: -5 })).toBe(false);
    expect(detectarChute({ acertou: true, segundos: 0, medianaSegundos: null })).toBe(false);
  });
});

describe("medianaSegundos", () => {
  it("vazio → padrão", () => {
    expect(medianaSegundos([])).toBe(90);
    expect(medianaSegundos([], 60)).toBe(60);
  });
  it("ímpar e par", () => {
    const ts = (s: number[]) => s.map((segundos) => tentativaFake({ segundos }));
    expect(medianaSegundos(ts([30, 10, 20]))).toBe(20);
    expect(medianaSegundos(ts([40, 10, 20, 30]))).toBe(25);
  });
});

describe("pesoTentativa", () => {
  it("oficial 1, gêmea 0,6", () => {
    expect(pesoTentativa({ origem: "oficial", acertou: true, b: null, theta: 0 })).toBe(1);
    expect(pesoTentativa({ origem: "gemea", acertou: true, b: null, theta: 0 })).toBe(0.6);
    expect(pesoTentativa({ origem: "oficial", acertou: true, b: 2, theta: null })).toBe(1);
  });
  it("×1,2 ao acertar item mais difícil que θ", () => {
    expect(pesoTentativa({ origem: "oficial", acertou: true, b: 1, theta: 0.5 })).toBeCloseTo(1.2);
    expect(pesoTentativa({ origem: "oficial", acertou: true, b: 0.5, theta: 0.5 })).toBe(1);
  });
  it("×1,3 ao errar item com b < θ − 1", () => {
    expect(pesoTentativa({ origem: "oficial", acertou: false, b: -1.5, theta: 0 })).toBeCloseTo(1.3);
    expect(pesoTentativa({ origem: "oficial", acertou: false, b: -1, theta: 0 })).toBe(1);
    expect(pesoTentativa({ origem: "oficial", acertou: false, b: 2, theta: 0 })).toBe(1);
  });
  it("gêmea sem b nunca recebe bônus", () => {
    expect(pesoTentativa({ origem: "gemea", acertou: false, b: null, theta: 3 })).toBe(0.6);
  });
});

describe("atualizarDominio", () => {
  it("m + 0,25·w·(e − m)", () => {
    expect(atualizarDominio(0.3, 1, 1)).toBeCloseTo(0.475);
    expect(atualizarDominio(0.3, 0, 1.3)).toBeCloseTo(0.3 - 0.25 * 1.3 * 0.3);
  });
  it("limita a [0, 1]", () => {
    expect(atualizarDominio(0.9, 1, 10)).toBe(1);
    expect(atualizarDominio(0.2, 0, 10)).toBe(0);
  });
});

describe("aplicarTentativa", () => {
  const dados = {
    acertou: true,
    degrauMaximo: 0 as const,
    pediuResposta: false,
    origem: "oficial" as const,
    segundos: 80,
    medianaSegundos: 90,
    b: null,
    theta: null,
  };

  it("estado novo começa em 0,3 com cartão novo", () => {
    const e = novoEstadoHabilidade("H16", agora);
    expect(e.dominio).toBe(DOMINIO_INICIAL);
    expect(e.cartao.reps).toBe(0);
    expect(e.atualizadoEm).toBeNull();
  });

  it("acerto oficial sem dica", () => {
    const r = aplicarTentativa(novoEstadoHabilidade("H16", agora), dados, agora);
    expect(r.evidencia).toBe(1);
    expect(r.peso).toBe(1);
    expect(r.chuteSuspeito).toBe(false);
    expect(r.estado.dominio).toBeCloseTo(0.475);
    expect(r.estado.itensOficiais).toBe(1);
    expect(r.estado.itensGemeos).toBe(0);
    expect(r.estado.acertos).toBe(1);
    expect(r.estado.cartao.reps).toBe(1);
    expect(r.estado.atualizadoEm).toBe(agora.toISOString());
  });

  it("chute: evidência pela metade", () => {
    const r = aplicarTentativa(novoEstadoHabilidade("H16", agora), { ...dados, segundos: 10 }, agora);
    expect(r.chuteSuspeito).toBe(true);
    expect(r.evidencia).toBe(0.5);
    expect(r.estado.dominio).toBeCloseTo(0.3 + 0.25 * 0.2);
  });

  it("erro em gêmea conta como gêmeo e não soma acerto", () => {
    const r = aplicarTentativa(
      novoEstadoHabilidade("H16", agora),
      { ...dados, acertou: false, origem: "gemea" },
      agora,
    );
    expect(r.evidencia).toBe(0);
    expect(r.peso).toBe(0.6);
    expect(r.estado.itensOficiais).toBe(0);
    expect(r.estado.itensGemeos).toBe(1);
    expect(r.estado.acertos).toBe(0);
    expect(r.estado.dominio).toBeCloseTo(0.3 - 0.25 * 0.6 * 0.3);
  });
});
