/**
 * TRI de 3 parâmetros e estimativa EAP de θ (seção 6 do BRAINSTORM).
 * Só itens oficiais com parâmetros TRI entram na nota.
 */
import { dificuldadeDoB, type Questao } from "@/data/tipos";
import type { IntervaloNota, Tentativa } from "./tipos";

export interface ItemTRI {
  a: number;
  b: number;
  c: number;
}

export interface RespostaTRI extends ItemTRI {
  acertou: boolean;
}

export interface OpcoesEAP {
  priorMedia?: number;
  priorDesvio?: number;
  pontos?: number;
  limite?: number;
  D?: number;
}

export type BuscaQuestao = (id: string) => Questao | undefined;

/** P(θ) = c + (1 − c) / (1 + exp(−D·a·(θ − b))). */
export function probabilidade3PL(theta: number, { a, b, c }: ItemTRI, D = 1): number {
  return c + (1 - c) / (1 + Math.exp(-D * a * (theta - b)));
}

const EPS = 1e-12;

/** EAP por quadratura em grade uniforme, prior Normal; log-verossimilhança para evitar underflow. */
export function estimarTheta(
  respostas: RespostaTRI[],
  opcoes: OpcoesEAP = {},
): { theta: number; erroPadrao: number; itens: number } {
  const { priorMedia = 0, priorDesvio = 1, pontos = 61, limite = 4, D = 1 } = opcoes;
  if (respostas.length === 0) {
    return { theta: priorMedia, erroPadrao: priorDesvio, itens: 0 };
  }
  const nos: number[] = [];
  const logPost: number[] = [];
  for (let k = 0; k < pontos; k++) {
    const x = -limite + (2 * limite * k) / (pontos - 1);
    let lp = -((x - priorMedia) ** 2) / (2 * priorDesvio ** 2);
    for (const r of respostas) {
      const p = Math.min(1 - EPS, Math.max(EPS, probabilidade3PL(x, r, D)));
      lp += r.acertou ? Math.log(p) : Math.log(1 - p);
    }
    nos.push(x);
    logPost.push(lp);
  }
  const max = Math.max(...logPost);
  const pesos = logPost.map((lp) => Math.exp(lp - max));
  const soma = pesos.reduce((s, w) => s + w, 0);
  const theta = pesos.reduce((s, w, k) => s + w * nos[k]!, 0) / soma;
  const variancia = pesos.reduce((s, w, k) => s + w * (nos[k]! - theta) ** 2, 0) / soma;
  return { theta, erroPadrao: Math.sqrt(variancia), itens: respostas.length };
}

/** Nota 500 + 100θ com intervalo ±1,96·100·EP, inteiros e nunca negativos. */
export function notaEstimada(theta: number, erroPadrao: number, itens: number): IntervaloNota {
  const centro = 500 + 100 * theta;
  const margem = 1.96 * 100 * erroPadrao;
  return {
    nota: Math.max(0, Math.round(centro)),
    inferior: Math.max(0, Math.round(centro - margem)),
    superior: Math.max(0, Math.round(centro + margem)),
    theta,
    erroPadrao,
    itens,
  };
}

export function comoBusca(questoes: Map<string, Questao> | BuscaQuestao): BuscaQuestao {
  return typeof questoes === "function" ? questoes : (id) => questoes.get(id);
}

/**
 * Respostas para a TRI: só tentativas oficiais em questões com TRI e não anuladas,
 * e só a PRIMEIRA tentativa de cada questão (na ordem do array, que é cronológica).
 */
export function respostasTRI(
  tentativas: Tentativa[],
  questoes: Map<string, Questao> | BuscaQuestao,
): RespostaTRI[] {
  const buscar = comoBusca(questoes);
  const vistas = new Set<string>();
  const respostas: RespostaTRI[] = [];
  for (const t of tentativas) {
    if (t.origem !== "oficial" || vistas.has(t.questaoId)) continue;
    const q = buscar(t.questaoId);
    if (!q || q.anulada || !q.tri) continue;
    vistas.add(t.questaoId);
    respostas.push({ a: q.tri.a, b: q.tri.b, c: q.tri.c, acertou: t.acertou });
  }
  return respostas;
}

/** Percentil 33 (posto mais próximo): o maior b do terço de menor b. null se vazio. */
export function limiarFacil(bs: number[]): number | null {
  if (bs.length === 0) return null;
  const ordenados = [...bs].sort((x, y) => x - y);
  return ordenados[Math.ceil(ordenados.length / 3) - 1]!;
}

/**
 * Questão fácil: com TRI, b ≤ limiar (sem limiar, usa a regra do PROVAS b < 0,5);
 * sem TRI, dificuldade_estimada === "facil" (null → não é fácil).
 */
export function ehFacil(questao: Questao, limiar: number | null): boolean {
  if (questao.tri) {
    return limiar != null ? questao.tri.b <= limiar : dificuldadeDoB(questao.tri.b) === "facil";
  }
  return questao.dificuldade_estimada === "facil";
}
