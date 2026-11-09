import { describe, expect, it } from "vitest";
import { novoEstadoHabilidade } from "./evidencia";
import { prontoFaceis, prontoHabilidade, prontoProva } from "./pronto";
import { revisarCartao } from "./revisao";
import { questaoFake, tentativaFake } from "./teste-fixtures";
import type { EstadoHabilidade, IntervaloNota, Simulado, Tentativa } from "./tipos";

const dia1 = new Date(2026, 10, 9, 10);
const dia2 = new Date(2026, 10, 10, 10);

function estadoForte(habilidade: EstadoHabilidade["habilidade"] = "H16"): EstadoHabilidade {
  const e = novoEstadoHabilidade(habilidade, dia1);
  return { ...e, dominio: 0.95, cartao: revisarCartao(e.cartao, "easy", dia2) };
}

function acertos(n: number, habilidade: Tentativa["habilidade"] = "H16"): Tentativa[] {
  return Array.from({ length: n }, (_, i) =>
    tentativaFake({ id: `t${i}`, habilidade, em: (i === 0 ? dia1 : dia2).toISOString() }),
  );
}

describe("prontoHabilidade", () => {
  it("pronto quando cumpre tudo", () => {
    const r = prontoHabilidade({ estado: estadoForte(), tentativas: acertos(6), agora: dia2 });
    expect(r.faltas).toEqual([]);
    expect(r.pronto).toBe(true);
    expect(r.retencao).toBeCloseTo(1, 5);
    expect(r.dominioEfetivo).toBeCloseTo(0.95, 5);
  });

  it("lista tudo o que falta para um estado novo", () => {
    const r = prontoHabilidade({
      estado: novoEstadoHabilidade("H16", dia1),
      tentativas: [],
      agora: dia1,
    });
    expect(r.pronto).toBe(false);
    expect(r.faltas).toEqual([
      "domínio efetivo 0,30 (meta 0,85)",
      "faltam 6 itens oficiais",
      "últimos 4 precisam ser acertos com dica até o degrau 1",
      "falta 1 acerto em outro dia",
    ]);
  });

  it("ignora outras habilidades e gêmeas; falta 1 item (singular)", () => {
    const ts = [
      ...acertos(5),
      tentativaFake({ id: "g", origem: "gemea", em: dia2.toISOString() }),
      tentativaFake({ id: "o", habilidade: "H24", em: dia2.toISOString() }),
    ];
    const r = prontoHabilidade({ estado: estadoForte(), tentativas: ts, agora: dia2 });
    expect(r.faltas).toEqual(["falta 1 item oficial"]);
  });

  it("últimos 4 com dica no degrau 2, resposta pedida ou erro não valem", () => {
    for (const ruim of [
      { degrauMaximo: 2 as const },
      { pediuResposta: true },
      { acertou: false },
    ]) {
      const ts = [...acertos(6), tentativaFake({ id: "x", em: dia2.toISOString(), ...ruim })];
      const r = prontoHabilidade({ estado: estadoForte(), tentativas: ts, agora: dia2 });
      expect(r.faltas).toEqual(["últimos 4 precisam ser acertos com dica até o degrau 1"]);
    }
    const comDica1 = [...acertos(6), tentativaFake({ id: "y", degrauMaximo: 1, em: dia2.toISOString() })];
    expect(prontoHabilidade({ estado: estadoForte(), tentativas: comDica1, agora: dia2 }).pronto).toBe(true);
  });

  it("acertos todos no mesmo dia: falta 1 acerto em outro dia", () => {
    const ts = acertos(6).map((t) => ({ ...t, em: dia2.toISOString() }));
    const r = prontoHabilidade({ estado: estadoForte(), tentativas: ts, agora: dia2 });
    expect(r.faltas).toEqual(["falta 1 acerto em outro dia"]);
  });

  it("esquecimento reduz o domínio efetivo (trunca na mensagem)", () => {
    const muitoDepois = new Date(2028, 0, 1);
    const r = prontoHabilidade({ estado: estadoForte(), tentativas: acertos(6), agora: muitoDepois });
    expect(r.retencao).toBeLessThan(0.9);
    expect(r.faltas[0]).toMatch(/^domínio efetivo 0,\d\d \(meta 0,85\)$/);
  });
});

const simFaceis = (s: Partial<Simulado> = {}): Simulado => ({
  id: "s1",
  tipo: "faceis-15",
  iniciadoEm: dia2.toISOString(),
  terminadoEm: dia2.toISOString(),
  total: 15,
  acertos: 14,
  maiorTempoItem: 170,
  tentativaIds: [],
  ...s,
});

