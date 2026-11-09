import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import katex from "katex";
import { ASSUNTOS } from "@/data/taxonomia";
import { competenciaDa } from "@/data/tipos";
import { VISUAIS } from "@/lib/visuais/catalogo";
import { RESUMOS, resumoPorId } from "./conteudo";
import {
  agruparPorCompetencia,
  alternarEstudado,
  buscarResumos,
  geometriaMapa,
  larguraRotulo,
  lerEstudados,
  mapaGeral,
  normalizar,
  questoesDoResumo,
  resumoParaQuestao,
} from "./logica";

describe("conteúdo dos resumos", () => {
  it("tem entre 14 e 18 resumos com ids únicos", () => {
    expect(RESUMOS.length).toBeGreaterThanOrEqual(14);
    expect(RESUMOS.length).toBeLessThanOrEqual(18);
    expect(new Set(RESUMOS.map((r) => r.id)).size).toBe(RESUMOS.length);
  });

  it.each(RESUMOS.map((r) => [r.id, r] as const))("%s está completo e ligado à taxonomia", (_id, r) => {
    expect(r.mapa.ramos.length).toBeGreaterThanOrEqual(3);
    expect(r.mapa.ramos.length).toBeLessThanOrEqual(7);
    for (const ramo of r.mapa.ramos) expect(ramo.itens.length).toBeGreaterThanOrEqual(1);
    expect(r.formulas.length).toBeGreaterThanOrEqual(2);
    expect(r.exemplo.passos.length).toBeGreaterThanOrEqual(3);
    expect(r.pegadinhas.length).toBeGreaterThanOrEqual(2);
    for (const p of r.pegadinhas) expect(p).toMatch(/^\*\*[^*]+\*\*: /);
    expect(r.truque.length).toBeGreaterThan(20);
    expect(r.comoCobra.length).toBeGreaterThan(60);
    expect(r.habilidades.length).toBeGreaterThan(0);
    // habilidades existem e a competência do resumo é a de alguma delas
    for (const h of r.habilidades) expect(competenciaDa(h)).not.toBeNull();
    expect(r.habilidades.map((h) => competenciaDa(h))).toContain(r.competencia);
    for (const a of r.assuntos) {
      const info = ASSUNTOS.find((x) => x.id === a);
      expect(info, a).toBeDefined();
    }
    if (r.visual) expect(VISUAIS.some((v) => v.id === r.visual)).toBe(true);
    // sem travessão no texto (regra de estilo) e sem emoji
    const texto = JSON.stringify(r);
    expect(texto).not.toMatch(/—/);
    expect(texto).not.toMatch(/\p{Emoji_Presentation}/u);
  });

  it.each(RESUMOS.map((r) => [r.id, r] as const))("%s: a conta do exemplo dá a resposta", (_id, r) => {
    const v = evaluate(r.exemplo.conta) as number;
    expect(v).toBeCloseTo(r.exemplo.resposta, 9);
  });

  it.each(RESUMOS.flatMap((r) => r.formulas.map((f) => [`${r.id}: ${f.rotulo}`, f.tex] as const)))("%s compila no KaTeX", (_n, tex) => {
    expect(() => katex.renderToString(tex, { displayMode: true, throwOnError: true })).not.toThrow();
  });

  it("confere as contas citadas no texto", () => {
    // porcentagem: três descontos de 10%
    expect(evaluate("0.9^3")).toBeCloseTo(0.729, 9);
    // juros simples do mesmo caso
    expect(evaluate("2000 * (1 + 0.1 * 3)")).toBeCloseTo(2600, 9);
    expect(evaluate("2000*1.1")).toBeCloseTo(2200, 9);
    expect(evaluate("2200*1.1")).toBeCloseTo(2420, 9);
    // estatística: média, mediana, moda e variância
    expect(evaluate("mean([3,5,5,6,8,9])")).toBe(6);
    expect(evaluate("median([3,5,5,6,8,9])")).toBe(5.5);
    expect(evaluate("mode([3,5,5,6,8,9])")).toEqual([5]);
    expect(evaluate("variance([3,5,5,6,8,9], 'uncorrected')")).toBe(4);
    // probabilidade: pelo menos um 6 em dois dados
    expect(evaluate("1 - 25/36")).toBeCloseTo(11 / 36, 12);
    // combinatória: arranjo e anagramas de ARARA
    expect(evaluate("8*7*6")).toBe(336);
    expect(evaluate("factorial(5)/(factorial(3)*factorial(2))")).toBe(10);
    // escala: 1 : 100 nas áreas
    expect(evaluate("100^2")).toBe(10000);
    // quadrática: vértice e raízes de -x²+40x-300 (10 e 30)
    expect(evaluate("-40/(2*-1)")).toBe(20);
    expect(evaluate("-(10^2)+40*10-300")).toBe(0);
    expect(evaluate("-(30^2)+40*30-300")).toBe(0);
    expect(evaluate("-(40^2 - 4*(-1)*(-300))/(4*-1)")).toBe(100);
    // exponencial: 6 h com dobra a cada 3 h
    expect(evaluate("2^(6/3)")).toBe(4);
    // potências: 500 s em minutos e notação científica
    expect(evaluate("500/60")).toBeCloseTo(8.33, 2);
    expect(evaluate("25e3")).toBe(2.5e4);
    // unidades: m/s para km/h
    expect(evaluate("to(1 m/s, km/h)").toNumber("km/h")).toBeCloseTo(3.6, 9);
    expect(evaluate("to(1 m^3, L)").toNumber("L")).toBeCloseTo(1000, 9);
    // trigonometria: notáveis
    expect(evaluate("sin(45 deg)")).toBeCloseTo(Math.SQRT2 / 2, 12);
    expect(evaluate("sin(60 deg)")).toBeCloseTo(Math.sqrt(3) / 2, 12);
    expect(evaluate("cos(60 deg)")).toBeCloseTo(0.5, 12);
    // geometria espacial: raio dobrado
    expect(evaluate("(2^2)")).toBe(4);
    expect(evaluate("(2^3)")).toBe(8);
  });

  it("cobre todas as competências e os assuntos mais frequentes do banco", () => {
    expect(new Set(RESUMOS.map((r) => r.competencia)).size).toBe(7);
    const cobertos = new Set(RESUMOS.flatMap((r) => r.assuntos));
    for (const a of ["grandezas-unidades-escalas", "geometria-plana", "graficos-tabelas", "porcentagem", "geometria-espacial", "estatistica-basica", "razao-proporcao", "probabilidade"]) {
      expect(cobertos.has(a), a).toBe(true);
    }
  });

  it("resumoPorId", () => {
    expect(resumoPorId("probabilidade")?.titulo).toBe("Probabilidade");
    expect(resumoPorId("nada")).toBeUndefined();
  });
});

