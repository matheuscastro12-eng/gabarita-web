import { describe, expect, it } from "vitest";
import { calcular } from "@/lib/tutor/mathjs";
import { comFallbackMathjs, ehErroDeCarga, expressaoParaMathjs, mensagemErroCarga, NOTA_MATHJS, saidaViaMathjs } from "./fallback";

describe("expressaoParaMathjs", () => {
  it("traduz a última linha útil (Rational, **, comentários)", () => {
    expect(expressaoParaMathjs("# conta\n28900 / Rational(25, 100)")).toBe("28900 / (25/100)");
    expect(expressaoParaMathjs("2**10")).toBe("2^10");
    expect(expressaoParaMathjs("sqrt(16) + pi * 0")).toBe("sqrt(16) + pi * 0");
    expect(expressaoParaMathjs("E**0 + 1")).toBe("e^0 + 1");
  });

  it("recusa o que depende do Python ou do SymPy", () => {
    expect(expressaoParaMathjs("")).toBeNull();
    expect(expressaoParaMathjs("# só comentário")).toBeNull();
    expect(expressaoParaMathjs("x = 2\nx + 1")).toBeNull();
    expect(expressaoParaMathjs("from sympy import *\n2 + 2")).toBeNull();
    expect(expressaoParaMathjs("solve(Eq(x, 2), x)")).toBeNull();
    expect(expressaoParaMathjs("print(2 + 2)")).toBeNull();
    expect(expressaoParaMathjs("[1, 2, 3]")).toBeNull();
    expect(expressaoParaMathjs("a + b")).toBeNull();
    expect(expressaoParaMathjs("1 == 1 and 2")).toBeNull();
  });

  it("aceita comparação (==) nas linhas anteriores sem tratar como atribuição", () => {
    expect(expressaoParaMathjs("1 == 1\n3 * 4")).toBe("3 * 4");
  });
});

describe("saidaViaMathjs", () => {
  it("devolve a saída no formato do run_python com a nota", () => {
    const s = saidaViaMathjs("28900 / Rational(25, 100)", calcular, 7);
    expect(s).toEqual({ ok: true, saida: NOTA_MATHJS, resultado: "115600", erro: null, ms: 7 });
  });

  it("inclui a aproximação decimal quando há", () => {
    const s = saidaViaMathjs("1/3", calcular);
    expect(s?.resultado).toMatch(/≈ 0\.3333$/);
  });

  it("null quando não dá para traduzir ou o mathjs falha", () => {
    expect(saidaViaMathjs("x = 1\nx", calcular)).toBeNull();
    expect(saidaViaMathjs("1 +", calcular)).toBeNull();
    expect(saidaViaMathjs("2 + 2", () => ({ ok: true, expressao: "2 + 2" }))).toBeNull();
  });
});

describe("erro de carga e fallback", () => {
  const carga = { ok: false, saida: "", resultado: null, erro: mensagemErroCarga("NetworkError"), ms: 3 };

  it("mensagem reconhecível, com e sem detalhe", () => {
    expect(ehErroDeCarga(carga)).toBe(true);
    expect(carga.erro).toContain("(NetworkError)");
    expect(mensagemErroCarga()).not.toContain("(NetworkError)");
    expect(mensagemErroCarga("  ")).toBe(mensagemErroCarga());
    expect(ehErroDeCarga({ ok: false, erro: "NameError" })).toBe(false);
    expect(ehErroDeCarga({ ok: true, erro: null })).toBe(false);
  });

  it("comFallbackMathjs: só age na falha de carga e preserva o erro quando não resolve", () => {
    const ok = { ok: true, saida: "", resultado: "4", erro: null, ms: 1 };
    expect(comFallbackMathjs("2 + 2", ok, calcular)).toBe(ok);
    expect(comFallbackMathjs("2 + 2", carga, calcular)).toEqual({ ok: true, saida: NOTA_MATHJS, resultado: "4", erro: null, ms: 3 });
    expect(comFallbackMathjs("solve(x)", carga, calcular)).toBe(carga);
  });
});
