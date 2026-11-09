/** Fila de questões do sprint e resumo do dia. */
import { ordemHabilidade, type Questao } from "@/data/tipos";
import { DOMINIO_INICIAL } from "./evidencia";
import { dataLocal, MS_POR_DIA } from "./formato";
import { precisaRevisao } from "./revisao";
import { ehFacil } from "./tri";
import type { EstadoAluno, Habilidade } from "./tipos";

export const TAMANHO_FILA = 5;
/** No máximo 2 questões da mesma habilidade por fila (relaxado se faltar questão). */
export const MAX_POR_HABILIDADE = 2;
/** Questão acertada há menos de 7 dias fica fora da fila. */
export const DIAS_SEM_REPETIR_ACERTO = 7;

/** b heurístico para questões sem TRI. */
const B_HEURISTICO = { facil: -0.5, media: 1, dificil: 2 } as const;
const B_SEM_DIFICULDADE = 1;

export function bOrdenacao(q: Questao): number {
  if (q.tri) return q.tri.b;
  return q.dificuldade_estimada ? B_HEURISTICO[q.dificuldade_estimada] : B_SEM_DIFICULDADE;
}

type Chave = [number, number, number, number, number, string];

/**
 * Ordena por [sem habilidade por último, fácil primeiro, revisão vencida primeiro,
 * domínio asc (sem estado → 0,3), b asc (heurístico sem TRI), id].
 */
export function ordenarCandidatas(
  questoes: Questao[],
  { estado, agora, limiarFacil }: { estado: EstadoAluno; agora: Date; limiarFacil: number | null },
): Questao[] {
  const chave = (q: Questao): Chave => {
    const h = q.habilidade ? estado.habilidades[q.habilidade] : undefined;
    return [
      q.habilidade ? 0 : 1,
      ehFacil(q, limiarFacil) ? 0 : 1,
      h && precisaRevisao(h.cartao, agora) ? 0 : 1,
      h ? h.dominio : DOMINIO_INICIAL,
      bOrdenacao(q),
      q.id,
    ];
  };
  const comChave = questoes.map((q) => ({ q, k: chave(q) }));
  comChave.sort((x, y) => {
    for (let i = 0; i < 5; i++) {
      const d = (x.k[i] as number) - (y.k[i] as number);
      if (d !== 0) return d;
    }
    return x.k[5] < y.k[5] ? -1 : x.k[5] > y.k[5] ? 1 : 0;
  });
  return comChave.map((c) => c.q);
}

/**
 * Monta a fila do sprint: exclui anuladas, acertadas nos últimos 7 dias e repetidas;
 * ordena com `ordenarCandidatas` e aplica a diversidade (máx. 2 por habilidade).
 * `theta` é aceito para uso futuro (ordenar por distância a θ); hoje não muda a ordem.
 */
export function montarFila({
  questoes,
  estado,
  agora,
  tamanho = TAMANHO_FILA,
  limiarFacil,
}: {
  questoes: Questao[];
  estado: EstadoAluno;
  agora: Date;
  tamanho?: number;
  limiarFacil: number | null;
  theta: number | null;
}): Questao[] {
  const desde = agora.getTime() - DIAS_SEM_REPETIR_ACERTO * MS_POR_DIA;
  const acertadas = new Set(
    estado.tentativas
      .filter((t) => t.acertou && new Date(t.em).getTime() > desde)
      .map((t) => t.questaoId),
  );
  const vistas = new Set<string>();
  const candidatas = questoes.filter((q) => {
    if (q.anulada || acertadas.has(q.id) || vistas.has(q.id)) return false;
    vistas.add(q.id);
    return true;
  });
  const ordenadas = ordenarCandidatas(candidatas, { estado, agora, limiarFacil });

  const fila: Questao[] = [];
  const porHabilidade = new Map<string, number>();
  for (const q of ordenadas) {
    if (fila.length >= tamanho) break;
    const h = q.habilidade ?? "";
    const n = porHabilidade.get(h) ?? 0;
    if (n >= MAX_POR_HABILIDADE) continue;
    porHabilidade.set(h, n + 1);
    fila.push(q);
  }
  for (const q of ordenadas) {
    if (fila.length >= tamanho) break;
    if (!fila.includes(q)) fila.push(q);
  }
  return fila;
}

export interface ResumoDoDia {
  tentativasHoje: number;
  acertosHoje: number;
  sprintsHoje: number;
  habilidadesVencidas: Habilidade[];
  /** Menor `due` (ISO) entre as habilidades já revisadas e ainda não vencidas. */
  proximaRevisao: string | null;
}

export function resumoDoDia(estado: EstadoAluno, agora: Date): ResumoDoDia {
  const hoje = dataLocal(agora);
  const deHoje = estado.tentativas.filter((t) => dataLocal(new Date(t.em)) === hoje);
  const habilidades = Object.values(estado.habilidades);
  const vencidas = habilidades.filter((h) => precisaRevisao(h.cartao, agora));
  const proximas = habilidades
    .filter((h) => h.cartao.reps > 0 && !vencidas.includes(h))
    .map((h) => h.cartao.due)
    .sort();
  return {
    tentativasHoje: deHoje.length,
    acertosHoje: deHoje.filter((t) => t.acertou).length,
    sprintsHoje: estado.sprints.filter((s) => dataLocal(new Date(s.iniciadoEm)) === hoje).length,
    habilidadesVencidas: vencidas
      .map((h) => h.habilidade)
      .sort((a, b) => ordemHabilidade(a) - ordemHabilidade(b)),
    proximaRevisao: proximas[0] ?? null,
  };
}
