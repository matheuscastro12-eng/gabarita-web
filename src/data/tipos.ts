/**
 * Tipos do banco de questões, compatíveis com `schema/questao.schema.json`
 * e `schema/resolucao.schema.json` do repositório PROVAS.
 *
 * Validação em runtime com zod (usada pelo script de sincronização e pelo
 * import de backup). Os tipos TypeScript são derivados dos schemas zod.
 */
import { z } from "zod";

export const LETRAS = ["A", "B", "C", "D", "E"] as const;
export type Letra = (typeof LETRAS)[number];

export const HABILIDADES = Array.from({ length: 30 }, (_, i) => `H${i + 1}`) as [
  string,
  ...string[],
];
export type Habilidade = `H${number}`;
export type Competencia = `C${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

const letraSchema = z.enum(LETRAS);
const habilidadeSchema = z.string().regex(/^H([1-9]|[12][0-9]|30)$/);
const competenciaSchema = z.string().regex(/^C[1-7]$/);
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const triSchema = z.object({
  a: z.number(),
  b: z.number(),
  c: z.number().min(0).max(1),
  /** true quando o espelho trazia o decimal quebrado e o PROVAS reinseriu o ponto (só 2009). */
  corrigido: z.boolean().optional(),
  /** Ex.: "INEP, microdados do ENEM 2023 (ITENS_PROVA), espelho Zenodo record 18801899". */
  fonte: z.string().optional(),
});
export type ParametrosTRI = z.infer<typeof triSchema>;

export const alternativaSchema = z.object({
  letra: letraSchema,
  texto: z.string(),
  imagem: z.string().url().nullable().optional(),
});
export type Alternativa = z.infer<typeof alternativaSchema>;

export const resolucaoSchema = z.object({
  id: z.string(),
  gabarito: letraSchema,
  assuntos: z.array(slugSchema).min(1),
  habilidade: habilidadeSchema,
  resumo: z.string().optional(),
  resolucao: z.string().min(80),
  dicas: z.object({
    dica1: z.string().min(10),
    dica2: z.string().min(10),
    dica3: z.string().min(10),
  }),
  erros_comuns: z
    .array(z.object({ alternativa: letraSchema, por_que: z.string().min(10) }))
    .min(1),
  conceitos: z.array(z.string()).min(1),
  verificacao: z.object({
    codigo_sympy: z.string(),
    resultado_esperado: z.string(),
    alternativa_esperada: letraSchema.optional(),
    tolerancia: z.number().min(0).optional(),
  }),
  classificacao: z.literal("revisada"),
  revisado_por: z.string().optional(),
  revisado_em: z.string().optional(),
  /** Dificuldade percebida pelo curador (1 = mais fácil); ordena a trilha quando não há TRI. */
  nivel_curador: z.number().int().min(1).max(5).optional(),
  /** Transcrição textual da tabela/gráfico quando a questão depende de imagem. */
  dados_da_imagem: z.string().optional(),
});
export type Resolucao = z.infer<typeof resolucaoSchema>;

export const fonteSchema = z.object({
  orgao: z.literal("INEP"),
  prova: z.string(),
  url_oficial: z.string().url().nullable().optional(),
  transcricao: z.literal("enem.dev"),
  transcricao_url: z.string().url(),
  microdados_url: z.string().url().nullable().optional(),
  microdados_espelho_url: z.string().url().nullable().optional(),
});

export const qualidadeSchema = z.object({
  enunciado_vazio: z.boolean().optional(),
  alternativas_incompletas: z.boolean().optional(),
  depende_de_imagem: z.boolean().optional(),
  observacoes: z.array(z.string()).optional(),
});

export const questaoSchema = z.object({
  id: z.string().regex(/^enem-(19|20)[0-9]{2}-[0-9]{1,3}$/),
  ano: z.number().int().min(1998).max(2100),
  dia: z.union([z.literal(1), z.literal(2)]),
  caderno: z.enum(["azul", "amarelo", "branco", "rosa", "cinza", "verde", "laranja"]),
  numero: z.number().int().min(1).max(200),
  area: z.literal("matematica"),
  enunciado: z.string(),
  imagens: z.array(z.string().url()),
  alternativas: z.array(alternativaSchema).min(4).max(5),
  gabarito: letraSchema,
  /** "inep" = TX_GABARITO oficial dos microdados; "transcricao" = só a enem.dev. Ausente no fixture antigo. */
  gabarito_fonte: z.enum(["inep", "transcricao"]).optional(),
  anulada: z.boolean(),
  habilidade: habilidadeSchema.nullable(),
  habilidade_origem: z.enum(["inep", "heuristica", "revisada"]).nullable().optional(),
  competencia: competenciaSchema.nullable(),
  assuntos: z.array(slugSchema),
  classificacao: z.enum(["heuristica", "revisada"]),
  tri: triSchema.nullable(),
  dificuldade_estimada: z.enum(["facil", "media", "dificil"]).nullable(),
  fonte: fonteSchema,
  qualidade: qualidadeSchema.optional(),
  resolucao: resolucaoSchema.optional(),
});
export type Questao = z.infer<typeof questaoSchema>;

/** Arquivo `data/questoes/matematica/{ano}.json` do PROVAS: lista de questões. */
export const arquivoQuestoesSchema = z.array(questaoSchema);

/** Metadados do snapshot gravado em `src/data/provas/`. */
export const manifestoSchema = z.object({
  gerado_em: z.string(),
  origem: z.string(),
  fixture: z.boolean(),
  anos: z.array(z.number().int()),
  total: z.number().int(),
  com_tri: z.number().int(),
  com_resolucao: z.number().int(),
});
export type Manifesto = z.infer<typeof manifestoSchema>;

/** Competência (C1–C7) de cada habilidade da Matriz de Referência de Matemática. */
export function competenciaDa(habilidade: Habilidade | string): Competencia | null {
  const n = Number(habilidade.replace(/^H/, ""));
  if (!Number.isInteger(n) || n < 1 || n > 30) return null;
  if (n <= 5) return "C1";
  if (n <= 9) return "C2";
  if (n <= 14) return "C3";
  if (n <= 18) return "C4";
  if (n <= 23) return "C5";
  if (n <= 26) return "C6";
  return "C7";
}

/**
 * Dificuldade heurística a partir do parâmetro b (regra antiga do PROVAS). Hoje o banco
 * traz `dificuldade_estimada` pelos tercis de b; isto é só o fallback quando não há limiar.
 */
export function dificuldadeDoB(b: number): "facil" | "media" | "dificil" {
  if (b < 0.5) return "facil";
  if (b < 1.5) return "media";
  return "dificil";
}

/** Nome curto de cada habilidade, para rótulos de interface. */
export const NOME_HABILIDADE: Record<string, string> = {
  H1: "Sistemas de numeração",
  H2: "Padrões numéricos",
  H3: "Problemas numéricos",
  H4: "Razoabilidade de resultados",
  H5: "Intervenção com números",
  H6: "Visão espacial",
  H7: "Planificações e sólidos",
  H8: "Geometria e argumentação",
  H9: "Intervenção com geometria",
  H10: "Grandezas e unidades",
  H11: "Conversão de unidades",
  H12: "Medidas e argumentação",
  H13: "Intervenção com medidas",
  H14: "Perímetro, área e volume",
  H15: "Dependência entre grandezas",
  H16: "Proporcionalidade",
  H17: "Variação de grandezas",
  H18: "Intervenção com proporção",
  H19: "Representações algébricas",
  H20: "Gráfico cartesiano",
  H21: "Modelagem algébrica",
  H22: "Álgebra e argumentação",
  H23: "Intervenção com álgebra",
  H24: "Inferência em gráficos e tabelas",
  H25: "Problemas com gráficos e tabelas",
  H26: "Gráficos e argumentação",
  H27: "Média, mediana e moda",
  H28: "Estatística e probabilidade",
  H29: "Probabilidade e argumentação",
  H30: "Intervenção com estatística",
};

/** "ENEM 2023, questão 137" (para citar a fonte em qualquer tela). */
export function citarFonte(q: Pick<Questao, "ano" | "numero">): string {
  return `INEP, ENEM ${q.ano}, questão ${q.numero}`;
}

export interface FonteDetalhada {
  /** "Fonte: INEP, ENEM 2023, questão 137" */
  citacao: string;
  /** Link da transcrição na enem.dev. */
  transcricaoUrl: string;
  /** Página oficial de provas e gabaritos do INEP, se houver. */
  urlOficial: string | null;
  /** "gabarito oficial do INEP" | "gabarito da transcrição (enem.dev)" */
  gabarito: string;
  /** Texto curto sobre o TRI: fonte, correção, ou ausência. */
  tri: string;
}

/** Monta os textos de atribuição de uma questão (sempre citando o INEP). */
export function fonteDetalhada(q: Questao): FonteDetalhada {
  const gabarito =
    q.gabarito_fonte === "inep"
      ? "gabarito oficial do INEP (microdados)"
      : q.gabarito_fonte === "transcricao"
        ? "gabarito da transcrição (enem.dev)"
        : "gabarito oficial do INEP";
  let tri: string;
  if (q.anulada) tri = "questão anulada: sem parâmetros TRI";
  else if (!q.tri) tri = "sem parâmetros TRI";
  else {
    tri = `TRI: ${q.tri.fonte ?? "microdados do INEP"}`;
    if (q.tri.corrigido) tri += " (decimal corrigido pelo PROVAS)";
  }
  return {
    citacao: `Fonte: ${citarFonte(q)}`,
    transcricaoUrl: q.fonte.transcricao_url,
    urlOficial: q.fonte.url_oficial ?? null,
    gabarito,
    tri,
  };
}
