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

export interface RamoGeometria {
  x: number;
  y: number;
  /** Onde o texto dos filhos se ancora. */
  ancora: "start" | "middle" | "end";
  filhos: { x: number; y: number }[];
}

export const MAPA_VIEWBOX = { x: -500, y: -300, largura: 1000, altura: 600 };
const RX = 215;
const RY = 150;
const FX = 300;
const FY = 210;
const PASSO = 30;

/** Posições radiais: ramos numa elipse, filhos empilhados além do ramo, para fora. */
export function geometriaMapa(qtdFilhos: readonly number[]): RamoGeometria[] {
  const n = qtdFilhos.length;
  return qtdFilhos.map((m, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const x = Math.round(RX * c);
    const y = Math.round(RY * s);
    const ancora = c > 0.25 ? "start" : c < -0.25 ? "end" : "middle";
    const baseX = Math.round(FX * c);
    let filhos: { x: number; y: number }[];
    if (ancora === "middle") {
      // em cima ou embaixo: empilha para fora (para cima no topo, para baixo embaixo)
      const dir = s < 0 ? -1 : 1;
      const y0 = Math.round(y + dir * 46);
      filhos = Array.from({ length: m }, (_, j) => ({ x: baseX, y: y0 + dir * j * PASSO }));
    } else {
      const yc = Math.round(FY * s * 0.85);
      const y0 = yc - ((m - 1) * PASSO) / 2;
      filhos = Array.from({ length: m }, (_, j) => ({ x: baseX, y: Math.round(y0 + j * PASSO) }));
    }
    return { x, y, ancora, filhos };
  });
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
