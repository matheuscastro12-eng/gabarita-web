/**
 * Handler da rota /api/tutor, separado do arquivo de rota para ser testável
 * com um modelo mock. Nunca loga nem devolve a chave da API.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type LanguageModel,
  type ModelMessage,
  type StreamTextTransform,
  type TextStreamPart,
  type UIMessage,
} from "ai";
import { z } from "zod";
import type { Questao } from "@/data/tipos";
import { LETRAS } from "@/data/tipos";
import { AVISO_MODO_LOCAL, criarModeloClaudeLocal } from "./claude-local";
import { configuracaoTutor, modeloGateway, type ConfiguracaoTutor } from "./config";
import { ferramentasTutor, type DadosTutor, type FerramentasTutor } from "./ferramentas";
import { montarInstrucoes, type ContextoConversa } from "./prompt";
import { aplicarGuarda, guardaAtiva } from "./vazamento";

export const MAX_PASSOS = 8;

export const contextoSchema = z.object({
  questaoId: z.string().min(1).max(60),
  degrau: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  escolha: z.enum(LETRAS).nullable().default(null),
  confirmada: z.boolean().default(false),
  pedidoResposta: z.boolean().default(false),
  selecao: z.string().max(600).nullable().optional(),
  resumoAluno: z.string().max(3000).default(""),
  perfil: z
    .object({ nome: z.string().max(60).default("Matheus"), explicaDoMeuJeito: z.string().max(600).default("") })
    .default({ nome: "Matheus", explicaDoMeuJeito: "" }),
});
export type ContextoRequisicao = z.infer<typeof contextoSchema>;

export const corpoSchema = z.object({
  messages: z.array(z.custom<UIMessage>((v) => typeof v === "object" && v !== null && "role" in v && "parts" in v)).min(1).max(200),
  contexto: contextoSchema,
});

export type ErroTutor = "missing_key" | "invalid_body" | "question_not_found" | "model_error";

export function respostaErro(codigo: ErroTutor, status: number, mensagem: string): Response {
  return Response.json({ codigo, mensagem }, { status });
}

/** Cria o modelo a partir da configuração (nunca expõe a chave). */
export function criarModelo(
  config: ConfiguracaoTutor,
  env: Record<string, string | undefined>,
  ferramentas?: FerramentasTutor,
): LanguageModel {
  if (config.provedor === "claude-local") {
    if (!ferramentas) throw new Error("claude-local precisa das ferramentas da questão.");
    return criarModeloClaudeLocal(config, ferramentas, env, MAX_PASSOS);
  }
  if (config.provedor === "gateway") {
    return createGateway({ apiKey: env.AI_GATEWAY_API_KEY })(modeloGateway(config.modelo));
  }
  return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(config.modelo);
}

/**
 * Transformação do stream que aplica o filtro de vazamento: junta cada bloco
 * de texto até o fim e só então o libera (redigido se preciso). Quando a
 * guarda está inativa, deixa o stream passar sem atraso.
 */
export function transformGuarda(
  questao: Questao,
  ctx: ContextoConversa,
  aoVazar: (motivos: string[]) => void,
): StreamTextTransform<FerramentasTutor> {
  return () => {
    const ativa = guardaAtiva({ degrau: ctx.degrau, pedidoExplicito: ctx.pedidoResposta, confirmada: ctx.confirmada });
    const buffers = new Map<string, string>();
    return new TransformStream<TextStreamPart<FerramentasTutor>, TextStreamPart<FerramentasTutor>>({
      transform(parte, controlador) {
        if (!ativa) {
          controlador.enqueue(parte);
          return;
        }
        if (parte.type === "text-start") {
          buffers.set(parte.id, "");
          controlador.enqueue(parte);
          return;
        }
        if (parte.type === "text-delta" && buffers.has(parte.id)) {
          buffers.set(parte.id, (buffers.get(parte.id) ?? "") + parte.text);
          return;
        }
        if (parte.type === "text-end" && buffers.has(parte.id)) {
          const completo = buffers.get(parte.id) ?? "";
          buffers.delete(parte.id);
          const r = aplicarGuarda(completo, questao, { degrau: ctx.degrau, pedidoExplicito: ctx.pedidoResposta, confirmada: ctx.confirmada });
          if (r.vazou) aoVazar(r.motivos);
          if (r.texto) controlador.enqueue({ type: "text-delta", id: parte.id, text: r.texto });
          controlador.enqueue(parte);
          return;
        }
        controlador.enqueue(parte);
      },
      flush(controlador) {
        // Texto sem text-end (stream interrompido): libera o que houver, redigido.
        for (const [id, texto] of buffers) {
          const r = aplicarGuarda(texto, questao, { degrau: ctx.degrau, pedidoExplicito: ctx.pedidoResposta, confirmada: ctx.confirmada });
          if (r.vazou) aoVazar(r.motivos);
          if (r.texto) controlador.enqueue({ type: "text-delta", id, text: r.texto });
          controlador.enqueue({ type: "text-end", id });
        }
        buffers.clear();
      },
    });
  };
}

