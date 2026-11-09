/** Store em memória (testes e SSR). Guarda cópias para isolar o chamador. */
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { criarStoreBase } from "./base";
import type { StudentStore } from "./tipos";

export function criarStoreMemoria(agora: () => Date = () => new Date()): StudentStore {
  let salvo: EstadoAluno | undefined;
  return criarStoreBase(
    {
      carregar: async () => (salvo ? structuredClone(salvo) : undefined),
      salvar: async (estado) => {
        salvo = structuredClone(estado);
      },
    },
    agora,
  );
}
