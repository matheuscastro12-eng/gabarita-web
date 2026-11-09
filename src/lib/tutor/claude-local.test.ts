import { describe, expect, it } from "vitest";
import { simulateReadableStream, streamText, wrapLanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { configuracaoTutor } from "./config";
import { ferramentasTutor } from "./ferramentas";
import {
  AVISO_MODO_LOCAL,
  FERRAMENTAS_SO_CLIENTE,
  caminhoCli,
  criarModeloClaudeLocal,
  ferramentasServidor,
  middlewareNomes,
  nomeOriginal,
  opcoesClaudeLocal,
} from "./claude-local";
import { criarModelo } from "./servidor";

const questao = questaoFake({ id: "q1" });
const ferramentas = ferramentasTutor(questao);
const config = configuracaoTutor({ TUTOR_PROVIDER: "claude-local", TUTOR_EFFORT: "medium" });

describe("ferramentas no modo local", () => {
  it("expõe só as que rodam no servidor", () => {
    const nomes = Object.keys(ferramentasServidor(ferramentas)).sort();
    expect(nomes).toEqual(["calc", "get_hint", "make_twin", "plot_function", "verify_answer"]);
    for (const n of FERRAMENTAS_SO_CLIENTE) expect(nomes).not.toContain(n);
  });
  it("o aviso de sistema cita as ferramentas que ficaram de fora", () => {
    expect(AVISO_MODO_LOCAL).toContain("run_python");
    expect(AVISO_MODO_LOCAL).toContain("record_event");
  });
  it("nomeOriginal tira só o prefixo do servidor do tutor", () => {
    expect(nomeOriginal("mcp__tutor__calc")).toBe("calc");
    expect(nomeOriginal("mcp__outro__calc")).toBe("mcp__outro__calc");
    expect(nomeOriginal("Bash")).toBe("Bash");
  });
});

describe("opcoesClaudeLocal", () => {
  const op = opcoesClaudeLocal(config, ferramentas, { HOME: "/casa" }, 8);
  it("desliga as ferramentas internas da CLI e o carregamento de settings", () => {
    expect(op.tools).toEqual([]);
    expect(op.settingSources).toEqual([]);
    expect(op.permissionPrompts).toBe("none");
    expect(op.persistSession).toBe(false);
  });
  it("libera só as ferramentas do app, via MCP", () => {
    expect(op.allowedTools.sort()).toEqual([
      "mcp__tutor__calc",
      "mcp__tutor__get_hint",
      "mcp__tutor__make_twin",
      "mcp__tutor__plot_function",
      "mcp__tutor__verify_answer",
    ]);
    expect(Object.keys(op.mcpServers)).toEqual(["tutor"]);
  });
  it("repassa esforço e limite de turnos", () => {
    expect(op.effort).toBe("medium");
    expect(op.maxTurns).toBe(8);
  });
});

describe("caminhoCli", () => {
  it("CLAUDE_CODE_PATH vence", () => {
    expect(caminhoCli({ CLAUDE_CODE_PATH: "/x/claude" }, () => false)).toBe("/x/claude");
  });
  it("usa ~/.local/bin/claude quando existe", () => {
    expect(caminhoCli({ HOME: "/casa" }, (p) => p === "/casa/.local/bin/claude")).toBe("/casa/.local/bin/claude");
  });
  it("sem nada, deixa o pacote usar o binário embutido", () => {
    expect(caminhoCli({ HOME: "/casa" }, () => false)).toBeUndefined();
  });
});

describe("escolha do modelo", () => {
  it("criarModelo devolve o modelo local quando o provedor é claude-local", () => {
    const m = criarModelo(config, {}, ferramentas) as { provider: string };
    expect(m.provider).toContain("claude-code");
    expect((criarModeloClaudeLocal(config, ferramentas, {}, 8) as { provider: string }).provider).toContain("claude-code");
  });
  it("claude-local sem ferramentas é erro de programação", () => {
    expect(() => criarModelo(config, {})).toThrow(/ferramentas/);
  });
  it("com chave, continua no provedor da API", () => {
    const m = criarModelo(configuracaoTutor({ ANTHROPIC_API_KEY: "k" }), { ANTHROPIC_API_KEY: "k" }, ferramentas) as { provider: string };
    expect(m.provider).toContain("anthropic");
  });
});

describe("middlewareNomes", () => {
  const usage = {
    inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 1, text: 1, reasoning: undefined },
  };
  const partes: LanguageModelV4StreamPart[] = [
    { type: "tool-input-start", id: "c1", toolName: "mcp__tutor__calc", providerExecuted: true, dynamic: true },
    { type: "tool-input-end", id: "c1" },
    { type: "tool-call", toolCallId: "c1", toolName: "mcp__tutor__calc", input: '{"expressao":"2+3"}', providerExecuted: true, dynamic: true },
    { type: "tool-result", toolCallId: "c1", toolName: "mcp__tutor__calc", result: { ok: true, valor: 5 }, dynamic: true },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: "Deu 5." },
    { type: "text-end", id: "t1" },
    { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage },
  ];

  it("faz a chamada MCP virar a ferramenta do app e não passa tools para a CLI", async () => {
    const base = new MockLanguageModelV4({ doStream: { stream: simulateReadableStream({ chunks: partes }) } });
    const modelo = wrapLanguageModel({ model: base, middleware: middlewareNomes });
    const r = streamText({ model: modelo, prompt: "oi", tools: ferramentas });
    const chunks: Array<Record<string, unknown>> = [];
    for await (const c of r.toUIMessageStream()) chunks.push(c as Record<string, unknown>);
    const disponivel = chunks.find((c) => c.type === "tool-input-available");
    expect(disponivel).toMatchObject({ toolName: "calc", providerExecuted: true });
    expect(disponivel?.dynamic).toBeFalsy();
    expect(chunks.find((c) => c.type === "tool-output-available")).toMatchObject({ output: { ok: true, valor: 5 } });
    expect(base.doStreamCalls[0]?.tools).toBeUndefined();
  });
});

describe("claude-local no modo resumo", () => {
  it("libera só calc e plot_function via MCP", async () => {
    const { ferramentasResumo } = await import("./ferramentas");
    const op = opcoesClaudeLocal(config, ferramentasResumo(), { HOME: "/casa" }, 8);
    expect(op.allowedTools.sort()).toEqual(["mcp__tutor__calc", "mcp__tutor__plot_function"]);
    expect(op.tools).toEqual([]);
  });
});
