/**
 * Lógica pura da sincronização do banco de questões (PROVAS → src/data/provas).
 *
 * Nada aqui faz I/O: o CLI `scripts/sync-provas.ts` lê/grava arquivos e chama
 * estas funções. Assim dá para testar tudo com vitest sem tocar no disco.
 */
import type { z } from "zod";
import {
  arquivoQuestoesSchema,
  resolucaoSchema,
  type Manifesto,
  type Questao,
  type Resolucao,
} from "../../src/data/tipos";

/** Anos com Matemática no 2º dia (layout atual do PROVAS). */
export const ANOS_PADRAO: readonly number[] = Array.from({ length: 15 }, (_, i) => 2009 + i);

/** Nome de arquivo de ano gravado em src/data/provas (ex.: 2023.json). */
export const PADRAO_ARQUIVO_ANO = /^(\d{4})\.json$/;

export class ErroSync extends Error {
  override name = "ErroSync";
}

function formatarCaminho(caminho: readonly PropertyKey[]): string {
  if (caminho.length === 0) return "(raiz)";
  return caminho
    .map((p, i) => (typeof p === "number" ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`))
    .join("");
}

/** Converte o erro do zod em linhas legíveis: arquivo, índice da questão e caminho do campo. */
export function descreverErroZod(arquivo: string, erro: z.ZodError, dados?: unknown): string {
  const linhas = erro.issues.slice(0, 10).map((issue) => {
    const [indice, ...resto] = issue.path;
    let alvo = formatarCaminho(issue.path);
    if (typeof indice === "number") {
      const item = Array.isArray(dados) ? (dados[indice] as { id?: unknown } | undefined) : undefined;
      const id = item && typeof item.id === "string" ? ` (${item.id})` : "";
      alvo = `índice ${indice}${id}, campo ${formatarCaminho(resto)}`;
    }
    return `  - ${arquivo}: ${alvo}: ${issue.message}`;
  });
  const extra = erro.issues.length > 10 ? `\n  … e mais ${erro.issues.length - 10} problema(s)` : "";
  return `Arquivo inválido: ${arquivo}\n${linhas.join("\n")}${extra}`;
}

/**
 * Valida o conteúdo de um `{ano}.json` do PROVAS e devolve as questões
 * normalizadas (campos desconhecidos removidos pelo zod, ordenadas por número).
 * Lança `ErroSync` apontando arquivo/índice/caminho em caso de erro.
 */
export function normalizarArquivo(dados: unknown, arquivo: string, anoEsperado?: number): Questao[] {
  const r = arquivoQuestoesSchema.safeParse(dados);
  if (!r.success) throw new ErroSync(descreverErroZod(arquivo, r.error, dados));

  const vistos = new Set<string>();
  r.data.forEach((q, i) => {
    if (vistos.has(q.id)) {
      throw new ErroSync(`Arquivo inválido: ${arquivo}\n  - ${arquivo}: índice ${i}: id duplicado ${q.id}`);
    }
    vistos.add(q.id);
    if (anoEsperado !== undefined && q.ano !== anoEsperado) {
      throw new ErroSync(
        `Arquivo inválido: ${arquivo}\n  - ${arquivo}: índice ${i} (${q.id}), campo ano: esperado ${anoEsperado}, veio ${q.ano}`,
      );
    }
  });

  return [...r.data].sort((a, b) => a.numero - b.numero);
}

/**
 * Lê o conteúdo de um arquivo de `data/resolucoes/` (um objeto ou uma lista
 * de resoluções) e valida com `resolucaoSchema`.
 */
export function normalizarResolucoes(dados: unknown, arquivo: string): Resolucao[] {
  const lista = Array.isArray(dados) ? dados : [dados];
  const r = resolucaoSchema.array().safeParse(lista);
  if (!r.success) throw new ErroSync(descreverErroZod(arquivo, r.error, lista));
  return r.data;
}

export interface ResultadoMescla {
  questoes: Questao[];
  mescladas: number;
  /** Resoluções cujo id não corresponde a nenhuma questão sincronizada. */
  orfas: string[];
}

/**
 * Coloca cada resolução dentro da questão de mesmo `id` (campo `resolucao`),
 * sem sobrescrever uma resolução que a questão já traga. Não muta a entrada.
 */
export function mesclarResolucoes(questoes: readonly Questao[], resolucoes: readonly Resolucao[]): ResultadoMescla {
  const porId = new Map<string, Resolucao>();
  for (const r of resolucoes) porId.set(r.id, r);

  let mescladas = 0;
  const usadas = new Set<string>();
  const resultado = questoes.map((q) => {
    const r = porId.get(q.id);
    if (!r) return q;
    usadas.add(q.id);
    if (q.resolucao) return q;
    mescladas++;
    return { ...q, resolucao: r };
  });

  const orfas = [...porId.keys()].filter((id) => !usadas.has(id)).sort();
  return { questoes: resultado, mescladas, orfas };
}

export interface EntradaManifesto {
  questoesPorAno: ReadonlyMap<number, readonly Questao[]>;
  origem: string;
  fixture: boolean;
  geradoEm: Date;
}

/** Monta o manifesto (`manifestoSchema`) a partir das questões de cada ano. */
export function montarManifesto({ questoesPorAno, origem, fixture, geradoEm }: EntradaManifesto): Manifesto {
  const anos = [...questoesPorAno.entries()]
    .filter(([, qs]) => qs.length > 0)
    .map(([ano]) => ano)
    .sort((a, b) => a - b);
  const todas = anos.flatMap((ano) => questoesPorAno.get(ano) ?? []);
  return {
    gerado_em: geradoEm.toISOString(),
    origem,
    fixture,
    anos,
    total: todas.length,
    com_tri: todas.filter((q) => q.tri !== null).length,
    com_resolucao: todas.filter((q) => q.resolucao !== undefined).length,
  };
}

/** Manifesto do fixture de desenvolvimento: sem anos sincronizados, `fixture: true`. */
export function montarManifestoFixture(questoes: readonly Questao[], geradoEm: Date, origem: string): Manifesto {
  return {
    gerado_em: geradoEm.toISOString(),
    origem,
    fixture: true,
    anos: [],
    total: questoes.length,
    com_tri: questoes.filter((q) => q.tri !== null).length,
    com_resolucao: questoes.filter((q) => q.resolucao !== undefined).length,
  };
}

/**
 * Dado o conteúdo atual de src/data/provas, devolve os arquivos de ano
 * (`NNNN.json`) que não vieram na nova sincronização. Nunca inclui
 * `fixture.json`, `manifesto.json` nem nada fora do padrão de 4 dígitos.
 */
export function planejarRemocoes(existentes: readonly string[], anosNovos: readonly number[]): string[] {
  const manter = new Set(anosNovos.map((a) => `${a}.json`));
  return existentes.filter((nome) => PADRAO_ARQUIVO_ANO.test(nome) && !manter.has(nome)).sort();
}

/** Código de `src/data/provas/index.ts`, com imports estáticos por ano. */
export function gerarIndexTs(anos: readonly number[]): string {
  const ordenados = [...anos].sort((a, b) => a - b);
  const usaFixture = ordenados.length === 0;
  const cabecalho = [
    "// Gerado por scripts/sync-provas.ts. Não edite à mão: rode `pnpm sync-provas`.",
    "// Imports de JSON precisam ser estáticos para o bundler; por isso este arquivo existe.",
    "",
    `export const anos = [${ordenados.join(", ")}] as const;`,
    "",
    "/** true quando não há anos sincronizados e o app deve usar fixture.json. */",
    `export const usaFixture: boolean = ${usaFixture};`,
    "",
  ];
  if (usaFixture) {
    return [
      ...cabecalho,
      "/** Conteúdo bruto (não validado) do arquivo do ano, ou undefined se o ano não foi sincronizado. */",
      "export async function carregarAno(ano: number): Promise<unknown> {",
      "  void ano;",
      "  return undefined;",
      "}",
      "",
    ].join("\n");
  }
  const casos = ordenados.flatMap((ano) => [
    `    case ${ano}:`,
    `      return (await import("./${ano}.json")).default;`,
  ]);
  return [
    ...cabecalho,
    "/** Conteúdo bruto (não validado) do arquivo do ano, ou undefined se o ano não foi sincronizado. */",
    "export async function carregarAno(ano: number): Promise<unknown> {",
    "  switch (ano) {",
    ...casos,
    "    default:",
    "      return undefined;",
    "  }",
    "}",
    "",
  ].join("\n");
}

/** URL do arquivo de um ano no GitHub raw do PROVAS. */
export function urlGithubAno(ref: string, ano: number): string {
  return `https://raw.githubusercontent.com/matheuscastro12-eng/PROVAS/${encodeURIComponent(ref)}/data/questoes/matematica/${ano}.json`;
}

export interface OpcoesCli {
  dir?: string;
  ref: string;
  github: boolean;
  fixture: boolean;
  dryRun: boolean;
  cacheEnemdev?: string;
  ajuda: boolean;
}

/** Parse de argumentos do CLI, com fallback para variáveis de ambiente. */
export function parseArgs(argv: readonly string[], env: Readonly<Record<string, string | undefined>>): OpcoesCli {
  const opcoes: OpcoesCli = {
    dir: env.PROVAS_DIR || undefined,
    ref: env.PROVAS_GIT_REF || "main",
    github: false,
    fixture: false,
    dryRun: false,
    cacheEnemdev: env.ENEMDEV_CACHE || undefined,
    ajuda: false,
  };
  const valor = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new ErroSync(`A opção ${flag} precisa de um valor.`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const [flag, inline] = arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
    switch (flag) {
      case "--dir":
        opcoes.dir = inline ?? valor(i++, flag);
        break;
      case "--ref":
        opcoes.ref = inline ?? valor(i++, flag);
        break;
      case "--cache-enemdev":
        opcoes.cacheEnemdev = inline ?? valor(i++, flag);
        break;
      case "--github":
        opcoes.github = true;
        break;
      case "--fixture":
        opcoes.fixture = true;
        break;
      case "--dry-run":
        opcoes.dryRun = true;
        break;
      case "--help":
      case "-h":
        opcoes.ajuda = true;
        break;
      case "--":
        break;
      default:
        throw new ErroSync(`Opção desconhecida: ${arg}. Use --help.`);
    }
  }
  return opcoes;
}

/** Resumo legível do snapshot, impresso no fim do CLI. */
export function formatarResumo(m: Manifesto, extras: { dryRun?: boolean; removidos?: readonly string[] } = {}): string {
  const anos = m.anos.length > 0 ? m.anos.join(", ") : "(nenhum: fixture)";
  const linhas = [
    extras.dryRun ? "Resumo (dry-run: nada foi gravado)" : "Resumo da sincronização",
    `  origem:         ${m.origem}`,
    `  fixture:        ${m.fixture ? "sim" : "não"}`,
    `  anos:           ${anos}`,
    `  total:          ${m.total}`,
    `  com TRI:        ${m.com_tri}`,
    `  com resolução:  ${m.com_resolucao}`,
  ];
  if (extras.removidos && extras.removidos.length > 0) {
    linhas.push(`  ${extras.dryRun ? "removeria" : "removidos"}:      ${extras.removidos.join(", ")}`);
  }
  return linhas.join("\n");
}
