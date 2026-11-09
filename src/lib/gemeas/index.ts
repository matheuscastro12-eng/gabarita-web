/** API pública das questões gêmeas. */
import type { Questao } from "@/data/tipos";
import { criarAleatorio, sementeDeTexto } from "@/lib/aleatorio";
import { GERADORES } from "./geradores";
import { montarGemea } from "./montar";
import type { Gemea, NomeGerador } from "./tipos";

export type { Gemea, NomeGerador, AlternativaGemea } from "./tipos";
export { HABILIDADE_DO_GERADOR } from "./montar";

export const NOMES_GERADORES = Object.keys(GERADORES) as NomeGerador[];

export const ROTULO_GERADOR: Record<NomeGerador, string> = {
  porcentagem: "Porcentagem",
  "regra-de-tres": "Regra de três",
  "razao-proporcao": "Razão e proporção",
  probabilidade: "Probabilidade simples",
  "media-mediana-moda": "Média, mediana e moda",
  "funcao-afim": "Função afim",
  "equacao-1-grau": "Equação do 1º grau",
  "equacao-2-grau": "Equação do 2º grau",
  "progressao-aritmetica": "Progressão aritmética",
  escala: "Escala",
};

export function ehNomeGerador(nome: string): nome is NomeGerador {
  return Object.prototype.hasOwnProperty.call(GERADORES, nome);
}

/** Gera a gêmea do `gerador` com a `semente` (mesma semente → mesma questão). */
export function gerarGemea(gerador: NomeGerador, semente: number): Gemea {
  const candidata = GERADORES[gerador](criarAleatorio(semente));
  return montarGemea(gerador, semente, candidata);
}

/** Slugs de assunto do PROVAS → gerador. */
const ASSUNTO_PARA_GERADOR: [RegExp, NomeGerador][] = [
  [/porcentagem|juros/, "porcentagem"],
  [/regra-de-tres/, "regra-de-tres"],
  [/razao-proporcao|proporcionalidade/, "razao-proporcao"],
  [/probabilidade/, "probabilidade"],
  [/media|mediana|moda|estatistica/, "media-mediana-moda"],
  [/funcao-afim|funcao-do-1|funcoes?$/, "funcao-afim"],
  [/equacao-do-1|equacao-1|equacoes?-do-1/, "equacao-1-grau"],
  [/equacao-do-2|equacao-2|quadratica|segundo-grau/, "equacao-2-grau"],
  [/progressao-aritmetica|\bpa\b|sequencias?/, "progressao-aritmetica"],
  [/escala|grandezas-unidades/, "escala"],
];

/** Gerador mais adequado para uma questão oficial (pelos assuntos), ou null. */
export function geradorPara(questao: Pick<Questao, "assuntos" | "resolucao">): NomeGerador | null {
  const slugs = [...(questao.resolucao?.assuntos ?? []), ...questao.assuntos];
  for (const slug of slugs) {
    for (const [re, gerador] of ASSUNTO_PARA_GERADOR) if (re.test(slug)) return gerador;
  }
  return null;
}

/** Semente estável para a n-ésima gêmea de uma questão (n começa em 0). */
export function sementeGemea(questaoId: string, indice: number): number {
  return sementeDeTexto(`${questaoId}#${indice}`);
}

/**
 * Gêmea de uma questão oficial: escolhe o gerador pelos assuntos. `indice`
 * muda a semente (a 2ª gêmea da mesma questão é outra).
 */
export function gemeaDaQuestao(questao: Pick<Questao, "id" | "assuntos" | "resolucao">, indice = 0): Gemea | null {
  const gerador = geradorPara(questao);
  if (!gerador) return null;
  return gerarGemea(gerador, sementeGemea(questao.id, indice));
}

/** Converte uma gêmea num objeto com a cara de `Questao`, para registrar a tentativa (origem "gemea"). */
export function gemeaComoQuestao(gemea: Gemea, pai?: Pick<Questao, "habilidade" | "competencia">): Questao {
  return {
    id: gemea.id,
    ano: new Date().getFullYear(),
    dia: 2,
    caderno: "azul",
    numero: 0,
    area: "matematica",
    enunciado: gemea.enunciado,
    imagens: [],
    alternativas: gemea.alternativas.map((a) => ({ letra: a.letra, texto: a.texto })),
    gabarito: gemea.gabarito,
    anulada: false,
    habilidade: pai?.habilidade ?? gemea.habilidade,
    habilidade_origem: "revisada",
    competencia: pai?.competencia ?? null,
    assuntos: [gemea.gerador],
    classificacao: "revisada",
    tri: null,
    dificuldade_estimada: "facil",
    fonte: {
      orgao: "INEP",
      prova: "Gêmea gerada pelo Gabarita",
      transcricao: "enem.dev",
      transcricao_url: "https://enem.dev/",
    },
  };
}
