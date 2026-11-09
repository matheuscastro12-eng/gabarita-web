/**
 * Recorte do estado do aluno por área. O estado é um só (o que se faz no Geral conta para
 * cada área); as telas de uma versão leem só a fatia das suas áreas. Escrever continua
 * sendo no estado inteiro, via `atualizar`.
 */
import { areaDaHabilidade, type Area } from "@/data/tipos";
import type { EstadoAluno, Simulado } from "./tipos";

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
