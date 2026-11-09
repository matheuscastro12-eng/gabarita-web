/**
 * Carregador do banco de questões usado pelo app (cliente e servidor, sem fs).
 *
 * Lê o snapshot gravado por `pnpm sync-provas` em src/data/provas/. Quando não
 * há anos sincronizados (ou o manifesto marca `fixture: true`), usa o fixture
 * de desenvolvimento `provas/fixture.json` (5 questões reais do ENEM 2023).
 */
import { arquivoQuestoesSchema, manifestoSchema, type Questao } from "./tipos";
import manifestoJson from "./provas/manifesto.json";
import { anos, carregarAno, usaFixture } from "./provas";
import { carregarAposta, ehIdAposta } from "./apostas";

const manifesto = manifestoSchema.parse(manifestoJson);
// `anos` é uma tupla literal gerada; alargar evita comparações "impossíveis" no TS.
const anosSincronizados: readonly number[] = anos;
const deveUsarFixture =
  usaFixture || manifesto.fixture || anosSincronizados.length === 0 || manifesto.anos.length === 0;
const validar = process.env.NODE_ENV !== "production";

let cache: Promise<Questao[]> | undefined;
let porId: Map<string, Questao> | undefined;

function conferir(dados: unknown, rotulo: string): Questao[] {
  if (!validar) return dados as Questao[];
  const r = arquivoQuestoesSchema.safeParse(dados);
  if (!r.success) {
    throw new Error(`Banco de questões inválido em ${rotulo}: ${r.error.message}. Rode \`pnpm sync-provas\`.`);
  }
  return r.data;
}

async function carregarTudo(): Promise<Questao[]> {
  if (deveUsarFixture) {
    const fixture = (await import("./provas/fixture.json")).default;
    return conferir(fixture, "provas/fixture.json");
  }
  const listas = await Promise.all(
    anosSincronizados.map(async (ano) => conferir(await carregarAno(ano), `provas/${ano}.json`)),
  );
  return listas.flat();
}

/** Todas as questões do snapshot (validadas uma vez em dev e cacheadas em memória). */
export function carregarQuestoes(): Promise<Questao[]> {
  cache ??= carregarTudo().catch((e: unknown) => {
    cache = undefined;
    throw e;
  });
  return cache;
}

/** Uma questão pelo id (ex.: "enem-2023-143" ou "apostas-2026-07"), ou undefined se não existir. */
export async function carregarQuestao(id: string): Promise<Questao | undefined> {
  // Apostas (não oficiais) só são achadas pelo id: o tutor funciona nelas, mas elas não
  // entram em carregarQuestoes() e, portanto, em nenhuma estatística oficial.
  if (ehIdAposta(id)) return carregarAposta(id);
  if (!porId) {
    const questoes = await carregarQuestoes();
    porId = new Map(questoes.map((q) => [q.id, q]));
  }
  return porId.get(id);
}

/** De onde vêm os dados exibidos (para avisar na interface quando é fixture). */
export function origemDosDados(): { fixture: boolean; origem: string; total: number } {
  return { fixture: deveUsarFixture, origem: manifesto.origem, total: manifesto.total };
}
