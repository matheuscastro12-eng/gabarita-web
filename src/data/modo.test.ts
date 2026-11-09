import { describe, expect, it } from "vitest";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { carregarQuestoes } from "./carregar";
import { aplicarModo, B_MAX_PADRAO, configModo, entraNoModoFaceis, limiarFacilDoModo, MODO } from "./modo";

const q = (n: number, extra: Parameters<typeof questaoFake>[0] = {}) => questaoFake({ id: `enem-2023-${n}`, ...extra });

describe("configModo", () => {
  it("desligado sem variáveis (padrão de produção)", () => {
    expect(configModo({})).toEqual({ soFaceis: false, bMax: B_MAX_PADRAO });
    expect(B_MAX_PADRAO).toBe(0.5);
  });

  it("liga só com NEXT_PUBLIC_MODO=faceis (sem diferenciar maiúsculas e espaços)", () => {
    expect(configModo({ NEXT_PUBLIC_MODO: "faceis" }).soFaceis).toBe(true);
    expect(configModo({ NEXT_PUBLIC_MODO: " FACEIS " }).soFaceis).toBe(true);
    for (const v of ["", "1", "true", "facil", "dificeis"]) {
      expect(configModo({ NEXT_PUBLIC_MODO: v }).soFaceis).toBe(false);
    }
  });

  it("lê NEXT_PUBLIC_FACEIS_B_MAX e cai no padrão quando é inválido", () => {
    expect(configModo({ NEXT_PUBLIC_FACEIS_B_MAX: "0.2" }).bMax).toBe(0.2);
    expect(configModo({ NEXT_PUBLIC_FACEIS_B_MAX: "-1" }).bMax).toBe(-1);
    expect(configModo({ NEXT_PUBLIC_FACEIS_B_MAX: "0,8" }).bMax).toBe(0.8);
    for (const v of [undefined, "", "  ", "abc", "Infinity", "NaN", "1.2.3"]) {
      expect(configModo({ NEXT_PUBLIC_FACEIS_B_MAX: v }).bMax).toBe(B_MAX_PADRAO);
    }
  });

  it("os testes rodam com o modo desligado (MODO derivado do ambiente)", () => {
    expect(MODO.soFaceis).toBe(process.env.NEXT_PUBLIC_MODO?.trim().toLowerCase() === "faceis");
  });
});

describe("filtro do modo fáceis", () => {
  const lista = [
    q(1, { tri: { a: 1, b: -1, c: 0.2 }, dificuldade_estimada: "facil" }),
    q(2, { tri: { a: 1, b: 0.49, c: 0.2 }, dificuldade_estimada: "media" }), // TRI manda
    q(3, { tri: { a: 1, b: 0.5, c: 0.2 }, dificuldade_estimada: "facil" }), // b = 0,5 não é fácil
    q(4, { tri: null, dificuldade_estimada: "facil" }),
    q(5, { tri: null, dificuldade_estimada: "media" }),
    q(6, { tri: null, dificuldade_estimada: null }),
    q(7, { tri: { a: 1, b: 0, c: 0.2 }, anulada: true }),
  ];

  it("com TRI usa tri.b < bMax; sem TRI usa dificuldade_estimada", () => {
    expect(entraNoModoFaceis(lista[0]!, 0.5)).toBe(true);
    expect(entraNoModoFaceis(lista[1]!, 0.5)).toBe(true);
    expect(entraNoModoFaceis(lista[2]!, 0.5)).toBe(false);
    expect(entraNoModoFaceis(lista[3]!, 0.5)).toBe(true);
    expect(entraNoModoFaceis(lista[4]!, 0.5)).toBe(false);
    expect(entraNoModoFaceis(lista[5]!, 0.5)).toBe(false);
  });

  it("desligado devolve a mesma lista", () => {
    expect(aplicarModo(lista, { soFaceis: false, bMax: 0.5 })).toBe(lista);
  });

  it("ligado filtra e mantém anuladas fáceis (o app já as trata adiante)", () => {
    const ids = aplicarModo(lista, { soFaceis: true, bMax: 0.5 }).map((x) => x.id);
    expect(ids).toEqual(["enem-2023-1", "enem-2023-2", "enem-2023-4", "enem-2023-7"]);
  });

  it("respeita outro bMax", () => {
    const ids = aplicarModo(lista, { soFaceis: true, bMax: 0 }).map((x) => x.id);
    expect(ids).toEqual(["enem-2023-1", "enem-2023-4"]);
  });

  it("aplicado ao banco real dá um pool não vazio só de fáceis", async () => {
    const todas = await carregarQuestoes();
    const pool = aplicarModo(todas, { soFaceis: true, bMax: 0.5 });
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.length).toBeLessThan(todas.length);
    expect(pool.every((x) => (x.tri ? x.tri.b < 0.5 : x.dificuldade_estimada === "facil"))).toBe(true);
  });
});

describe("limiarFacilDoModo", () => {
  it("desligado é o tercil do banco; ligado é o bMax", () => {
    expect(limiarFacilDoModo([3, 1, 2], { soFaceis: false, bMax: 0.5 })).toBe(1);
    expect(limiarFacilDoModo([], { soFaceis: false, bMax: 0.5 })).toBeNull();
    expect(limiarFacilDoModo([3, 1, 2], { soFaceis: true, bMax: 0.5 })).toBe(0.5);
  });
});
