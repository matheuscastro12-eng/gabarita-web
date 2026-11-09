import type { EstadoAluno } from "@/lib/dominio/tipos";

export type Ouvinte = (estado: EstadoAluno) => void;

/**
 * Persistência do estado do aluno. Um único documento (`EstadoAluno`) por
 * usuário; a v1 não tem login nem servidor. Implementações: IndexedDB
 * (navegador) e memória (testes). Trocar por Supabase depois é só
 * implementar esta interface.
 */
export interface StudentStore {
  /** Lê o estado; cria o inicial se não existir. */
  ler(): Promise<EstadoAluno>;
  /** Grava o estado inteiro (atualiza `atualizadoEm`). */
  gravar(estado: EstadoAluno): Promise<EstadoAluno>;
  /** Lê, aplica a função e grava, de forma serializada (sem corrida). */
  atualizar(fn: (estado: EstadoAluno) => EstadoAluno): Promise<EstadoAluno>;
  /** Apaga tudo e volta ao estado inicial. */
  limpar(): Promise<EstadoAluno>;
  /** Observa mudanças gravadas por esta instância. Devolve a função de cancelar. */
  assinar(ouvinte: Ouvinte): () => void;
}
