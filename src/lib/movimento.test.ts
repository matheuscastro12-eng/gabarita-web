import { describe, expect, it } from "vitest";
import { interpolarContador, numeroDoTexto, suavizar } from "./movimento";

describe("movimento", () => {
  it("suavizar vai de 0 a 1 e é monotônica", () => {
    expect(suavizar(0)).toBe(0);
    expect(suavizar(1)).toBe(1);
    expect(suavizar(-1)).toBe(0);
    expect(suavizar(0.5)).toBeGreaterThan(0.5);
  });
  it("contador chega exatamente ao alvo", () => {
    expect(interpolarContador(0, 640, 0)).toBe(0);
    expect(interpolarContador(0, 640, 1)).toBe(640);
    const meio = interpolarContador(0, 640, 0.5);
    expect(meio).toBeGreaterThan(320);
    expect(Number.isInteger(meio)).toBe(true);
    expect(interpolarContador(0, 1, 0.5, 2)).toBe(0.88);
  });
  it("só anima textos inteiros", () => {
    expect(numeroDoTexto("12")).toBe(12);
    expect(numeroDoTexto("—")).toBeNull();
    expect(numeroDoTexto("0,30")).toBeNull();
  });
});
