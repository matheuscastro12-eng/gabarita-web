import { describe, expect, it } from "vitest";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { dicaCurada, fazerGemea, ferramentasTutor, saidaPythonSchema } from "./ferramentas";

const semCuradoria = questaoFake({ resolucao: undefined, assuntos: ["graficos-tabelas"] });
const comCuradoria = questaoFake({
  assuntos: ["porcentagem"],
  resolucao: {
    id: "enem-2023-136",
    gabarito: "C",
    assuntos: ["porcentagem"],
    habilidade: "H3",
    resolucao: "r".repeat(80),
    dicas: { dica1: "Dica curada 1.", dica2: "Dica curada 2.", dica3: "Dica curada 3." },
    erros_comuns: [{ alternativa: "B", por_que: "Multiplicou por 3." }],
    conceitos: ["x"],
    verificacao: { codigo_sympy: "x", resultado_esperado: "1" },
    classificacao: "revisada",
  },
});

describe("dicaCurada", () => {
  it("devolve a dica do degrau ou a resolução, e avisa quando não há curadoria", () => {
    expect(dicaCurada(comCuradoria, 2)).toEqual({ nivel: 2, texto: "Dica curada 2.", curada: true });
    expect(dicaCurada(comCuradoria, 4)).toMatchObject({ nivel: 4, curada: true });
    expect(dicaCurada(comCuradoria, 9).nivel).toBe(4);
    expect(dicaCurada(comCuradoria, -3).nivel).toBe(1);
    expect(dicaCurada(semCuradoria, 1)).toMatchObject({ texto: null, curada: false });
    expect(dicaCurada(semCuradoria, 1).motivo).toContain("curadoria");
  });
});

describe("fazerGemea", () => {
  it("usa o assunto da questão, aceita gerador explícito e rejeita desconhecido", () => {
    const a = fazerGemea(comCuradoria, 0);
    expect(a).toMatchObject({ ok: true, gemea: { gerador: "porcentagem" } });
    const b = fazerGemea(comCuradoria, 1);
    expect(a.ok && b.ok && a.gemea.id !== b.gemea.id).toBe(true);
    expect(fazerGemea(semCuradoria, 0)).toMatchObject({ ok: false });
    expect(fazerGemea(semCuradoria, 0, "escala")).toMatchObject({ ok: true, gemea: { gerador: "escala" } });
    expect(fazerGemea(semCuradoria, 0, "nada")).toMatchObject({ ok: false, motivo: expect.stringContaining("desconhecido") });
  });
});

describe("ferramentasTutor", () => {
  const f = ferramentasTutor(comCuradoria);
  const opcoes = { toolCallId: "c", messages: [] as never[], context: undefined } as never;
  it("expõe as 7 ferramentas; run_python e record_event sem execute", () => {
    expect(Object.keys(f).sort()).toEqual(["calc", "get_hint", "make_twin", "plot_function", "record_event", "run_python", "verify_answer"]);
    expect(f.run_python.execute).toBeUndefined();
    expect(f.record_event.execute).toBeUndefined();
  });
  it("executa as do servidor", async () => {
    await expect(f.verify_answer.execute!({ expressao: "3" }, opcoes)).resolves.toMatchObject({ gabarito: "C" });
    await expect(f.calc.execute!({ expressao: "2+2" }, opcoes)).resolves.toMatchObject({ ok: true, resultado: "4" });
    await expect(f.get_hint.execute!({ nivel: 1 }, opcoes)).resolves.toMatchObject({ texto: "Dica curada 1." });
    await expect(f.make_twin.execute!({}, opcoes)).resolves.toMatchObject({ ok: true });
    await expect(f.plot_function.execute!({ funcoes: [{ expressao: "x" }] }, opcoes)).resolves.toMatchObject({ xMin: -10, xMax: 10 });
    await expect(f.plot_function.execute!({ funcoes: [{ expressao: "x" }], parametros: [{ nome: "1a", min: 0, max: 1, valor: 0 }] }, opcoes)).resolves.toMatchObject({
      erro: expect.any(String),
    });
  });
  it("saidaPythonSchema valida a saída do cliente", () => {
    expect(saidaPythonSchema.safeParse({ ok: true, saida: "", resultado: "4", erro: null, ms: 10 }).success).toBe(true);
    expect(saidaPythonSchema.safeParse({ ok: true }).success).toBe(false);
  });
});
