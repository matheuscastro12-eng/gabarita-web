import { describe, expect, it } from "vitest";
import { COMPETENCIAS, COMPETENCIAS_CN, competenciasDaArea } from "./taxonomia";
import { areaDaHabilidade, competenciaDa, exibirHabilidade, habilidadesDaArea, NOME_HABILIDADE, ordemHabilidade, rotuloHabilidade } from "./tipos";

describe("matriz de Ciências da Natureza", () => {
  it("tem C1 a C8 cobrindo CN-H1 a CN-H30 uma vez cada, na ordem", () => {
    expect(COMPETENCIAS_CN.map((c) => c.id)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]);
    const todas = COMPETENCIAS_CN.flatMap((c) => c.habilidades);
    expect(todas).toEqual(habilidadesDaArea("natureza"));
    expect(todas.every((h) => h.startsWith("CN-"))).toBe(true);
  });

  it("C6, C7 e C8 são física, química e biologia (H20–23, H24–27, H28–30)", () => {
    const [c6, c7, c8] = COMPETENCIAS_CN.slice(5);
    expect([c6!.nome, c7!.nome, c8!.nome]).toEqual(["Física", "Química", "Biologia"]);
    expect(c6!.habilidades).toEqual(["CN-H20", "CN-H21", "CN-H22", "CN-H23"]);
    expect(c8!.habilidades).toEqual(["CN-H28", "CN-H29", "CN-H30"]);
  });

  it("competenciaDa usa a matriz certa para cada prefixo, sem misturar Hn", () => {
    for (const c of COMPETENCIAS_CN) for (const h of c.habilidades) expect(competenciaDa(h)).toBe(c.id);
    for (const c of COMPETENCIAS) for (const h of c.habilidades) expect(competenciaDa(h)).toBe(c.id);
    // H20 é C5 em matemática e C6 em natureza
    expect(competenciaDa("H20")).toBe("C5");
    expect(competenciaDa("CN-H20")).toBe("C6");
  });

  it("nomes, rótulos e ordem", () => {
    for (const h of habilidadesDaArea("natureza")) expect(NOME_HABILIDADE[h]).toBeTruthy();
    expect(NOME_HABILIDADE.H1).toBe("Sistemas de numeração");
    expect(areaDaHabilidade("CN-H3")).toBe("natureza");
    expect(areaDaHabilidade("H3")).toBe("matematica");
    expect(rotuloHabilidade("CN-H3")).toBe("H3");
    expect(rotuloHabilidade("CN-H3", true)).toBe("CN H3");
    expect(rotuloHabilidade("H3", true)).toBe("MT H3");
    expect(exibirHabilidade("CN-H3")).toBe("CN H3");
    expect(ordemHabilidade("H30")).toBeLessThan(ordemHabilidade("CN-H1"));
    expect(competenciasDaArea("matematica")).toBe(COMPETENCIAS);
    expect(competenciasDaArea("natureza")).toBe(COMPETENCIAS_CN);
  });
});
