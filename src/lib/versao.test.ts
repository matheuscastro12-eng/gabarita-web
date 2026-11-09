import { describe, expect, it } from "vitest";
import { areasDaVersao, ehVersao, itemVisivel, nomeCompleto, textoApostas, versaoInicial } from "./versao";

describe("versões do app", () => {
  it("quem já usa (tem progresso) cai em Matemática sem a tela de entrada", () => {
    expect(versaoInicial(null, true)).toBe("matematica");
    expect(versaoInicial(null, false)).toBeNull();
  });

  it("a escolha salva vale, e lixo no localStorage é ignorado", () => {
    expect(versaoInicial("natureza", true)).toBe("natureza");
    expect(versaoInicial("geral", false)).toBe("geral");
    expect(versaoInicial("humanas", false)).toBeNull();
    expect(ehVersao("geral")).toBe(true);
    expect(ehVersao(3)).toBe(false);
  });

  it("áreas de cada versão", () => {
    expect(areasDaVersao("matematica")).toEqual(["matematica"]);
    expect(areasDaVersao("natureza")).toEqual(["natureza"]);
    expect(areasDaVersao("geral")).toEqual(["natureza", "matematica"]);
  });

  it("Resumos e Aprender só aparecem em Matemática", () => {
    expect(itemVisivel("/resumos", "matematica")).toBe(true);
    expect(itemVisivel("/resumos", "natureza")).toBe(false);
    expect(itemVisivel("/aprender", "geral")).toBe(false);
    expect(itemVisivel("/mapa", "natureza")).toBe(true);
    expect(nomeCompleto("natureza")).toBe("Gabarita · Natureza");
  });

  it("card das Apostas filtrado pela área", () => {
    expect(textoApostas("natureza")).toMatch(/14/);
    expect(textoApostas("geral")).toMatch(/14 de CN e 18 de MT/);
    expect(textoApostas("matematica")).toMatch(/50/);
  });
});
