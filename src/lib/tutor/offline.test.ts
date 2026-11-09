import { describe, expect, it } from "vitest";
import type { Questao } from "@/data/tipos";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { calcular } from "./mathjs";
import { aberturaOffline, AVISO_OFFLINE, extrairExpressao, interpretar, responderOffline, textoDegrau, type EstadoOffline } from "./offline";

const curada: Questao = questaoFake({
  id: "enem-2022-154",
  enunciado: "Queda de 75% para 28 900 vagas. Quantas em 2012?",
  alternativas: [
    { letra: "A", texto: "16 514." },
    { letra: "B", texto: "86 700." },
    { letra: "C", texto: "115 600." },
    { letra: "D", texto: "441 343." },
    { letra: "E", texto: "448 568." },
  ],
  gabarito: "C",
  assuntos: ["porcentagem"],
  resolucao: {
    id: "enem-2022-154",
    gabarito: "C",
    assuntos: ["porcentagem"],
    habilidade: "H3",
    resolucao: "**1.** 28 900 é 25% do valor. **2.** V = 28 900 ÷ 0,25 = 115 600 (alternativa C). ".repeat(2),
    dicas: { dica1: "Se caiu 75%, sobrou 25%.", dica2: "Chame o valor de V: 25% de V = 28 900.", dica3: "V = 28 900 ÷ 0,25." },
    erros_comuns: [{ alternativa: "B", por_que: "Multiplicou 28 900 por 3 em vez de 4." }],
    conceitos: ["porcentagem"],
    verificacao: { codigo_sympy: "x", resultado_esperado: "115600" },
    classificacao: "revisada",
  },
});
const semCuradoria: Questao = questaoFake({ id: "enem-2019-140", assuntos: ["graficos-tabelas"], resolucao: undefined });

function estado(sobre: Partial<EstadoOffline> = {}): EstadoOffline {
  return { questao: curada, degrau: 0, escolha: null, confirmada: false, pedidoResposta: false, gemeasGeradas: 0, ...sobre };
}
const deps = { calcular };

describe("interpretar", () => {
  it("classifica as intenções em pt-BR", () => {
    expect(interpretar("me dá uma dica").tipo).toBe("dica");
    expect(interpretar("não sei por onde começar").tipo).toBe("dica");
    expect(interpretar("por que errei?").tipo).toBe("por-que-errei");
    expect(interpretar("onde foi que errei").tipo).toBe("por-que-errei");
    expect(interpretar("qual é a resposta?").tipo).toBe("resposta");
    expect(interpretar("me mostra a resolução passo a passo").tipo).toBe("resposta");
    expect(interpretar("quero uma questão gêmea").tipo).toBe("gemea");
    expect(interpretar("gráfico de y = 2x + 3")).toMatchObject({ tipo: "grafico", spec: { funcoes: [{ expressao: "2x + 3" }] } });
    expect(interpretar("desenha um gráfico")).toEqual({ tipo: "grafico", spec: null });
    expect(interpretar("calcule 28900 / 0,25")).toEqual({ tipo: "calcular", expressao: "28900 / 0,25" });
    expect(interpretar("quanto é 3/4 de 200?")).toEqual({ tipo: "calcular", expressao: "3/4 * 200" });
    expect(interpretar("28 900 ÷ 0,25")).toEqual({ tipo: "calcular", expressao: "28 900 ÷ 0,25" });
    expect(interpretar("abrir o laboratório").tipo).toBe("laboratorio");
    expect(interpretar("oi, tudo bem?").tipo).toBe("desconhecida");
    expect(interpretar("   ").tipo).toBe("desconhecida");
    expect(interpretar("calcule a área do círculo").tipo).toBe("desconhecida");
  });
  it("extrairExpressao traduz palavras e rejeita texto", () => {
    expect(extrairExpressao("quanto dá 2 vezes 3 mais 4")).toBe("2 * 3 + 4");
    expect(extrairExpressao("calcule 10 por cento de 50")).toBe("10 % * 50");
    expect(extrairExpressao("calcule tudo")).toBeNull();
  });
});

describe("textoDegrau", () => {
  it("usa curadoria quando há e genérico quando não", () => {
    expect(textoDegrau(curada, 1)).toEqual({ texto: "Se caiu 75%, sobrou 25%.", curado: true });
    expect(textoDegrau(curada, 4).curado).toBe(true);
    expect(textoDegrau(semCuradoria, 2).curado).toBe(false);
    expect(textoDegrau(semCuradoria, 4).texto).toContain("gabarito oficial é **C**");
  });
});

