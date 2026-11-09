import { describe, expect, it } from "vitest";
import { extrairFuncao, normalizarPlot } from "./plot";

describe("normalizarPlot", () => {
  it("aplica padrões e corrige limites", () => {
    const s = normalizarPlot({ funcoes: [{ expressao: "x" }], xMin: 5, xMax: -5, parametros: [{ nome: "a", min: 3, max: 1, valor: 9 }] });
    expect(s.xMin).toBe(-5);
    expect(s.xMax).toBe(5);
    expect(s.parametros[0]).toMatchObject({ min: 1, max: 3, valor: 3 });
    const d = normalizarPlot({ funcoes: [{ expressao: "x" }], xMin: 2, xMax: 2 });
    expect(d.xMax).toBe(3);
    expect(d.pontos).toEqual([]);
  });
  it("rejeita spec inválida", () => {
    expect(() => normalizarPlot({ funcoes: [] })).toThrow();
  });
});

describe("extrairFuncao", () => {
  it("entende pedidos em linguagem natural", () => {
    expect(extrairFuncao("gráfico de y = 2x + 3")?.funcoes[0]?.expressao).toBe("2x + 3");
    expect(extrairFuncao("Plote f(x)=x^2-4")?.funcoes[0]?.expressao).toBe("x^2-4");
    expect(extrairFuncao("desenha a função 3x+1, por favor")?.funcoes[0]?.expressao).toBe("3x+1");
    expect(extrairFuncao("me mostra o gráfico da função y=x^2")?.funcoes[0]?.expressao).toBe("x^2");
  });
  it("cria sliders para parâmetros", () => {
    const s = extrairFuncao("gráfico de a*x + b");
    expect(s?.parametros.map((p) => p.nome)).toEqual(["a", "b"]);
  });
  it("devolve null quando não é pedido de gráfico ou não tem x", () => {
    expect(extrairFuncao("por que errei?")).toBeNull();
    expect(extrairFuncao("gráfico de 2 + 3")).toBeNull();
    expect(extrairFuncao("gráfico de")).toBeNull();
    expect(extrairFuncao("gráfico de velocidade contra tempo")).toBeNull();
    expect(extrairFuncao("gráfico de x + w*z")).toBeNull();
  });
});
