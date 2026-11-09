import { describe, expect, it } from "vitest";
import { carregarExplicacao, carregarExplicacoes } from "./explicacoes";
import { carregarQuestoes } from "./carregar";

describe("explicações de IA das questões oficiais", () => {
  it("cobrem as questões do banco, sem texto de erro do CLI", async () => {
    const todas = await carregarExplicacoes();
    const ids = new Set((await carregarQuestoes()).map((q) => q.id));
    const chaves = Object.keys(todas);
    expect(chaves.length).toBeGreaterThanOrEqual(600);
    for (const k of chaves) {
      expect(ids.has(k)).toBe(true);
      expect(todas[k]!.texto).not.toMatch(/^(You've hit your|API Error:)/);
      expect(todas[k]!.texto.length).toBeGreaterThan(50);
    }
  }, 30_000);

  it("marca as divergentes e devolve undefined para quem não tem", async () => {
    const todas = Object.values(await carregarExplicacoes());
    expect(todas.some((e) => e.divergente)).toBe(true);
    // gabarito do app antigo diferente do INEP: explicação excluída de propósito
    expect(await carregarExplicacao("enem-2021-139")).toBeUndefined();
  }, 30_000);
});
