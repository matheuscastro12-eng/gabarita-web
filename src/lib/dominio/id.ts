/** Geração de IDs. */

/** Função que gera um ID a partir de um prefixo (ex.: "tentativa" → "tentativa-…"). */
export type GeradorId = (prefixo: string) => string;

/** Fonte da parte aleatória do ID. */
export type FonteId = () => string;

let contadorFallback = 0;

/** Fallback quando não há `crypto.randomUUID` (contexto inseguro ou ambiente antigo). */
export function fonteFallback(): string {
  contadorFallback += 1;
  const aleatorio = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${contadorFallback.toString(36)}-${aleatorio}`;
}

/** Fonte padrão: `crypto.randomUUID` quando existe, senão `fonteFallback`. */
export function fontePadrao(): string {
  const c = globalThis.crypto as Crypto | undefined;
  return typeof c?.randomUUID === "function" ? c.randomUUID() : fonteFallback();
}

/** Fonte determinística para testes: "000001", "000002", … */
export function criarFonteSequencial(inicio = 1): FonteId {
  let n = inicio - 1;
  return () => {
    n += 1;
    return String(n).padStart(6, "0");
  };
}

/** Gera `${prefixo}-${fonte()}`. */
export function gerarId(prefixo: string, fonte: FonteId = fontePadrao): string {
  return `${prefixo}-${fonte()}`;
}

/** Gerador de IDs determinístico para testes ("tentativa-000001", …). */
export function criarGeradorSequencial(inicio = 1): GeradorId {
  const fonte = criarFonteSequencial(inicio);
  return (prefixo) => gerarId(prefixo, fonte);
}
