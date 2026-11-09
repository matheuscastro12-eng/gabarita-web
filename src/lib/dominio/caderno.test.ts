import { describe, expect, it } from "vitest";
import { agruparPorHabilidade, errosAbertos, marcarResolvida, registrarErro } from "./caderno";
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
