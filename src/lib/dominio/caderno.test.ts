import { describe, expect, it } from "vitest";
import { estadoInicial } from "./estado";
import { novoEstadoHabilidade } from "./evidencia";
import { revisarCartao } from "./revisao";
import { agruparPorHabilidade, errosAbertos, marcarResolvida, registrarErro, listarCaderno } from "./caderno";
import { tentativaFake } from "./teste-fixtures";

const t0 = new Date(2026, 10, 9, 10);
const t1 = new Date(2026, 10, 10, 10);

describe("caderno", () => {
  const erro1 = tentativaFake({ id: "t1", acertou: false, escolha: "A" });
  const erro2 = tentativaFake({ id: "t2", questaoId: "enem-2023-140", habilidade: "H24", acertou: false });

  it("registra sem duplicar a mesma tentativa", () => {
    const c1 = registrarErro([], erro1, "confundiu razão", t0);
    expect(c1).toEqual([
      {
        id: "erro-t1",
        tentativaId: "t1",
        questaoId: erro1.questaoId,
        habilidade: "H16",
        escolha: "A",
        gabarito: "C",
        porQue: "confundiu razão",
        em: t0.toISOString(),
        resolvidaEm: null,
      },
    ]);
    expect(registrarErro(c1, erro1, null, t1)).toBe(c1);
  });

  it("marca resolvidas só as abertas da questão", () => {
    let c = registrarErro([], erro1, null, t0);
    c = registrarErro(c, erro2, null, t0);
    c = marcarResolvida(c, erro1.questaoId, t1);
    expect(c[0]!.resolvidaEm).toBe(t1.toISOString());
    expect(c[1]!.resolvidaEm).toBeNull();
    const depois = marcarResolvida(c, erro1.questaoId, new Date(2027, 0, 1));
    expect(depois[0]!.resolvidaEm).toBe(t1.toISOString());
    expect(errosAbertos(depois).map((e) => e.id)).toEqual(["erro-t2"]);
  });

  it("agrupa por habilidade", () => {
    let c = registrarErro([], erro1, null, t0);
    c = registrarErro(c, erro2, null, t0);
    c = registrarErro(c, tentativaFake({ id: "t3", acertou: false }), null, t0);
    const g = agruparPorHabilidade(c);
    expect(Object.keys(g).sort()).toEqual(["H16", "H24"]);
    expect(g.H16).toHaveLength(2);
    expect(agruparPorHabilidade([])).toEqual({});
  });
});

describe("listarCaderno", () => {
  it("abertas primeiro (mais recentes no topo), depois resolvidas; marca revisão vencida e repetições", () => {
    const agora = new Date(2026, 10, 9, 10);
    const antigo = new Date(2026, 0, 1);
    const h16 = novoEstadoHabilidade("H16", antigo);
    const estado = {
      ...estadoInicial(agora),
      habilidades: { H16: { ...h16, cartao: revisarCartao(h16.cartao, "good", antigo) } },
      caderno: [
        { id: "e1", tentativaId: "t1", questaoId: "q1", habilidade: "H16" as const, escolha: "A" as const, gabarito: "C" as const, porQue: null, em: "2026-11-01T10:00:00.000Z", resolvidaEm: "2026-11-02T10:00:00.000Z" },
        { id: "e2", tentativaId: "t2", questaoId: "q1", habilidade: "H16" as const, escolha: "B" as const, gabarito: "C" as const, porQue: "x", em: "2026-11-03T10:00:00.000Z", resolvidaEm: null },
        { id: "e3", tentativaId: "t3", questaoId: "q2", habilidade: "H24" as const, escolha: null, gabarito: "D" as const, porQue: null, em: "2026-11-04T10:00:00.000Z", resolvidaEm: null },
      ],
    };
    const lista = listarCaderno(estado, agora);
    expect(lista.map((e) => e.id)).toEqual(["e3", "e2", "e1"]);
    expect(lista.map((e) => e.revisaoVencida)).toEqual([false, true, true]);
    expect(lista.map((e) => e.vezes)).toEqual([1, 2, 2]);
  });

  it("entradas com a mesma data mantêm a ordem estável", () => {
    const agora = new Date(2026, 10, 9, 10);
    const e = (id: string) => ({ id, tentativaId: id, questaoId: id, habilidade: "H3" as const, escolha: null, gabarito: "A" as const, porQue: null, em: "2026-11-04T10:00:00.000Z", resolvidaEm: null });
    const lista = listarCaderno({ ...estadoInicial(agora), caderno: [e("a"), e("b")] }, agora);
    expect(lista.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
