/**
 * Especificação de gráfico devolvida pela ferramenta `plot_function` e
 * desenhada pelo chat (Mafs). Puro: schema zod + extração de "gráfico de y = 2x+3".
 */
import { z } from "zod";

export const parametroSchema = z.object({
  nome: z.string().regex(/^[a-zA-Z]\w{0,8}$/),
  min: z.number(),
  max: z.number(),
  passo: z.number().positive().optional(),
  valor: z.number(),
});

export const funcaoPlotSchema = z.object({
  /** Expressão em x (e parâmetros), ex.: "2x + 3", "a*x^2 + b". */
  expressao: z.string().min(1).max(200),
  rotulo: z.string().max(60).optional(),
});

export const plotSpecSchema = z.object({
  funcoes: z.array(funcaoPlotSchema).min(1).max(4),
  xMin: z.number().default(-10),
  xMax: z.number().default(10),
  yMin: z.number().optional(),
  yMax: z.number().optional(),
  parametros: z.array(parametroSchema).max(3).default([]),
  pontos: z
    .array(z.object({ x: z.number(), y: z.number(), rotulo: z.string().max(40).optional() }))
    .max(10)
    .default([]),
  titulo: z.string().max(80).optional(),
});

export type PlotSpec = z.infer<typeof plotSpecSchema>;
export type PlotSpecEntrada = z.input<typeof plotSpecSchema>;

/** Valida e normaliza a spec (garante xMin < xMax e parâmetros dentro dos limites). */
export function normalizarPlot(entrada: PlotSpecEntrada): PlotSpec {
  const spec = plotSpecSchema.parse(entrada);
  const xMin = Math.min(spec.xMin, spec.xMax);
  const xMax = Math.max(spec.xMin, spec.xMax);
  return {
    ...spec,
    xMin,
    xMax: xMax === xMin ? xMin + 1 : xMax,
    parametros: spec.parametros.map((p) => ({
      ...p,
      min: Math.min(p.min, p.max),
      max: Math.max(p.min, p.max),
      valor: Math.min(Math.max(p.valor, Math.min(p.min, p.max)), Math.max(p.min, p.max)),
    })),
  };
}

/** Letras de parâmetro aceitas numa expressão digitada pelo aluno (além de x). */
const PARAMETROS_LIVRES = ["a", "b", "c", "k", "m", "n", "p", "q"];

/**
 * Extrai uma expressão de função de um pedido em linguagem natural:
 * "gráfico de y = 2x + 3", "plote f(x)=x^2-4", "desenha 3x+1". null se não houver.
 */
export function extrairFuncao(texto: string): PlotSpec | null {
  const t = texto.trim();
  const gatilho = /gr[aá]fico|plot(?:e|a|ar)?|desenh[ae]|esbo[cç][ae]|tra[cç][ae]/i;
  if (!gatilho.test(t)) return null;
  const resto = t.replace(new RegExp(`^.*?(?:${gatilho.source})`, "i"), "");
  const pedaco = resto.split(/[;\n]|,\s*(?=[a-zA-Z\u00c0-\u00ff]{3,})/)[0] ?? "";
  let expressao = pedaco
    .replace(/^\s*(?:de|da|do|:)?\s*(?:a\s+)?(?:fun[cç][aã]o\s+)?/i, "")
    .replace(/[.?!]+$/, "")
    .trim();
  const igual = /^[yf]\s*(?:\(\s*x\s*\))?\s*=\s*(.+)$/i.exec(expressao);
  if (igual) expressao = (igual[1] ?? "").trim();
  if (!expressao || !/x/.test(expressao)) return null;
  const semFuncoes = expressao.replace(/sqrt|sin|cos|tan|log|exp|abs|pi/gi, "");
  if (/[a-wyzA-WYZ\u00c0-\u00ff]{3,}/.test(semFuncoes)) return null;
  const letras = new Set(semFuncoes.match(/[a-zA-Z]/g) ?? []);
  letras.delete("x");
  letras.delete("e");
  const parametros = [...letras]
    .filter((l) => PARAMETROS_LIVRES.includes(l.toLowerCase()))
    .slice(0, 3)
    .map((nome) => ({ nome, min: -5, max: 5, passo: 0.5, valor: 1 }));
  if (letras.size > parametros.length) return null;
  return normalizarPlot({ funcoes: [{ expressao, rotulo: `y = ${expressao}` }], parametros });
}
