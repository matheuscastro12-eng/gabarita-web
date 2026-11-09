/**
 * Fixture de desenvolvimento a partir das páginas brutas da API pública enem.dev
 * (`GET /v1/exams/{ano}/questions?limit=50&offset=N`).
 *
 * Função pura: recebe as páginas já lidas (como dados) e a seleção de questões,
 * e devolve objetos no formato de `questaoSchema`. O texto é transcrição de
 * material do INEP: é copiado sem correção nem paráfrase.
 */
import { z } from "zod";
import { competenciaDa, questaoSchema, type Letra, type Questao } from "../../src/data/tipos";
import { ErroSync } from "./sync";

const alternativaEnemDev = z.object({
  letter: z.enum(["A", "B", "C", "D", "E"]),
  text: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
});

const questaoEnemDev = z.object({
  index: z.number().int(),
  year: z.number().int(),
  discipline: z.string().nullable().optional(),
  context: z.string().nullable().optional(),
  alternativesIntroduction: z.string().nullable().optional(),
  alternatives: z.array(alternativaEnemDev),
  correctAlternative: z.enum(["A", "B", "C", "D", "E"]),
  files: z.array(z.string()).nullable().optional(),
});

export const paginaEnemDevSchema = z.object({ questions: z.array(questaoEnemDev) });
export type PaginaEnemDev = z.infer<typeof paginaEnemDevSchema>;

export interface SelecaoFixture {
  numero: number;
  gabarito: Letra;
  habilidade: string;
  assuntos: string[];
}

/** As 5 questões reais do ENEM 2023 (2º dia, caderno azul) usadas no fixture. */
export const SELECAO_FIXTURE_2023: readonly SelecaoFixture[] = [
  { numero: 143, gabarito: "B", habilidade: "H3", assuntos: ["porcentagem", "aumento-e-desconto"] },
  { numero: 162, gabarito: "D", habilidade: "H19", assuntos: ["funcao-afim", "lei-de-formacao"] },
  { numero: 167, gabarito: "A", habilidade: "H16", assuntos: ["regra-de-tres", "porcentagem"] },
  { numero: 171, gabarito: "C", habilidade: "H16", assuntos: ["razao-e-proporcao", "regra-de-tres"] },
  { numero: 180, gabarito: "C", habilidade: "H27", assuntos: ["media-aritmetica"] },
];

export const ANO_FIXTURE = 2023;
export const ORIGEM_FIXTURE = "fixture:enem.dev-2023";
export const URL_OFICIAL_INEP =
  "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos";
export const OBSERVACAO_FIXTURE =
  "Fixture de desenvolvimento: habilidade e assuntos atribuídos por heurística, sem parâmetros TRI.";

/**
 * Monta as questões do fixture. Lança `ErroSync` se uma questão selecionada
 * não estiver nas páginas, se o gabarito divergir do esperado ou se o
 * resultado não passar em `questaoSchema`.
 */
export function montarFixture(
  paginas: readonly unknown[],
  selecao: readonly SelecaoFixture[] = SELECAO_FIXTURE_2023,
  ano: number = ANO_FIXTURE,
): Questao[] {
  const porNumero = new Map<number, z.infer<typeof questaoEnemDev>>();
  paginas.forEach((p, i) => {
    const r = paginaEnemDevSchema.safeParse(p);
    if (!r.success) throw new ErroSync(`Página ${i} do enem.dev em formato inesperado: ${r.error.message}`);
    for (const q of r.data.questions) {
      // Páginas se sobrepõem nas bordas (offset 50 traz a 50 de novo): fica a primeira.
      if (q.year === ano && !porNumero.has(q.index)) porNumero.set(q.index, q);
    }
  });

  return selecao.map((s) => {
    const bruta = porNumero.get(s.numero);
    if (!bruta) throw new ErroSync(`Questão ${s.numero} de ${ano} não encontrada nas páginas do enem.dev.`);
    if (bruta.correctAlternative !== s.gabarito) {
      throw new ErroSync(
        `Gabarito divergente na questão ${s.numero}: enem.dev diz ${bruta.correctAlternative}, a seleção espera ${s.gabarito}.`,
      );
    }

    const partes = [bruta.context ?? "", bruta.alternativesIntroduction ?? ""].filter((t) => t !== "");
    const imagens = bruta.files ?? [];
    const alternativas = bruta.alternatives.map((a) => ({
      letra: a.letter,
      texto: (a.text ?? "").trim(),
      imagem: a.file ?? null,
    }));
    const dependeDeImagem = imagens.length > 0 || alternativas.some((a) => a.imagem !== null);

    const questao: Questao = {
      id: `enem-${ano}-${s.numero}`,
      ano,
      dia: 2,
      caderno: "azul",
      numero: s.numero,
      area: "matematica",
      enunciado: partes.join("\n\n"),
      imagens,
      alternativas,
      gabarito: bruta.correctAlternative,
      anulada: false,
      habilidade: s.habilidade,
      habilidade_origem: "heuristica",
      competencia: competenciaDa(s.habilidade),
      assuntos: s.assuntos,
      classificacao: "heuristica",
      tri: null,
      dificuldade_estimada: null,
      fonte: {
        orgao: "INEP",
        prova: `ENEM ${ano}, 2º dia, caderno azul (aplicação regular), questão ${s.numero}`,
        url_oficial: URL_OFICIAL_INEP,
        transcricao: "enem.dev",
        transcricao_url: `https://api.enem.dev/v1/exams/${ano}/questions/${s.numero}`,
        microdados_url: null,
      },
      qualidade: { depende_de_imagem: dependeDeImagem, observacoes: [OBSERVACAO_FIXTURE] },
    };

    const r = questaoSchema.safeParse(questao);
    if (!r.success) throw new ErroSync(`Questão ${s.numero} do fixture inválida: ${r.error.message}`);
    return r.data;
  });
}
