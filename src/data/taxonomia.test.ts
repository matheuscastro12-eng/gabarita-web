import { describe, expect, it } from "vitest";
import { HABILIDADES, competenciaDa } from "./tipos";
import { ASSUNTOS, ASSUNTOS_DE_FOCO, COMPETENCIAS, assuntoPorId, nomeAssunto } from "./taxonomia";

describe("taxonomia (espelho do PROVAS)", () => {
  it("as 7 competências cobrem H1–H30 sem repetir, coerentes com competenciaDa", () => {
    const todas = COMPETENCIAS.flatMap((c) => c.habilidades);
    expect([...todas].sort()).toEqual([...HABILIDADES].sort());
    for (const c of COMPETENCIAS) for (const h of c.habilidades) expect(competenciaDa(h)).toBe(c.id);
  });

  it("assuntos têm ids únicos, habilidades válidas e 15 de foco inicial", () => {
    expect(new Set(ASSUNTOS.map((a) => a.id)).size).toBe(ASSUNTOS.length);
    const validas = new Set<string>(HABILIDADES);
    for (const a of ASSUNTOS) for (const h of a.habilidades) expect(validas.has(h)).toBe(true);
    expect(ASSUNTOS_DE_FOCO).toHaveLength(15);
  });

  it("assuntoPorId e nomeAssunto", () => {
    expect(assuntoPorId("porcentagem")?.nome).toBe("Porcentagem");
    expect(assuntoPorId("nada")).toBeUndefined();
    expect(nomeAssunto("graficos-tabelas")).toBe("Gráficos e tabelas");
    expect(nomeAssunto("slug-desconhecido")).toBe("slug desconhecido");
  });
});
