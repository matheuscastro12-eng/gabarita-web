import { describe, expect, it } from "vitest";
import {
  calcular,
  compilarFuncao,
  normalizarExpressao,
  valorDaAlternativa,
  variaveisLivres,
  verificarEquivalencia,
  verificarResposta,
} from "./mathjs";
import { create, all } from "mathjs";

const math = create(all as NonNullable<typeof all>);

describe("normalizarExpressao", () => {
  it("converte notação brasileira e símbolos", () => {
    expect(normalizarExpressao("115 600.")).toBe("115600");
    expect(normalizarExpressao("1.234,5 × 2")).toBe("1234.5 * 2");
    expect(normalizarExpressao("R$ 28 900 ÷ 0,25")).toBe("28900 / 0.25");
    expect(normalizarExpressao("25%")).toBe("(25/100)");
    expect(normalizarExpressao("$\\frac{3}{20}$")).toBe("((3)/(20))");
    expect(normalizarExpressao("2 − 1")).toBe("2 - 1");
    expect(normalizarExpressao("\\sqrt{16} \\cdot 2")).toBe("sqrt(16) * 2");
  });
});

describe("calcular", () => {
  it("avalia expressões numéricas", () => {
    expect(calcular("28900 / 0,25")).toMatchObject({ ok: true, resultado: "115600" });
    expect(calcular("1/3")).toMatchObject({ ok: true, aproximado: "0.3333" });
    expect(calcular("25% * 400")).toMatchObject({ ok: true, resultado: "100" });
  });
  it("simplifica expressões com variáveis", () => {
    const r = calcular("2x + 3x");
    expect(r.ok).toBe(true);
    expect(r.resultado).toBe("5 * x");
  });
  it("devolve erro em vez de lançar", () => {
    expect(calcular("").ok).toBe(false);
    expect(calcular("2 +* 3")).toMatchObject({ ok: false });
    expect(calcular("2 +* 3").erro).toBeTruthy();
  });
});

describe("variaveisLivres", () => {
  it("ignora constantes e funções", () => {
    expect(variaveisLivres(math.parse("sin(x) + pi*y + e"))).toEqual(["x", "y"]);
    expect(variaveisLivres(math.parse("sqrt(2)"))).toEqual([]);
  });
});

describe("verificarEquivalencia", () => {
  it("detecta equivalência simbólica", () => {
    const r = verificarEquivalencia("(x+1)^2", "x^2 + 2x + 1");
    expect(r.equivalente).toBe(true);
    expect(["simbolico", "numerico"]).toContain(r.metodo);
    expect(r.variaveis).toEqual(["x"]);
  });
  it("detecta equivalência numérica que o simplify não pega", () => {
    const r = verificarEquivalencia("sin(x)^2 + cos(x)^2", "1");
    expect(r.equivalente).toBe(true);
  });
  it("rejeita expressões diferentes", () => {
    const r = verificarEquivalencia("2x + 1", "2x + 2");
    expect(r.equivalente).toBe(false);
    expect(r.metodo).toBe("numerico");
    expect(r.diferencaMax).toBeGreaterThan(0);
  });
  it("compara números com tolerância e notação brasileira", () => {
    expect(verificarEquivalencia("0,25", "1/4").equivalente).toBe(true);
    expect(verificarEquivalencia("3,14", "pi", 1e-2).equivalente).toBe(true);
    expect(verificarEquivalencia("3,14", "pi").equivalente).toBe(false);
  });
  it("ignora pontos fora do domínio e trata erros", () => {
    expect(verificarEquivalencia("sqrt(x)", "x^(1/2)").equivalente).toBe(true);
    expect(verificarEquivalencia("2 +* 3", "1")).toMatchObject({ equivalente: false, metodo: "nenhum" });
    expect(verificarEquivalencia("[1,2]", "1")).toMatchObject({ equivalente: false, metodo: "nenhum" });
    expect(verificarEquivalencia("sqrt(-x^2-1)", "1")).toMatchObject({ equivalente: false, metodo: "nenhum" });
  });
});

describe("valorDaAlternativa", () => {
  it("extrai números de textos do ENEM", () => {
    expect(valorDaAlternativa("115 600.")).toBe(115600);
    expect(valorDaAlternativa("R$ 1.250,00")).toBe(1250);
    expect(valorDaAlternativa("25%")).toBe(0.25);
    expect(valorDaAlternativa("12 km")).toBe(12);
    expect(valorDaAlternativa("$\\frac{3}{20}$")).toBeCloseTo(0.15);
    expect(valorDaAlternativa("x = 7")).toBe(7);
  });
  it("devolve null para alternativas textuais", () => {
    expect(valorDaAlternativa("o dobro da anterior")).toBeNull();
    expect(valorDaAlternativa("")).toBeNull();
    expect(valorDaAlternativa("3 litros de água mineral")).toBeNull();
    expect(valorDaAlternativa("2x + 1")).toBeNull();
  });
});

describe("verificarResposta", () => {
  const questao = {
    gabarito: "C" as const,
    alternativas: [
      { letra: "A" as const, texto: "16 514." },
      { letra: "B" as const, texto: "86 700." },
      { letra: "C" as const, texto: "115 600." },
      { letra: "D" as const, texto: "441 343." },
      { letra: "E" as const, texto: "448 568." },
    ],
  };
  it("bate quando o valor corresponde ao gabarito", () => {
    const r = verificarResposta(questao, "28900 / 0,25");
    expect(r).toMatchObject({ bateu: true, letraCorrespondente: "C", gabarito: "C", valorCalculado: "115600" });
    expect(r.observacao).toContain("gabarito oficial");
  });
  it("não bate quando corresponde a outra alternativa (erro típico)", () => {
    const r = verificarResposta(questao, "28900 * 3");
    expect(r).toMatchObject({ bateu: false, letraCorrespondente: "B" });
    expect(r.observacao).toContain("alternativa B");
  });
  it("não bate quando não corresponde a nenhuma", () => {
    expect(verificarResposta(questao, "12345")).toMatchObject({ bateu: false, letraCorrespondente: null });
  });
  it("expressão inválida", () => {
    const r = verificarResposta(questao, "2 +* 3");
    expect(r).toMatchObject({ bateu: false, metodo: "nenhum", valorCalculado: null });
  });
});

describe("compilarFuncao", () => {
  it("aceita y = 2x + 3 e parâmetros", () => {
    const f = compilarFuncao("y = 2x + 3");
    expect(f({ x: 1 })).toBe(5);
    const g = compilarFuncao("a*x^2 + b");
    expect(g({ x: 2, a: 3, b: 1 })).toBe(13);
    expect(Number.isNaN(compilarFuncao("[x, 1]")({ x: 1 }))).toBe(true);
  });
  it("lança em expressão inválida", () => {
    expect(() => compilarFuncao("2 +* x")).toThrow();
  });
});