export interface OpcoesResposta {
  corpo: unknown;
  env: Record<string, string | undefined>;
  buscarQuestao: (id: string) => Promise<Questao | undefined>;
  /** Modelo injetado (testes). Se ausente, cria pela configuração. */
  modelo?: LanguageModel;
}

/** Trata um POST em /api/tutor. */
export async function responderTutor({ corpo, env, buscarQuestao, modelo }: OpcoesResposta): Promise<Response> {
  const config = configuracaoTutor(env);
  if (config.provedor === null && !modelo) {
    return respostaErro("missing_key", 503, "Tutor de IA desligado: falta a chave ANTHROPIC_API_KEY (ou AI_GATEWAY_API_KEY).");
  }
  const parse = corpoSchema.safeParse(corpo);
  if (!parse.success) return respostaErro("invalid_body", 400, "Corpo da requisição inválido.");
  const { messages, contexto } = parse.data;

  const questao = await buscarQuestao(contexto.questaoId);
  if (!questao) return respostaErro("question_not_found", 404, `Questão ${contexto.questaoId} não encontrada.`);

  const ctx: ContextoConversa = {
    degrau: contexto.degrau,
    escolha: contexto.escolha,
    confirmada: contexto.confirmada,
    pedidoResposta: contexto.pedidoResposta,
    selecao: contexto.selecao ?? null,
  };
  const instrucoes = montarInstrucoes({ questao, perfil: contexto.perfil, contexto: ctx, resumoAluno: contexto.resumoAluno });
  const ferramentas = ferramentasTutor(questao);

  let mensagensModelo: ModelMessage[];
  try {
    mensagensModelo = await convertToModelMessages(messages, { tools: ferramentas, ignoreIncompleteToolCalls: true });
  } catch {
    return respostaErro("invalid_body", 400, "Histórico de mensagens inválido.");
  }

  const modeloFinal = modelo ?? criarModelo(config, env, ferramentas);
  const local = config.provedor === "claude-local";
  const cache = { anthropic: { cacheControl: { type: "ephemeral" as const } } };

  const stream = createUIMessageStream<UIMessage<never, DadosTutor>>({
    execute: ({ writer }) => {
      const resultado = streamText({
        model: modeloFinal,
        instructions: [
          { role: "system", content: instrucoes.fixo, providerOptions: cache },
          { role: "system", content: instrucoes.perfil, providerOptions: cache },
          { role: "system", content: instrucoes.contexto },
          ...(local ? [{ role: "system" as const, content: AVISO_MODO_LOCAL }] : []),
        ],
        messages: mensagensModelo,
        tools: ferramentas,
        stopWhen: isStepCount(MAX_PASSOS),
        maxOutputTokens: 1200,
        providerOptions: { anthropic: { effort: config.esforco } },
        experimental_transform: transformGuarda(questao, ctx, (motivos) => {
          writer.write({ type: "data-guarda", data: { motivos }, transient: true });
        }),
        onError: ({ error }) => {
          console.error("[tutor] erro do modelo:", error instanceof Error ? error.message : String(error));
        },
      });
      writer.merge(
        toUIMessageStream({
          stream: resultado.stream,
          tools: ferramentas,
          onError: (erro) => (erro instanceof Error ? erro.message : "O tutor não conseguiu responder agora."),
        }),
      );
    },
    onError: (erro) => (erro instanceof Error ? erro.message : "O tutor não conseguiu responder agora."),
  });

  return createUIMessageStreamResponse({ stream });
}
