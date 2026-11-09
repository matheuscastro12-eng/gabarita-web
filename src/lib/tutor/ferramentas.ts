/**
 * Ferramentas do tutor (AI SDK `tool`). As que têm `execute` rodam no servidor;
 * `run_python` e `record_event` não têm `execute` e são executadas no cliente
 * (Web Worker com Pyodide e StudentStore), via `onToolCall`/`addToolOutput`.
 */
import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";
import type { Questao } from "@/data/tipos";
import { gemeaDaQuestao, gerarGemea, ehNomeGerador, type Gemea } from "@/lib/gemeas";
import { calcular, verificarResposta } from "./mathjs";
import { normalizarPlot, type PlotSpec } from "./plot";
import { NOME_FERRAMENTAS } from "./prompt";

/** Saída de `run_python`, produzida no cliente. */
export const saidaPythonSchema = z.object({
  ok: z.boolean(),
  /** stdout capturado. */
  saida: z.string(),
  /** repr do valor da última expressão, se houver. */
  resultado: z.string().nullable(),
  erro: z.string().nullable(),
  ms: z.number(),
});
export type SaidaPython = z.infer<typeof saidaPythonSchema>;

export const entradaPlotSchema = z.object({
  funcoes: z
    .array(
      z.object({
        expressao: z.string().describe("Expressão em x (e parâmetros), ex.: '2x + 3' ou 'a*x^2 + b'."),
        rotulo: z.string().optional(),
      }),
    )
    .min(1)
    .max(4),
  xMin: z.number().optional(),
  xMax: z.number().optional(),
  yMin: z.number().optional(),
  yMax: z.number().optional(),
  parametros: z
    .array(z.object({ nome: z.string(), min: z.number(), max: z.number(), passo: z.number().optional(), valor: z.number() }))
    .max(3)
    .optional()
    .describe("Sliders: cada parâmetro vira um controle deslizante."),
  pontos: z.array(z.object({ x: z.number(), y: z.number(), rotulo: z.string().optional() })).max(10).optional(),
  titulo: z.string().optional(),
});

export const tipoEventoSchema = z.enum(["dica", "erro", "equivoco", "pedido_resposta", "verificacao", "gemea"]);

export interface DicaCurada {
  nivel: number;
  texto: string | null;
  curada: boolean;
  motivo?: string;
}

/** Lê a dica curada do degrau (1–3) ou a resolução (4). */
export function dicaCurada(questao: Questao, nivel: number): DicaCurada {
  const res = questao.resolucao;
  const n = Math.min(4, Math.max(1, Math.round(nivel)));
  if (!res) return { nivel: n, texto: null, curada: false, motivo: "Esta questão ainda não tem curadoria no PROVAS; formule a dica coerente com o degrau." };
  if (n === 4) return { nivel: 4, texto: res.resolucao, curada: true };
  return { nivel: n, texto: res.dicas[`dica${n as 1 | 2 | 3}`], curada: true };
}

export type ResultadoTwin = { ok: true; gemea: Gemea } | { ok: false; motivo: string };

export function fazerGemea(questao: Questao, indice: number, gerador?: string): ResultadoTwin {
  if (gerador) {
    if (!ehNomeGerador(gerador)) return { ok: false, motivo: `Gerador desconhecido: ${gerador}.` };
    return { ok: true, gemea: gerarGemea(gerador, indice * 7919 + 17) };
  }
  const g = gemeaDaQuestao(questao, indice);
  return g ? { ok: true, gemea: g } : { ok: false, motivo: "Não há gerador de gêmeas para o assunto desta questão." };
}

