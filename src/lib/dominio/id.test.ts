import { afterEach, describe, expect, it, vi } from "vitest";
import {
  criarFonteSequencial,
  criarGeradorSequencial,
  fonteFallback,
  fontePadrao,
  gerarId,
} from "./id";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gerarId", () => {
  it("usa crypto.randomUUID quando existe", () => {
    const id = gerarId("tentativa");
    expect(id).toMatch(/^tentativa-[0-9a-f-]{36}$/);
  });
  it("cai no fallback sem crypto.randomUUID", () => {
    vi.stubGlobal("crypto", undefined);
    const a = fontePadrao();
    const b = fontePadrao();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-z]+-[0-9a-z]+-[0-9a-z]*$/);
  });
  it("fallback gera IDs distintos", () => {
    expect(fonteFallback()).not.toBe(fonteFallback());
  });
  it("aceita fonte injetada e gerador sequencial determinístico", () => {
    const fonte = criarFonteSequencial();
    expect(gerarId("x", fonte)).toBe("x-000001");
    expect(gerarId("x", fonte)).toBe("x-000002");
    const ger = criarGeradorSequencial(10);
    expect(ger("sprint")).toBe("sprint-000010");
    expect(ger("tentativa")).toBe("tentativa-000011");
  });
});
