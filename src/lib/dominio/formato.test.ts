import { describe, expect, it } from "vitest";
import { dataLocal, formatarDecimal, plural, truncar } from "./formato";

describe("formato", () => {
  it("formata com vírgula decimal", () => {
    expect(formatarDecimal(0.625)).toBe("0,63");
    expect(formatarDecimal(12.5, 1)).toBe("12,5");
    expect(formatarDecimal(3, 0)).toBe("3");
  });
  it("trunca sem arredondar e tolera erro de ponto flutuante", () => {
    expect(truncar(0.849)).toBe(0.84);
    expect(truncar(0.29)).toBe(0.29);
    expect(truncar(1.23456, 3)).toBe(1.234);
  });
  it("plural", () => {
    expect(plural(1, "item", "itens")).toBe("1 item");
    expect(plural(3, "item", "itens")).toBe("3 itens");
  });
  it("data local YYYY-MM-DD", () => {
    expect(dataLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(dataLocal(new Date(2026, 10, 19))).toBe("2026-11-19");
  });
});