/** Monta o conjunto de ferramentas para uma questão. */
export function ferramentasTutor(questao: Questao) {
  return {
    [NOME_FERRAMENTAS.runPython]: tool({
      description:
        "Executa código Python com SymPy no navegador do aluno (from sympy import * já feito). Use para álgebra, equações e qualquer conta que você vá afirmar. Devolve stdout e o valor da última expressão.",
      inputSchema: z.object({
        codigo: z.string().min(1).max(4000).describe("Código Python. A última linha pode ser uma expressão para ver o valor."),
        objetivo: z.string().max(200).optional().describe("O que você quer conferir, em uma frase."),
      }),
      // Sem execute: roda no cliente (Pyodide num Web Worker).
    }),
    [NOME_FERRAMENTAS.verifyAnswer]: tool({
      description:
        "Confere um valor final contra o gabarito oficial da questão: avalia a expressão (mathjs), compara com as alternativas numéricas e diz se corresponde à letra certa. Chame antes de afirmar qualquer resultado final.",
      inputSchema: z.object({
        expressao: z.string().min(1).max(300).describe("Expressão numérica, ex.: '28900 / 0.25'."),
        descricao: z.string().max(200).optional().describe("O que a expressão representa."),
      }),
      execute: async ({ expressao }) => verificarResposta(questao, expressao),
    }),
    [NOME_FERRAMENTAS.calc]: tool({
      description: "Calcula ou simplifica uma expressão com mathjs (aceita vírgula decimal e porcentagem). Para contas rápidas sem Python.",
      inputSchema: z.object({ expressao: z.string().min(1).max(300) }),
      execute: async ({ expressao }) => calcular(expressao),
    }),
    [NOME_FERRAMENTAS.plotFunction]: tool({
      description:
        "Desenha um gráfico interativo no chat. Devolva funções em x; letras extras (a, b, k…) viram sliders se listadas em `parametros`.",
      inputSchema: entradaPlotSchema,
      execute: async (entrada): Promise<PlotSpec | { erro: string }> => {
        try {
          return normalizarPlot({ ...entrada, parametros: entrada.parametros ?? [], pontos: entrada.pontos ?? [] });
        } catch (e) {
          return { erro: e instanceof Error ? e.message : "spec inválida" };
        }
      },
    }),
    [NOME_FERRAMENTAS.getHint]: tool({
      description: "Lê a dica curada (verificada) do degrau pedido: 1 conceito, 2 primeiro passo, 3 quase lá, 4 resolução completa.",
      inputSchema: z.object({ nivel: z.number().int().min(1).max(4) }),
      execute: async ({ nivel }) => dicaCurada(questao, nivel),
    }),
    [NOME_FERRAMENTAS.makeTwin]: tool({
      description:
        "Gera uma questão gêmea (mesma estrutura, números novos, resposta calculada pelo código). O chat mostra a gêmea para o aluno responder. Use `indice` 1, 2… para outra gêmea.",
      inputSchema: z.object({
        indice: z.number().int().min(0).max(50).optional(),
        gerador: z.string().optional().describe("Opcional: porcentagem, regra-de-tres, razao-proporcao, probabilidade, media-mediana-moda, funcao-afim, equacao-1-grau, equacao-2-grau, progressao-aritmetica, escala."),
      }),
      execute: async ({ indice, gerador }) => fazerGemea(questao, indice ?? 0, gerador),
    }),
    [NOME_FERRAMENTAS.recordEvent]: tool({
      description: "Registra um evento no modelo do aluno: dica (com degrau), erro, equívoco identificado, pedido_resposta, verificacao ou gemea.",
      inputSchema: z.object({
        tipo: tipoEventoSchema,
        detalhe: z.string().max(300),
        degrau: z.number().int().min(0).max(4).optional(),
      }),
      // Sem execute: o cliente grava no StudentStore.
    }),
  };
}

export type FerramentasTutor = ReturnType<typeof ferramentasTutor>;
export type UIToolsTutor = InferUITools<FerramentasTutor>;

/** Dados extras enviados no stream (fora das mensagens do modelo). */
export type DadosTutor = {
  /** A guarda redigiu um trecho que revelaria a resposta. */
  guarda: { motivos: string[] };
};

export type MensagemTutor = UIMessage<never, DadosTutor, UIToolsTutor>;
