/** Lógica comum dos stores: fila de operações serializada, estado inicial e ouvintes. */
import { estadoInicial } from "@/lib/dominio/estado";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import type { Ouvinte, StudentStore } from "./tipos";

export interface Persistencia {
  /** Devolve o estado salvo, ou undefined se não houver (ou se estiver inválido). */
  carregar(): Promise<EstadoAluno | undefined>;
  salvar(estado: EstadoAluno): Promise<void>;
}

export function criarStoreBase(p: Persistencia, agora: () => Date): StudentStore {
  const ouvintes = new Set<Ouvinte>();
  let fila: Promise<unknown> = Promise.resolve();

  function enfileirar<T>(op: () => Promise<T>): Promise<T> {
    const resultado = fila.then(op);
    fila = resultado.catch(() => undefined);
    return resultado;
  }

  function notificar(estado: EstadoAluno): void {
    for (const o of ouvintes) o(estado);
  }

  async function lerInterno(): Promise<EstadoAluno> {
    const salvo = await p.carregar();
    if (salvo) return salvo;
    const novo = estadoInicial(agora());
    await p.salvar(novo);
    return novo;
  }

  async function gravarInterno(estado: EstadoAluno): Promise<EstadoAluno> {
    const gravado = { ...estado, atualizadoEm: agora().toISOString() };
    await p.salvar(gravado);
    notificar(gravado);
    return gravado;
  }

  return {
    ler: () => enfileirar(lerInterno),
    gravar: (estado) => enfileirar(() => gravarInterno(estado)),
    atualizar: (fn) => enfileirar(async () => gravarInterno(fn(await lerInterno()))),
    limpar: () =>
      enfileirar(async () => {
        const novo = estadoInicial(agora());
        await p.salvar(novo);
        notificar(novo);
        return novo;
      }),
    assinar(ouvinte) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}
