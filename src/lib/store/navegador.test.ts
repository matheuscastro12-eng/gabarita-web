import { describe, expect, it, vi } from "vitest";
import { estadoInicial } from "@/lib/dominio/estado";
import type { Persistencia } from "./base";
import { AVISO_SEM_ARMAZENAMENTO, criarStoreNavegador, indexedDBDisponivel, persistenciaComFallback } from "./navegador";

const t0 = new Date(2026, 10, 9, 10);

function memoria(): Persistencia & { dados: () => unknown } {
  let salvo: unknown;
  return {
    dados: () => salvo,
    carregar: async () => salvo as never,
    salvar: async (e) => {
      salvo = e;
    },
  };
}

describe("indexedDBDisponivel", () => {
  it("true quando existe, false quando não existe ou o acesso lança", () => {
    expect(indexedDBDisponivel({ indexedDB: {} })).toBe(true);
    expect(indexedDBDisponivel({})).toBe(false);
    expect(indexedDBDisponivel({ indexedDB: null })).toBe(false);
    const hostil = {} as { indexedDB?: unknown };
    Object.defineProperty(hostil, "indexedDB", {
      get() {
        throw new Error("SecurityError");
      },
    });
    expect(indexedDBDisponivel(hostil)).toBe(false);
  });

  it("usa o globalThis por padrão", () => {
    expect(typeof indexedDBDisponivel()).toBe("boolean");
  });
});

describe("persistenciaComFallback", () => {
  it("usa a principal quando ela funciona", async () => {
    const principal = memoria();
    const aoCair = vi.fn();
    const store = criarStoreNavegador({ principal, aoCair, agora: () => t0 });
    const e = await store.ler();
    await store.gravar({ ...e, perfil: { ...e.perfil, metaNota: 810 } });
    expect((principal.dados() as { perfil: { metaNota: number } }).perfil.metaNota).toBe(810);
    expect(aoCair).not.toHaveBeenCalled();
  });

  it("falha ao carregar: cai para a memória, avisa uma vez e segue gravando", async () => {
    const principal: Persistencia = {
      carregar: async () => {
        throw new Error("QuotaExceededError");
      },
      salvar: async () => {
        throw new Error("não deveria chegar aqui");
      },
    };
    const aoCair = vi.fn();
    const store = criarStoreNavegador({ principal, aoCair, agora: () => t0 });
    const e = await store.ler();
    expect(e.tentativas).toEqual([]);
    const g = await store.atualizar((x) => ({ ...x, perfil: { ...x.perfil, nome: "Teste" } }));
    expect(g.perfil.nome).toBe("Teste");
    expect((await store.ler()).perfil.nome).toBe("Teste");
    expect(aoCair).toHaveBeenCalledTimes(1);
    expect(aoCair.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect((aoCair.mock.calls[0]?.[0] as Error).message).toBe("QuotaExceededError");
  });

  it("falha ao salvar: leva o estado que ia gravar para a memória", async () => {
    const principal: Persistencia = {
      carregar: async () => undefined,
      salvar: async () => {
        throw "disco cheio";
      },
    };
    const aoCair = vi.fn();
    const p = persistenciaComFallback({ principal, aoCair });
    expect(p.caiu()).toBe(false);
    const estado = estadoInicial(t0, { nome: "Memória" });
    await p.salvar(estado);
    expect(p.caiu()).toBe(true);
    expect((aoCair.mock.calls[0]?.[0] as Error).message).toBe("disco cheio");
    const lido = await p.carregar();
    expect(lido?.perfil.nome).toBe("Memória");
    expect(lido).not.toBe(estado);
    // Depois de cair, grava só em memória e não chama o aviso de novo.
    await p.salvar({ ...estado, perfil: { ...estado.perfil, nome: "Depois" } });
    expect((await p.carregar())?.perfil.nome).toBe("Depois");
    expect(aoCair).toHaveBeenCalledTimes(1);
  });

  it("disponivel=false: começa já em memória e avisa", async () => {
    const principal = memoria();
    const aoCair = vi.fn();
    const store = criarStoreNavegador({ principal, aoCair, disponivel: false, agora: () => t0 });
    expect(aoCair).toHaveBeenCalledTimes(1);
    await store.ler();
    expect(principal.dados()).toBeUndefined();
    const sem = persistenciaComFallback({ principal, disponivel: false });
    expect(await sem.carregar()).toBeUndefined();
  });

  it("sem aoCair e sem agora: cai em silêncio e usa a data atual", async () => {
    const principal: Persistencia = {
      carregar: async () => {
        throw new Error("falhou");
      },
      salvar: async () => undefined,
    };
    const store = criarStoreNavegador({ principal });
    const e = await store.ler();
    expect(Math.abs(Date.parse(e.criadoEm) - Date.now())).toBeLessThan(5_000);
    const p = persistenciaComFallback({ principal: { carregar: async () => undefined, salvar: async () => { throw new Error("x"); } } });
    await p.salvar(e);
    expect(p.caiu()).toBe(true);
  });

  it("aviso em pt-BR aponta para o backup", () => {
    expect(AVISO_SEM_ARMAZENAMENTO).toMatch(/backup/);
  });
});
