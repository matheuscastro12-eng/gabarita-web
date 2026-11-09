import { describe, expect, it } from "vitest";
import { criarAleatorio, sementeDeTexto } from "./aleatorio";

describe("aleatorio", () => {
  it("é determinístico para a mesma semente", () => {
    const a = criarAleatorio(42);
    const b = criarAleatorio(42);
    const sa = Array.from({ length: 5 }, () => a.proximo());
    const sb = Array.from({ length: 5 }, () => b.proximo());
    expect(sa).toEqual(sb);
    expect(sa.every((x) => x >= 0 && x < 1)).toBe(true);
  });
  it("inteiro fica no intervalo inclusive (mesmo com min > max)", () => {
    const r = criarAleatorio(7);
    for (let i = 0; i < 200; i++) {
      const n = r.inteiro(3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
    expect(r.inteiro(9, 9)).toBe(9);
    expect([1, 2]).toContain(r.inteiro(2, 1));
  });
  it("escolher e embaralhar", () => {
    const r = criarAleatorio(1);
    expect(["a", "b"]).toContain(r.escolher(["a", "b"]));
    expect(() => r.escolher([])).toThrow();
    const e = r.embaralhar([1, 2, 3, 4, 5]);
    expect([...e].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(r.embaralhar([])).toEqual([]);
  });
  it("sementeDeTexto é estável e distinta", () => {
    expect(sementeDeTexto("abc")).toBe(sementeDeTexto("abc"));
    expect(sementeDeTexto("abc")).not.toBe(sementeDeTexto("abd"));
  });
});
