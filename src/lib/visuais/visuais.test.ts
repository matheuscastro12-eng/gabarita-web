import { describe, expect, it } from "vitest";
import { aplicarVariacoes, fator, porcentagemDe, quadradosPintados, variacaoEquivalente } from "./porcentagem";
import { pelaUnidade, regraDeTresDireta, regraDeTresInversa } from "./proporcao";
import { fatias, fracaoDe, mdc, simplificar, somar } from "./fracoes";
import { destinoAoOrdenar, indicesMediana, media, mediana, moda, ordenar } from "./estatistica";
import { converter, converterArea, degraus, escalaParaKm } from "./unidades";
import { areaRetangulo, celulasPreenchidas, perimetroRetangulo } from "./geometria";
import { facesDoDado, probabilidade } from "./probabilidade";
import { passoAnterior, proximoPasso, rotuloPasso } from "./passos";
import { infoVisual, VISUAIS, visualParaAssuntos } from "./catalogo";
import { ASSUNTOS } from "@/data/taxonomia";

describe("porcentagem", () => {
  it("pinta os quadradinhos presos a 0..100", () => {
    expect(quadradosPintados(35)).toBe(35);
    expect(quadradosPintados(-3)).toBe(0);
    expect(quadradosPintados(140)).toBe(100);
    expect(quadradosPintados(12.6)).toBe(13);
  });
  it("calcula p% de um valor e o fator", () => {
    expect(porcentagemDe(20, 150)).toBe(30);
    expect(fator(20)).toBe(1.2);
    expect(fator(-15)).toBe(0.85);
  });
  it("aumento e desconto em sequência não se anulam", () => {
    expect(aplicarVariacoes(200, [10, -10])).toBe(198);
    expect(variacaoEquivalente([10, -10])).toBe(-1);
    expect(variacaoEquivalente([20, 20])).toBe(44);
  });
});

describe("proporção", () => {
  it("regra de três direta e inversa", () => {
    expect(regraDeTresDireta(3, 12, 5)).toBe(20);
    expect(regraDeTresInversa(4, 6, 3)).toBe(8);
    expect(() => regraDeTresDireta(0, 1, 1)).toThrow();
    expect(() => regraDeTresInversa(1, 1, 0)).toThrow();
  });
  it("redução à unidade", () => {
    expect(pelaUnidade(3, 12, 5)).toEqual({ unitario: 4, resultado: 20 });
  });
});

describe("frações", () => {
  it("mdc, simplificação e soma", () => {
    expect(mdc(12, 18)).toBe(6);
    expect(mdc(0, 0)).toBe(1);
    expect(simplificar(6, 8)).toEqual({ n: 3, d: 4 });
    expect(simplificar(2, -4)).toEqual({ n: -1, d: 2 });
    expect(somar({ n: 1, d: 2 }, { n: 1, d: 3 })).toEqual({ n: 5, d: 6 });
    expect(() => simplificar(1, 0)).toThrow();
  });
  it("fração de uma quantidade e as fatias pintadas", () => {
    expect(fracaoDe(3, 4, 80)).toBe(60);
    expect(fatias(2, 5)).toEqual([true, true, false, false, false]);
  });
});

describe("estatística", () => {
  const notas = [7, 3, 9, 5, 5];
  it("média, ordenação e mediana ímpar", () => {
    expect(media(notas)).toBe(5.8);
    expect(ordenar(notas)).toEqual([3, 5, 5, 7, 9]);
    expect(mediana(notas)).toBe(5);
    expect(indicesMediana(5)).toEqual([2]);
  });
  it("mediana par é a média dos dois do meio", () => {
    expect(mediana([8, 2, 6, 4])).toBe(5);
    expect(indicesMediana(4)).toEqual([1, 2]);
    expect(indicesMediana(0)).toEqual([]);
  });
  it("moda, bimodal e amodal", () => {
    expect(moda(notas)).toEqual([5]);
    expect(moda([1, 1, 2, 2, 3])).toEqual([1, 2]);
    expect(moda([1, 2, 3])).toEqual([]);
    expect(moda([4, 4])).toEqual([4]);
  });
  it("destino de cada ponto ao ordenar (estável)", () => {
    expect(destinoAoOrdenar([7, 3, 9, 5, 5])).toEqual([3, 0, 4, 1, 2]);
  });
  it("lista vazia é erro", () => {
    expect(() => media([])).toThrow();
    expect(() => mediana([])).toThrow();
  });
});

describe("unidades e escala", () => {
  it("escada do metro", () => {
    expect(degraus("km", "m")).toBe(3);
    expect(converter(2.5, "km", "m")).toBe(2500);
    expect(converter(350, "cm", "m")).toBe(3.5);
  });
  it("escala 1:50 000: 4 cm no mapa = 2 km", () => {
    expect(escalaParaKm(4, 50_000)).toBe(2);
  });
  it("área anda de 100 em 100", () => {
    expect(converterArea(1, "m", "cm")).toBe(10_000);
  });
});

describe("área e perímetro", () => {
  it("retângulo 6×4", () => {
    expect(areaRetangulo(6, 4)).toBe(24);
    expect(perimetroRetangulo(6, 4)).toBe(20);
    expect(celulasPreenchidas(6, 4, 30)).toBe(24);
    expect(celulasPreenchidas(6, 4, -1)).toBe(0);
  });
});

describe("probabilidade", () => {
  it("favoráveis sobre possíveis", () => {
    expect(probabilidade(3, 12)).toEqual({ n: 1, d: 4, porcento: 25 });
    expect(facesDoDado((f) => f % 2 === 0)).toEqual([2, 4, 6]);
    expect(() => probabilidade(1, 0)).toThrow();
    expect(() => probabilidade(5, 4)).toThrow();
  });
});

describe("passos", () => {
  it("avança e volta sem sair do intervalo", () => {
    expect(proximoPasso(0, 3)).toBe(1);
    expect(proximoPasso(2, 3)).toBe(2);
    expect(passoAnterior(0)).toBe(0);
    expect(passoAnterior(2)).toBe(1);
    expect(rotuloPasso(1, 4)).toBe("Passo 2 de 4");
  });
});

describe("catálogo", () => {
  it("todo assunto citado existe na taxonomia", () => {
    const ids = new Set(ASSUNTOS.map((a) => a.id));
    for (const v of VISUAIS) for (const a of v.assuntos) expect(ids.has(a)).toBe(true);
  });
  it("acha o visual pelo primeiro assunto que tem visual", () => {
    expect(visualParaAssuntos(["funcao-afim", "porcentagem"])).toBe("porcentagem");
    expect(visualParaAssuntos(["trigonometria"])).toBeNull();
    expect(infoVisual("area").titulo).toMatch(/Área/);
  });
});
