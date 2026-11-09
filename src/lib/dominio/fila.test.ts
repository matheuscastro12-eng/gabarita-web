import { describe, expect, it } from "vitest";
import { estadoInicial } from "./estado";
import { novoEstadoHabilidade } from "./evidencia";
import { bOrdenacao, montarFila, ordenarCandidatas, resumoDoDia } from "./fila";
import { revisarCartao } from "./revisao";
import { questaoFake, tentativaFake } from "./teste-fixtures";
import type { EstadoAluno } from "./tipos";

const agora = new Date(2026, 10, 9, 10);
const q = (n: number, extra: Parameters<typeof questaoFake>[0] = {}) =>
  questaoFake({ id: `enem-2023-${n}`, ...extra });

describe("bOrdenacao", () => {
  it("usa b da TRI ou heurística", () => {
    expect(bOrdenacao(q(1, { tri: { a: 1, b: 0.7, c: 0.2 } }))).toBe(0.7);
    expect(bOrdenacao(q(1, { tri: null, dificuldade_estimada: "facil" }))).toBe(-0.5);
    expect(bOrdenacao(q(1, { tri: null, dificuldade_estimada: "media" }))).toBe(1);
    expect(bOrdenacao(q(1, { tri: null, dificuldade_estimada: "dificil" }))).toBe(2);
    expect(bOrdenacao(q(1, { tri: null, dificuldade_estimada: null }))).toBe(1);
  });
});

describe("ordenarCandidatas", () => {
  it("ordena pela tupla [com habilidade, fácil, vencida, domínio, b, id]", () => {
    const base = estadoInicial(agora);
    const h17 = novoEstadoHabilidade("H17", agora);
    const vencida = { ...h17, cartao: revisarCartao(h17.cartao, "easy", new Date(2024, 0, 1)) };
    const estado: EstadoAluno = {
      ...base,
      habilidades: {
        H16: { ...novoEstadoHabilidade("H16", agora), dominio: 0.8 },
        H17: vencida,
        H19: { ...novoEstadoHabilidade("H19", agora), dominio: 0.1 },
      },
    };
    const lista = [
      q(10, { habilidade: null, tri: { a: 1, b: -3, c: 0 } }),
      q(11, { habilidade: "H16", tri: { a: 1, b: 2, c: 0 } }),
      q(12, { habilidade: "H16", tri: { a: 1, b: -1, c: 0 } }),
      q(13, { habilidade: "H17", tri: { a: 1, b: 1, c: 0 } }),
      q(14, { habilidade: "H19", tri: { a: 1, b: 1.5, c: 0 } }),
      q(15, { habilidade: "H24", tri: { a: 1, b: 1.5, c: 0 } }),
      q(16, { habilidade: "H24", tri: { a: 1, b: 1.5, c: 0 } }),
    ];
    const ids = ordenarCandidatas([...lista].reverse(), { estado, agora, limiarFacil: 0 }).map(
      (x) => x.id,
    );
    expect(ids).toEqual([
      "enem-2023-12", // fácil
      "enem-2023-13", // revisão vencida
      "enem-2023-14", // domínio 0,1
      "enem-2023-15", // sem estado → 0,3; empate em b, desempata por id
      "enem-2023-16",
      "enem-2023-11", // domínio 0,8
      "enem-2023-10", // sem habilidade por último
    ]);
  });

  it("é estável com ids repetidos", () => {
    const a = q(1);
    const b = q(1);
    const r = ordenarCandidatas([a, b], { estado: estadoInicial(agora), agora, limiarFacil: null });
    expect(r).toEqual([a, b]);
  });
});

describe("montarFila", () => {
  it("exclui anuladas, acertadas nos últimos 7 dias e repetidas; diversidade máx. 2", () => {
    const base = estadoInicial(agora);
    const estado: EstadoAluno = {
      ...base,
      tentativas: [
        tentativaFake({ questaoId: "enem-2023-2", em: new Date(2026, 10, 5).toISOString() }),
        tentativaFake({ questaoId: "enem-2023-3", em: new Date(2026, 9, 1).toISOString() }),
        tentativaFake({ questaoId: "enem-2023-4", acertou: false, em: agora.toISOString() }),
      ],
    };
    const lista = [
      q(1, { anulada: true }),
      q(2),
      q(3),
      q(3),
      q(4),
      q(5),
      q(6, { habilidade: "H24" }),
    ];
    const fila = montarFila({ questoes: lista, estado, agora, limiarFacil: null, theta: null });
    // H16: 3, 4, 5 elegíveis; diversidade pega 3 e 4, depois H24 (6), e relaxa com 5.
    expect(fila.map((x) => x.id)).toEqual(["enem-2023-3", "enem-2023-4", "enem-2023-6", "enem-2023-5"]);
  });

  it("respeita o tamanho e prefere habilidades variadas", () => {
    const lista = [
      q(1), q(2), q(3),
      q(4, { habilidade: "H24" }), q(5, { habilidade: "H24" }), q(6, { habilidade: "H24" }),
      q(7, { habilidade: null }),
    ];
    const fila = montarFila({
      questoes: lista,
      estado: estadoInicial(agora),
      agora,
      tamanho: 3,
      limiarFacil: null,
      theta: 0,
    });
    expect(fila.map((x) => x.id)).toEqual(["enem-2023-1", "enem-2023-2", "enem-2023-4"]);
    const cinco = montarFila({ questoes: lista, estado: estadoInicial(agora), agora, limiarFacil: null, theta: 0 });
    expect(cinco.map((x) => x.id)).toEqual([
      "enem-2023-1", "enem-2023-2", "enem-2023-4", "enem-2023-5", "enem-2023-7",
    ]);
  });
});

describe("resumoDoDia", () => {
  it("conta o dia, lista vencidas e a próxima revisão", () => {
    const base = estadoInicial(agora);
    const h16 = novoEstadoHabilidade("H16", agora);
    const h3 = novoEstadoHabilidade("H3", agora);
    const h24 = novoEstadoHabilidade("H24", agora);
    const recente = revisarCartao(h24.cartao, "easy", agora);
    const estado: EstadoAluno = {
      ...base,
      habilidades: {
        H16: { ...h16, cartao: revisarCartao(h16.cartao, "easy", new Date(2024, 0, 1)) },
        H3: { ...h3, cartao: revisarCartao(h3.cartao, "easy", new Date(2024, 0, 1)) },
        H24: { ...h24, cartao: recente },
        H25: novoEstadoHabilidade("H25", agora),
      },
      tentativas: [
        tentativaFake({ em: agora.toISOString() }),
        tentativaFake({ acertou: false, em: agora.toISOString() }),
        tentativaFake({ em: new Date(2026, 10, 8).toISOString() }),
      ],
      sprints: [
        { id: "s1", iniciadoEm: agora.toISOString(), terminadoEm: null, questaoIds: [], tentativaIds: [] },
        { id: "s0", iniciadoEm: new Date(2026, 10, 1).toISOString(), terminadoEm: null, questaoIds: [], tentativaIds: [] },
      ],
    };
    expect(resumoDoDia(estado, agora)).toEqual({
      tentativasHoje: 2,
      acertosHoje: 1,
      sprintsHoje: 1,
      habilidadesVencidas: ["H3", "H16"],
      proximaRevisao: recente.due,
    });
    expect(resumoDoDia(base, agora).proximaRevisao).toBeNull();
  });
});
