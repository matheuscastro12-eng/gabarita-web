import { describe, expect, it } from "vitest";
import { estadoInicial, registrarTentativa } from "./estado";
import {
  encerrarSimulado,
  montarSimuladoFaceis,
  questoesJaTentadas,
  SEGUNDOS_POR_ITEM_SIMULADO,
  simuladoValeParaFaceis,
  TAMANHO_SIMULADO_FACEIS,
} from "./simulado";
import { questaoFake, tentativaFake } from "./teste-fixtures";
import type { Questao, Simulado } from "./tipos";

const agora = new Date(2026, 10, 9, 10);

function banco(): Questao[] {
  const qs: Questao[] = [];
  let n = 136;
  const habs = ["H3", "H16", "H17", "H19", "H24", "H25", "H27", "H28", "H1", "H2", "H6", "H7"] as const;
  for (const h of habs) {
    for (let i = 0; i < 3; i++) {
      qs.push(questaoFake({ id: `enem-2023-${n}`, numero: n, habilidade: h, tri: { a: 1, b: -1 + n / 100, c: 0.2 } }));
      n++;
    }
  }
  return qs;
}

describe("montarSimuladoFaceis", () => {
  it("monta 15 fáceis inéditas, habilidades da semana primeiro, b crescente, máx. 2 por habilidade", () => {
    const qs = banco();
    const estado = estadoInicial(agora);
    const s = montarSimuladoFaceis({ questoes: qs, estado, limiarFacil: 10 });
    expect(s).toHaveLength(TAMANHO_SIMULADO_FACEIS);
    const semana = new Set(estado.perfil.habilidadesDaSemana);
    // As 8 habilidades da semana × 2 = 16 ≥ 15: todas da semana.
    expect(s.every((q) => semana.has(q.habilidade!))).toBe(true);
    const porH = new Map<string, number>();
    for (const q of s) porH.set(q.habilidade!, (porH.get(q.habilidade!) ?? 0) + 1);
    expect(Math.max(...porH.values())).toBe(2);
    // Dentro da mesma habilidade, b crescente.
    const h3 = s.filter((q) => q.habilidade === "H3").map((q) => q.tri!.b);
    expect(h3).toEqual([...h3].sort((a, b) => a - b));
    expect(new Set(s.map((q) => q.id)).size).toBe(15);
  });

  it("exclui anuladas, sem habilidade, já tentadas, não fáceis e duplicadas; relaxa o limite por habilidade", () => {
    const qs = [
      questaoFake({ id: "enem-2023-1", numero: 1, anulada: true }),
      questaoFake({ id: "enem-2023-2", numero: 2, habilidade: null }),
      questaoFake({ id: "enem-2023-3", numero: 3 }),
      questaoFake({ id: "enem-2023-3", numero: 3 }),
      questaoFake({ id: "enem-2023-4", numero: 4, tri: { a: 1, b: 3, c: 0.2 } }),
      questaoFake({ id: "enem-2023-5", numero: 5, tri: null, dificuldade_estimada: "facil" }),
      questaoFake({ id: "enem-2023-6", numero: 6, tri: { a: 1, b: 0.1, c: 0.2 } }),
      questaoFake({ id: "enem-2023-7", numero: 7, tri: { a: 1, b: 0.2, c: 0.2 } }),
    ];
    const estado = { ...estadoInicial(agora), tentativas: [tentativaFake({ questaoId: "enem-2023-3" })] };
    const s = montarSimuladoFaceis({ questoes: qs, estado, limiarFacil: 1, tamanho: 15 });
    // Todas H16: 3 restantes (5, 6, 7) entram mesmo acima do máximo de 2 por habilidade.
    expect(s.map((q) => q.id)).toEqual(["enem-2023-5", "enem-2023-6", "enem-2023-7"]);
  });

  it("desempata por id e respeita o tamanho pedido", () => {
    const qs = [
      questaoFake({ id: "enem-2023-9", numero: 9, habilidade: "H1", tri: { a: 1, b: 0, c: 0.2 } }),
      questaoFake({ id: "enem-2023-8", numero: 8, habilidade: "H2", tri: { a: 1, b: 0, c: 0.2 } }),
    ];
    const estado = { ...estadoInicial(agora), perfil: { ...estadoInicial(agora).perfil, habilidadesDaSemana: [] as never[] } };
    expect(montarSimuladoFaceis({ questoes: qs, estado, limiarFacil: 1, tamanho: 1 }).map((q) => q.id)).toEqual(["enem-2023-8"]);
  });

  it("gêmeas não contam como tentadas", () => {
    const estado = { ...estadoInicial(agora), tentativas: [tentativaFake({ questaoId: "x", origem: "gemea" }), tentativaFake({ id: "b", questaoId: "y" })] };
    expect([...questoesJaTentadas(estado)]).toEqual(["y"]);
  });
});

