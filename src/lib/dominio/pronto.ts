/**
 * Critérios de "pronto" (seção 6 do BRAINSTORM). Cada função diz o que falta, em pt-BR.
 */
import type { Questao } from "@/data/tipos";
import { novoEstadoHabilidade } from "./evidencia";
import { dataLocal, formatarDecimal, MS_POR_DIA, plural, truncar } from "./formato";
import { dominioEfetivo, retencao } from "./revisao";
import type { EstadoHabilidade, IntervaloNota, Simulado, Tentativa } from "./tipos";

export const META_DOMINIO = 0.85;
export const MIN_ITENS_OFICIAIS = 6;
export const ULTIMOS_N = 4;
export const DEGRAU_MAX_ULTIMOS = 1;

export const META_ACERTO_FACEIS = 0.9;
export const MAX_SEGUNDOS_ITEM_FACEIS = 180;
export const MAX_TAXA_ERRO_FACEIS_PROVA = 0.05;
export const SIMULADOS_COMPLETOS_MIN = 2;
export const JANELA_SIMULADOS_DIAS = 14;

export interface Resultado {
  pronto: boolean;
  faltas: string[];
}

export function prontoHabilidade({
  estado,
  tentativas,
  agora,
}: {
  estado: EstadoHabilidade;
  tentativas: Tentativa[];
  agora: Date;
}): Resultado & { dominioEfetivo: number; retencao: number } {
  const oficiais = tentativas.filter(
    (t) => t.habilidade === estado.habilidade && t.origem === "oficial",
  );
  const ret = retencao(estado.cartao, agora);
  const efetivo = dominioEfetivo(estado.dominio, ret);
  const faltas: string[] = [];

  if (efetivo < META_DOMINIO) {
    faltas.push(
      `domínio efetivo ${formatarDecimal(truncar(efetivo))} (meta ${formatarDecimal(META_DOMINIO)})`,
    );
  }
  const faltamItens = MIN_ITENS_OFICIAIS - oficiais.length;
  if (faltamItens > 0) {
    faltas.push(
      faltamItens === 1
        ? "falta 1 item oficial"
        : `faltam ${faltamItens} itens oficiais`,
    );
  }
  const ultimos = oficiais.slice(-ULTIMOS_N);
  const ultimosOk =
    ultimos.length === ULTIMOS_N &&
    ultimos.every((t) => t.acertou && t.degrauMaximo <= DEGRAU_MAX_ULTIMOS && !t.pediuResposta);
  if (!ultimosOk) {
    faltas.push(
      `últimos ${ULTIMOS_N} precisam ser acertos com dica até o degrau ${DEGRAU_MAX_ULTIMOS}`,
    );
  }
  const diasComAcerto = new Set(
    oficiais.filter((t) => t.acertou).map((t) => dataLocal(new Date(t.em))),
  );
  if (diasComAcerto.size < 2) faltas.push("falta 1 acerto em outro dia");

  return { pronto: faltas.length === 0, faltas, dominioEfetivo: efetivo, retencao: ret };
}

export function prontoFaceis({
  habilidadesDaSemana,
  estados,
  tentativas,
  simulados,
  agora,
}: {
  habilidadesDaSemana: string[];
  estados: Record<string, EstadoHabilidade>;
  tentativas: Tentativa[];
  simulados: Simulado[];
  agora: Date;
}): Resultado {
  const faltas: string[] = [];
  for (const h of habilidadesDaSemana) {
    const estado = estados[h] ?? novoEstadoHabilidade(h as EstadoHabilidade["habilidade"], agora);
    const r = prontoHabilidade({ estado, tentativas, agora });
    if (!r.pronto) faltas.push(`${h}: ${r.faltas.join("; ")}`);
  }
  const simuladoOk = simulados.some(
    (s) =>
      s.tipo === "faceis-15" &&
      s.total > 0 &&
      s.acertos / s.total >= META_ACERTO_FACEIS &&
      s.maiorTempoItem <= MAX_SEGUNDOS_ITEM_FACEIS,
  );
  if (!simuladoOk) {
    faltas.push(
      "falta 1 simulado de 15 fáceis com pelo menos 90% de acerto e no máximo 3 min por item",
    );
  }
  return { pronto: faltas.length === 0, faltas };
}

export function prontoProva({
  nota,
  metaNota,
  tentativas,
  questoes,
  simulados,
  agora,
}: {
  nota: IntervaloNota;
  metaNota: number;
  tentativas: Tentativa[];
  questoes: (id: string) => Questao | undefined;
  simulados: Simulado[];
  agora: Date;
}): Resultado {
  const faltas: string[] = [];
  if (nota.inferior < metaNota) {
    faltas.push(`limite inferior da nota estimada ${nota.inferior} (meta ${metaNota})`);
  }

  const limiteB = nota.theta - 1;
  const faceis = tentativas.filter((t) => {
    if (t.origem !== "oficial") return false;
    const q = questoes(t.questaoId);
    return !!q && !q.anulada && !!q.tri && q.tri.b < limiteB;
  });
  if (faceis.length === 0) {
    faltas.push(
      `ainda não há itens oficiais com b abaixo de θ − 1 (${formatarDecimal(limiteB)}) para medir a taxa de erro`,
    );
  } else {
    const taxa = faceis.filter((t) => !t.acertou).length / faceis.length;
    if (taxa >= MAX_TAXA_ERRO_FACEIS_PROVA) {
      faltas.push(
        `erro de ${formatarDecimal(taxa * 100, 1)}% nos itens com b abaixo de θ − 1 (meta abaixo de 5%)`,
      );
    }
  }

  const desde = agora.getTime() - JANELA_SIMULADOS_DIAS * MS_POR_DIA;
  const recentes = simulados.filter(
    (s) => (s.tipo === "completo-45" || s.tipo === "prova-dia2") && new Date(s.terminadoEm).getTime() >= desde,
  ).length;
  const faltamSimulados = SIMULADOS_COMPLETOS_MIN - recentes;
  if (faltamSimulados > 0) {
    faltas.push(
      `${faltamSimulados === 1 ? "falta" : "faltam"} ${plural(faltamSimulados, "simulado completo", "simulados completos")} de 45 itens nos últimos 14 dias`,
    );
  }
  return { pronto: faltas.length === 0, faltas };
}
