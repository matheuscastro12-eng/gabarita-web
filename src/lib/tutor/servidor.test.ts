import { describe, expect, it } from "vitest";
import { simulateReadableStream, type UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import type { Questao } from "@/data/tipos";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { responderTutor } from "./servidor";

const questao: Questao = questaoFake({
  id: "enem-2022-154",
  enunciado: "Queda de 75% para 28 900 vagas. Quantas em 2012?",
  alternativas: [
    { letra: "A", texto: "16 514." },
    { letra: "B", texto: "86 700." },
    { letra: "C", texto: "115 600." },
    { letra: "D", texto: "441 343." },
    { letra: "E", texto: "448 568." },
  ],
  gabarito: "C",
});
const buscarQuestao = async (id: string) => (id === questao.id ? questao : undefined);

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const fim = (unified: "stop" | "tool-calls"): LanguageModelV4StreamPart => ({ type: "finish", finishReason: { unified, raw: undefined }, usage });
const texto = (t: string): LanguageModelV4StreamPart[] => [
  { type: "text-start", id: "t1" },
  ...t.split(" ").map((p, i, arr): LanguageModelV4StreamPart => ({ type: "text-delta", id: "t1", delta: i < arr.length - 1 ? `${p} ` : p })),
  { type: "text-end", id: "t1" },
];
const chamada = (toolName: string, input: Record<string, unknown>, id = "c1"): LanguageModelV4StreamPart => ({
  type: "tool-call",
  toolCallId: id,
  toolName,
  input: JSON.stringify(input),
});

function mock(passos: LanguageModelV4StreamPart[][]) {
  return new MockLanguageModelV4({
    doStream: passos.map((chunks) => ({ stream: simulateReadableStream({ chunks }) })),
  });
}

function mensagem(textoAluno: string): UIMessage {
  return { id: "u1", role: "user", parts: [{ type: "text", text: textoAluno }] };
}

function corpo(extras: Partial<{ degrau: 0 | 1 | 2 | 3 | 4; confirmada: boolean; pedidoResposta: boolean; questaoId: string }> = {}) {
  return {
    messages: [mensagem("Como eu resolvo?")],
    contexto: { questaoId: questao.id, degrau: 0, escolha: "B", confirmada: false, pedidoResposta: false, resumoAluno: "r", ...extras },
  };
}

interface Chunk {
  type: string;
  [k: string]: unknown;
}

async function lerChunks(res: Response): Promise<Chunk[]> {
  const bruto = await res.text();
  return bruto
    .split("\n")
    .filter((l) => l.startsWith("data: ") && !l.includes("[DONE]"))
    .map((l) => JSON.parse(l.slice(6)) as Chunk);
}

function textoDe(chunks: Chunk[]): string {
  return chunks
    .filter((c) => c.type === "text-delta")
    .map((c) => String(c.delta))
    .join("");
}

describe("responderTutor sem chave", () => {
  it("responde 503 com código missing_key e sem detalhes", async () => {
    const res = await responderTutor({ corpo: corpo(), env: {}, buscarQuestao });
    expect(res.status).toBe(503);
    const json = (await res.json()) as { codigo: string; mensagem: string };
    expect(json.codigo).toBe("missing_key");
    expect(json.mensagem).toContain("ANTHROPIC_API_KEY");
  });
  it("chave em branco também conta como ausente", async () => {
    const res = await responderTutor({ corpo: corpo(), env: { ANTHROPIC_API_KEY: "  " }, buscarQuestao });
    expect(res.status).toBe(503);
  });
});

describe("responderTutor validação", () => {
  const env = { ANTHROPIC_API_KEY: "sk-teste" };
  it("corpo inválido → 400", async () => {
    const res = await responderTutor({ corpo: { messages: [] }, env, buscarQuestao, modelo: mock([]) });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { codigo: string }).codigo).toBe("invalid_body");
  });
  it("questão inexistente → 404", async () => {
    const res = await responderTutor({ corpo: corpo({ questaoId: "enem-1999-1" }), env, buscarQuestao, modelo: mock([]) });
    expect(res.status).toBe(404);
  });
});

