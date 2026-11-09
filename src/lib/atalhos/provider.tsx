"use client";

import * as React from "react";
import { RegistroAtalhos, type Atalho } from "./registro";

interface AtalhosContexto {
  registro: RegistroAtalhos;
}

const Contexto = React.createContext<AtalhosContexto | null>(null);
const LISTA_VAZIA: Atalho[] = [];

/** Instala o ouvinte global de teclado e expõe o registro de atalhos. */
export function AtalhosProvider({ children }: { children: React.ReactNode }) {
  const [registro] = React.useState(() => new RegistroAtalhos());

  React.useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.repeat) return;
      const executado = registro.despachar({
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        target: e.target,
      });
      if (executado) e.preventDefault();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [registro]);

  const valor = React.useMemo(() => ({ registro }), [registro]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

function useRegistro(): RegistroAtalhos {
  const ctx = React.useContext(Contexto);
  if (!ctx) throw new Error("useAtalho precisa estar dentro de <AtalhosProvider>.");
  return ctx.registro;
}

/**
 * Registra um atalho enquanto o componente estiver montado.
 * A ação mais recente é sempre a usada (sem precisar re-registrar).
 */
export function useAtalho(atalho: Atalho) {
  const registro = useRegistro();
  const acaoRef = React.useRef(atalho.acao);
  React.useEffect(() => {
    acaoRef.current = atalho.acao;
  });
  const { id, combinacao, descricao, grupo, emCampos, ativo } = atalho;

  React.useEffect(() => {
    return registro.registrar({
      id,
      combinacao,
      descricao,
      grupo,
      emCampos,
      ativo,
      acao: () => acaoRef.current(),
    });
  }, [registro, id, combinacao, descricao, grupo, emCampos, ativo]);
}

/** Lista reativa de todos os atalhos registrados (para a ajuda e a paleta). */
export function useListaAtalhos(): Atalho[] {
  const registro = useRegistro();
  const cache = React.useRef<{ versao: number; lista: Atalho[] }>({ versao: -1, lista: LISTA_VAZIA });
  const versaoRef = React.useRef(0);

  const assinar = React.useCallback(
    (cb: () => void) =>
      registro.assinar(() => {
        versaoRef.current += 1;
        cb();
      }),
    [registro],
  );
  const obter = React.useCallback(() => {
    if (cache.current.versao !== versaoRef.current) {
      cache.current = { versao: versaoRef.current, lista: registro.listar() };
    }
    return cache.current.lista;
  }, [registro]);

  return React.useSyncExternalStore(assinar, obter, () => LISTA_VAZIA);
}