describe("busca e índice", () => {
  it("normaliza acento e caixa", () => {
    expect(normalizar("  Área ")).toBe("area");
  });
  it("busca vazia devolve tudo; termos combinam com E", () => {
    expect(buscarResumos("")).toHaveLength(RESUMOS.length);
    expect(buscarResumos("mediana").map((r) => r.id)).toEqual(["estatistica"]);
    expect(buscarResumos("AREA circulo").map((r) => r.id)).toContain("geometria-plana");
    expect(buscarResumos("H27").map((r) => r.id)).toContain("estatistica");
    expect(buscarResumos("xyzw")).toEqual([]);
  });
  it("agrupa por competência na ordem C1–C7 e omite grupos vazios", () => {
    const g = agruparPorCompetencia(RESUMOS);
    expect(g.map((x) => x.competencia)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7"]);
    expect(agruparPorCompetencia(buscarResumos("mediana")).map((x) => x.competencia)).toEqual(["C7"]);
  });
});

describe("estudados", () => {
  it("lê com tolerância a lixo", () => {
    expect(lerEstudados(null)).toEqual([]);
    expect(lerEstudados("{")).toEqual([]);
    expect(lerEstudados('{"a":1}')).toEqual([]);
    expect(lerEstudados('["probabilidade", 3, "inexistente", "probabilidade"]')).toEqual(["probabilidade"]);
  });
  it("alterna", () => {
    expect(alternarEstudado([], "a")).toEqual(["a"]);
    expect(alternarEstudado(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("ligação com as questões", () => {
  const qs = [
    { id: "q1", habilidade: "H28", assuntos: ["probabilidade"] },
    { id: "q2", habilidade: "H28", assuntos: ["probabilidade"], anulada: true },
    { id: "q3", habilidade: "H1", assuntos: ["probabilidade"] },
    { id: "q4", habilidade: null, assuntos: ["probabilidade"] },
    { id: "q5", habilidade: "H27", assuntos: ["outra", "estatistica-basica"] },
  ];
  it("questoesDoResumo exige habilidade e assunto, sem anuladas", () => {
    expect(questoesDoResumo(resumoPorId("probabilidade")!, qs).map((q) => q.id)).toEqual(["q1"]);
  });
  it("resumoParaQuestao", () => {
    expect(resumoParaQuestao(qs[0]!)?.id).toBe("probabilidade");
    expect(resumoParaQuestao(qs[2]!)).toBeNull();
    expect(resumoParaQuestao(qs[3]!)).toBeNull();
    expect(resumoParaQuestao(qs[4]!)?.id).toBe("estatistica");
  });
});

describe("mapa mental", () => {
  const sobrepoe = (a: { x: number; y: number; largura: number }, b: { x: number; y: number; largura: number }, h: number) =>
    a.x < b.x + b.largura && b.x < a.x + a.largura && Math.abs(a.y - b.y) < h;

  it("pílulas ficam no viewBox, crescem para fora e não se sobrepõem", () => {
    for (const n of [3, 4, 5, 7]) {
      const { ramos: g, viewBox: vb } = geometriaMapa(Array.from({ length: n }, () => ({ largura: 180, filhos: [120, 150, 90, 140, 100] })));
      expect(g).toHaveLength(n);
      expect(g[0]!.ancora).toBe("middle");
      expect(g[0]!.filhos[1]!.y).toBeLessThan(g[0]!.filhos[0]!.y);
      expect(g.some((r) => r.ancora === "start")).toBe(true);
      expect(g.some((r) => r.ancora === "end")).toBe(true);
      for (const r of g) {
        for (const c of [r.caixa, ...r.filhos]) {
          expect(c.x).toBeGreaterThanOrEqual(vb.x);
          expect(c.x + c.largura).toBeLessThanOrEqual(vb.x + vb.largura);
          expect(c.y).toBeGreaterThan(vb.y);
          expect(c.y).toBeLessThan(vb.y + vb.altura);
        }
        if (r.ancora === "start") expect(r.filhos[0]!.x).toBeGreaterThan(r.caixa.x + r.caixa.largura);
        if (r.ancora === "end") expect(r.filhos[0]!.x + r.filhos[0]!.largura).toBeLessThan(r.caixa.x);
      }
    }
    const q = geometriaMapa([2, 2, 2, 2].map(() => ({ largura: 100, filhos: [80, 80] })));
    expect(q.ramos[2]!.ancora).toBe("middle");
    expect(q.ramos[2]!.filhos[1]!.y).toBeGreaterThan(q.ramos[2]!.filhos[0]!.y);
  });

  it("nos mapas reais e no geral, os ramos não se sobrepõem entre si nem ao centro", () => {
    const mapas = [...RESUMOS.map((r) => r.mapa), mapaGeral()];
    for (const m of mapas) {
      const lc = larguraRotulo(m.centro, 16) + 10;
      const { ramos } = geometriaMapa(
        m.ramos.map((r) => ({ largura: larguraRotulo(r.rotulo, 14), filhos: r.itens.map((i) => larguraRotulo(typeof i === "string" ? i : i.rotulo, 12)) })),
        lc,
      );
      const centro = { x: -lc / 2, y: 0, largura: lc };
      ramos.forEach((a, i) => {
        expect(sobrepoe(a.caixa, centro, 44), `${m.centro}: ramo ${i} x centro`).toBe(false);
        ramos.slice(i + 1).forEach((b, j) => expect(sobrepoe(a.caixa, b.caixa, 36), `${m.centro}: ramos ${i}/${i + j + 1}`).toBe(false));
      });
    }
  });

  it("larguraRotulo cresce com o texto", () => {
    expect(larguraRotulo("abcd")).toBeLessThan(larguraRotulo("abcdefgh"));
    expect(larguraRotulo("ab", 20)).toBeGreaterThan(larguraRotulo("ab"));
  });
  it("mapa geral liga todos os resumos", () => {
    const m = mapaGeral();
    expect(m.ramos).toHaveLength(7);
    const hrefs = m.ramos.flatMap((r) => r.itens.map((i) => i.href));
    expect(hrefs).toHaveLength(RESUMOS.length);
    expect(hrefs).toContain("/resumos/probabilidade");
  });
});
