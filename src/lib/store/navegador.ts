/**
 * Store do navegador com fallback: tenta o IndexedDB; se ele não existir ou
 * falhar (modo privado, cota, navegador antigo, erro de abertura), passa a
 * guardar em memória e avisa uma vez. O app continua funcionando; o
 * progresso só não sobrevive à aba.
 */
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { criarStoreBase, type Persistencia } from "./base";
import type { StudentStore } from "./tipos";

export interface OpcoesNavegador {
  /** Persistência principal (IndexedDB). Injetável para testes. */
  principal: Persistencia;
  /** Chamado uma única vez quando a principal falha e o fallback assume. */
  aoCair?: (erro: Error) => void;
  agora?: () => Date;
  /** `false` força o fallback de imediato (ex.: `indexedDB` indefinido). */
  disponivel?: boolean;
}

export const AVISO_SEM_ARMAZENAMENTO =
  "Seu navegador bloqueou o armazenamento local. O progresso desta sessão não será salvo ao fechar a aba: exporte um backup nos Ajustes.";

/** Diz se há IndexedDB utilizável neste ambiente. */
export function indexedDBDisponivel(global: { indexedDB?: unknown } = globalThis as { indexedDB?: unknown }): boolean {
  try {
    return typeof global.indexedDB !== "undefined" && global.indexedDB !== null;
  } catch {
    return false;
  }
}

function comoErro(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

/**
 * Persistência que começa na principal e, à primeira falha, muda para a
 * memória (levando o último estado conhecido) e chama `aoCair`.
 */
export function persistenciaComFallback(opcoes: OpcoesNavegador): Persistencia & { caiu: () => boolean } {
  const { principal, aoCair } = opcoes;
  let emMemoria: EstadoAluno | undefined;
  let caiu = opcoes.disponivel === false;
  if (caiu) aoCair?.(new Error("IndexedDB indisponível neste navegador."));

  // Só é chamada enquanto a principal ainda está em uso (ver carregar/salvar).
  const cair = (e: unknown, ultimo?: EstadoAluno) => {
    caiu = true;
    if (ultimo) emMemoria = structuredClone(ultimo);
    aoCair?.(comoErro(e));
  };

  return {
    caiu: () => caiu,
    async carregar() {
      if (caiu) return emMemoria ? structuredClone(emMemoria) : undefined;
      try {
        return await principal.carregar();
      } catch (e) {
        cair(e);
        return undefined;
      }
    },
    async salvar(estado) {
      if (!caiu) {
        try {
          await principal.salvar(estado);
          return;
        } catch (e) {
          cair(e, estado);
        }
      }
      emMemoria = structuredClone(estado);
    },
  };
}

export function criarStoreNavegador(opcoes: OpcoesNavegador): StudentStore {
  return criarStoreBase(persistenciaComFallback(opcoes), opcoes.agora ?? (() => new Date()));
}
