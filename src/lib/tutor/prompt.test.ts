import { describe, expect, it } from "vitest";
import { estadoInicial, registrarEventoTutor, registrarTentativa } from "@/lib/dominio";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { BLOCO_FIXO, blocoContexto, blocoPerfil, montarInstrucoes, resumirAluno } from "./prompt";
import { RESUMOS } from "@/lib/resumos/conteudo";
import { BLOCO_FIXO_RESUMO, montarInstrucoesResumo } from "./prompt";
const resumoPorIdTeste = (id: string) => RESUMOS.find((r) => r.id === id)!;

const agora = new Date("2026-11-09T12:00:00Z");
const questao = questaoFake({
  id: "enem-2022-154",
  enunciado: "Queda de 75% para 28 900. Valor original?",
  alternativas: [
    { letra: "A", texto: "16 514." },
    { letra: "B", texto: "86 700." },
    { letra: "C", texto: "115 600." },
    { letra: "D", texto: "441 343." },
    { letra: "E", texto: "" , imagem: "https://enem.dev/x.png" },
  ],
  habilidade: "H3",
  tri: null,
  resolucao: {
    id: "enem-2022-154",
    gabarito: "C",
    assuntos: ["porcentagem"],
    habilidade: "H3",
    resumo: "Recuperar o original.",
    resolucao: "x".repeat(80),
    dicas: { dica1: "Dica um aqui.", dica2: "Dica dois aqui.", dica3: "Dica três aqui." },
    erros_comuns: [{ alternativa: "B", por_que: "Multiplicou por 3 em vez de 4." }],
    conceitos: ["porcentagem"],
    verificacao: { codigo_sympy: "V = symbols('V')\nsolve(Eq(V/4, 28900), V)", resultado_esperado: "115600" },
    classificacao: "revisada",
  },
});

describe("BLOCO_FIXO", () => {
  it("tem as regras centrais e cita as ferramentas", () => {
    expect(BLOCO_FIXO).toMatch(/NUNCA revele a alternativa/);
    expect(BLOCO_FIXO).toMatch(/máximo 3 frases/);
    expect(BLOCO_FIXO).toMatch(/LaTeX/);
    for (const f of ["run_python", "verify_answer", "calc", "plot_function", "get_hint", "make_twin", "record_event"]) {
      expect(BLOCO_FIXO).toContain(f);
    }
    expect(BLOCO_FIXO).toMatch(/0 pergunta socrática .* 4 a resolução completa/s);
  });
});

describe("blocoPerfil", () => {
  it("usa o texto do aluno ou um padrão", () => {
    expect(blocoPerfil({ nome: "Matheus", explicaDoMeuJeito: "com futebol" })).toContain("com futebol");
    expect(blocoPerfil({ nome: "", explicaDoMeuJeito: "  " })).toMatch(/Nome: Matheus.*ainda não disse/s);
  });
});

describe("resumirAluno", () => {
  it("resume domínio, tentativas e equívocos em poucas linhas", () => {
    let estado = estadoInicial(agora);
    estado = registrarTentativa(estado, { questao, escolha: "B", segundos: 60, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null, porQue: "Multiplicou por 3" }, agora).estado;
    estado = registrarEventoTutor(estado, { tipo: "equivoco", questaoId: questao.id, detalhe: "Multiplicou por 3" }, agora).estado;
    const r = resumirAluno(estado, "H3");
    expect(r).toMatch(/Domínio nas habilidades da semana: H3 0,\d\d/);
    expect(r).toMatch(/Nesta habilidade \(H3\): domínio 0,\d\d, 1 itens oficiais, 0 acertos/);
    expect(r).toContain("Tentativas: 1 (0 acertos). Erros abertos no caderno: 1.");
    expect(r).toContain("multiplicou por 3 (2×)");
    expect(r.split(/\s+/).length).toBeLessThan(160);
  });
  it("habilidade sem estado e sem habilidade", () => {
    const estado = estadoInicial(agora);
    expect(resumirAluno(estado, "H24")).toContain("primeiro item");
    expect(resumirAluno(estado)).not.toContain("Nesta habilidade");
    expect(resumirAluno(estado)).not.toContain("Equívocos");
  });
});

