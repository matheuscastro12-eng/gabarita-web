import { describe, expect, it } from "vitest";
import { arquivoQuestoesSchema, competenciaDa } from "../tipos";
import fixture from "./fixture.json";

describe("fixture.json", () => {
  const questoes = arquivoQuestoesSchema.parse(fixture);

  it("tem as 5 questões esperadas, com os gabaritos oficiais", () => {
    expect(questoes.map((q) => [q.id, q.gabarito])).toEqual([
      ["enem-2023-143", "B"],
      ["enem-2023-162", "D"],
      ["enem-2023-167", "A"],
      ["enem-2023-171", "C"],
      ["enem-2023-180", "C"],
    ]);
  });

  it("não inventa TRI e todas têm habilidade heurística coerente com a competência", () => {
    for (const q of questoes) {
      expect(q.tri).toBeNull();
      expect(q.dificuldade_estimada).toBeNull();
      expect(q.habilidade).toMatch(/^H\d+$/);
      expect(q.habilidade_origem).toBe("heuristica");
      expect(q.competencia).toBe(competenciaDa(q.habilidade!));
      expect(q.fonte.transcricao_url).toBe(`https://api.enem.dev/v1/exams/2023/questions/${q.numero}`);
      expect(q.alternativas).toHaveLength(5);
    }
  });
});
