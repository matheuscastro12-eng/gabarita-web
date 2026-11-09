import { describe, expect, it } from "vitest";
import {
  encerrarSprint,
  estadoInicial,
  iniciarSprint,
  PERFIL_PADRAO,
  registrarTentativa,
  resumoSprint,
} from "./estado";
import { criarGeradorSequencial } from "./id";
import { questaoFake } from "./teste-fixtures";
import type { EntradaTentativa } from "./estado";

const agora = new Date(2026, 10, 9, 10);

describe("estadoInicial", () => {
  it("perfil padrão e sobrescrita parcial", () => {
    const e = estadoInicial(agora);
    expect(e.perfil).toEqual(PERFIL_PADRAO);
    expect(e.perfil.habilidadesDaSemana).not.toBe(PERFIL_PADRAO.habilidadesDaSemana);
    expect(e.criadoEm).toBe(agora.toISOString());
    expect(e.versao).toBe(1);
    expect(estadoInicial(agora, { metaNota: 800 }).perfil.metaNota).toBe(800);
  });
});

const entrada = (extra: Partial<EntradaTentativa> = {}): EntradaTentativa => ({
  questao: questaoFake(),
  escolha: "C",
  segundos: 90,
  degrauMaximo: 0,
  pediuResposta: false,
  origem: "oficial",
  sprintId: null,
  ...extra,
});

describe("registrarTentativa", () => {
  it("erro claro para questão sem habilidade", () => {
    expect(() =>
      registrarTentativa(estadoInicial(agora), entrada({ questao: questaoFake({ habilidade: null }) }), agora),
    ).toThrow("está sem habilidade");
  });

  it("primeiro acerto: θ nulo, cria habilidade, sem caderno", () => {
    const { estado, tentativa } = registrarTentativa(estadoInicial(agora), entrada(), agora);
    expect(tentativa.id).toMatch(/^tentativa-/);
    expect(tentativa.thetaAntes).toBeNull();
    expect(tentativa.b).toBe(0.5);
    expect(tentativa.acertou).toBe(true);
    expect(tentativa.dominioAntes).toBe(0.3);
    expect(tentativa.dominioDepois).toBeCloseTo(0.475);
    expect(estado.habilidades.H16!.itensOficiais).toBe(1);
    expect(estado.caderno).toEqual([]);
    expect(estado.tentativas).toHaveLength(1);
  });

  it("erro vai ao caderno; acerto depois resolve; θ vem das anteriores", () => {
    const ids = criarGeradorSequencial();
    const q2 = questaoFake({ id: "enem-2023-140", tri: { a: 1, b: -3, c: 0.2 } });
    const banco = new Map([[q2.id, q2]]);
    let r = registrarTentativa(
      estadoInicial(agora),
      entrada({ questao: q2, escolha: "A", porQue: "trocou sinal" }),
      agora,
      ids,
    );
    expect(r.estado.caderno).toHaveLength(1);
    expect(r.estado.caderno[0]!.porQue).toBe("trocou sinal");
    r = registrarTentativa(
      r.estado,
      entrada({ questao: q2, buscarQuestao: (id) => banco.get(id) }),
      agora,
      ids,
    );
    expect(r.tentativa.thetaAntes).not.toBeNull();
    expect(r.estado.caderno[0]!.resolvidaEm).toBe(agora.toISOString());
    // sem porQue → null; sem busca, questões antigas desconhecidas não entram no θ
    const r3 = registrarTentativa(
      r.estado,
      entrada({ escolha: null }),
      agora,
      ids,
    );
    expect(r3.tentativa.thetaAntes).toBeNull();
    expect(r3.estado.caderno.at(-1)!.porQue).toBeNull();
    expect(r3.tentativa.id).toBe("tentativa-000003");
  });

  it("gêmea não tem b e pesa 0,6", () => {
    const { tentativa, estado } = registrarTentativa(
      estadoInicial(agora),
      entrada({ origem: "gemea" }),
      agora,
    );
    expect(tentativa.b).toBeNull();
    expect(tentativa.peso).toBe(0.6);
    expect(estado.habilidades.H16!.itensGemeos).toBe(1);
  });

  it("questão sem TRI: b nulo", () => {
    const { tentativa } = registrarTentativa(
      estadoInicial(agora),
      entrada({ questao: questaoFake({ tri: null }) }),
      agora,
    );
    expect(tentativa.b).toBeNull();
  });
});

