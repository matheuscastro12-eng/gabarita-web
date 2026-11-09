import { describe, expect, it } from "vitest";
import { estadoInicial } from "./estado";
import { novoEstadoHabilidade } from "./evidencia";
import { filtrarEstadoPorArea, montarFilaDasAreas, notaDaArea } from "./area";
import { corrigirProva, lerAndamento, montarBloco45, montarBlocoAssunto, montarProvaDia2, novoAndamento, serializarAndamento } from "./prova";
import { questaoFake, tentativaFake } from "./teste-fixtures";
import type { Questao } from "@/data/tipos";

const agora = new Date("2026-11-09T12:00:00Z");

function cn(n: number, ano = 2020, extra: Partial<Questao> = {}): Questao {
  return questaoFake({ id: `enem-${ano}-${n}`, ano, numero: n, area: "natureza", habilidade: `CN-H${(n % 30) + 1}`, competencia: "C6", ...extra });
}
function mt(n: number, ano = 2020, extra: Partial<Questao> = {}): Questao {
  return questaoFake({ id: `enem-${ano}-${n}`, ano, numero: n, area: "matematica", habilidade: `H${(n % 30) + 1}`, ...extra });
}

describe("recorte do estado por área", () => {
  it("separa tentativas, caderno e habilidades; Geral vê tudo", () => {
    const e = {
      ...estadoInicial(agora),
      tentativas: [tentativaFake({ id: "t1", habilidade: "H3" }), tentativaFake({ id: "t2", habilidade: "CN-H3" })],
    };
    expect(filtrarEstadoPorArea(e, ["natureza"]).tentativas.map((t) => t.id)).toEqual(["t2"]);
    expect(filtrarEstadoPorArea(e, ["matematica"]).tentativas.map((t) => t.id)).toEqual(["t1"]);
    expect(filtrarEstadoPorArea(e, ["natureza", "matematica"])).toBe(e);
  });

  it("simulados antigos (sem áreas) são de matemática", () => {
    const e = {
      ...estadoInicial(agora),
      simulados: [
        { id: "s1", tipo: "faceis-15" as const, iniciadoEm: agora.toISOString(), terminadoEm: agora.toISOString(), total: 15, acertos: 15, maiorTempoItem: 10, tentativaIds: [] },
        { id: "s2", tipo: "completo-45" as const, iniciadoEm: agora.toISOString(), terminadoEm: agora.toISOString(), total: 45, acertos: 30, maiorTempoItem: 10, tentativaIds: [], areas: ["natureza" as const] },
      ],
    };
    expect(filtrarEstadoPorArea(e, ["matematica"]).simulados.map((s) => s.id)).toEqual(["s1"]);
    expect(filtrarEstadoPorArea(e, ["natureza"]).simulados.map((s) => s.id)).toEqual(["s2"]);
  });

  it("fila do Geral intercala natureza e matemática", () => {
    const qs = [cn(91), cn(92), cn(93), mt(136), mt(137), mt(138)];
    const fila = montarFilaDasAreas({ questoes: qs, estado: estadoInicial(agora), agora, areas: ["natureza", "matematica"] });
    expect(fila.map((q) => q.area)).toEqual(["natureza", "matematica", "natureza", "matematica", "natureza"]);
  });

  it("nota por área usa só os itens da área", () => {
    const qs = [cn(91, 2020, { tri: { a: 1, b: 0, c: 0.2 } }), mt(136, 2020, { tri: { a: 1, b: 0, c: 0.2 } })];
    const porId = new Map(qs.map((q) => [q.id, q]));
    const e = { ...estadoInicial(agora), tentativas: [tentativaFake({ questaoId: "enem-2020-91", habilidade: "CN-H2", acertou: true })] };
    expect(notaDaArea(e, porId, "natureza").itens).toBe(1);
    expect(notaDaArea(e, porId, "matematica").itens).toBe(0);
  });
});

describe("simulados longos", () => {
  const banco = [...Array.from({ length: 45 }, (_, i) => cn(91 + i)), ...Array.from({ length: 45 }, (_, i) => mt(136 + i)), cn(91, 2019), mt(136, 2019)];

  it("prova do 2º dia: CN e depois MT, na ordem oficial, só do ano", () => {
    const p = montarProvaDia2([...banco].reverse(), 2020);
    expect(p).toHaveLength(90);
    expect(p[0]!.numero).toBe(91);
    expect(p[44]!.area).toBe("natureza");
    expect(p[45]!.numero).toBe(136);
    expect(montarProvaDia2(banco, 2019)).toHaveLength(2);
  });

  it("bloco de 45: de um ano ou misturado, inéditas primeiro", () => {
    expect(montarBloco45({ questoes: banco, area: "natureza", ano: 2020 })).toHaveLength(45);
    const tentadas = new Set(["enem-2019-91"]);
    const misto = montarBloco45({ questoes: banco, area: "natureza", ano: null, tentadas });
    expect(misto).toHaveLength(45);
    expect(misto.some((q) => q.id === "enem-2019-91")).toBe(false);
  });

  it("bloco curto por competência (natureza)", () => {
    expect(montarBlocoAssunto({ questoes: banco, area: "natureza", chave: "C6" })).toHaveLength(10);
    expect(montarBlocoAssunto({ questoes: banco, area: "natureza", chave: "C8" })).toHaveLength(0);
  });

  it("correção por área; em branco conta como erro", () => {
    const qs = [cn(91, 2020, { gabarito: "A", tri: { a: 1, b: 0, c: 0.2 } }), mt(136, 2020, { gabarito: "B", tri: null })];
    const c = corrigirProva(qs, ["A", null]);
    expect(c.find((x) => x.area === "natureza")).toMatchObject({ acertos: 1, total: 1, respondidas: 1 });
    expect(c.find((x) => x.area === "natureza")!.nota?.itens).toBe(1);
    expect(c.find((x) => x.area === "matematica")).toMatchObject({ acertos: 0, total: 1, respondidas: 0, nota: null });
  });

  it("andamento salvo volta igual e rejeita lixo", () => {
    const a = novoAndamento({ tipo: "prova-dia2", titulo: "ENEM 2020 · 2º dia", questoes: banco.slice(0, 3), ano: 2020, duracaoSegundos: 18000, agora });
    const b = lerAndamento(serializarAndamento({ ...a, escolhas: ["A", null, "C"], indice: 2, usadosSegundos: 61 }));
    expect(b?.escolhas).toEqual(["A", null, "C"]);
    expect(b?.indice).toBe(2);
    expect(lerAndamento("{")).toBeNull();
    expect(lerAndamento(JSON.stringify({ ...a, escolhas: [] }))).toBeNull();
    expect(lerAndamento(null)).toBeNull();
  });
});