describe("responderTutor com modelo mock", () => {
  const env = { ANTHROPIC_API_KEY: "sk-teste" };

  it("executa verify_answer no servidor, continua e redige o vazamento antes do degrau 4", async () => {
    const modelo = mock([
      [chamada("verify_answer", { expressao: "28900 / 0.25" }), fim("tool-calls")],
      [...texto("Conferi: dá 115600, então é a alternativa C. Divida por 0,25 e confira."), fim("stop")],
    ]);
    const res = await responderTutor({ corpo: corpo(), env, buscarQuestao, modelo });
    expect(res.status).toBe(200);
    const chunks = await lerChunks(res);

    const entrada = chunks.find((c) => c.type === "tool-input-available");
    expect(entrada).toMatchObject({ toolName: "verify_answer", input: { expressao: "28900 / 0.25" } });
    const saida = chunks.find((c) => c.type === "tool-output-available");
    expect(saida?.output).toMatchObject({ bateu: true, letraCorrespondente: "C", gabarito: "C" });

    const t = textoDe(chunks);
    expect(t).not.toContain("115600");
    expect(t).not.toMatch(/alternativa C/);
    expect(t).toContain("▮▮▮");
    expect(t).toContain("Divida por 0,25 e confira.");
    expect(t).toContain("Trecho oculto");
    const guarda = chunks.find((c) => c.type === "data-guarda");
    expect(guarda?.data).toMatchObject({ motivos: expect.arrayContaining([expect.stringMatching(/^valor/), expect.stringMatching(/^letra/)]) });

    // Dois passos do modelo; o segundo leva o resultado da ferramenta.
    expect(modelo.doStreamCalls).toHaveLength(2);
    const segundo = modelo.doStreamCalls[1]?.prompt ?? [];
    expect(segundo.some((m) => m.role === "tool")).toBe(true);
  });

  it("deixa o texto passar inteiro quando o aluno pediu a resposta (degrau 4)", async () => {
    const modelo = mock([[...texto("A resposta é a alternativa C: 115 600."), fim("stop")]]);
    const res = await responderTutor({ corpo: corpo({ degrau: 4, pedidoResposta: true }), env, buscarQuestao, modelo });
    const chunks = await lerChunks(res);
    expect(textoDe(chunks)).toBe("A resposta é a alternativa C: 115 600.");
    expect(chunks.some((c) => c.type === "data-guarda")).toBe(false);
  });

  it("deixa o texto passar depois de confirmar (gabarito já na tela)", async () => {
    const modelo = mock([[...texto("Você marcou B; o gabarito é C porque sobrou 25%."), fim("stop")]]);
    const res = await responderTutor({ corpo: corpo({ confirmada: true }), env, buscarQuestao, modelo });
    expect(textoDe(await lerChunks(res))).toContain("o gabarito é C");
  });

  it("encaminha run_python e record_event para o cliente (sem execute no servidor)", async () => {
    const modelo = mock([
      [
        chamada("run_python", { codigo: "solve(Eq(V/4, 28900), V)" }, "c1"),
        chamada("record_event", { tipo: "dica", detalhe: "degrau 1", degrau: 1 }, "c2"),
        fim("tool-calls"),
      ],
    ]);
    const res = await responderTutor({ corpo: corpo(), env, buscarQuestao, modelo });
    const chunks = await lerChunks(res);
    const entradas = chunks.filter((c) => c.type === "tool-input-available").map((c) => c.toolName);
    expect(entradas).toEqual(["run_python", "record_event"]);
    expect(chunks.some((c) => c.type === "tool-output-available")).toBe(false);
    expect(modelo.doStreamCalls).toHaveLength(1); // espera o cliente
  });

  it("executa get_hint, calc, plot_function e make_twin no servidor", async () => {
    const q = { ...questao, resolucao: { ...questaoFake().resolucao, dicas: { dica1: "Dica curada 1.", dica2: "d2", dica3: "d3" } } } as Questao;
    const comCuradoria: Questao = {
      ...q,
      assuntos: ["porcentagem"],
      resolucao: {
        id: q.id,
        gabarito: "C",
        assuntos: ["porcentagem"],
        habilidade: "H3",
        resolucao: "r".repeat(80),
        dicas: { dica1: "Dica curada 1.", dica2: "d2 curada.", dica3: "d3 curada." },
        erros_comuns: [{ alternativa: "B", por_que: "Multiplicou por 3." }],
        conceitos: ["x"],
        verificacao: { codigo_sympy: "x", resultado_esperado: "115600" },
        classificacao: "revisada",
      },
    };
    const modelo = mock([
      [
        chamada("get_hint", { nivel: 1 }, "c1"),
        chamada("calc", { expressao: "28900/0,25" }, "c2"),
        chamada("plot_function", { funcoes: [{ expressao: "0.25x" }], parametros: [{ nome: "a", min: 0, max: 2, valor: 1 }] }, "c3"),
        chamada("make_twin", { indice: 1 }, "c4"),
        chamada("make_twin", { gerador: "inexistente" }, "c5"),
        fim("tool-calls"),
      ],
      [...texto("Pronto. Quer tentar?"), fim("stop")],
    ]);
    const res = await responderTutor({ corpo: corpo({ degrau: 1 }), env, buscarQuestao: async () => comCuradoria, modelo });
    const saidas = (await lerChunks(res)).filter((c) => c.type === "tool-output-available");
    expect(saidas).toHaveLength(5);
    expect(saidas[0]?.output).toMatchObject({ nivel: 1, texto: "Dica curada 1.", curada: true });
    expect(saidas[1]?.output).toMatchObject({ ok: true, resultado: "115600" });
    expect(saidas[2]?.output).toMatchObject({ xMin: -10, xMax: 10, parametros: [{ nome: "a", valor: 1 }] });
    expect(saidas[3]?.output).toMatchObject({ ok: true, gemea: { gerador: "porcentagem" } });
    expect(saidas[4]?.output).toMatchObject({ ok: false });
  });

  it("marca o bloco fixo e o perfil para cache e manda o contexto oculto", async () => {
    const modelo = mock([[...texto("Qual é a parte e qual é o todo?"), fim("stop")]]);
    await (await responderTutor({ corpo: corpo(), env, buscarQuestao, modelo })).text();
    const prompt = modelo.doStreamCalls[0]?.prompt ?? [];
    const sistemas = prompt.filter((m) => m.role === "system");
    expect(sistemas).toHaveLength(3);
    expect(sistemas[0]?.providerOptions).toEqual({ anthropic: { cacheControl: { type: "ephemeral" } } });
    expect(sistemas[1]?.providerOptions).toEqual({ anthropic: { cacheControl: { type: "ephemeral" } } });
    expect(sistemas[2]?.providerOptions).toBeUndefined();
    expect(String(sistemas[0]?.content)).toContain("NUNCA revele");
    expect(String(sistemas[2]?.content)).toContain("GABARITO OFICIAL: C");
    expect(String(sistemas[2]?.content)).toContain("Alternativa marcada pelo aluno: B.");
    const ferramentas = (modelo.doStreamCalls[0]?.tools ?? []).map((t) => t.name).sort();
    expect(ferramentas).toEqual(["calc", "get_hint", "make_twin", "plot_function", "record_event", "run_python", "verify_answer"]);
    expect(modelo.doStreamCalls[0]?.providerOptions).toMatchObject({ anthropic: { effort: "low" } });
  });
});
