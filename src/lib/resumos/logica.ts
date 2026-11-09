/** Lógica pura dos resumos: busca, "estudado", ligação com as questões e geometria do mapa mental. */
import type { Competencia } from "@/data/tipos";
import { COMPETENCIAS } from "@/data/taxonomia";
import { RESUMOS, type Resumo } from "./conteudo";

// ---------- busca ----------

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function textoDoResumo(r: Resumo): string {
  return normalizar(
    [r.titulo, r.chamada, r.mapa.centro, ...r.mapa.ramos.flatMap((m) => [m.rotulo, ...m.itens]), ...r.habilidades, ...r.assuntos.map((a) => a.replace(/-/g, " "))].join(" "),
  );
}

/** Resumos cujo texto contém todas as palavras da busca (sem acento, sem caixa). */
export function buscarResumos(consulta: string, lista: readonly Resumo[] = RESUMOS): Resumo[] {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [...lista];
  return lista.filter((r) => {
    const t = textoDoResumo(r);
    return termos.every((p) => t.includes(p));
  });
}

/** Grade do índice: competências na ordem C1–C7, só as que têm resumo na lista. */
export function agruparPorCompetencia(lista: readonly Resumo[]): { competencia: Competencia; nome: string; resumos: Resumo[] }[] {
  return COMPETENCIAS.map((c) => ({ competencia: c.id, nome: c.nome, resumos: lista.filter((r) => r.competencia === c.id) })).filter(
    (g) => g.resumos.length > 0,
  );
}

// ---------- estudado (localStorage) ----------

export const CHAVE_ESTUDADOS = "gabarita:resumos-estudados";

/** Lê o JSON salvo; ignora lixo e ids que não existem mais. */
export function lerEstudados(bruto: string | null): string[] {
  if (!bruto) return [];
  try {
    const v: unknown = JSON.parse(bruto);
    if (!Array.isArray(v)) return [];
    return [...new Set(v.filter((x): x is string => typeof x === "string" && RESUMOS.some((r) => r.id === x)))];
  } catch {
    return [];
  }
}

export function alternarEstudado(atuais: readonly string[], id: string): string[] {
  return atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id];
}

// ---------- ligação com as questões ----------

interface QuestaoMinima {
  id: string;
  habilidade: string | null;
  assuntos: readonly string[];
  anulada?: boolean;
}

/** Questões do app daquele resumo: mesmo assunto e habilidade da lista do resumo (anuladas fora). */
export function questoesDoResumo<Q extends QuestaoMinima>(resumo: Resumo, questoes: readonly Q[]): Q[] {
  return questoes.filter(
    (q) => !q.anulada && q.habilidade !== null && resumo.habilidades.includes(q.habilidade as Resumo["habilidades"][number]) && q.assuntos.some((a) => resumo.assuntos.includes(a)),
  );
}

/** Resumo para o link "Ver resumo" da IDE: o primeiro assunto da questão que tenha resumo com a habilidade dela. */
export function resumoParaQuestao(q: Pick<QuestaoMinima, "habilidade" | "assuntos">, lista: readonly Resumo[] = RESUMOS): Resumo | null {
  if (!q.habilidade) return null;
  for (const a of q.assuntos) {
    const r = lista.find((x) => x.assuntos.includes(a) && x.habilidades.includes(q.habilidade as Resumo["habilidades"][number]));
    if (r) return r;
  }
  return null;
}

// ---------- mapa mental ----------

export interface NoMapa {
  rotulo: string;
  href?: string;
}

export type Ancora = "start" | "middle" | "end";

export interface CaixaMapa {
  /** Canto esquerdo e centro vertical da pílula. */
  x: number;
  y: number;
  largura: number;
}

export interface RamoGeometria {
  caixa: CaixaMapa;
  ancora: Ancora;
  /** Ponto da pílula do ramo de onde saem as ligações para os filhos. */
  saida: { x: number; y: number };
  filhos: CaixaMapa[];
}

export interface GeometriaMapa {
  ramos: RamoGeometria[];
  viewBox: { x: number; y: number; largura: number; altura: number };
}

const RX = 190;
const RY = 135;
const VAO = 26;
const PASSO = 30;
const MEIA_ALTURA = 20;

function esquerda(xAncora: number, largura: number, ancora: Ancora): number {
  return ancora === "start" ? xAncora : ancora === "end" ? xAncora - largura : xAncora - largura / 2;
}

/**
 * Posições radiais: o ponto de cada ramo fica numa elipse e a pílula cresce para fora do centro;
 * os filhos empilham além da borda externa do ramo. O viewBox abraça tudo (todos os ramos abertos).
 */
export function geometriaMapa(ramos: readonly { largura: number; filhos: readonly number[] }[], larguraCentro = 160): GeometriaMapa {
  const n = ramos.length;
  const geo = ramos.map((r, i): RamoGeometria => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const ancora: Ancora = c > 0.2 ? "start" : c < -0.2 ? "end" : "middle";
    const px = Math.round(RX * c + (ancora === "middle" ? 0 : Math.sign(c) * (larguraCentro / 2 - 40)));
    const py = Math.round(RY * s);
    const caixa = { x: Math.round(esquerda(px, r.largura, ancora)), y: py, largura: r.largura };
    let saida: { x: number; y: number };
    let filhos: CaixaMapa[];
    if (ancora === "middle") {
      const dir = s < 0 ? -1 : 1;
      saida = { x: px, y: py + dir * 17 };
      filhos = r.filhos.map((w, j) => ({ x: Math.round(px - w / 2), y: py + dir * (48 + j * PASSO), largura: w }));
    } else {
      const borda = ancora === "start" ? caixa.x + r.largura : caixa.x;
      saida = { x: borda, y: py };
      const xf = borda + (ancora === "start" ? VAO : -VAO);
      const y0 = py - ((r.filhos.length - 1) * PASSO) / 2;
      filhos = r.filhos.map((w, j) => ({ x: Math.round(esquerda(xf, w, ancora)), y: Math.round(y0 + j * PASSO), largura: w }));
    }
    return { caixa, ancora, saida, filhos };
  });
  const caixas = [{ x: -larguraCentro / 2, y: 0, largura: larguraCentro }, ...geo.flatMap((g) => [g.caixa, ...g.filhos])];
  const minX = Math.min(...caixas.map((b) => b.x)) - 12;
  const maxX = Math.max(...caixas.map((b) => b.x + b.largura)) + 12;
  const minY = Math.min(...caixas.map((b) => b.y)) - MEIA_ALTURA - 8;
  const maxY = Math.max(...caixas.map((b) => b.y)) + MEIA_ALTURA + 8;
  return { ramos: geo, viewBox: { x: minX, y: minY, largura: maxX - minX, altura: maxY - minY } };
}

/** Largura aproximada de um rótulo (px) para desenhar a pílula atrás do texto. */
export function larguraRotulo(texto: string, tamanho = 13): number {
  return Math.round(texto.length * tamanho * 0.56 + 22);
}

/** Mapa geral: centro "Matemática do ENEM", ramos = competências, filhos = resumos. */
export function mapaGeral(lista: readonly Resumo[] = RESUMOS): { centro: string; ramos: { rotulo: string; itens: NoMapa[] }[] } {
  return {
    centro: "Matemática do ENEM",
    ramos: agruparPorCompetencia(lista).map((g) => ({
      rotulo: `${g.competencia} · ${g.nome}`,
      itens: g.resumos.map((r) => ({ rotulo: r.mapa.centro, href: `/resumos/${r.id}` })),
    })),
  };
}