describe("sprint", () => {
  it("critério de aceite 10: delta do sprint igual ao calculado à mão", () => {
    const ids = criarGeradorSequencial();
    const inicio = iniciarSprint(estadoInicial(agora), ["a", "b"], agora, ids);
    const sprint = inicio.sprint;
    let estado = inicio.estado;
    expect(sprint).toEqual({
      id: "sprint-000001",
      iniciadoEm: agora.toISOString(),
      terminadoEm: null,
      questaoIds: ["a", "b"],
      tentativaIds: [],
    });
    // Sem TRI (sem bônus) e com 90 s (sem chute): w = 1.
    const semTri = (n: number, habilidade = "H16") =>
      questaoFake({ id: `enem-2023-${n}`, tri: null, habilidade });
    const passos: Partial<EntradaTentativa>[] = [
      { questao: semTri(1) }, // e = 1
      { questao: semTri(2), degrauMaximo: 1 }, // e = 0,8
      { questao: semTri(3), escolha: "A" }, // e = 0
      { questao: semTri(4), degrauMaximo: 2 }, // e = 0,5
      { questao: semTri(5, "H24"), pediuResposta: true }, // e = 0,1 (outra habilidade)
    ];
    for (const p of passos) {
      estado = registrarTentativa(estado, entrada({ ...p, sprintId: sprint.id }), agora, ids).estado;
    }
    // Uma tentativa fora do sprint não entra no resumo.
    estado = registrarTentativa(estado, entrada({ questao: semTri(6) }), agora, ids).estado;

    let m = 0.3;
    for (const e of [1, 0.8, 0, 0.5]) m = m + 0.25 * (e - m);
    const h24 = 0.3 + 0.25 * (0.1 - 0.3);

    const resumo = resumoSprint(estado, sprint.id);
    expect(resumo.tentativas).toHaveLength(5);
    expect(resumo.acertos).toBe(4);
    expect(resumo.deltaPorHabilidade.H16!.antes).toBe(0.3);
    expect(resumo.deltaPorHabilidade.H16!.depois).toBeCloseTo(m, 12);
    expect(resumo.deltaPorHabilidade.H24).toEqual({ antes: 0.3, depois: expect.closeTo(h24, 12) });
    expect(estado.sprints[0]!.tentativaIds).toHaveLength(5);

    const fim = new Date(2026, 10, 9, 10, 30);
    const encerrado = encerrarSprint(estado, sprint.id, fim);
    expect(encerrado.sprints[0]!.terminadoEm).toBe(fim.toISOString());
    const deNovo = encerrarSprint(encerrado, sprint.id, new Date(2026, 10, 9, 11));
    expect(deNovo.sprints[0]!.terminadoEm).toBe(fim.toISOString());
  });

  it("tentativa com sprintId só altera aquele sprint", () => {
    const ids = criarGeradorSequencial();
    let e = iniciarSprint(estadoInicial(agora), [], agora, ids).estado;
    const s2 = iniciarSprint(e, [], agora, ids);
    e = registrarTentativa(s2.estado, entrada({ sprintId: s2.sprint.id }), agora, ids).estado;
    expect(e.sprints[0]!.tentativaIds).toEqual([]);
    expect(e.sprints[1]!.tentativaIds).toHaveLength(1);
    expect(iniciarSprint(e, [], agora).sprint.id).toMatch(/^sprint-/);
    expect(resumoSprint(e, "inexistente")).toEqual({ tentativas: [], acertos: 0, deltaPorHabilidade: {} });
  });
});