describe("blocoContexto / montarInstrucoes", () => {
  it("inclui enunciado, alternativas, gabarito, curadoria e estado", () => {
    const c = blocoContexto({
      questao,
      contexto: { degrau: 2, escolha: "B", confirmada: false, pedidoResposta: false, selecao: " 28 900 " },
      resumoAluno: "RESUMO X",
    });
    expect(c).toContain("Queda de 75%");
    expect(c).toContain("E) [imagem]");
    expect(c).toContain("GABARITO OFICIAL: C");
    expect(c).toContain("Dica 2: Dica dois aqui.");
    expect(c).toContain("B: Multiplicou por 3 em vez de 4.");
    expect(c).toContain("V = symbols('V'); solve");
    expect(c).toContain("Degrau de dica atual: 2.");
    expect(c).toContain("Alternativa marcada pelo aluno: B.");
    expect(c).toContain("NÃO pode ser revelada");
    expect(c).toContain("«28 900»");
    expect(c).toContain("RESUMO X");
    expect(c).toContain("H3 (Problemas numéricos)");
    expect(c).toContain("sem parâmetro TRI");
  });
  it("estados: confirmou e errou, confirmou e acertou, pediu a resposta, sem curadoria, com TRI", () => {
    const base = { questao, resumoAluno: "" };
    expect(blocoContexto({ ...base, contexto: { degrau: 0, escolha: "B", confirmada: true, pedidoResposta: false } })).toContain("ERROU (marcou B)");
    expect(blocoContexto({ ...base, contexto: { degrau: 0, escolha: "C", confirmada: true, pedidoResposta: false } })).toContain("ACERTOU");
    expect(blocoContexto({ ...base, contexto: { degrau: 0, escolha: null, confirmada: true, pedidoResposta: false } })).toContain("marcou nada");
    const pediu = blocoContexto({ ...base, contexto: { degrau: 4, escolha: null, confirmada: false, pedidoResposta: true } });
    expect(pediu).toContain("PEDIU A RESPOSTA DIRETA");
    expect(pediu).not.toContain("NÃO pode ser revelada");
    const semCuradoria = blocoContexto({
      questao: questaoFake({ resolucao: undefined, tri: { a: 1, b: -0.4, c: 0.2 }, imagens: ["https://enem.dev/i.png"], anulada: true, habilidade: null }),
      contexto: { degrau: 4, escolha: null, confirmada: false, pedidoResposta: false },
      resumoAluno: "",
    });
    expect(semCuradoria).toContain("ainda não tem resolução curada");
    expect(semCuradoria).toContain("b = -0.40");
    expect(semCuradoria).toContain("IMAGENS");
    expect(semCuradoria).toContain("anulada");
    expect(semCuradoria).toContain("Habilidade: desconhecida");
  });
  it("montarInstrucoes separa fixo, perfil e contexto", () => {
    const i = montarInstrucoes({
      questao,
      perfil: { nome: "Matheus", explicaDoMeuJeito: "" },
      contexto: { degrau: 0, escolha: null, confirmada: false, pedidoResposta: false },
      resumoAluno: "r",
    });
    expect(i.fixo).toBe(BLOCO_FIXO);
    expect(i.perfil).toContain("PERFIL DO ALUNO");
    expect(i.contexto).toContain("CONTEXTO (OCULTO DO ALUNO");
  });
});

describe("prompt do modo resumo", () => {
  const resumo = resumoPorIdTeste("combinatoria");
  const inst = montarInstrucoesResumo({ resumo, perfil: { nome: "Matheus", explicaDoMeuJeito: "com exemplos de futebol" } });
  it("fixo sem escada de dicas nem gabarito; cita só calc e plot_function", () => {
    expect(BLOCO_FIXO_RESUMO).not.toMatch(/ESCADA|gabarito|verify_answer|run_python|record_event|get_hint|make_twin/i);
    expect(BLOCO_FIXO_RESUMO).toContain("calc");
    expect(BLOCO_FIXO_RESUMO).toContain("plot_function");
  });
  it("contexto tem fórmulas, legendas, exemplo, pegadinhas e truque", () => {
    expect(inst.contexto).toContain("Análise combinatória");
    for (const f of resumo.formulas) expect(inst.contexto).toContain(f.tex);
    expect(inst.contexto).toContain("Quando usar:");
    expect(inst.contexto).toContain("fatorial");
    expect(inst.contexto).toContain(resumo.exemplo.respostaTexto);
    expect(inst.contexto).toContain("PEGADINHAS");
    expect(inst.contexto).toContain(resumo.truque);
    expect(inst.perfil).toContain("futebol");
  });
});

describe("tutor por área", () => {
  it("natureza tem o bloco da área, com as mesmas regras de vazamento", async () => {
    const { BLOCO_FIXO_NATUREZA, blocoFixoDaArea } = await import("./prompt");
    expect(blocoFixoDaArea("matematica")).toBe(BLOCO_FIXO);
    expect(BLOCO_FIXO_NATUREZA).toMatch(/Ciências da Natureza \(física, química e biologia\)/);
    expect(BLOCO_FIXO_NATUREZA).not.toMatch(/estudo de matemática/);
    expect(BLOCO_FIXO_NATUREZA).toMatch(/NUNCA revele a alternativa/);
    expect(BLOCO_FIXO_NATUREZA).toMatch(/0 pergunta socrática .* 4 a resolução completa/s);
  });
});
