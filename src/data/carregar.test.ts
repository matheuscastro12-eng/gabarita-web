import { describe, expect, it } from "vitest";
import { arquivoQuestoesSchema } from "./tipos";
import { carregarQuestao, carregarQuestoes, origemDosDados } from "./carregar";

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
    expect(origem.total).toBe(questoes.length);
    expect(origem.fixture ? origem.origem.startsWith("fixture:") : origem.origem.length > 0).toBe(true);
  });
});
