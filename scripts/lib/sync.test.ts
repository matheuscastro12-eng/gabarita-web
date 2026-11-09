import { describe, expect, it } from "vitest";
import { manifestoSchema, type Questao, type Resolucao } from "../../src/data/tipos";
import { montarFixture, SELECAO_FIXTURE_2023 } from "./fixture";
import {
  ErroSync,
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
} from "./sync";

function questao(numero: number, extra: Partial<Questao> = {}): Questao {
  return {
    id: `enem-2023-${numero}`,
    ano: 2023,
    dia: 2,
    caderno: "azul",
    numero,
    area: "matematica",
    enunciado: "Enunciado.",
    imagens: [],
    alternativas: (["A", "B", "C", "D", "E"] as const).map((letra) => ({ letra, texto: letra, imagem: null })),
    gabarito: "A",
    anulada: false,
    habilidade: "H1",
    habilidade_origem: "heuristica",
    competencia: "C1",
    assuntos: ["porcentagem"],
    classificacao: "heuristica",
    tri: null,
    dificuldade_estimada: null,
    fonte: {
      orgao: "INEP",
      prova: "ENEM 2023",
      transcricao: "enem.dev",
      transcricao_url: `https://api.enem.dev/v1/exams/2023/questions/${numero}`,
    },
    ...extra,
  };
}

function resolucao(id: string): Resolucao {
  return {
    id,
    gabarito: "A",
    assuntos: ["porcentagem"],
    habilidade: "H1",
    resolucao: "x".repeat(80),
    dicas: { dica1: "dica número 1", dica2: "dica número 2", dica3: "dica número 3" },
    erros_comuns: [{ alternativa: "B", por_que: "confunde a base" }],
    conceitos: ["porcentagem"],
    verificacao: { codigo_sympy: "1", resultado_esperado: "1" },
    classificacao: "revisada",
  };
}

describe("normalizarArquivo", () => {
  it("valida, remove campos desconhecidos e ordena por número", () => {
    const r = normalizarArquivo([{ ...questao(150), extra: 1 }, questao(136)], "2023.json", 2023);
    expect(r.map((q) => q.numero)).toEqual([136, 150]);
    expect(r[1]).not.toHaveProperty("extra");
  });

  it("aponta arquivo, índice, id e caminho do campo no erro", () => {
    const ruim = [questao(136), { ...questao(137), alternativas: [{ letra: "Z", texto: "" }] }];
    expect(() => normalizarArquivo(ruim, "2023.json")).toThrow(ErroSync);
    expect(() => normalizarArquivo(ruim, "2023.json")).toThrow(/2023\.json: índice 1 \(enem-2023-137\), campo alternativas\[0\]\.letra/);
  });

  it("rejeita arquivo que não é lista", () => {
    expect(() => normalizarArquivo({}, "x.json")).toThrow(/x\.json: \(raiz\)/);
  });

  it("rejeita id duplicado e ano divergente", () => {
    expect(() => normalizarArquivo([questao(136), questao(136)], "a.json")).toThrow(/id duplicado enem-2023-136/);
    expect(() => normalizarArquivo([questao(136)], "a.json", 2022)).toThrow(/esperado 2022, veio 2023/);
  });
});

describe("normalizarResolucoes e mesclarResolucoes", () => {
  it("aceita objeto único ou lista", () => {
    expect(normalizarResolucoes(resolucao("enem-2023-136"), "r.json")).toHaveLength(1);
    expect(normalizarResolucoes([resolucao("a"), resolucao("b")], "r.json")).toHaveLength(2);
    expect(() => normalizarResolucoes({ id: "x" }, "r.json")).toThrow(/r\.json: índice 0 \(x\)/);
  });

  it("mescla pelo id sem sobrescrever e lista órfãs", () => {
    const existente = resolucao("enem-2023-137");
    const qs = [questao(136), questao(137, { resolucao: { ...existente, resumo: "original" } }), questao(138)];
    const entrada = structuredClone(qs);
    const r = mesclarResolucoes(qs, [resolucao("enem-2023-136"), existente, resolucao("enem-2009-999")]);
    expect(r.mescladas).toBe(1);
    expect(r.questoes[0]!.resolucao?.id).toBe("enem-2023-136");
    expect(r.questoes[1]!.resolucao?.resumo).toBe("original");
    expect(r.questoes[2]!.resolucao).toBeUndefined();
    expect(r.orfas).toEqual(["enem-2009-999"]);
    expect(qs).toEqual(entrada);
  });
});

