import { describe, expect, it } from "vitest";
import { arquivoQuestoesSchema } from "./tipos";
import { areaDaPosicao, areaDoId, carregarQuestao, carregarQuestoes, origemDosDados, TOTAL_NATUREZA } from "./carregar";

/**
 * Estes testes valem tanto com o fixture (5 questões) quanto com o snapshot
 * real do PROVAS (centenas): conferem a forma dos dados, não a quantidade.
 */
describe("carregar", () => {
  it("carregarQuestoes devolve questões válidas, com ids únicos", async () => {
    const questoes = await carregarQuestoes();
    expect(questoes.length).toBeGreaterThanOrEqual(5);
    expect(new Set(questoes.map((q) => q.id)).size).toBe(questoes.length);
    expect(arquivoQuestoesSchema.safeParse(questoes).success).toBe(true);
  });

  it("inclui as questões reais do ENEM 2023 usadas no fixture", async () => {
    const questoes = await carregarQuestoes();
    const ids = new Set(questoes.map((q) => q.id));
    for (const id of ["enem-2023-143", "enem-2023-162", "enem-2023-167", "enem-2023-171", "enem-2023-180"]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("cacheia em memória (mesma instância)", async () => {
    expect(await carregarQuestoes()).toBe(await carregarQuestoes());
  });

  it("carregarQuestao acha por id e devolve undefined para id inexistente", async () => {
    const q = await carregarQuestao("enem-2023-162");
    expect(q?.gabarito).toBe("D");
    expect(q?.numero).toBe(162);
    expect(await carregarQuestao("enem-2023-999")).toBeUndefined();
  });

  it("origemDosDados é coerente com o manifesto", async () => {
    const origem = origemDosDados();
    const questoes = await carregarQuestoes();
    expect(origem.matematica).toBe(questoes.length);
    expect(origem.total).toBe(origem.matematica + origem.natureza);
    expect(origem.fixture ? origem.origem.startsWith("fixture:") : origem.origem.length > 0).toBe(true);
  });
});

describe("natureza", () => {
  it("672 questões de CN: 45 por ano, 42 em 2019 (faltam 3 na fonte)", async () => {
    const qs = await carregarQuestoes(["natureza"]);
    expect(qs).toHaveLength(TOTAL_NATUREZA);
    const porAno = new Map<number, number>();
    for (const q of qs) porAno.set(q.ano, (porAno.get(q.ano) ?? 0) + 1);
    for (let ano = 2009; ano <= 2023; ano++) expect(porAno.get(ano)).toBe(ano === 2019 ? 42 : 45);
    expect(qs.every((q) => q.area === "natureza" && q.dia === 2)).toBe(true);
    expect(arquivoQuestoesSchema.safeParse(qs).success).toBe(true);
  }, 30_000);

  it("a área de cada questão de CN bate com a posição na prova", async () => {
    const qs = await carregarQuestoes(["natureza"]);
    for (const q of qs) {
      expect(areaDaPosicao(q.ano, q.numero)).toBe("CN");
      expect(areaDoId(q.id)).toBe("natureza");
    }
  }, 30_000);

  it("habilidades com prefixo CN, competência da matriz CN e TRI na maioria", async () => {
    const qs = await carregarQuestoes(["natureza"]);
    const comHab = qs.filter((q) => q.habilidade);
    expect(comHab.every((q) => /^CN-H([1-9]|[12]\d|30)$/.test(q.habilidade!))).toBe(true);
    expect(comHab.every((q) => /^C[1-8]$/.test(q.competencia!))).toBe(true);
    expect(qs.filter((q) => q.tri).length).toBeGreaterThanOrEqual(600);
    expect(qs.every((q) => q.imagens.every((u) => u.startsWith("/questoes/natureza/")))).toBe(true);
  }, 30_000);

  it("carregarQuestao acha uma de natureza e as áreas juntas não repetem id", async () => {
    expect((await carregarQuestao("enem-2020-100"))?.area).toBe("natureza");
    const todas = await carregarQuestoes(["natureza", "matematica"]);
    expect(new Set(todas.map((q) => q.id)).size).toBe(todas.length);
  }, 30_000);
});

describe("areaDaPosicao", () => {
  it("2009 = CN, CH, LC, MT; 2010 a 2016 = CH, CN, LC, MT; 2017+ = LC, CH, CN, MT", () => {
    expect([1, 46, 91, 136].map((n) => areaDaPosicao(2009, n))).toEqual(["CN", "CH", "LC", "MT"]);
    expect([1, 46, 91, 136].map((n) => areaDaPosicao(2013, n))).toEqual(["CH", "CN", "LC", "MT"]);
    expect([1, 46, 91, 136].map((n) => areaDaPosicao(2017, n))).toEqual(["LC", "CH", "CN", "MT"]);
    expect(areaDaPosicao(2016, 90)).toBe("CN");
    expect(areaDaPosicao(2016, 91)).toBe("LC");
    expect(areaDoId("enem-2023-136")).toBe("matematica");
    expect(areaDoId("enem-2023-10")).toBeNull();
    expect(areaDoId("apostas-2026-07")).toBeNull();
  });
});
