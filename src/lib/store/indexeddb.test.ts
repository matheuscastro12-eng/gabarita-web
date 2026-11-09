import "fake-indexeddb/auto";
import { createStore, get, set } from "idb-keyval";
import { describe, expect, it } from "vitest";
import { CHAVE_CORROMPIDO, CHAVE_PADRAO, criarStoreIndexedDB } from "./indexeddb";

const t0 = new Date(2026, 10, 9, 10);
const banco = createStore("gabarita", "estado");

describe("criarStoreIndexedDB", () => {
  it("cria, grava e relê pelo IndexedDB", async () => {
    const store = criarStoreIndexedDB({ chave: "teste-1", agora: () => t0 });
    const e = await store.ler();
    expect(e.criadoEm).toBe(t0.toISOString());
    await store.gravar({ ...e, perfil: { ...e.perfil, metaNota: 780 } });
    const outra = criarStoreIndexedDB({ chave: "teste-1" });
    expect((await outra.ler()).perfil.metaNota).toBe(780);
    expect(((await get("teste-1", banco)) as { perfil: { metaNota: number } }).perfil.metaNota).toBe(780);
  });

  it("estado inválido: guarda em estado-corrompido e volta ao inicial", async () => {
    const lixo = { versao: 99, qualquer: "coisa" };
    await set("teste-2", lixo, banco);
    const store = criarStoreIndexedDB({ chave: "teste-2", agora: () => t0 });
    const e = await store.ler();
    expect(e.versao).toBe(1);
    expect(e.tentativas).toEqual([]);
    expect(await get(CHAVE_CORROMPIDO, banco)).toEqual(lixo);
    expect(((await get("teste-2", banco)) as { versao: number }).versao).toBe(1);
  });

  it("chave padrão", async () => {
    const store = criarStoreIndexedDB();
    await store.limpar();
    expect(await get(CHAVE_PADRAO, banco)).toBeDefined();
  });
});
