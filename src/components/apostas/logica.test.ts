import { describe, expect, it } from "vitest";
import apostas from "@/data/apostas-2026.json";
import type { Questao } from "@/data/tipos";
import { corrigirSimulado } from "./logica";

const qs = (apostas as unknown as Questao[]).slice(0, 4);

describe("corrigirSimulado", () => {
  it("conta acertos, brancos e por área", () => {
    const escolhas = [qs[0]!.gabarito, null, qs[2]!.gabarito === "A" ? "B" : "A", qs[3]!.gabarito] as const;
    const c = corrigirSimulado(qs, [...escolhas]);
    expect(c.total).toBe(4);
    expect(c.acertos).toBe(2);
    expect(c.emBranco).toBe(1);
    expect(Object.values(c.porArea).reduce((a, b) => a + b.total, 0)).toBe(4);
  });
});
