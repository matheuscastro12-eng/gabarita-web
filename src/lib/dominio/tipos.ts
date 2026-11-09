/**
 * Tipos do modelo do aluno (seção 6 do BRAINSTORM).
 * Tudo aqui é serializável em JSON (datas em ISO 8601) para persistir no StudentStore.
 */
import type { Card as CartaoFSRS } from "ts-fsrs";
import type { Habilidade, Letra } from "@/data/tipos";

export type { Habilidade, Letra };

/** Degrau da escada de dicas: 0 = nenhuma dica, 4 = resolução completa. */
export type DegrauDica = 0 | 1 | 2 | 3 | 4;

export type OrigemItem = "oficial" | "gemea";

export interface Tentativa {
  id: string;
  questaoId: string;
  habilidade: Habilidade;
  origem: OrigemItem;
  /** Alternativa marcada; null quando pulou ou pediu a resposta sem marcar. */
  escolha: Letra | null;
  gabarito: Letra;
  acertou: boolean;
  /** Tempo gasto até confirmar, em segundos. */
  segundos: number;
  degrauMaximo: DegrauDica;
  pediuResposta: boolean;
  /** Parâmetro b do item na hora da tentativa (null se sem TRI). */
  b: number | null;
  /** θ estimado antes desta tentativa (null se ainda não havia estimativa). */
  thetaAntes: number | null;
  /** Acerto rápido demais em relação à mediana: evidência pela metade. */
  chuteSuspeito: boolean;
  /** Evidência e peso efetivamente aplicados, para auditoria e para a tela de fim do sprint. */
  evidencia: number;
  peso: number;
  dominioAntes: number;
  dominioDepois: number;
  em: string;
  sprintId: string | null;
}

/** Cartão FSRS serializável (datas em ISO). */
export interface CartaoSerializado extends Omit<CartaoFSRS, "due" | "last_review"> {
  due: string;
  last_review: string | null;
}

export interface EstadoHabilidade {
  habilidade: Habilidade;
  /** Domínio m_h ∈ [0, 1]; começa em 0,3. */
  dominio: number;
  itensOficiais: number;
  itensGemeos: number;
  acertos: number;
  cartao: CartaoSerializado;
  atualizadoEm: string | null;
}

export interface EntradaCaderno {
  id: string;
  tentativaId: string;
  questaoId: string;
  habilidade: Habilidade;
  escolha: Letra | null;
  gabarito: Letra;
  /** Explicação do erro (do PROVAS ou do tutor), quando houver. */
  porQue: string | null;
  em: string;
  /** Quando o aluno refez a questão e acertou. */
  resolvidaEm: string | null;
}

export interface Sprint {
  id: string;
  iniciadoEm: string;
  terminadoEm: string | null;
  questaoIds: string[];
  tentativaIds: string[];
}

export type TipoSimulado = "faceis-15" | "completo-45";

export interface Simulado {
  id: string;
  tipo: TipoSimulado;
  iniciadoEm: string;
  terminadoEm: string;
  total: number;
  acertos: number;
  /** Maior tempo gasto num item, em segundos. */
  maiorTempoItem: number;
  tentativaIds: string[];
}

export interface Perfil {
  nome: string;
  /** Data da prova (YYYY-MM-DD) ou null. */
  dataProva: string | null;
  /** Meta de nota em matemática na escala do ENEM. */
  metaNota: number;
  /** Texto livre "explica do meu jeito" enviado ao tutor. */
  explicaDoMeuJeito: string;
  /** Habilidades da semana (meta "pronto nos fáceis"). */
  habilidadesDaSemana: Habilidade[];
  /** Mostrar o timer discreto durante o sprint. */
  mostrarTimer: boolean;
}

export interface EstadoAluno {
  versao: 1;
  criadoEm: string;
  atualizadoEm: string;
  perfil: Perfil;
  habilidades: Record<string, EstadoHabilidade>;
  tentativas: Tentativa[];
  caderno: EntradaCaderno[];
  sprints: Sprint[];
  simulados: Simulado[];
}

export interface IntervaloNota {
  /** Nota pontual 500 + 100·θ. */
  nota: number;
  inferior: number;
  superior: number;
  theta: number;
  erroPadrao: number;
  /** Quantidade de itens oficiais com TRI usados na estimativa. */
  itens: number;
}
