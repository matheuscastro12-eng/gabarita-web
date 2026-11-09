/**
 * Coleção "Apostas 2026" (curso Edcley Teixeira): 50 questões inéditas, NÃO oficiais.
 *
 * Ficam fora de `carregarQuestoes()` de propósito: o banco oficial (636 questões do
 * INEP) alimenta TRI, domínio, mapa e estatísticas; as apostas não entram em nada disso.
 * Gerado por `scripts/apostas/extrair.py` + `scripts/apostas/montar.py`.
 */
import { AREAS, COLECAO_APOSTAS, questaoSchema, type Area, type Questao } from "./tipos";

let cache: Promise<Questao[]> | undefined;

export const NOME_AREA: Record<Area, string> = {
  matematica: "Matemática",
  natureza: "Natureza",
  humanas: "Humanas",
  linguagens: "Linguagens",
};

/** As 50 apostas, validadas pelo schema (em dev) e na ordem do material. */
export function carregarApostas(): Promise<Questao[]> {
  cache ??= import("./apostas-2026.json").then((m) => {
    const dados = m.default as unknown[];
    const lista = process.env.NODE_ENV === "production" ? (dados as Questao[]) : dados.map((d) => questaoSchema.parse(d));
    return lista;
  });
  return cache;
}

export function ehIdAposta(id: string): boolean {
  return id.startsWith(`${COLECAO_APOSTAS}-`);
}

export async function carregarAposta(id: string): Promise<Questao | undefined> {
  return (await carregarApostas()).find((q) => q.id === id);
}

/** Filtra por área ("todas" = as 50). */
export function filtrarPorArea(questoes: readonly Questao[], area: Area | "todas"): Questao[] {
  return area === "todas" ? [...questoes] : questoes.filter((q) => q.area === area);
}

export function contarPorArea(questoes: readonly Questao[]): Record<Area, number> {
  const r = Object.fromEntries(AREAS.map((a) => [a, 0])) as Record<Area, number>;
  for (const q of questoes) r[q.area] += 1;
  return r;
}
