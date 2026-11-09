/**
 * Simulado de 15 fáceis inéditos (critério "pronto nos fáceis", seção 6 do BRAINSTORM):
 * itens oficiais do tercil fácil que o aluno nunca tentou, 3 minutos por item.
 */
import type { Questao } from "@/data/tipos";
import { gerarId, type GeradorId } from "./id";
import { bOrdenacao } from "./fila";
import { MAX_SEGUNDOS_ITEM_FACEIS } from "./pronto";
import { ehFacil } from "./tri";
import type { EstadoAluno, Simulado, TipoSimulado } from "./tipos";

export const TAMANHO_SIMULADO_FACEIS = 15;
/** 3 minutos por item (o cronômetro da tela usa este valor). */
export const SEGUNDOS_POR_ITEM_SIMULADO = MAX_SEGUNDOS_ITEM_FACEIS;
/** No máximo 2 itens da mesma habilidade (relaxado se faltar questão). */
export const MAX_POR_HABILIDADE_SIMULADO = 2;

/** Ids de questões oficiais que o aluno já tentou (qualquer resultado). */
export function questoesJaTentadas(estado: EstadoAluno): Set<string> {
  return new Set(estado.tentativas.filter((t) => t.origem === "oficial").map((t) => t.questaoId));
}

/**
 * Monta o simulado: fáceis (pelo limiar do banco), com habilidade, não anuladas e inéditas.
 * Prioriza as habilidades da semana; dentro de cada grupo, b crescente; máx. 2 por habilidade,
 * completando sem o limite se faltar. Devolve menos de `tamanho` se não houver questão suficiente.
 */
export function montarSimuladoFaceis({
  questoes,
  estado,
  limiarFacil,
  tamanho = TAMANHO_SIMULADO_FACEIS,
}: {
  questoes: Questao[];
  estado: EstadoAluno;
  limiarFacil: number | null;
  tamanho?: number;
}): Questao[] {
  const tentadas = questoesJaTentadas(estado);
  const semana = new Set<string>(estado.perfil.habilidadesDaSemana);
  const vistas = new Set<string>();
  const candidatas = questoes.filter((q) => {
    if (q.anulada || !q.habilidade || tentadas.has(q.id) || vistas.has(q.id) || !ehFacil(q, limiarFacil)) return false;
    vistas.add(q.id);
    return true;
  });
  candidatas.sort((x, y) => {
    const sx = semana.has(x.habilidade!) ? 0 : 1;
    const sy = semana.has(y.habilidade!) ? 0 : 1;
    if (sx !== sy) return sx - sy;
    const d = bOrdenacao(x) - bOrdenacao(y);
    if (d !== 0) return d;
    return x.id < y.id ? -1 : 1;
  });

  const escolhidas: Questao[] = [];
  const porHabilidade = new Map<string, number>();
  for (const q of candidatas) {
    if (escolhidas.length >= tamanho) break;
    const n = porHabilidade.get(q.habilidade!) ?? 0;
    if (n >= MAX_POR_HABILIDADE_SIMULADO) continue;
    porHabilidade.set(q.habilidade!, n + 1);
    escolhidas.push(q);
  }
  for (const q of candidatas) {
    if (escolhidas.length >= tamanho) break;
    if (!escolhidas.includes(q)) escolhidas.push(q);
  }
  return escolhidas;
}

/**
 * Encerra um simulado: conta acertos e o maior tempo por item a partir das tentativas
 * já registradas (`tentativaIds`) e grava o `Simulado` no estado.
 */
export function encerrarSimulado(
  estado: EstadoAluno,
  { tipo, iniciadoEm, tentativaIds }: { tipo: TipoSimulado; iniciadoEm: string; tentativaIds: string[] },
  agora: Date,
  idFn: GeradorId = (prefixo) => gerarId(prefixo),
): { estado: EstadoAluno; simulado: Simulado } {
  const ids = new Set(tentativaIds);
  const tentativas = estado.tentativas.filter((t) => ids.has(t.id));
  const simulado: Simulado = {
    id: idFn("simulado"),
    tipo,
    iniciadoEm,
    terminadoEm: agora.toISOString(),
    total: tentativaIds.length,
    acertos: tentativas.filter((t) => t.acertou).length,
    maiorTempoItem: tentativas.reduce((m, t) => Math.max(m, t.segundos), 0),
    tentativaIds: [...tentativaIds],
  };
  return {
    estado: { ...estado, simulados: [...estado.simulados, simulado], atualizadoEm: agora.toISOString() },
    simulado,
  };
}

/** Um simulado de fáceis vale para o critério quando acerta ≥ 90% e nenhum item passa de 3 min. */
export function simuladoValeParaFaceis(s: Simulado): boolean {
  return s.tipo === "faceis-15" && s.total > 0 && s.acertos / s.total >= 0.9 && s.maiorTempoItem <= SEGUNDOS_POR_ITEM_SIMULADO;
}
