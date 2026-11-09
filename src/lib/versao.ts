/**
 * As três "versões" do Gabarita (decisão do Matheus, 09/11/2026): Matemática, Natureza e
 * Geral. A versão decide quais áreas cada tela mostra; o progresso fica num só estado, com
 * as habilidades separadas por área (matemática "H3", natureza "CN-H3").
 */
import { NOME_AREA, type Area } from "@/data/tipos";

export const VERSOES = ["matematica", "natureza", "geral"] as const;
export type Versao = (typeof VERSOES)[number];

export const CHAVE_VERSAO = "gabarita:versao";

export interface InfoVersao {
  id: Versao;
  nome: string;
  descricao: string;
}

export const INFO_VERSAO: Record<Versao, InfoVersao> = {
  matematica: {
    id: "matematica",
    nome: "Matemática",
    descricao: "Sprints, Aprender, Resumos, Mapa da matriz de MT, Caderno e simulados de matemática.",
  },
  natureza: {
    id: "natureza",
    nome: "Natureza",
    descricao: "Física, química e biologia: sprints, Mapa da matriz de CN, Caderno e simulados de natureza.",
  },
  geral: {
    id: "geral",
    nome: "Geral",
    descricao: "Prova completa do 2º dia (CN + MT, 90 questões, 5h), blocos por área e treino misturado.",
  },
};

export function ehVersao(v: unknown): v is Versao {
  return typeof v === "string" && (VERSOES as readonly string[]).includes(v);
}

/** Áreas que a versão mostra. */
export function areasDaVersao(v: Versao): Area[] {
  if (v === "geral") return ["natureza", "matematica"];
  return [v];
}

/** "Gabarita · Matemática". */
export function nomeCompleto(v: Versao): string {
  return `Gabarita · ${INFO_VERSAO[v].nome}`;
}

/** Itens do menu que só existem na versão Matemática (Resumos e Aprender de natureza ainda não existem). */
export const SO_MATEMATICA = ["/aprender", "/resumos"] as const;

export function itemVisivel(href: string, v: Versao): boolean {
  return v === "matematica" || !(SO_MATEMATICA as readonly string[]).includes(href);
}

/**
 * Versão na abertura: a salva, se houver; senão, quem já tem progresso (usava o app só de
 * matemática) cai direto em Matemática; senão, null = mostrar a tela de entrada.
 */
export function versaoInicial(salva: string | null, temProgresso: boolean): Versao | null {
  if (ehVersao(salva)) return salva;
  return temProgresso ? "matematica" : null;
}

export function nomeArea(a: Area): string {
  return NOME_AREA[a];
}
