/** Store no IndexedDB do navegador (idb-keyval), validado com zod na leitura. */
import { createStore, get, set, type UseStore } from "idb-keyval";
import { criarStoreBase } from "./base";
import { estadoAlunoSchema } from "./schema";
import type { StudentStore } from "./tipos";

export const CHAVE_PADRAO = "estado-v1";
export const CHAVE_CORROMPIDO = "estado-corrompido";

export function criarStoreIndexedDB(
  opcoes: { chave?: string; agora?: () => Date } = {},
): StudentStore {
  const { chave = CHAVE_PADRAO, agora = () => new Date() } = opcoes;
  // Criado sob demanda: no servidor (SSR) não existe indexedDB.
  let banco: UseStore | undefined;
  const obterBanco = (): UseStore => (banco ??= createStore("gabarita", "estado"));

  return criarStoreBase(
    {
      async carregar() {
        const bruto: unknown = await get(chave, obterBanco());
        if (bruto === undefined) return undefined;
        const r = estadoAlunoSchema.safeParse(bruto);
        if (r.success) return r.data;
        // Inválido: guarda o que veio para não perder nada e volta ao estado inicial.
        await set(CHAVE_CORROMPIDO, bruto, obterBanco());
        return undefined;
      },
      salvar: (estado) => set(chave, estado, obterBanco()),
    },
    agora,
  );
}
