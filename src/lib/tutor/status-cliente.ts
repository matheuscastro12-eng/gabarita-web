"use client";

/** Lê /api/status uma vez por aba e expõe se o tutor de IA está ligado. */
import * as React from "react";

export interface StatusIA {
  /** null enquanto carrega. */
  ia: boolean | null;
  provedor: "anthropic" | "gateway" | "claude-local" | null;
  modelo: string | null;
}

/**
 * Site público sem tutor: com NEXT_PUBLIC_SEM_TUTOR=1 (definido só na Vercel) o painel do tutor,
 * o "Tirar dúvida" e o card do tutor nos Ajustes não aparecem. O app do Mac e o dev não definem.
 */
export const TUTOR_OCULTO = process.env.NEXT_PUBLIC_SEM_TUTOR === "1";

const INICIAL: StatusIA = { ia: null, provedor: null, modelo: null };
let atual: StatusIA = INICIAL;
let promessa: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function definir(novo: StatusIA) {
  atual = novo;
  for (const o of ouvintes) o();
}

/** Busca o status (idempotente). Falha de rede conta como IA desligada. */
export function carregarStatusIA(): Promise<void> {
  promessa ??= fetch("/api/status", { cache: "no-store" })
    .then(async (r) => {
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { ia: boolean; provedor: StatusIA["provedor"]; modelo: string };
      definir({ ia: Boolean(j.ia), provedor: j.provedor ?? null, modelo: j.modelo ?? null });
    })
    .catch(() => definir({ ia: false, provedor: null, modelo: null }));
  return promessa;
}

/** Força o modo guiado nesta aba (quando a rota devolve 503 missing_key no meio do uso). */
export function marcarIADesligada() {
  definir({ ...atual, ia: false });
}

function assinar(cb: () => void) {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

export function useStatusIA(): StatusIA {
  const status = React.useSyncExternalStore(assinar, () => atual, () => INICIAL);
  React.useEffect(() => {
    void carregarStatusIA();
  }, []);
  return status;
}
