/**
 * Dados do Mapa: uma célula por habilidade (H1–H30) com domínio efetivo, retenção, itens e
 * o que falta para "pronto"; agrupamento por competência e por assunto de foco.
 */
import type { Questao } from "@/data/tipos";
import { competenciaDa, HABILIDADES, NOME_HABILIDADE, type Competencia } from "@/data/tipos";
import { ASSUNTOS_DE_FOCO, COMPETENCIAS, type AssuntoInfo, type CompetenciaInfo } from "@/data/taxonomia";
import { DOMINIO_INICIAL, novoEstadoHabilidade } from "./evidencia";
import { prontoHabilidade } from "./pronto";
import { precisaRevisao } from "./revisao";
import type { BuscaQuestao } from "./tri";
import { comoBusca } from "./tri";
import type { EstadoAluno, Habilidade } from "./tipos";

export interface CelulaMapa {
  habilidade: Habilidade;
  nome: string;
  competencia: Competencia;
  /** Domínio m_h (0,3 sem dados). */
  dominio: number;
  /** m_h · R(t). */
  dominioEfetivo: number;
  retencao: number;
  itensOficiais: number;
  itensGemeos: number;
  acertos: number;
  /** Nunca houve tentativa nesta habilidade. */
  semDados: boolean;
  /** Habilidade da semana (meta "pronto nos fáceis"). */
  daSemana: boolean;
  /** Retenção prevista abaixo de 90%. */
  revisaoVencida: boolean;
  pronto: boolean;
  faltas: string[];
}

/** Nível de calor 0–4 para a cor da célula (null = sem dados). */
export function nivelCalor(dominioEfetivo: number | null): 0 | 1 | 2 | 3 | 4 {
  if (dominioEfetivo === null) return 0;
  if (dominioEfetivo < 0.4) return 1;
  if (dominioEfetivo < 0.6) return 2;
  if (dominioEfetivo < 0.85) return 3;
  return 4;
}

export function mapaHabilidades(estado: EstadoAluno, agora: Date): CelulaMapa[] {
  const semana = new Set<string>(estado.perfil.habilidadesDaSemana);
  return HABILIDADES.map((h) => {
    const habilidade = h as Habilidade;
    const existente = estado.habilidades[habilidade];
    const eh = existente ?? novoEstadoHabilidade(habilidade, agora);
    const r = prontoHabilidade({ estado: eh, tentativas: estado.tentativas, agora });
    return {
      habilidade,
      nome: NOME_HABILIDADE[habilidade]!,
      competencia: competenciaDa(habilidade)!,
      dominio: eh.dominio,
      dominioEfetivo: r.dominioEfetivo,
      retencao: r.retencao,
      itensOficiais: eh.itensOficiais,
      itensGemeos: eh.itensGemeos,
      acertos: eh.acertos,
      semDados: !existente || eh.itensOficiais + eh.itensGemeos === 0,
      daSemana: semana.has(habilidade),
      revisaoVencida: !!existente && precisaRevisao(eh.cartao, agora),
      pronto: r.pronto,
      faltas: r.faltas,
    };
  });
}

export interface GrupoCompetencia {
  competencia: CompetenciaInfo;
  celulas: CelulaMapa[];
  /** Média do domínio efetivo das habilidades com dados (null se nenhuma). */
  media: number | null;
}

export function agruparPorCompetencia(celulas: CelulaMapa[]): GrupoCompetencia[] {
  return COMPETENCIAS.map((competencia) => {
    const minhas = celulas.filter((c) => c.competencia === competencia.id);
    return { competencia, celulas: minhas, media: mediaComDados(minhas) };
  });
}

function mediaComDados(celulas: CelulaMapa[]): number | null {
  const comDados = celulas.filter((c) => !c.semDados);
  if (comDados.length === 0) return null;
  return comDados.reduce((s, c) => s + c.dominioEfetivo, 0) / comDados.length;
}

export interface DominioAssunto {
  assunto: AssuntoInfo;
  /** Média do domínio efetivo das habilidades do assunto que têm dados (null se nenhuma). */
  media: number | null;
  /** Tentativas oficiais em questões marcadas com o assunto. */
  tentativas: number;
  acertos: number;
}

/** Domínio por assunto de foco: habilidades associadas + tentativas em questões do assunto. */
export function dominioPorAssunto(
  celulas: CelulaMapa[],
  estado: EstadoAluno,
  questoes: Map<string, Questao> | BuscaQuestao,
  assuntos: AssuntoInfo[] = ASSUNTOS_DE_FOCO,
): DominioAssunto[] {
  const buscar = comoBusca(questoes);
  const porHabilidade = new Map(celulas.map((c) => [c.habilidade, c]));
  return assuntos.map((assunto) => {
    const minhas = assunto.habilidades.flatMap((h) => {
      const c = porHabilidade.get(h);
      return c ? [c] : [];
    });
    let tentativas = 0;
    let acertos = 0;
    for (const t of estado.tentativas) {
      if (t.origem !== "oficial") continue;
      const q = buscar(t.questaoId);
      if (!q?.assuntos.includes(assunto.id)) continue;
      tentativas++;
      if (t.acertou) acertos++;
    }
    return { assunto, media: mediaComDados(minhas), tentativas, acertos };
  });
}

/** Domínio padrão exportado para a legenda do mapa. */
export const DOMINIO_SEM_DADOS = DOMINIO_INICIAL;