describe("encerrarSimulado", () => {
  it("conta acertos e o maior tempo só das tentativas do simulado", () => {
    let estado = estadoInicial(agora);
    const q1 = questaoFake({ id: "enem-2023-1", numero: 1 });
    const q2 = questaoFake({ id: "enem-2023-2", numero: 2 });
    const r1 = registrarTentativa(estado, { questao: q1, escolha: "C", segundos: 50, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null }, agora);
    estado = r1.estado;
    const r2 = registrarTentativa(estado, { questao: q2, escolha: "A", segundos: 200, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null }, agora);
    estado = r2.estado;
    const fora = tentativaFake({ id: "fora", segundos: 999 });
    estado = { ...estado, tentativas: [...estado.tentativas, fora] };
    const { estado: depois, simulado } = encerrarSimulado(
      estado,
      { tipo: "faceis-15", iniciadoEm: agora.toISOString(), tentativaIds: [r1.tentativa.id, r2.tentativa.id] },
      new Date(agora.getTime() + 60_000),
      () => "simulado-1",
    );
    expect(simulado).toEqual({
      id: "simulado-1",
      tipo: "faceis-15",
      iniciadoEm: agora.toISOString(),
      terminadoEm: new Date(agora.getTime() + 60_000).toISOString(),
      total: 2,
      acertos: 1,
      maiorTempoItem: 200,
      tentativaIds: [r1.tentativa.id, r2.tentativa.id],
    });
    expect(depois.simulados).toEqual([simulado]);
    expect(depois.atualizadoEm).toBe(simulado.terminadoEm);
  });

  it("usa o gerador de id padrão e aceita simulado vazio", () => {
    const { simulado } = encerrarSimulado(estadoInicial(agora), { tipo: "completo-45", iniciadoEm: agora.toISOString(), tentativaIds: [] }, agora);
    expect(simulado.id).toMatch(/^simulado-/);
    expect(simulado.total).toBe(0);
    expect(simulado.maiorTempoItem).toBe(0);
  });
});

describe("simuladoValeParaFaceis", () => {
  const base: Simulado = { id: "s", tipo: "faceis-15", iniciadoEm: "", terminadoEm: "", total: 15, acertos: 14, maiorTempoItem: 100, tentativaIds: [] };
  it("vale com ≥ 90% e ≤ 3 min por item", () => {
    expect(simuladoValeParaFaceis(base)).toBe(true);
    expect(simuladoValeParaFaceis({ ...base, acertos: 13 })).toBe(false);
    expect(simuladoValeParaFaceis({ ...base, maiorTempoItem: SEGUNDOS_POR_ITEM_SIMULADO + 1 })).toBe(false);
    expect(simuladoValeParaFaceis({ ...base, tipo: "completo-45" })).toBe(false);
    expect(simuladoValeParaFaceis({ ...base, total: 0, acertos: 0 })).toBe(false);
  });
});
