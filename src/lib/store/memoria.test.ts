import { describe, expect, it, vi } from "vitest";
import { criarStoreMemoria } from "./memoria";

const t0 = new Date(2026, 10, 9, 10);
const t1 = new Date(2026, 10, 9, 11);

describe("criarStoreMemoria", () => {
  it("cria o estado inicial na primeira leitura e devolve cópias", async () => {
    const store = criarStoreMemoria(() => t0);
    const e = await store.ler();
    expect(e.criadoEm).toBe(t0.toISOString());
    e.perfil.nome = "mexido";
    expect((await store.ler()).perfil.nome).toBe("Matheus");
  });

  it("gravar atualiza atualizadoEm e notifica; cancelar assinatura funciona", async () => {
    let agora = t0;
    const store = criarStoreMemoria(() => agora);
    const ouvinte = vi.fn();
    const cancelar = store.assinar(ouvinte);
    const e = await store.ler();
    agora = t1;
    const g = await store.gravar({ ...e, perfil: { ...e.perfil, metaNota: 750 } });
    expect(g.atualizadoEm).toBe(t1.toISOString());
    expect(ouvinte).toHaveBeenCalledTimes(1);
    cancelar();
    await store.gravar(g);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect((await store.ler()).perfil.metaNota).toBe(750);
  });

  it("atualizar é serializado (sem corrida)", async () => {
    const store = criarStoreMemoria(() => t0);
    const soma = (e: Awaited<ReturnType<typeof store.ler>>) => ({
      ...e,
      perfil: { ...e.perfil, metaNota: e.perfil.metaNota + 1 },
    });
    await Promise.all(Array.from({ length: 10 }, () => store.atualizar(soma)));
    expect((await store.ler()).perfil.metaNota).toBe(710);
  });

  it("erro numa operação não trava a fila", async () => {
    const store = criarStoreMemoria(() => t0);
    await expect(
      store.atualizar(() => {
        throw new Error("falhou");
      }),
    ).rejects.toThrow("falhou");
    expect((await store.ler()).versao).toBe(1);
  });

  it("limpar volta ao inicial e notifica", async () => {
    const store = criarStoreMemoria(() => t0);
    const ouvinte = vi.fn();
    store.assinar(ouvinte);
    await store.atualizar((e) => ({ ...e, perfil: { ...e.perfil, nome: "Outro" } }));
    const limpo = await store.limpar();
    expect(limpo.perfil.nome).toBe("Matheus");
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });

  it("usa new Date por padrão", async () => {
    const e = await criarStoreMemoria().ler();
    expect(Number.isNaN(Date.parse(e.criadoEm))).toBe(false);
  });
});
