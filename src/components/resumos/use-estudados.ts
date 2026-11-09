"use client";

import * as React from "react";
import { alternarEstudado, CHAVE_ESTUDADOS, lerEstudados } from "@/lib/resumos/logica";

const ouvintes = new Set<() => void>();
let cacheBruto: string | null | undefined;
let cacheLista: string[] = [];

function ler(): string[] {
  const bruto = window.localStorage.getItem(CHAVE_ESTUDADOS);
  if (bruto !== cacheBruto) {
    cacheBruto = bruto;
    cacheLista = lerEstudados(bruto);
  }
  return cacheLista;
}

function assinar(aviso: () => void) {
  ouvintes.add(aviso);
  const porStorage = (e: StorageEvent) => {
    if (e.key === CHAVE_ESTUDADOS) aviso();
  };
  window.addEventListener("storage", porStorage);
  return () => {
    ouvintes.delete(aviso);
    window.removeEventListener("storage", porStorage);
  };
}

const VAZIO: string[] = [];

/** Resumos marcados como "estudado", salvos no localStorage deste navegador. */
export function useEstudados() {
  const estudados = React.useSyncExternalStore(assinar, ler, () => VAZIO);
  const alternar = React.useCallback((id: string) => {
    window.localStorage.setItem(CHAVE_ESTUDADOS, JSON.stringify(alternarEstudado(ler(), id)));
    ouvintes.forEach((f) => f());
  }, []);
  return { estudados, alternar };
}
