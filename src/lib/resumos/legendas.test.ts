import { describe, expect, it } from "vitest";
import katex from "katex";
import { RESUMOS } from "./conteudo";
import { LEGENDAS, legendaDe, simbolosDoTex } from "./legendas";

const formulas = RESUMOS.flatMap((r) => r.formulas.map((f) => [`${r.id} · ${f.rotulo}`, r.id, f] as const));

describe("legendas das fórmulas", () => {
  it("não há legenda órfã (resumo ou rótulo que não existe)", () => {
    for (const [id, porRotulo] of Object.entries(LEGENDAS)) {
      const r = RESUMOS.find((x) => x.id === id);
      expect(r, id).toBeDefined();
      for (const rotulo of Object.keys(porRotulo)) expect(r!.formulas.map((f) => f.rotulo), `${id}/${rotulo}`).toContain(rotulo);
    }
  });

  it.each(formulas)("%s tem legenda completa", (_nome, id, f) => {
    const legenda = legendaDe(id, f.rotulo);
    expect(legenda).toBeDefined();
    expect(legenda!.quandoUsar.length).toBeGreaterThan(10);
    expect(legenda!.quandoUsar.length).toBeLessThanOrEqual(110);
    expect(legenda!.itens.length).toBeGreaterThan(0);
    const daLegenda = new Set<string>();
    for (const item of legenda!.itens) {
      expect(item.significado.trim().length).toBeGreaterThan(2);
      expect(() => katex.renderToString(item.simbolo, { throwOnError: true })).not.toThrow();
      for (const s of simbolosDoTex(item.simbolo)) daLegenda.add(s);
    }
    const daFormula = simbolosDoTex(f.tex);
    // toda letra da fórmula está explicada…
    for (const s of daFormula) expect(daLegenda, `falta "${s}"`).toContain(s);
    // …e a legenda não explica letra que não está na fórmula
    for (const s of daLegenda) expect(daFormula, `sobra "${s}"`).toContain(s);
  });
});

describe("simbolosDoTex", () => {
  it("pega letras, gregos, \\text e fatorial; ignora estrutura e preposições", () => {
    expect([...simbolosDoTex(String.raw`V_{\text{final}}=V\cdot\left(1\pm\frac{p}{100}\right)`)].sort()).toEqual(["V", "final", "p"]);
    expect([...simbolosDoTex(String.raw`p\%\text{ de }V`)].sort()).toEqual(["%", "V", "p"]);
    expect([...simbolosDoTex(String.raw`A_{n,p}=\frac{n!}{(n-p)!}`)].sort()).toEqual(["!", "A", "n", "p"]);
    expect([...simbolosDoTex(String.raw`\operatorname{sen}\theta+\cos^2\theta`)].sort()).toEqual(["\\cos", "\\theta", "sen"]);
  });
});
