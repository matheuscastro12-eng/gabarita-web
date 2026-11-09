import { describe, expect, it } from "vitest";
import { LETRAS } from "@/data/tipos";
import { criarAleatorio } from "@/lib/aleatorio";
import { valorDaAlternativa } from "@/lib/tutor/mathjs";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { GERADORES } from "./geradores";
import { montarGemea } from "./montar";
import { fracaoLatex, mdc, numeroEnem, reais } from "./formato";
import {
  ehNomeGerador,
  gemeaComoQuestao,
  gemeaDaQuestao,
  geradorPara,
  gerarGemea,
  NOMES_GERADORES,
  sementeGemea,
  type Gemea,
  type NomeGerador,
} from "./index";

const SEMENTES = Array.from({ length: 100 }, (_, i) => 1000 + i * 7919);

/** Números do enunciado na ordem em que aparecem (notação do ENEM). */
function numerosDe(texto: string): number[] {
  const limpo = texto
    .replace(/R\$\s*/g, "")
    .replace(/(\d)\.(?=\d{3}(?:\.\d{3})*(?:,\d|\D|$))/g, "$1")
    .replace(/(\d)[  ](?=\d{3}(\D|$))/g, "$1")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\d+(?:º|ª)/g, (m) => `ORD${m.replace(/\D/g, "")} `) // "12º mês" vira marcador
    .replace(/\$[^$]*\$/g, " ");
  const ordinais = [...limpo.matchAll(/ORD(\d+)/g)].map((m) => Number(m[1]));
  const nums = [...limpo.replace(/ORD\d+/g, " ").matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
  return [...nums, ...ordinais];
}

/** Oráculo independente: recalcula a resposta a partir dos números do enunciado. */
const ORACULOS: Record<NomeGerador, (g: Gemea, valor: number) => boolean> = {
  porcentagem: (g, valor) => {
    const n = numerosDe(g.enunciado);
    if (/desconto/.test(g.enunciado)) return Math.abs((n[0] as number) * (1 - (n[1] as number) / 100) - valor) < 1e-6;
    if (/queda/.test(g.enunciado)) return Math.abs((n[0] as number) / (1 - (n[1] as number) / 100) - valor) < 1e-6;
    const [antes, depois] = n as [number, number];
    return Math.abs(((depois - antes) / antes) * 100 - valor) < 1e-6;
  },
  "regra-de-tres": (g, valor) => {
    const [pecas, horas, novas] = numerosDe(g.enunciado) as [number, number, number];
    return Math.abs((pecas / horas) * novas - valor) < 1e-6;
  },
  "razao-proporcao": (g, valor) => {
    const [a, b, total] = numerosDe(g.enunciado) as [number, number, number];
    return Math.abs((total * b) / (a + b) - valor) < 1e-6;
  },
  probabilidade: (g, valor) => {
    const [v, a, z] = numerosDe(g.enunciado) as [number, number, number];
    return Math.abs(v / (v + a + z) - valor) < 1e-9;
  },
  "media-mediana-moda": (g, valor) => {
    const n = numerosDe(g.enunciado).slice(1); // o primeiro número é "seis"? não: "seis" é por extenso; todos são valores
    const valores = numerosDe(g.enunciado);
    const ord = [...(valores.length === 6 ? valores : n)].sort((x, y) => x - y);
    return Math.abs(((ord[2] as number) + (ord[3] as number)) / 2 - valor) < 1e-9;
  },
  "funcao-afim": (g, valor) => {
    const [fixa, porKm, total] = numerosDe(g.enunciado) as [number, number, number];
    return Math.abs((total - fixa) / porKm - valor) < 1e-6;
  },
  "equacao-1-grau": (g, valor) => {
    const mult = /dobro/.test(g.enunciado) ? 2 : /triplo/.test(g.enunciado) ? 3 : /quádruplo/.test(g.enunciado) ? 4 : 5;
    const [a, b] = numerosDe(g.enunciado) as [number, number];
    return Math.abs((b + a) / mult - valor) < 1e-6;
  },
  "equacao-2-grau": (g, valor) => {
    const m = /-5t\^2 \+ (\d+)t/.exec(g.enunciado);
    return Number(m?.[1]) / 5 === valor;
  },
  "progressao-aritmetica": (g, valor) => {
    const [a1, d, n] = numerosDe(g.enunciado) as [number, number, number];
    return Math.abs(a1 + (n - 1) * d - valor) < 1e-6;
  },
  escala: (g, valor) => {
    const [um, escala, cm] = numerosDe(g.enunciado) as [number, number, number];
    return um === 1 && Math.abs((cm * escala) / 100000 - valor) < 1e-9;
  },
};

