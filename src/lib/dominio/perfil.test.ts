import { describe, expect, it } from "vitest";
import { aplicarPreset, descreverPrazo, diasAteProva, normalizarMeta, PRESETS_EXPLICACAO, presetAtivo, removerPreset } from "./perfil";

const direto = PRESETS_EXPLICACAO[0]!;
const analogias = PRESETS_EXPLICACAO[1]!;

describe("presets do perfil", () => {
  it("aplica, detecta e remove sem duplicar", () => {
    expect(aplicarPreset("", direto)).toBe(direto.texto);
    const dois = aplicarPreset(aplicarPreset("gosto de exemplos", direto), analogias);
    expect(dois).toBe(`gosto de exemplos\n${direto.texto}\n${analogias.texto}`);
    expect(aplicarPreset(dois, direto)).toBe(dois);
    expect(presetAtivo(dois, direto)).toBe(true);
    expect(presetAtivo("nada", direto)).toBe(false);
    expect(removerPreset(dois, direto)).toBe(`gosto de exemplos\n${analogias.texto}`);
    expect(removerPreset(direto.texto, direto)).toBe("");
  });
});

describe("data da prova", () => {
  const hoje = new Date(2026, 10, 9, 15, 30);
  it("conta dias inteiros ignorando a hora", () => {
    expect(diasAteProva("2026-11-09", hoje)).toBe(0);
    expect(diasAteProva("2026-11-10", hoje)).toBe(1);
    expect(diasAteProva("2026-11-21", hoje)).toBe(12);
    expect(diasAteProva("2026-11-06", hoje)).toBe(-3);
    expect(diasAteProva(null, hoje)).toBeNull();
    expect(diasAteProva("21/11/2026", hoje)).toBeNull();
    expect(diasAteProva("2026-13-45", hoje)).toBeNull();
  });
  it("descreve o prazo", () => {
    expect(descreverPrazo(0)).toBe("é hoje");
    expect(descreverPrazo(1)).toBe("é amanhã");
    expect(descreverPrazo(12)).toBe("faltam 12 dias");
    expect(descreverPrazo(-1)).toBe("foi ontem");
    expect(descreverPrazo(-3)).toBe("foi há 3 dias");
  });
});

describe("normalizarMeta", () => {
  it("aceita inteiros entre 300 e 1000", () => {
    expect(normalizarMeta(700.4)).toBe(700);
    expect(normalizarMeta(300)).toBe(300);
    expect(normalizarMeta(1000)).toBe(1000);
    expect(normalizarMeta(299)).toBeNull();
    expect(normalizarMeta(1001)).toBeNull();
    expect(normalizarMeta(Number.NaN)).toBeNull();
  });
});