describe("cobertura dos ramos de área", () => {
  it("sprints por área (antigos = matemática; misto conta onde tem tentativa)", async () => {
    const { iniciarSprint } = await import("./estado");
    let e = estadoInicial(agora);
    e = iniciarSprint(e, ["enem-2020-136"], agora).estado;
    e = iniciarSprint(e, ["enem-2020-91"], agora, undefined, "natureza").estado;
    e = iniciarSprint(e, ["enem-2020-92"], agora, undefined, "misto").estado;
    const misto = e.sprints[2]!;
    e = { ...e, sprints: e.sprints.map((s) => (s.id === misto.id ? { ...s, tentativaIds: ["t9"] } : s)), tentativas: [tentativaFake({ id: "t9", habilidade: "CN-H1" })] };
    expect(filtrarEstadoPorArea(e, ["natureza"]).sprints.map((s) => s.area)).toEqual(["natureza", "misto"]);
    expect(filtrarEstadoPorArea(e, ["matematica"]).sprints.map((s) => s.area ?? "antigo")).toEqual(["antigo"]);
    expect(e.sprints[1]!.area).toBe("natureza");
  });

  it("limiar por área e relógio do andamento", async () => {
    const { limiarDaArea, questoesDaArea } = await import("./area");
    const { restanteSegundos } = await import("./prova");
    const qs = [cn(91, 2020, { tri: { a: 1, b: 2, c: 0.2 } }), mt(136, 2020, { tri: { a: 1, b: -1, c: 0.2 } }), cn(92, 2020, { tri: null })];
    expect(limiarDaArea(qs, "natureza")).toBe(2);
    expect(limiarDaArea(qs, "matematica")).toBe(-1);
    expect(questoesDaArea(qs, "natureza")).toHaveLength(2);
    const a = novoAndamento({ tipo: "completo-45", titulo: "x", questoes: qs, ano: null, duracaoSegundos: 100, agora });
    expect(restanteSegundos({ ...a, usadosSegundos: 40.4 })).toBe(60);
    expect(restanteSegundos({ ...a, usadosSegundos: 200 })).toBe(0);
  });

  it("encerrarSimulado grava áreas e ano", async () => {
    const { encerrarSimulado } = await import("./simulado");
    const r = encerrarSimulado(estadoInicial(agora), { tipo: "prova-dia2", iniciadoEm: agora.toISOString(), tentativaIds: [], areas: ["natureza", "matematica"], ano: 2020 }, agora);
    expect(r.simulado).toMatchObject({ areas: ["natureza", "matematica"], ano: 2020 });
    const s = encerrarSimulado(estadoInicial(agora), { tipo: "faceis-15", iniciadoEm: agora.toISOString(), tentativaIds: [] }, agora).simulado;
    expect(s.areas).toBeUndefined();
    expect(s.ano).toBeUndefined();
  });
});

describe("caderno e assunto", () => {
  it("caderno separado por área e bloco por assunto em matemática", () => {
    const entrada = { id: "c1", tentativaId: "t1", questaoId: "enem-2020-91", habilidade: "CN-H1" as const, escolha: null, gabarito: "A" as const, porQue: null, em: agora.toISOString(), resolvidaEm: null };
    const e = { ...estadoInicial(agora), caderno: [entrada], habilidades: { "CN-H1": novoEstadoHabilidade("CN-H1", agora), H2: novoEstadoHabilidade("H2", agora) } };
    expect(Object.keys(filtrarEstadoPorArea(e, ["natureza"]).habilidades)).toEqual(["CN-H1"]);
    expect(filtrarEstadoPorArea(e, ["natureza"]).caderno).toHaveLength(1);
    expect(filtrarEstadoPorArea(e, ["matematica"]).caderno).toHaveLength(0);
    const qs = [mt(136, 2020, { assuntos: ["porcentagem"] }), mt(137, 2020, { assuntos: ["probabilidade"] })];
    expect(montarBlocoAssunto({ questoes: qs, area: "matematica", chave: "porcentagem" }).map((q) => q.numero)).toEqual([136]);
  });
});