describe.each(NOMES_GERADORES)("gerador %s", (nome) => {
  it("100 sementes: 5 alternativas distintas, uma correta, resposta confere com o código e com o oráculo", () => {
    for (const semente of SEMENTES) {
      const g = gerarGemea(nome, semente);
      expect(g.id).toBe(`gemea-${nome}-${semente}`);
      expect(g.alternativas.map((a) => a.letra)).toEqual([...LETRAS]);
      const textos = g.alternativas.map((a) => a.texto);
      expect(new Set(textos).size, `semente ${semente}: ${textos.join(" | ")}`).toBe(5);
      expect(textos.every((t) => t.trim().length > 0)).toBe(true);
      const correta = g.alternativas.find((a) => a.letra === g.gabarito);
      expect(correta?.texto).toBe(g.resposta);
      expect(Object.keys(g.erros).sort()).toEqual(LETRAS.filter((l) => l !== g.gabarito).sort());
      expect(g.enunciado.length).toBeGreaterThan(40);
      expect(g.resolucao.length).toBeGreaterThan(40);
      // A resposta sai do código: o valor da candidata formatado é a alternativa correta.
      const candidata = GERADORES[nome](criarAleatorio(semente));
      expect(candidata.formatar(candidata.resposta)).toBe(g.resposta);
      // Oráculo independente a partir do enunciado.
      expect(ORACULOS[nome](g, candidata.resposta), `semente ${semente}: ${g.enunciado}`).toBe(true);
      // O valor da alternativa correta é legível pelo verificador do tutor.
      const bruto = valorDaAlternativa(g.resposta);
      expect(bruto, `semente ${semente}: ${g.resposta}`).not.toBeNull();
      const lido = g.resposta.endsWith("%") ? (bruto as number) * 100 : (bruto as number); // "30%" lê como 0,3
      expect(Math.abs(lido - candidata.resposta)).toBeLessThan(1e-6 + Math.abs(candidata.resposta) * 1e-6);
    }
  });
  it("é determinístico", () => {
    expect(gerarGemea(nome, 42)).toEqual(gerarGemea(nome, 42));
    expect(gerarGemea(nome, 42).enunciado).not.toBe(gerarGemea(nome, 43).enunciado);
  });
});

describe("montarGemea", () => {
  it("completa distratores repetidos com perturbações e rotula como erro de conta", () => {
    const g = montarGemea("porcentagem", 1, {
      enunciado: "e",
      resposta: 10,
      distratores: [
        { valor: 10, erro: "igual à resposta" },
        { valor: 20, erro: "x" },
        { valor: 20, erro: "repetido" },
        { valor: Number.NaN, erro: "inválido" },
      ],
      formatar: (v) => String(v),
      resolucao: "r",
    });
    expect(new Set(g.alternativas.map((a) => a.texto)).size).toBe(5);
    expect(Object.values(g.erros)).toContain("x");
    expect(Object.values(g.erros).filter((e) => e.startsWith("Erro de conta"))).toHaveLength(3);
  });
  it("lança quando o formato não distingue 5 valores", () => {
    expect(() =>
      montarGemea("escala", 2, { enunciado: "e", resposta: 1, distratores: [], formatar: () => "igual", resolucao: "r" }),
    ).toThrow(/5 alternativas/);
  });
});

describe("formato", () => {
  it("numeroEnem, reais, fracaoLatex, mdc", () => {
    expect(numeroEnem(115600, 0)).toBe("115 600");
    expect(numeroEnem(1250.5)).toBe("1250,5");
    expect(numeroEnem(12500.5)).toBe("12 500,5");
    expect(numeroEnem(-3.25)).toBe("−3,25");
    expect(reais(1250)).toBe("R$ 1.250,00");
    expect(reais(4.5)).toBe("R$ 4,50");
    expect(fracaoLatex(6, 8)).toBe("$\\frac{3}{4}$");
    expect(fracaoLatex(4, 2)).toBe("$2$");
    expect(mdc(0, 0)).toBe(1);
  });
});

describe("índice", () => {
  it("geradorPara escolhe pelos assuntos (curadoria primeiro)", () => {
    expect(geradorPara({ assuntos: ["graficos-tabelas"], resolucao: undefined })).toBeNull();
    expect(geradorPara({ assuntos: ["regra-de-tres", "porcentagem"], resolucao: undefined })).toBe("regra-de-tres");
    expect(geradorPara({ assuntos: ["grandezas-unidades-escalas"], resolucao: undefined })).toBe("escala");
    expect(geradorPara({ assuntos: ["funcao-quadratica"], resolucao: undefined })).toBe("equacao-2-grau");
    expect(geradorPara({ assuntos: ["progressao-aritmetica"], resolucao: undefined })).toBe("progressao-aritmetica");
    const q = questaoFake({ assuntos: ["outro"], resolucao: { ...questaoFake().resolucao, assuntos: ["probabilidade"] } as never });
    expect(geradorPara({ assuntos: ["outro"], resolucao: { assuntos: ["probabilidade"] } as never })).toBe("probabilidade");
    expect(q.assuntos).toEqual(["outro"]);
  });
  it("gemeaDaQuestao usa semente estável por índice", () => {
    const q = { id: "enem-2022-154", assuntos: ["porcentagem"], resolucao: undefined };
    const a = gemeaDaQuestao(q, 0);
    const b = gemeaDaQuestao(q, 1);
    expect(a?.semente).toBe(sementeGemea("enem-2022-154", 0));
    expect(a?.enunciado).not.toBe(b?.enunciado);
    expect(gemeaDaQuestao({ id: "x", assuntos: ["nada"], resolucao: undefined })).toBeNull();
  });
  it("gemeaComoQuestao herda habilidade do pai e marca origem", () => {
    const g = gerarGemea("escala", 5);
    const q = gemeaComoQuestao(g, { habilidade: "H12", competencia: "C3" });
    expect(q.id).toBe(g.id);
    expect(q.habilidade).toBe("H12");
    expect(q.gabarito).toBe(g.gabarito);
    expect(q.alternativas).toHaveLength(5);
    expect(gemeaComoQuestao(g).habilidade).toBe("H10");
    expect(gemeaComoQuestao(g).competencia).toBeNull();
  });
  it("ehNomeGerador", () => {
    expect(ehNomeGerador("escala")).toBe(true);
    expect(ehNomeGerador("toString")).toBe(false);
  });
});
