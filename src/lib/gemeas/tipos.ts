/** Questões gêmeas: geradas por template determinístico em TypeScript; a resposta sai do código. */
import type { Habilidade, Letra } from "@/data/tipos";

export type NomeGerador =
  | "porcentagem"
  | "regra-de-tres"
  | "razao-proporcao"
  | "probabilidade"
  | "media-mediana-moda"
  | "funcao-afim"
  | "equacao-1-grau"
  | "equacao-2-grau"
  | "progressao-aritmetica"
  | "escala";

export interface AlternativaGemea {
  letra: Letra;
  texto: string;
}

export interface Gemea {
  /** `gemea-<gerador>-<semente>` */
  id: string;
  gerador: NomeGerador;
  habilidade: Habilidade;
  semente: number;
  enunciado: string;
  alternativas: AlternativaGemea[];
  gabarito: Letra;
  /** Resposta correta no mesmo formato da alternativa. */
  resposta: string;
  /** Resolução passo a passo (Markdown + LaTeX). */
  resolucao: string;
  /** Erro típico por alternativa errada. */
  erros: Partial<Record<Letra, string>>;
}

/** O que cada gerador produz antes de virar alternativas A–E. */
export interface Candidata {
  enunciado: string;
  /** Valor correto. */
  resposta: number;
  /** Distratores: valor errado + o erro que leva até ele. */
  distratores: { valor: number; erro: string }[];
  /** Como mostrar um valor como texto de alternativa. */
  formatar: (valor: number) => string;
  resolucao: string;
}