describe("responderOffline", () => {
  it("abertura é a pergunta socrática com chips", () => {
    const a = aberturaOffline(estado());
    expect(a.texto).toMatch(/\?$/);
    expect(a.sugestoes.map((s) => s.rotulo)).toEqual(["Próximo degrau", "Questão gêmea", "Gráfico", "Laboratório"]);
    expect(AVISO_OFFLINE).toContain("ANTHROPIC_API_KEY");
  });
  it("escada de dicas sobe um degrau por pedido e registra eventos", async () => {
    const r1 = await responderOffline("dica", estado(), deps);
    expect(r1.novoDegrau).toBe(1);
    expect(r1.texto).toContain("Se caiu 75%, sobrou 25%.");
    expect(r1.texto).toMatch(/\?$/);
    expect(r1.rotulo).toBe("Degrau 1 · conceito");
    expect(r1.eventos).toEqual([{ tipo: "dica", questaoId: "enem-2022-154", detalhe: "degrau 1 (modo guiado)", degrau: 1 }]);
    const r3 = await responderOffline("dica", estado({ degrau: 2 }), deps);
    expect(r3.novoDegrau).toBe(3);
    expect(r3.sugestoes[0]?.rotulo).toBe("Ver a resolução");
    const r4 = await responderOffline("dica", estado({ degrau: 3 }), deps);
    expect(r4.novoDegrau).toBe(4);
    expect(r4.conferido).toBe(true);
    expect(r4.eventos.map((e) => e.tipo)).toEqual(["dica", "pedido_resposta"]);
    const r5 = await responderOffline("dica", estado({ degrau: 4 }), deps);
    expect(r5.novoDegrau).toBeUndefined();
    expect(r5.texto).toContain("já está acima");
  });
  it("sem curadoria, marca o degrau como sem curadoria", async () => {
    const r = await responderOffline("ajuda", estado({ questao: semCuradoria }), deps);
    expect(r.rotulo).toContain("(sem curadoria)");
    expect(r.conferido).toBeUndefined();
  });
  it("por que errei: antes de confirmar, pulou, acertou, errou com/sem erro catalogado", async () => {
    expect((await responderOffline("por que errei?", estado(), deps)).texto).toContain("Primeiro confirme");
    expect((await responderOffline("por que errei?", estado({ confirmada: true }), deps)).texto).toContain("pulou");
    expect((await responderOffline("por que errei?", estado({ confirmada: true, escolha: "C" }), deps)).texto).toContain("acertou");
    const errou = await responderOffline("por que errei?", estado({ confirmada: true, escolha: "B" }), deps);
    expect(errou.texto).toContain("multiplicou 28 900 por 3 em vez de 4.");
    expect(errou.texto).toContain("gabarito é **C**");
    expect(errou.conferido).toBe(true);
    expect(errou.eventos).toEqual([{ tipo: "equivoco", questaoId: "enem-2022-154", detalhe: "Multiplicou 28 900 por 3 em vez de 4." }]);
    const semErro = await responderOffline("por que errei?", estado({ confirmada: true, escolha: "D" }), deps);
    expect(semErro.texto).toContain("Não há um erro típico catalogado");
    expect(semErro.eventos[0]?.tipo).toBe("erro");
    expect(semErro.sugestoes.some((s) => s.rotulo === "Ver a resolução")).toBe(true);
  });
  it("resposta direta registra o pedido antes do degrau 4 e dá a resolução conferida", async () => {
    const r = await responderOffline("qual é a resposta?", estado(), deps);
    expect(r.novoDegrau).toBe(4);
    expect(r.pedidoResposta).toBe(true);
    expect(r.conferido).toBe(true);
    expect(r.texto).toContain("115 600");
    expect(r.texto).toContain("gêmea");
    expect(r.eventos).toEqual([{ tipo: "pedido_resposta", questaoId: "enem-2022-154", detalhe: "pediu a resposta direta (modo guiado)", degrau: 4 }]);
    const depois = await responderOffline("resolução", estado({ confirmada: true }), deps);
    expect(depois.pedidoResposta).toBeUndefined();
    expect(depois.eventos).toEqual([]);
    const semCur = await responderOffline("resolução", estado({ questao: semCuradoria, degrau: 4 }), deps);
    expect(semCur.rotulo).toContain("(sem curadoria)");
    expect(semCur.texto).toContain("Laboratório");
  });
  it("gêmea usa o gerador do assunto e muda com o índice", async () => {
    const a = await responderOffline("quero uma gêmea", estado(), deps);
    const b = await responderOffline("quero uma gêmea", estado({ gemeasGeradas: 1 }), deps);
    expect(a.gemea?.gerador).toBe("porcentagem");
    expect(a.gemea?.alternativas).toHaveLength(5);
    expect(a.gemea?.id).not.toBe(b.gemea?.id);
    expect(a.eventos[0]).toMatchObject({ tipo: "gemea", detalhe: a.gemea?.id });
    expect(a.texto).toContain("Porcentagem");
    const sem = await responderOffline("quero uma gêmea", estado({ questao: semCuradoria }), deps);
    expect(sem.gemea).toBeUndefined();
    expect(sem.texto).toContain("Ainda não tenho um gerador");
  });
  it("gráfico com e sem função", async () => {
    const com = await responderOffline("gráfico de y = 2x + 3", estado(), deps);
    expect(com.grafico?.funcoes[0]?.expressao).toBe("2x + 3");
    expect(com.texto).toContain("$y = 2x + 3$");
    const sliders = await responderOffline("gráfico de a*x^2 + b", estado(), deps);
    expect(sliders.texto).toContain("sliders");
    const sem = await responderOffline("quero um gráfico", estado(), deps);
    expect(sem.grafico).toBeUndefined();
    expect(sem.texto).toContain("Me diga a função");
  });
  it("cálculo com mathjs, com erro e com aproximação", async () => {
    const ok = await responderOffline("calcule 28900 / 0,25", estado(), deps);
    expect(ok.calculo?.resultado).toBe("115600");
    expect(ok.texto).toContain("= 115600$");
    const aprox = await responderOffline("1/3", estado(), deps);
    expect(aprox.texto).toContain("≈ 0,3333");
    const erro = await responderOffline("calcule 2 +* 3", estado(), deps);
    expect(erro.calculo?.ok).toBe(false);
    expect(erro.texto).toContain("Não consegui avaliar");
    const assinc = await responderOffline("2+2", estado(), { calcular: async (e) => calcular(e) });
    expect(assinc.calculo?.resultado).toBe("4");
  });
  it("laboratório e desconhecida terminam com pergunta", async () => {
    const lab = await responderOffline("abre o laboratório", estado(), deps);
    expect(lab.rotulo).toBe("Laboratório");
    const x = await responderOffline("oi", estado(), deps);
    expect(x.texto).toContain("modo guiado");
    expect(x.texto).toMatch(/\?$/);
    expect(x.sugestoes.length).toBeLessThanOrEqual(5);
  });
});
