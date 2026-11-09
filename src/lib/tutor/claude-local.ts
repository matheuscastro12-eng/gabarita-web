/**
 * Provedor `claude-local`: o tutor usa o Claude Code logado neste computador
 * (assinatura do aluno) no lugar da API paga. Só faz sentido no app do Mac, que
 * sobe o servidor Next em 127.0.0.1; na Vercel não há CLI nem login.
 *
 * O Claude Code roda o laço de ferramentas dentro da CLI, então as ferramentas
 * do servidor (com `execute`) são expostas como um servidor MCP em processo.
 * As ferramentas internas da CLI (Bash, Read, Write, WebFetch…) ficam desligadas.
 * As ferramentas do cliente (run_python, record_event) não têm `execute` e não
 * podem atravessar a CLI: ficam fora neste modo.
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { wrapLanguageModel, type LanguageModel, type LanguageModelMiddleware, type ToolSet } from "ai";
import { claudeCode, createAiSdkMcpServer } from "ai-sdk-provider-claude-code";
import type { ConfiguracaoTutor } from "./config";
import { NOME_FERRAMENTAS } from "./prompt";

export const SERVIDOR_MCP = "tutor";
const PREFIXO = `mcp__${SERVIDOR_MCP}__`;

/** Ferramentas que rodam no cliente e por isso ficam fora no modo local. */
export const FERRAMENTAS_SO_CLIENTE = [NOME_FERRAMENTAS.runPython, NOME_FERRAMENTAS.recordEvent] as const;

/** Aviso extra de sistema no modo local (o prompt fixo cita ferramentas que não existem aqui). */
export const AVISO_MODO_LOCAL = `Neste ambiente, ${NOME_FERRAMENTAS.runPython} e ${NOME_FERRAMENTAS.recordEvent} não estão disponíveis. Para conferir contas use ${NOME_FERRAMENTAS.calc} e ${NOME_FERRAMENTAS.verifyAnswer}; não tente registrar eventos.`;

type FerramentaServidor = ToolSet[string];

/** Só as ferramentas com `execute` (rodam no servidor). */
export function ferramentasServidor(ferramentas: ToolSet): Record<string, FerramentaServidor> {
  const saida: Record<string, FerramentaServidor> = {};
  for (const [nome, f] of Object.entries(ferramentas)) {
    if (typeof (f as { execute?: unknown }).execute === "function") saida[nome] = f;
  }
  return saida;
}

/** `mcp__tutor__calc` → `calc`; outros nomes ficam como estão. */
export function nomeOriginal(nome: string): string {
  return nome.startsWith(PREFIXO) ? nome.slice(PREFIXO.length) : nome;
}

/**
 * Faz as chamadas MCP parecerem as ferramentas do app: tira o prefixo do nome e
 * marca como não dinâmicas, para o cliente renderizar `tool-calc`,
 * `tool-plot_function` etc. como faz com a API. Também tira `tools` dos
 * parâmetros (a CLI os ignoraria com aviso; elas vão pelo MCP).
 */
export const middlewareNomes: LanguageModelMiddleware = {
  specificationVersion: "v4",
  transformParams: async ({ params }) => ({ ...params, tools: undefined, toolChoice: undefined }),
  wrapStream: async ({ doStream }) => {
    const { stream, ...resto } = await doStream();
    return {
      ...resto,
      stream: stream.pipeThrough(
        new TransformStream({
          transform(parte, controlador) {
            if ("toolName" in parte && typeof parte.toolName === "string" && parte.toolName.startsWith(PREFIXO)) {
              controlador.enqueue({ ...parte, toolName: nomeOriginal(parte.toolName), dynamic: false });
              return;
            }
            controlador.enqueue(parte);
          },
        }),
      ),
    };
  },
};

type Env = Record<string, string | undefined>;

/** Caminho da CLI: CLAUDE_CODE_PATH, depois ~/.local/bin/claude, senão o binário do pacote. */
export function caminhoCli(env: Env, existe: (p: string) => boolean = fs.existsSync): string | undefined {
  const explicito = (env.CLAUDE_CODE_PATH ?? "").trim();
  if (explicito) return explicito;
  const local = path.join(env.HOME || os.homedir(), ".local", "bin", "claude");
  return existe(local) ? local : undefined;
}

/** Monta as opções da CLI (puro, testável). */
export function opcoesClaudeLocal(config: ConfiguracaoTutor, ferramentas: ToolSet, env: Env, maxTurnos: number) {
  const servidor = ferramentasServidor(ferramentas);
  return {
    pathToClaudeCodeExecutable: caminhoCli(env),
    // Pasta neutra: nada do repositório nem do HOME entra como contexto.
    cwd: os.tmpdir(),
    settingSources: [] as Array<"user" | "project" | "local">,
    // Nenhuma ferramenta interna da CLI; só as do app, via MCP.
    tools: [] as string[],
    allowedTools: Object.keys(servidor).map((n) => `${PREFIXO}${n}`),
    permissionPrompts: "none" as const,
    verbatimPrompts: true,
    persistSession: false,
    maxTurns: maxTurnos,
    effort: config.esforco,
    mcpServers: { [SERVIDOR_MCP]: createAiSdkMcpServer(SERVIDOR_MCP, servidor as never) },
  };
}

export function criarModeloClaudeLocal(
  config: ConfiguracaoTutor,
  ferramentas: ToolSet,
  env: Env,
  maxTurnos: number,
): LanguageModel {
  const base = claudeCode(config.modelo, opcoesClaudeLocal(config, ferramentas, env, maxTurnos));
  return wrapLanguageModel({ model: base, middleware: middlewareNomes });
}
