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
/**
 * Habilidade da matriz do INEP. Matemática usa "H1"–"H30" (chave histórica do estado do aluno);
 * Ciências da Natureza usa "CN-H1"–"CN-H30", para não misturar Hn de matrizes diferentes.
 */
export type Habilidade = `H${number}` | `CN-H${number}`;
export type Competencia = `C${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

/**
 * Áreas com banco de questões oficiais no app (Humanas e Linguagens ficaram de fora: o dia 1
 * já passou). `AREAS` (mais abaixo) inclui as 4 porque as Apostas cobrem as 4 matérias.
 */
export const AREAS_OFICIAIS = ["matematica", "natureza"] as const;
export const NOME_AREA: Record<Area, string> = { matematica: "Matemática", natureza: "Natureza", humanas: "Humanas", linguagens: "Linguagens" };
export const SIGLA_AREA: Record<Area, string> = { matematica: "MT", natureza: "CN", humanas: "CH", linguagens: "LC" };

/** Área de uma chave de habilidade ("CN-H3" → natureza; "H3" → matemática). */
export function areaDaHabilidade(h: string): Area {
  return h.startsWith("CN-") ? "natureza" : "matematica";
}

/** "CN-H3" → "H3" (rótulo curto; a área aparece no contexto da tela). */
export function rotuloHabilidade(h: string): string {
  return h.replace(/^CN-/, "");
}

/** Chave de habilidade de uma área: matemática "H3", natureza "CN-H3". */
export function chaveHabilidade(area: Area, n: number): Habilidade {
  return area === "natureza" ? `CN-H${n}` : `H${n}`;
}

/** Ordem estável: matemática H1–H30, depois natureza CN-H1–CN-H30. */
export function ordemHabilidade(h: string): number {
  return (h.startsWith("CN-") ? 100 : 0) + Number(h.replace(/^(CN-)?H/, ""));
}

/** As 30 habilidades da matriz da área, como chaves do estado do aluno. */
export function habilidadesDaArea(area: Area): Habilidade[] {
  return Array.from({ length: 30 }, (_, i) => chaveHabilidade(area, i + 1));
}

const urlOuCaminho = z.string().refine((u) => u.startsWith("/") || /^https?:\/\//.test(u), "URL ou caminho público");

const letraSchema = z.enum(LETRAS);
const habilidadeSchema = z.string().regex(/^(CN-)?H([1-9]|[12][0-9]|30)$/);
const competenciaSchema = z.string().regex(/^C[1-8]$/);
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
  imagem: urlOuCaminho.nullable().optional(),
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

/**
 * Fonte das questões da coleção "Apostas 2026" (curso Edcley Teixeira): questões
 * inéditas, NÃO oficiais. Nunca citar INEP nelas.
 */
export const fonteApostaSchema = z.object({
  orgao: z.literal("Curso Edcley Teixeira"),
  prova: z.literal("Apostas de Edcley Teixeira ENEM 2026"),
  autor: z.literal("Edcley Teixeira"),
  /** Linha de referência impressa sob o texto de apoio (sites/obras citados no material). */
  referencia: z.string().nullable(),
});

export const COLECAO_APOSTAS = "apostas-2026" as const;
export const AREAS = ["matematica", "natureza", "humanas", "linguagens"] as const;
export type Area = (typeof AREAS)[number];

export const qualidadeSchema = z.object({
  enunciado_vazio: z.boolean().optional(),
  alternativas_incompletas: z.boolean().optional(),
  depende_de_imagem: z.boolean().optional(),
  observacoes: z.array(z.string()).optional(),
});

export const questaoSchema = z.object({
  /** "enem-2023-142" (INEP) ou "apostas-2026-07" (coleção Apostas, não oficial). */
  id: z.string().regex(/^(enem-(19|20)[0-9]{2}-[0-9]{1,3}|apostas-2026-[0-9]{2})$/),
  ano: z.number().int().min(1998).max(2100),
  dia: z.union([z.literal(1), z.literal(2)]),
  caderno: z.enum(["azul", "amarelo", "branco", "rosa", "cinza", "verde", "laranja"]),
  numero: z.number().int().min(1).max(200),
  area: z.enum(AREAS),
  enunciado: z.string(),
  /** URL absoluta (enem.dev) ou caminho público local ("/questoes/natureza/x.png"). */
  imagens: z.array(urlOuCaminho),
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
  fonte: z.union([fonteSchema, fonteApostaSchema]),
  qualidade: qualidadeSchema.optional(),
  resolucao: resolucaoSchema.optional(),
  /** Presente só nas questões de coleções não oficiais (ex.: "apostas-2026"). */
  colecao: z.literal(COLECAO_APOSTAS).optional(),
  /** Resolução do autor da coleção (texto do material, markdown). */
  resolucao_autor: z.object({ topico: z.string(), texto: z.string().min(40) }).optional(),
  /** Explicação passo a passo escrita e conferida na curadoria (complementa a do autor). */
  explicacao_detalhada: z.string().min(80).optional(),
  /** Avisos da curadoria (gabarito discutível, alternativa duplicada etc.). Não mudam o gabarito. */
  flags: z.array(z.string()).optional(),
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
  if (habilidade.startsWith("CN-")) return competenciaNatureza(habilidade);
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

/** Competência (C1–C8) de cada habilidade da Matriz de Referência de Ciências da Natureza. */
export function competenciaNatureza(habilidade: string): Competencia | null {
  const n = Number(habilidade.replace(/^CN-H/, ""));
  if (!Number.isInteger(n) || n < 1 || n > 30) return null;
  if (n <= 4) return "C1";
  if (n <= 7) return "C2";
  if (n <= 12) return "C3";
  if (n <= 16) return "C4";
  if (n <= 19) return "C5";
  if (n <= 23) return "C6";
  if (n <= 27) return "C7";
  return "C8";
}

/** Nome curto das habilidades da Matriz de Ciências da Natureza (INEP), chave "CN-Hn". */
export const NOME_HABILIDADE_CN: Record<string, string> = {
  "CN-H1": "Ondas e oscilações",
  "CN-H2": "Ciência resolvendo problemas",
  "CN-H3": "Ciência e senso comum",
  "CN-H4": "Intervenção e biodiversidade",
  "CN-H5": "Circuitos elétricos",
  "CN-H6": "Manuais e aparelhos",
  "CN-H7": "Testes e critérios de materiais",
  "CN-H8": "Obtenção e reciclagem de recursos",
  "CN-H9": "Ciclos biogeoquímicos e energia",
  "CN-H10": "Perturbações ambientais",
  "CN-H11": "Biotecnologia",
  "CN-H12": "Impactos de atividades humanas",
  "CN-H13": "Transmissão da vida",
  "CN-H14": "Padrões nos processos vitais",
  "CN-H15": "Modelos e experimentos biológicos",
  "CN-H16": "Evolução",
  "CN-H17": "Linguagens das ciências",
  "CN-H18": "Propriedades e finalidades",
  "CN-H19": "Métodos para problemas sociais",
  "CN-H20": "Movimentos",
  "CN-H21": "Termodinâmica e eletromagnetismo",
  "CN-H22": "Radiação e matéria",
  "CN-H23": "Geração e uso de energia",
  "CN-H24": "Linguagem química",
  "CN-H25": "Obtenção de substâncias",
  "CN-H26": "Recursos energéticos e minerais",
  "CN-H27": "Intervenção com química",
  "CN-H28": "Adaptações dos organismos",
  "CN-H29": "Experimentos com seres vivos",
  "CN-H30": "Saúde e ambiente",
};

Object.assign(NOME_HABILIDADE, NOME_HABILIDADE_CN);

/** "ENEM 2023, questão 137" (para citar a fonte em qualquer tela). */
export function ehAposta(q: Pick<Questao, "colecao">): boolean {
  return q.colecao === COLECAO_APOSTAS;
}

export const CREDITO_APOSTAS = "Apostas do curso Edcley Teixeira (questões inéditas, não oficiais)";

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
  if (q.fonte.orgao !== "INEP") {
    return {
      citacao: `Fonte: ${CREDITO_APOSTAS}, questão ${String(q.numero).padStart(2, "0")}. Autor: ${q.fonte.autor}`,
      transcricaoUrl: "",
      urlOficial: null,
      gabarito: "gabarito do autor",
      tri: "fora do TRI (não oficial)",
    };
  }
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
