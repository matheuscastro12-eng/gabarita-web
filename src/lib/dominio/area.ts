/**
 * Recorte do estado do aluno por área. O estado é um só (o que se faz no Geral conta para
 * cada área); as telas de uma versão leem só a fatia das suas áreas. Escrever continua
 * sendo no estado inteiro, via `atualizar`.
 */
import { areaDaHabilidade, type Area, type Questao } from "@/data/tipos";
import { montarFila, TAMANHO_FILA } from "./fila";
import { comoBusca, estimarTheta, limiarFacil, notaEstimada, respostasTRI, type BuscaQuestao } from "./tri";
import type { EstadoAluno, IntervaloNota, Simulado } from "./tipos";

/** Área de um simulado gravado (os antigos, sem `area`, são de matemática). */
export function areasDoSimulado(s: Simulado): Area[] {
  return s.areas ?? ["matematica"];
}

export function filtrarEstadoPorArea(estado: EstadoAluno, areas: readonly Area[]): EstadoAluno {
  if (areas.length >= 2) return estado;
  const quer = new Set<Area>(areas);
  const tentativas = estado.tentativas.filter((t) => quer.has(areaDaHabilidade(t.habilidade)));
  const ids = new Set(tentativas.map((t) => t.id));
  const habilidades = Object.fromEntries(Object.entries(estado.habilidades).filter(([h]) => quer.has(areaDaHabilidade(h))));
  return {
    ...estado,
    habilidades,
    tentativas,
    caderno: estado.caderno.filter((c) => quer.has(areaDaHabilidade(c.habilidade))),
    sprints: estado.sprints.filter((s) => {
      const area = s.area ?? "matematica";
      return area === "misto" ? s.tentativaIds.some((id) => ids.has(id)) : quer.has(area);
    }),
    simulados: estado.simulados.filter((s) => areasDoSimulado(s).some((a) => quer.has(a))),
    perfil: {
      ...estado.perfil,
      habilidadesDaSemana: estado.perfil.habilidadesDaSemana.filter((h) => quer.has(areaDaHabilidade(h))),
    },
  };
}

/** Questões de uma área (pelo campo `area`). */
export function questoesDaArea(questoes: readonly Questao[], area: Area): Questao[] {
  return questoes.filter((q) => q.area === area);
}

/** Limiar de "fácil" (tercil de b) calculado dentro da área: CN e MT têm escalas de b diferentes. */
export function limiarDaArea(questoes: readonly Questao[], area: Area): number | null {
  return limiarFacil(questoesDaArea(questoes, area).flatMap((q) => (q.tri ? [q.tri.b] : [])));
}

/** Nota TRI estimada só com as tentativas da área (cada área tem a sua escala). */
export function notaDaArea(estado: EstadoAluno, porId: Map<string, Questao> | BuscaQuestao, area: Area): IntervaloNota {
  const buscar = comoBusca(porId);
  const respostas = respostasTRI(estado.tentativas, (id) => {
    const q = buscar(id);
    return q && q.area === area ? q : undefined;
  });
  const { theta, erroPadrao, itens } = estimarTheta(respostas);
  return notaEstimada(theta, erroPadrao, itens);
}

/**
 * Fila do sprint para as áreas pedidas: cada área usa o seu limiar de fácil, e as filas
 * se intercalam (no Geral: natureza, matemática, natureza...). Uma área só = `montarFila`.
 */
export function montarFilaDasAreas({
  questoes,
  estado,
  agora,
  areas,
  tamanho = TAMANHO_FILA,
}: {
  questoes: Questao[];
  estado: EstadoAluno;
  agora: Date;
  areas: readonly Area[];
  tamanho?: number;
}): Questao[] {
  const filas = areas.map((area, i) => {
    const n = Math.ceil((tamanho - i) / areas.length);
    return montarFila({ questoes: questoesDaArea(questoes, area), estado, agora, tamanho: n, limiarFacil: limiarDaArea(questoes, area), theta: null });
  });
  const saida: Questao[] = [];
  for (let k = 0; saida.length < tamanho && filas.some((f) => k < f.length); k++) {
    for (const f of filas) if (f[k] && saida.length < tamanho) saida.push(f[k]!);
  }
  return saida;
}
