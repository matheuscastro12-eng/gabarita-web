/**
 * Carregador do banco de questões usado pelo app (cliente e servidor, sem fs).
 *
 * Matemática: snapshot gravado por `pnpm sync-provas` em src/data/provas/ (ou o fixture
 * de desenvolvimento `provas/fixture.json` quando não há anos sincronizados).
 * Natureza: src/data/provas/natureza/{ano}.json, gerado por scripts/natureza/importar.py.
 * Cada área é carregada sob demanda (um chunk por ano), para não pesar o bundle inicial.
 */
import { arquivoQuestoesSchema, manifestoSchema, type Area, type Questao } from "./tipos";
import manifestoJson from "./provas/manifesto.json";
import { anos, carregarAno, usaFixture } from "./provas";
import { carregarAposta, ehIdAposta } from "./apostas";
import { anos as anosNatureza, carregarAno as carregarAnoNatureza } from "./provas/natureza";

const manifesto = manifestoSchema.parse(manifestoJson);
// `anos` é uma tupla literal gerada; alargar evita comparações "impossíveis" no TS.
const anosSincronizados: readonly number[] = anos;
const deveUsarFixture =
  usaFixture || manifesto.fixture || anosSincronizados.length === 0 || manifesto.anos.length === 0;
const validar = process.env.NODE_ENV !== "production";

/** Questões de natureza por ano (2009 a 2023, caderno azul). 2019 tem 42: faltam 3 na fonte. */
export const TOTAL_NATUREZA = 672;

const cache = new Map<Area, Promise<Questao[]>>();
const porId = new Map<string, Questao>();

function conferir(dados: unknown, rotulo: string): Questao[] {
  if (!validar) return dados as Questao[];
  const r = arquivoQuestoesSchema.safeParse(dados);
  if (!r.success) {
    throw new Error(`Banco de questões inválido em ${rotulo}: ${r.error.message}. Rode \`pnpm sync-provas\`.`);
  }
  return r.data;
}

async function carregarMatematica(): Promise<Questao[]> {
  if (deveUsarFixture) {
    const fixture = (await import("./provas/fixture.json")).default;
    return conferir(fixture, "provas/fixture.json");
  }
  const listas = await Promise.all(
    anosSincronizados.map(async (ano) => conferir(await carregarAno(ano), `provas/${ano}.json`)),
  );
  return listas.flat();
}

async function carregarNatureza(): Promise<Questao[]> {
  const listas = await Promise.all(
    anosNatureza.map(async (ano) => conferir(await carregarAnoNatureza(ano), `provas/natureza/${ano}.json`)),
  );
  return listas.flat();
}

function carregarArea(area: Area): Promise<Questao[]> {
  let p = cache.get(area);
  if (!p) {
    p = (area === "natureza" ? carregarNatureza() : carregarMatematica()).then(
      (qs) => {
        for (const q of qs) porId.set(q.id, q);
        return qs;
      },
      (e: unknown) => {
        cache.delete(area);
        throw e;
      },
    );
    cache.set(area, p);
  }
  return p;
}

/**
 * Questões das áreas pedidas (validadas uma vez em dev e cacheadas em memória).
 * Sem argumento: só matemática (compatível com o comportamento antigo).
 */
export async function carregarQuestoes(areas: readonly Area[] = ["matematica"]): Promise<Questao[]> {
  const listas = await Promise.all(areas.map(carregarArea));
  return listas.flat();
}

/** Área de uma questão pelo id, sem carregar nada: natureza ocupa blocos fixos por ano. */
export function areaDoId(id: string): Area | null {
  const m = /^enem-(\d{4})-(\d{1,3})$/.exec(id);
  if (!m) return null;
  const ano = Number(m[1]);
  const n = Number(m[2]);
  return areaDaPosicao(ano, n) === "CN" ? "natureza" : areaDaPosicao(ano, n) === "MT" ? "matematica" : null;
}

/**
 * Área pela posição na prova, em blocos de 45: 2009 = CN, CH, LC, MT; 2010 a 2016 =
 * CH, CN, LC, MT; 2017 em diante = LC, CH, CN, MT. (A coluna `discipline` do banco antigo
 * vem errada em ~200 questões; a posição é a fonte confiável.)
 */
export function areaDaPosicao(ano: number, numero: number): "CN" | "CH" | "LC" | "MT" {
  const ordem =
    ano === 2009 ? (["CN", "CH", "LC", "MT"] as const) : ano <= 2016 ? (["CH", "CN", "LC", "MT"] as const) : (["LC", "CH", "CN", "MT"] as const);
  return ordem[Math.min(3, Math.floor((numero - 1) / 45))]!;
}

/** Uma questão pelo id (ex.: "enem-2023-143" ou "apostas-2026-07"), ou undefined se não existir. */
export async function carregarQuestao(id: string): Promise<Questao | undefined> {
  // Apostas (não oficiais) só são achadas pelo id: o tutor funciona nelas, mas elas não
  // entram em carregarQuestoes() e, portanto, em nenhuma estatística oficial.
  if (ehIdAposta(id)) return carregarAposta(id);
  const area = areaDoId(id) ?? "matematica";
  await carregarArea(area);
  return porId.get(id);
}

/** De onde vêm os dados exibidos (para avisar na interface quando é fixture). */
export function origemDosDados(): { fixture: boolean; origem: string; total: number; matematica: number; natureza: number } {
  return {
    fixture: deveUsarFixture,
    origem: manifesto.origem,
    total: manifesto.total + TOTAL_NATUREZA,
    matematica: manifesto.total,
    natureza: TOTAL_NATUREZA,
  };
}
