import { describe, expect, it } from "vitest";
import { interpretarTutorVisivel } from "./visivel";

describe("interpretarTutorVisivel", () => {
  it("fica desligado quando a variável não existe, está vazia ou não é exatamente um valor ligado", () => {
    expect(interpretarTutorVisivel(undefined)).toBe(false);
    expect(interpretarTutorVisivel("")).toBe(false);
    expect(interpretarTutorVisivel("   ")).toBe(false);
    expect(interpretarTutorVisivel("0")).toBe(false);
    expect(interpretarTutorVisivel("false")).toBe(false);
    expect(interpretarTutorVisivel("TRUE")).toBe(false);
    expect(interpretarTutorVisivel("nao")).toBe(false);
  });

  it("liga só com 1, true, on ou sim, exatamente", () => {
    expect(interpretarTutorVisivel("1")).toBe(true);
    expect(interpretarTutorVisivel("true")).toBe(true);
    expect(interpretarTutorVisivel("on")).toBe(true);
    expect(interpretarTutorVisivel("sim")).toBe(true);
  });
});
