/**
 * Copia o snapshot do banco de questões (repositório PROVAS) para src/data/provas/.
 *
 * Uso:
 *   pnpm sync-provas                      # ../PROVAS local; sem dados, GitHub raw
 *   pnpm sync-provas --dir ~/PROVAS       # (ou PROVAS_DIR=...) origem local explícita
 *   pnpm sync-provas --github --ref main  # (ou PROVAS_GIT_REF=...) força o GitHub raw
 *   pnpm sync-provas --dry-run            # só valida e imprime o resumo
 *   pnpm sync-provas --fixture            # regenera fixture.json a partir do enem.dev
 *
 * A lógica fica em scripts/lib/*.ts (funções puras, testadas); aqui só há I/O.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { arquivoQuestoesSchema, manifestoSchema, type Manifesto, type Questao, type Resolucao } from "../src/data/tipos";
import { montarFixture, ORIGEM_FIXTURE } from "./lib/fixture";
import {
  ANOS_PADRAO,
  ErroSync,
  PADRAO_ARQUIVO_ANO,
  formatarResumo,
  gerarIndexTs,
  mesclarResolucoes,
  montarManifesto,
  montarManifestoFixture,
  normalizarArquivo,
  normalizarResolucoes,
  parseArgs,
  planejarRemocoes,
  urlGithubAno,
  type OpcoesCli,
} from "./lib/sync";

const RAIZ = path.resolve(import.meta.dirname, "..");
const DESTINO = path.join(RAIZ, "src", "data", "provas");
const PROVAS_IRMAO = path.resolve(RAIZ, "..", "PROVAS");
const SUBDIR_QUESTOES = path.join("data", "questoes", "matematica");
const SUBDIR_RESOLUCOES = path.join("data", "resolucoes");
const CACHE_ENEMDEV_PADRAO = "/tmp/enem2023";
const TIMEOUT_MS = 20_000;

const AJUDA = `sync-provas: copia o banco de questões do PROVAS para src/data/provas/

Opções:
  --dir <caminho>         raiz local do PROVAS (ou env PROVAS_DIR)
  --github                ignora cópias locais e baixa do GitHub raw
  --ref <ref>             branch/tag/commit no GitHub (ou env PROVAS_GIT_REF; padrão main)
  --fixture               regenera src/data/provas/fixture.json a partir do enem.dev
  --cache-enemdev <dir>   páginas brutas do enem.dev para --fixture (ou env ENEMDEV_CACHE;
                          padrão ${CACHE_ENEMDEV_PADRAO}; sem cache, baixa da API)
  --dry-run               só valida e imprime o resumo, sem gravar nada
  -h, --help              esta ajuda`;

const aviso = (msg: string) => console.warn(`aviso: ${msg}`);
const relativo = (p: string) => path.relative(RAIZ, p) || ".";

async function lerJson(caminho: string, rotulo: string): Promise<unknown> {
  const texto = await readFile(caminho, "utf8");
  try {
    return JSON.parse(texto) as unknown;
  } catch (e) {
    throw new ErroSync(`JSON malformado em ${rotulo}: ${(e as Error).message}`);
  }
}

async function gravarJson(caminho: string, dados: unknown): Promise<void> {
  await writeFile(caminho, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
}

async function listarJson(dir: string, padrao: RegExp = /\.json$/): Promise<string[]> {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((n) => padrao.test(n)).sort();
}

interface Snapshot {
  origem: string;
  questoesPorAno: Map<number, Questao[]>;
  resolucoes: Resolucao[];
}

async function temDadosLocais(raiz: string): Promise<boolean> {
  return (await listarJson(path.join(raiz, SUBDIR_QUESTOES), PADRAO_ARQUIVO_ANO)).length > 0;
}

async function lerLocal(raiz: string): Promise<Snapshot> {
  const dirQuestoes = path.join(raiz, SUBDIR_QUESTOES);
  const questoesPorAno = new Map<number, Questao[]>();
  for (const nome of await listarJson(dirQuestoes, PADRAO_ARQUIVO_ANO)) {
    const ano = Number(nome.slice(0, 4));
    const rotulo = path.join(SUBDIR_QUESTOES, nome);
    questoesPorAno.set(ano, normalizarArquivo(await lerJson(path.join(dirQuestoes, nome), rotulo), rotulo, ano));
  }

  const dirResolucoes = path.join(raiz, SUBDIR_RESOLUCOES);
  const resolucoes: Resolucao[] = [];
  for (const nome of await listarJson(dirResolucoes)) {
    const rotulo = path.join(SUBDIR_RESOLUCOES, nome);
    resolucoes.push(...normalizarResolucoes(await lerJson(path.join(dirResolucoes, nome), rotulo), rotulo));
  }
  return { origem: `local:${raiz}`, questoesPorAno, resolucoes };
}

async function lerGithub(ref: string): Promise<Snapshot> {
  const questoesPorAno = new Map<number, Questao[]>();
  const falhas: string[] = [];
  const ausentes: number[] = [];
  for (const ano of ANOS_PADRAO) {
    const url = urlGithubAno(ref, ano);
    let resp: Response;
    try {
      resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      const causa = (e as Error & { cause?: Error }).cause?.message ?? (e as Error).message;
      falhas.push(`${ano}: ${causa}`);
      continue;
    }
    if (resp.status === 404) {
      ausentes.push(ano);
      continue;
    }
    if (!resp.ok) {
      falhas.push(`${ano}: HTTP ${resp.status} ${resp.statusText}`);
      continue;
    }
    let dados: unknown;
    try {
      dados = await resp.json();
    } catch (e) {
      throw new ErroSync(`JSON malformado em ${url}: ${(e as Error).message}`);
    }
    questoesPorAno.set(ano, normalizarArquivo(dados, `github:${ref}/${SUBDIR_QUESTOES}/${ano}.json`, ano));
  }

  if (ausentes.length > 0) aviso(`404 no GitHub (ref ${ref}) para ${ausentes.join(", ")}: anos pulados.`);
  if (falhas.length > 0) {
    // Snapshot parcial apagaria anos bons do destino: melhor abortar.
    throw new ErroSync(
      `Falha de rede ao baixar do GitHub raw (ref ${ref}); nada foi gravado.\n${falhas.map((f) => `  - ${f}`).join("\n")}`,
    );
  }
  if (questoesPorAno.size === 0) {
    throw new ErroSync(
      `Nenhum ano encontrado no GitHub (ref ${ref}): todos os ${ANOS_PADRAO.length} arquivos deram 404.\n` +
        `  O repositório pode ser privado, a ref pode não existir ou data/ ainda não foi publicado.\n` +
        `  Use --dir <caminho do PROVAS> ou --ref <outra ref>. Nada foi gravado.`,
    );
  }
  aviso("o GitHub raw não lista diretórios: data/resolucoes/ não é baixado (só resoluções já embutidas nas questões).");
  return { origem: `github:${ref}`, questoesPorAno, resolucoes: [] };
}

async function resolverSnapshot(op: OpcoesCli): Promise<Snapshot> {
  if (op.github) return lerGithub(op.ref);
  if (op.dir) {
    const raiz = path.resolve(op.dir);
    if (!(await temDadosLocais(raiz))) {
      throw new ErroSync(`Sem arquivos ${SUBDIR_QUESTOES}/NNNN.json em ${raiz} (de --dir/PROVAS_DIR).`);
    }
    return lerLocal(raiz);
  }
  if (await temDadosLocais(PROVAS_IRMAO)) return lerLocal(PROVAS_IRMAO);
  aviso(`${PROVAS_IRMAO} não tem ${SUBDIR_QUESTOES}/NNNN.json; tentando o GitHub raw (ref ${op.ref}).`);
  return lerGithub(op.ref);
}

async function sincronizar(op: OpcoesCli): Promise<void> {
  const snap = await resolverSnapshot(op);
  console.log(`origem: ${snap.origem}`);

  const todas = [...snap.questoesPorAno.values()].flat();
  const { questoes: mescladas, mescladas: n, orfas } = mesclarResolucoes(todas, snap.resolucoes);
  if (snap.resolucoes.length > 0) console.log(`resoluções: ${snap.resolucoes.length} lidas, ${n} mescladas.`);
  if (orfas.length > 0) aviso(`resoluções sem questão correspondente: ${orfas.join(", ")}`);

  const questoesPorAno = new Map<number, Questao[]>();
  for (const q of mescladas) questoesPorAno.set(q.ano, [...(questoesPorAno.get(q.ano) ?? []), q]);

  const manifesto = manifestoSchema.parse(
    montarManifesto({ questoesPorAno, origem: snap.origem, fixture: false, geradoEm: new Date() }),
  );
  if (manifesto.total === 0) throw new ErroSync("A origem não tem nenhuma questão; nada foi gravado.");

  const removidos = planejarRemocoes(await listarJson(DESTINO), manifesto.anos);
  if (op.dryRun) {
    console.log(formatarResumo(manifesto, { dryRun: true, removidos }));
    return;
  }

  await mkdir(DESTINO, { recursive: true });
  for (const ano of manifesto.anos) {
    await gravarJson(path.join(DESTINO, `${ano}.json`), questoesPorAno.get(ano));
  }
  await gravarJson(path.join(DESTINO, "manifesto.json"), manifesto);
  await writeFile(path.join(DESTINO, "index.ts"), gerarIndexTs(manifesto.anos), "utf8");
  for (const nome of removidos) await rm(path.join(DESTINO, nome));

  console.log(formatarResumo(manifesto, { removidos }));
}

async function lerPaginasEnemdev(op: OpcoesCli): Promise<{ paginas: unknown[]; de: string }> {
  const dir = path.resolve(op.cacheEnemdev ?? CACHE_ENEMDEV_PADRAO);
  const arquivos = await listarJson(dir);
  if (arquivos.length > 0) {
    const paginas = await Promise.all(arquivos.map((n) => lerJson(path.join(dir, n), path.join(dir, n))));
    return { paginas, de: `cache ${dir} (${arquivos.length} páginas)` };
  }
  if (op.cacheEnemdev) aviso(`cache ${dir} vazio; baixando da API enem.dev.`);
  const paginas: unknown[] = [];
  for (const offset of [0, 50, 100, 150]) {
    const url = `https://api.enem.dev/v1/exams/2023/questions?limit=50&offset=${offset}`;
    let resp: Response;
    try {
      resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      throw new ErroSync(`Falha de rede ao baixar ${url}: ${(e as Error).message}`);
    }
    if (!resp.ok) throw new ErroSync(`HTTP ${resp.status} ao baixar ${url}`);
    paginas.push(await resp.json());
  }
  return { paginas, de: "API api.enem.dev" };
}

async function gerarFixture(op: OpcoesCli): Promise<void> {
  const { paginas, de } = await lerPaginasEnemdev(op);
  console.log(`enem.dev: ${de}`);
  const questoes = arquivoQuestoesSchema.parse(montarFixture(paginas));
  const caminhoManifesto = path.join(DESTINO, "manifesto.json");

  // Não rebaixa um snapshot real para o fixture: só aponta o manifesto para o
  // fixture quando não há anos sincronizados.
  const anosNoDestino = await listarJson(DESTINO, PADRAO_ARQUIVO_ANO);
  let manifestoAtual: Manifesto | undefined;
  if (existsSync(caminhoManifesto)) {
    const r = manifestoSchema.safeParse(await lerJson(caminhoManifesto, relativo(caminhoManifesto)));
    if (r.success) manifestoAtual = r.data;
  }
  const manterManifesto = anosNoDestino.length > 0 && manifestoAtual !== undefined && !manifestoAtual.fixture;
  const manifesto = manterManifesto ? manifestoAtual! : montarManifestoFixture(questoes, new Date(), ORIGEM_FIXTURE);

  if (op.dryRun) {
    console.log(`fixture: ${questoes.length} questões válidas (${questoes.map((q) => q.id).join(", ")})`);
    console.log(formatarResumo(manifesto, { dryRun: true }));
    return;
  }

  await mkdir(DESTINO, { recursive: true });
  await gravarJson(path.join(DESTINO, "fixture.json"), questoes);
  console.log(`gravado ${relativo(path.join(DESTINO, "fixture.json"))} (${questoes.length} questões)`);
  if (manterManifesto) {
    console.log(`manifesto mantido: já há anos sincronizados (${anosNoDestino.join(", ")}).`);
  } else {
    await gravarJson(caminhoManifesto, manifesto);
    await writeFile(path.join(DESTINO, "index.ts"), gerarIndexTs([]), "utf8");
  }
  console.log(formatarResumo(manifesto));
}

async function main(): Promise<void> {
  const op = parseArgs(process.argv.slice(2), process.env);
  if (op.ajuda) {
    console.log(AJUDA);
    return;
  }
  if (op.fixture) await gerarFixture(op);
  else await sincronizar(op);
}

main().catch((e: unknown) => {
  if (e instanceof ErroSync) console.error(`erro: ${e.message}`);
  else console.error("erro inesperado:", e);
  process.exitCode = 1;
});