describe("montarManifesto", () => {
  it("conta anos, total, TRI e resolução", () => {
    const m = montarManifesto({
      questoesPorAno: new Map([
        [2023, [questao(136, { tri: { a: 1, b: 2, c: 0.2 } }), questao(137, { resolucao: resolucao("enem-2023-137") })]],
        [2009, [questao(136, { id: "enem-2009-136", ano: 2009 })]],
        [2010, []],
      ]),
      origem: "local:/x",
      fixture: false,
      geradoEm: new Date("2026-01-02T03:04:05Z"),
    });
    expect(m).toEqual({
      gerado_em: "2026-01-02T03:04:05.000Z",
      origem: "local:/x",
      fixture: false,
      anos: [2009, 2023],
      total: 3,
      com_tri: 1,
      com_resolucao: 1,
    });
    expect(manifestoSchema.safeParse(m).success).toBe(true);
  });

  it("manifesto do fixture não tem anos", () => {
    const m = montarManifestoFixture([questao(1), questao(2)], new Date(0), "fixture:teste");
    expect(m).toMatchObject({ fixture: true, anos: [], total: 2, com_tri: 0, com_resolucao: 0 });
  });
});

describe("planejarRemocoes", () => {
  it("remove só NNNN.json ausentes; nunca fixture/manifesto/outros", () => {
    const existentes = ["2009.json", "2010.json", "2023.json", "fixture.json", "manifesto.json", "index.ts", "123.json", "2023.json.bak"];
    expect(planejarRemocoes(existentes, [2023])).toEqual(["2009.json", "2010.json"]);
    expect(planejarRemocoes(["fixture.json"], [])).toEqual([]);
  });
});

describe("gerarIndexTs", () => {
  it("sem anos: usaFixture true e carregarAno vazio", () => {
    const ts = gerarIndexTs([]);
    expect(ts).toContain("export const anos = [] as const;");
    expect(ts).toContain("export const usaFixture: boolean = true;");
    expect(ts).not.toContain("import(");
  });

  it("com anos: imports estáticos ordenados", () => {
    const ts = gerarIndexTs([2023, 2009]);
    expect(ts).toContain("export const anos = [2009, 2023] as const;");
    expect(ts).toContain("export const usaFixture: boolean = false;");
    expect(ts.indexOf('import("./2009.json")')).toBeLessThan(ts.indexOf('import("./2023.json")'));
  });
});

describe("parseArgs", () => {
  it("usa env como padrão e flags por cima", () => {
    expect(parseArgs([], { PROVAS_DIR: "/p", PROVAS_GIT_REF: "dev" })).toMatchObject({ dir: "/p", ref: "dev", dryRun: false });
    expect(parseArgs(["--dir", "/q", "--ref=v1", "--dry-run", "--fixture", "--github"], {})).toMatchObject({
      dir: "/q",
      ref: "v1",
      dryRun: true,
      fixture: true,
      github: true,
    });
    expect(parseArgs([], {}).ref).toBe("main");
  });

  it("rejeita opção desconhecida ou sem valor", () => {
    expect(() => parseArgs(["--xpto"], {})).toThrow(/desconhecida/);
    expect(() => parseArgs(["--dir"], {})).toThrow(/precisa de um valor/);
  });
});

describe("urlGithubAno e formatarResumo", () => {
  it("monta a URL do raw", () => {
    expect(urlGithubAno("main", 2023)).toBe(
      "https://raw.githubusercontent.com/matheuscastro12-eng/PROVAS/main/data/questoes/matematica/2023.json",
    );
  });

  it("resume o manifesto", () => {
    const m = montarManifestoFixture([questao(1)], new Date(0), "fixture:teste");
    const texto = formatarResumo(m, { dryRun: true, removidos: ["2009.json"] });
    expect(texto).toContain("dry-run");
    expect(texto).toContain("fixture:teste");
    expect(texto).toContain("removeria");
  });
});

describe("montarFixture", () => {
  const bruta = (index: number, correta: string) => ({
    index,
    year: 2023,
    context: "Texto  com espaços\n\nDisponível em: x.",
    alternativesIntroduction: "Qual é?",
    files: [],
    correctAlternative: correta,
    alternatives: ["A", "B", "C", "D", "E"].map((letter) => ({ letter, text: ` ${letter} `, file: null })),
  });

  it("preserva o texto, faz trim nas alternativas e não inventa TRI", () => {
    const [q] = montarFixture([{ questions: [bruta(143, "B")] }], [SELECAO_FIXTURE_2023[0]!]);
    expect(q!.enunciado).toBe("Texto  com espaços\n\nDisponível em: x.\n\nQual é?");
    expect(q!.alternativas[0]).toEqual({ letra: "A", texto: "A", imagem: null });
    expect(q!.tri).toBeNull();
    expect(q!.competencia).toBe("C1");
    expect(q!.qualidade?.depende_de_imagem).toBe(false);
  });

  it("para se o gabarito divergir ou a questão faltar", () => {
    expect(() => montarFixture([{ questions: [bruta(143, "C")] }], [SELECAO_FIXTURE_2023[0]!])).toThrow(/Gabarito divergente/);
    expect(() => montarFixture([{ questions: [] }], [SELECAO_FIXTURE_2023[0]!])).toThrow(/não encontrada/);
    expect(() => montarFixture([{ nada: 1 }])).toThrow(/formato inesperado/);
  });
});