describe("prontoFaceis", () => {
  it("pronto com habilidades prontas e simulado bom", () => {
    const r = prontoFaceis({
      habilidadesDaSemana: ["H16"],
      estados: { H16: estadoForte() },
      tentativas: acertos(6),
      simulados: [simFaceis()],
      agora: dia2,
    });
    expect(r).toEqual({ pronto: true, faltas: [] });
  });

  it("lista as habilidades que faltam e o simulado", () => {
    const r = prontoFaceis({
      habilidadesDaSemana: ["H16", "H24"],
      estados: { H16: estadoForte() },
      tentativas: acertos(6).map((t) => ({ ...t, em: dia2.toISOString() })),
      simulados: [
        simFaceis({ acertos: 13 }),
        simFaceis({ maiorTempoItem: 181 }),
        simFaceis({ tipo: "completo-45" }),
        simFaceis({ total: 0, acertos: 0 }),
      ],
      agora: dia2,
    });
    expect(r.pronto).toBe(false);
    expect(r.faltas[0]).toBe("H16: falta 1 acerto em outro dia");
    expect(r.faltas[1]).toMatch(/^H24: domínio efetivo 0,30/);
    expect(r.faltas[2]).toBe(
      "falta 1 simulado de 15 fáceis com pelo menos 90% de acerto e no máximo 3 min por item",
    );
  });
});

describe("prontoProva", () => {
  const nota = (inferior: number, theta = 1): IntervaloNota => ({
    nota: inferior + 50,
    inferior,
    superior: inferior + 100,
    theta,
    erroPadrao: 0.25,
    itens: 30,
  });
  const facil = questaoFake({ id: "enem-2023-150", tri: { a: 1, b: -0.5, c: 0.2 } });
  const dificil = questaoFake({ id: "enem-2023-151", tri: { a: 1, b: 2, c: 0.2 } });
  const semTri = questaoFake({ id: "enem-2023-152", tri: null });
  const anulada = questaoFake({ id: "enem-2023-153", anulada: true, tri: { a: 1, b: -2, c: 0.2 } });
  const banco = new Map([facil, dificil, semTri, anulada].map((q) => [q.id, q]));
  const buscar = (id: string) => banco.get(id);
  const completo = (dias: number): Simulado => ({
    ...simFaceis(),
    tipo: "completo-45",
    total: 45,
    terminadoEm: new Date(dia2.getTime() - dias * 86_400_000).toISOString(),
  });
  const vinteFaceis = Array.from({ length: 20 }, (_, i) =>
    tentativaFake({ id: `f${i}`, questaoId: facil.id }),
  );

  it("pronto quando cumpre tudo", () => {
    const r = prontoProva({
      nota: nota(720),
      metaNota: 700,
      tentativas: [...vinteFaceis, tentativaFake({ questaoId: dificil.id, acertou: false })],
      questoes: buscar,
      simulados: [completo(1), completo(13)],
      agora: dia2,
    });
    expect(r).toEqual({ pronto: true, faltas: [] });
  });

  it("nota abaixo da meta, taxa de erro alta e simulados faltando", () => {
    const ts = [...vinteFaceis.slice(0, 19), tentativaFake({ id: "e", questaoId: facil.id, acertou: false })];
    const r = prontoProva({
      nota: nota(650),
      metaNota: 700,
      tentativas: ts,
      questoes: buscar,
      simulados: [completo(1), completo(15), { ...completo(0), tipo: "faceis-15" }],
      agora: dia2,
    });
    expect(r.faltas).toEqual([
      "limite inferior da nota estimada 650 (meta 700)",
      "erro de 5,0% nos itens com b abaixo de θ − 1 (meta abaixo de 5%)",
      "falta 1 simulado completo de 45 itens nos últimos 14 dias",
    ]);
  });

  it("sem itens fáceis para medir e sem simulados", () => {
    const r = prontoProva({
      nota: nota(720),
      metaNota: 700,
      tentativas: [
        tentativaFake({ questaoId: facil.id, origem: "gemea" }),
        tentativaFake({ questaoId: semTri.id }),
        tentativaFake({ questaoId: anulada.id }),
        tentativaFake({ questaoId: "inexistente" }),
      ],
      questoes: buscar,
      simulados: [],
      agora: dia2,
    });
    expect(r.faltas).toEqual([
      "ainda não há itens oficiais com b abaixo de θ − 1 (0,00) para medir a taxa de erro",
      "faltam 2 simulados completos de 45 itens nos últimos 14 dias",
    ]);
  });
});
