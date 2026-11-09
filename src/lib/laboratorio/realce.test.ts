import { describe, expect, it } from "vitest";
import { EXEMPLOS_PYTHON, tokenizar } from "./realce";

describe("tokenizar (realce de Python)", () => {
  it("reproduz a entrada ao concatenar os tokens", () => {
    for (const ex of EXEMPLOS_PYTHON) {
      expect(tokenizar(ex.codigo).map((t) => t.texto).join("")).toBe(ex.codigo);
    }
    const esquisito = "x = 'a\\'b' + \"c\" # fim\n  ç = 1.5e3 + .5\n'''doc\nstring'''";
    expect(tokenizar(esquisito).map((t) => t.texto).join("")).toBe(esquisito);
  });

  it("classifica comentário, string, número, palavra-chave, builtin, nome e operador", () => {
    const tokens = tokenizar("x = symbols('x') # var\nif x: print(2.5)");
    const tipos = Object.fromEntries(tokens.filter((t) => t.tipo !== "texto").map((t) => [t.texto, t.tipo]));
    expect(tipos).toMatchObject({
      x: "nome",
      "=": "operador",
      symbols: "builtin",
      "'x'": "string",
      "# var": "comentario",
      if: "palavra",
      print: "builtin",
      "2.5": "numero",
    });
    expect(tokens.find((t) => t.texto === "\n")?.tipo).toBe("texto");
  });

  it("caracteres fora do alfabeto viram texto puro; string vazia dá lista vazia", () => {
    expect(tokenizar("")).toEqual([]);
    expect(tokenizar("ç§")).toEqual([{ tipo: "texto", texto: "ç§" }]);
    expect(tokenizar("a ç b").map((t) => t.tipo)).toEqual(["nome", "texto", "texto", "texto", "nome"]);
  });

  it("exemplos têm ids únicos e rótulos em pt-BR", () => {
    expect(new Set(EXEMPLOS_PYTHON.map((e) => e.id)).size).toBe(EXEMPLOS_PYTHON.length);
    expect(EXEMPLOS_PYTHON.map((e) => e.rotulo)).toContain("Probabilidade");
  });
});
