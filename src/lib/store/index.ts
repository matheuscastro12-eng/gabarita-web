/** API pública da persistência. */
export type { Ouvinte, StudentStore } from "./tipos";
export * from "./schema";
export { criarStoreBase, type Persistencia } from "./base";
export { criarStoreMemoria } from "./memoria";
export { criarStoreIndexedDB, CHAVE_PADRAO, CHAVE_CORROMPIDO } from "./indexeddb";
export * from "./backup";
