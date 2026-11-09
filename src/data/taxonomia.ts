/**
 * Espelho de `PROVAS/taxonomia/matriz-mt.json` (competências C1–C7, texto oficial do INEP)
 * e de `PROVAS/taxonomia/assuntos.json` (assuntos do Gabarita; `focoInicial` = trilha
 * "fáceis primeiro"). Copiado à mão em 09/11/2026: a taxonomia muda raramente e o app
 * precisa dela sem I/O. Ao mudar no PROVAS, atualize aqui.
 */
import type { Competencia, Habilidade } from "./tipos";

export interface CompetenciaInfo {
  id: Competencia;
  /** Nome curto para rótulos. */
  nome: string;
  /** Texto oficial da Matriz de Referência (INEP). */
  descricao: string;
  habilidades: Habilidade[];
}

export const COMPETENCIAS: CompetenciaInfo[] = [
  {
    id: "C1",
    nome: "Números",
    descricao: "Construir significados para os números naturais, inteiros, racionais e reais.",
    habilidades: ["H1", "H2", "H3", "H4", "H5"],
  },
  {
    id: "C2",
    nome: "Geometria",
    descricao: "Utilizar o conhecimento geométrico para realizar a leitura e a representação da realidade e agir sobre ela.",
    habilidades: ["H6", "H7", "H8", "H9"],
  },
  {
    id: "C3",
    nome: "Grandezas e medidas",
    descricao: "Construir noções de grandezas e medidas para a compreensão da realidade e a solução de problemas do cotidiano.",
    habilidades: ["H10", "H11", "H12", "H13", "H14"],
  },
  {
    id: "C4",
    nome: "Variação de grandezas",
    descricao: "Construir noções de variação de grandezas para a compreensão da realidade e a solução de problemas do cotidiano.",
    habilidades: ["H15", "H16", "H17", "H18"],
  },
  {
    id: "C5",
    nome: "Álgebra e modelagem",
    descricao:
      "Modelar e resolver problemas que envolvem variáveis socioeconômicas ou técnico-científicas, usando representações algébricas.",
    habilidades: ["H19", "H20", "H21", "H22", "H23"],
  },
  {
    id: "C6",
    nome: "Gráficos e tabelas",
    descricao:
      "Interpretar informações de natureza científica e social obtidas da leitura de gráficos e tabelas, realizando previsão de tendência, extrapolação, interpolação e interpretação.",
    habilidades: ["H24", "H25", "H26"],
  },
  {
    id: "C7",
    nome: "Estatística e probabilidade",
    descricao:
      "Compreender o caráter aleatório e não-determinístico dos fenômenos naturais e sociais e utilizar instrumentos adequados para medidas, determinação de amostras e cálculos de probabilidade para interpretar informações de variáveis apresentadas em uma distribuição estatística.",
    habilidades: ["H27", "H28", "H29", "H30"],
  },
];

export interface AssuntoInfo {
  /** Slug usado em `questao.assuntos`. */
  id: string;
  nome: string;
  focoInicial: boolean;
  habilidades: Habilidade[];
}

export const ASSUNTOS: AssuntoInfo[] = [
  { id: "porcentagem", nome: "Porcentagem", focoInicial: true, habilidades: ["H3", "H4", "H5", "H16"] },
  { id: "razao-proporcao", nome: "Razão e proporção", focoInicial: true, habilidades: ["H3", "H15", "H16", "H17"] },
  { id: "regra-de-tres", nome: "Regra de três", focoInicial: true, habilidades: ["H16", "H17", "H18"] },
  { id: "grandezas-unidades-escalas", nome: "Grandezas, unidades e escalas", focoInicial: true, habilidades: ["H10", "H11", "H12", "H13"] },
  { id: "probabilidade", nome: "Probabilidade", focoInicial: true, habilidades: ["H28", "H29", "H30"] },
  { id: "analise-combinatoria", nome: "Análise combinatória básica", focoInicial: true, habilidades: ["H2", "H3"] },
  { id: "estatistica-basica", nome: "Média, mediana e moda", focoInicial: true, habilidades: ["H27", "H28", "H29"] },
  { id: "graficos-tabelas", nome: "Gráficos e tabelas", focoInicial: true, habilidades: ["H24", "H25", "H26"] },
  { id: "funcao-afim", nome: "Função afim", focoInicial: true, habilidades: ["H15", "H19", "H20", "H21"] },
  { id: "funcao-quadratica", nome: "Função quadrática", focoInicial: true, habilidades: ["H19", "H20", "H21", "H22"] },
  { id: "leitura-grafico-funcao", nome: "Leitura de gráfico de função", focoInicial: true, habilidades: ["H20", "H24", "H25"] },
  { id: "equacao-1-grau", nome: "Equação e sistema do 1º grau", focoInicial: true, habilidades: ["H3", "H19", "H21"] },
  { id: "equacao-2-grau", nome: "Equação do 2º grau", focoInicial: true, habilidades: ["H3", "H21", "H22"] },
  { id: "geometria-plana", nome: "Áreas e perímetros", focoInicial: true, habilidades: ["H7", "H8", "H9", "H12", "H14"] },
  { id: "sequencias-pa", nome: "Sequências e PA", focoInicial: true, habilidades: ["H2", "H3", "H19"] },
  { id: "progressao-geometrica", nome: "PG e crescimento exponencial", focoInicial: false, habilidades: ["H2", "H3", "H21"] },
  { id: "geometria-espacial", nome: "Geometria espacial", focoInicial: false, habilidades: ["H6", "H7", "H8", "H9", "H12", "H14"] },
  { id: "trigonometria", nome: "Trigonometria", focoInicial: false, habilidades: ["H7", "H8", "H12"] },
  { id: "geometria-analitica", nome: "Geometria analítica", focoInicial: false, habilidades: ["H6", "H8", "H19", "H20"] },
  { id: "semelhanca-pitagoras", nome: "Semelhança e Pitágoras", focoInicial: false, habilidades: ["H7", "H8", "H12"] },
  { id: "matematica-financeira", nome: "Matemática financeira", focoInicial: false, habilidades: ["H3", "H5", "H21"] },
  { id: "numeros-operacoes", nome: "Números e operações", focoInicial: false, habilidades: ["H1", "H3", "H4", "H5"] },
  { id: "matrizes-sistemas", nome: "Matrizes e sistemas lineares", focoInicial: false, habilidades: ["H19", "H21", "H22"] },
  { id: "polinomios-funcoes-outras", nome: "Polinômios e outras funções", focoInicial: false, habilidades: ["H19", "H20", "H21"] },
];

export const ASSUNTOS_DE_FOCO: AssuntoInfo[] = ASSUNTOS.filter((a) => a.focoInicial);

const porId = new Map(ASSUNTOS.map((a) => [a.id, a]));

export function assuntoPorId(id: string): AssuntoInfo | undefined {
  return porId.get(id);
}

/** Nome legível de um slug de assunto (o próprio slug se não estiver na taxonomia). */
export function nomeAssunto(id: string): string {
  return porId.get(id)?.nome ?? id.replace(/-/g, " ");
}
