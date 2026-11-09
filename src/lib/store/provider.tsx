"use client";

import * as React from "react";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import type { StudentStore } from "./tipos";
import { persistenciaIndexedDB } from "./indexeddb";
import { AVISO_SEM_ARMAZENAMENTO, criarStoreNavegador, indexedDBDisponivel } from "./navegador";

interface Contexto {
  store: StudentStore;
  estado: EstadoAluno | null;
  erro: string | null;
  /** Aviso não bloqueante (ex.: IndexedDB indisponível, progresso só em memória). */
  aviso: string | null;
  /** Lê, aplica e grava; devolve o novo estado. */
  atualizar: (fn: (estado: EstadoAluno) => EstadoAluno) => Promise<EstadoAluno>;
  recarregar: () => Promise<void>;
}

const StoreContexto = React.createContext<Contexto | null>(null);

// Aviso fora do React: o fallback pode cair antes do primeiro render terminar.
let avisoAtual: string | null = null;
const ouvintesAviso = new Set<() => void>();
function definirAviso(texto: string | null) {
  avisoAtual = texto;
  for (const o of ouvintesAviso) o();
}
function assinarAviso(cb: () => void) {
  ouvintesAviso.add(cb);
  return () => {
    ouvintesAviso.delete(cb);
  };
}

function criarStorePadrao(): StudentStore {
  return criarStoreNavegador({
    principal: persistenciaIndexedDB(),
    disponivel: indexedDBDisponivel(),
    aoCair: () => definirAviso(AVISO_SEM_ARMAZENAMENTO),
  });
}

/**
 * Disponibiliza o StudentStore (IndexedDB no navegador, memória se ele falhar)
 * e o estado atual para a árvore. O estado é null enquanto carrega.
 */
export function StoreProvider({ children, store: storeExterno }: { children: React.ReactNode; store?: StudentStore }) {
  const [store] = React.useState<StudentStore>(() => storeExterno ?? criarStorePadrao());
  const [estado, setEstado] = React.useState<EstadoAluno | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const aviso = React.useSyncExternalStore(assinarAviso, () => avisoAtual, () => null);

  const recarregar = React.useCallback(async () => {
    try {
      setEstado(await store.ler());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler seus dados.");
    }
  }, [store]);

  React.useEffect(() => {
    let ativo = true;
    store
      .ler()
      .then((e) => {
        if (ativo) {
          setEstado(e);
          setErro(null);
        }
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível ler seus dados.");
      });
    const cancelar = store.assinar(setEstado);
    return () => {
      ativo = false;
      cancelar();
    };
  }, [store]);

  const atualizar = React.useCallback((fn: (estado: EstadoAluno) => EstadoAluno) => store.atualizar(fn), [store]);

  const valor = React.useMemo(() => ({ store, estado, erro, aviso, atualizar, recarregar }), [store, estado, erro, aviso, atualizar, recarregar]);
  return <StoreContexto.Provider value={valor}>{children}</StoreContexto.Provider>;
}

export function useStore(): Contexto {
  const ctx = React.useContext(StoreContexto);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>.");
  return ctx;
}
