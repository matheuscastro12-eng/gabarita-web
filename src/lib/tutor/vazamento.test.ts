import { describe, expect, it } from "vitest";
import { aplicarGuarda, detectarVazamento, extrairNumeros, guardaAtiva, redigir, SUBSTITUTO } from "./vazamento";

const questao = {
  enunciado:
    "Em janeiro de 2013, foram criadas 28 900 vagas, uma queda de 75% em relação a 2012. O número de vagas criadas em janeiro de 2012 foi",
  gabarito: "C" as const,
  alternativas: [
    { letra: "A" as const, texto: "16 514." },
    { letra: "B" as const, texto: "86 700." },
    { letra: "C" as const, texto: "115 600." },
    { letra: "D" as const, texto: "441 343." },
    { letra: "E" as const, texto: "448 568." },
  ],
};

describe("guardaAtiva", () => {
  it("vale antes do degrau 4, sem pedido e antes de confirmar", () => {
    expect(guardaAtiva({ degrau: 0, pedidoExplicito: false, confirmada: false })).toBe(true);
    expect(guardaAtiva({ degrau: 3, pedidoExplicito: false, confirmada: false })).toBe(true);
    expect(guardaAtiva({ degrau: 4, pedidoExplicito: false, confirmada: false })).toBe(false);
    expect(guardaAtiva({ degrau: 0, pedidoExplicito: true, confirmada: false })).toBe(false);
    expect(guardaAtiva({ degrau: 0, pedidoExplicito: false, confirmada: true })).toBe(false);
  });
});

describe("extrairNumeros", () => {
  it("entende espaço e ponto de milhar e vírgula decimal", () => {
    expect(extrairNumeros("115 600 ou 115.600 ou 0,25 e 2013")).toEqual([115600, 115600, 0.25, 2013]);
  });
});

describe("detectarVazamento", () => {
  it("pega a letra do gabarito em frases típicas", () => {
    for (const t of [
      "A resposta é a alternativa C.",
      "Então a letra C está certa.",
      "Gabarito: C",
      "É a C!",
      "Marque C.",
      "A opção (C) é a correta.",
      "Resposta: (C)",
    ]) {
      expect(detectarVazamento(t, questao).vazou, t).toBe(true);
    }
  });
  it("não pega letras em palavras ou outras alternativas", () => {
    for (const t of [
      "Compare os valores com calma.",
      "A alternativa B seria 3 vezes 28 900, mas pense: 75% de queda sobra quanto?",
      "Calcule 25% do valor.",
      "Caged é o cadastro de empregados.",
    ]) {
      expect(detectarVazamento(t, questao).vazou, t).toBe(false);
    }
  });
  it("pega o valor da resposta em várias grafias", () => {
    for (const t of ["Dá 115600.", "São 115 600 vagas.", "V = 115.600", "$V = 115\\,600$"]) {
      expect(detectarVazamento(t, questao).vazou, t).toBe(true);
    }
  });
  it("não pega números do enunciado nem valores de distratores", () => {
    expect(detectarVazamento("Você tem 28 900 que valem 25%. Quanto vale 100%?", questao).vazou).toBe(false);
    expect(detectarVazamento("86 700 seria 3 vezes; é isso?", questao).vazou).toBe(false);
  });
  it("não acusa valor quando o número da resposta já aparece no enunciado", () => {
    const q = { ...questao, enunciado: "O valor 115 600 aparece na tabela. Qual é o total?" };
    expect(detectarVazamento("Pense em 115 600 como ponto de partida.", q).vazou).toBe(false);
  });
  it("pega alternativa textual citada por inteiro", () => {
    const q = {
      enunciado: "Qual figura resulta da planificação?",
      gabarito: "B" as const,
      alternativas: [
        { letra: "A" as const, texto: "um cubo" },
        { letra: "B" as const, texto: "uma pirâmide de base quadrada" },
        { letra: "C" as const, texto: "um cilindro" },
        { letra: "D" as const, texto: "um cone" },
        { letra: "E" as const, texto: "um prisma" },
      ],
    };
    expect(detectarVazamento("Ela forma uma pirâmide de base quadrada.", q).vazou).toBe(true);
    expect(detectarVazamento("Conte as faces triangulares.", q).vazou).toBe(false);
  });
  it("ignora alternativa textual curta ou presente no enunciado", () => {
    const q = {
      enunciado: "Escolha sim ou não.",
      gabarito: "A" as const,
      alternativas: [
        { letra: "A" as const, texto: "sim" },
        { letra: "B" as const, texto: "não" },
      ],
    };
    expect(detectarVazamento("sim, pense nisso", q).vazou).toBe(false);
  });
  it("pega porcentagem como valor", () => {
    const q = {
      enunciado: "O preço subiu de 80 para 100. Qual foi o aumento percentual?",
      gabarito: "B" as const,
      alternativas: [
        { letra: "A" as const, texto: "20%" },
        { letra: "B" as const, texto: "25%" },
        { letra: "C" as const, texto: "30%" },
      ],
    };
    const d = detectarVazamento("O aumento foi de 0,25, ou seja, 25%.", q);
    expect(d.vazou).toBe(true);
    expect(redigir("O aumento foi de 0,25, ou seja, 25%.", d)).toBe(`O aumento foi de ${SUBSTITUTO}, ou seja, ${SUBSTITUTO}%.`);
  });
});

describe("redigir e aplicarGuarda", () => {
  it("substitui só os trechos vazados", () => {
    const texto = "Pense: V = 115 600, então a alternativa C. Confira dividindo por 0,25.";
    const d = detectarVazamento(texto, questao);
    const r = redigir(texto, d);
    expect(r).not.toContain("115 600");
    expect(r).not.toMatch(/alternativa C/);
    expect(r).toContain("Confira dividindo por 0,25.");
    expect(r).toContain(SUBSTITUTO);
  });
  it("aplicarGuarda redige com aviso quando ativa e deixa passar quando não", () => {
    const texto = "A resposta é a letra C.";
    const ativa = aplicarGuarda(texto, questao, { degrau: 1, pedidoExplicito: false, confirmada: false });
    expect(ativa.vazou).toBe(true);
    expect(ativa.texto).toContain("Trecho oculto");
    expect(ativa.motivos[0]).toMatch(/^letra/);
    const livre = aplicarGuarda(texto, questao, { degrau: 4, pedidoExplicito: false, confirmada: false });
    expect(livre).toEqual({ texto, vazou: false, motivos: [] });
    const limpo = aplicarGuarda("Qual é a parte e qual é o todo?", questao, { degrau: 0, pedidoExplicito: false, confirmada: false });
    expect(limpo.vazou).toBe(false);
  });
});
