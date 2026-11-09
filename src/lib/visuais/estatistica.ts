import { arredondar } from "./porcentagem";

export function media(xs: number[]): number {
  if (xs.length === 0) throw new Error("lista vazia");
  return arredondar(xs.reduce((s, x) => s + x, 0) / xs.length);
}

export function ordenar(xs: number[]): number[] {
  return [...xs].sort((a, b) => a - b);
}

/** Mediana: valor do meio da lista ordenada; com quantidade par, média dos dois do meio. */
export function mediana(xs: number[]): number {
  if (xs.length === 0) throw new Error("lista vazia");
  const o = ordenar(xs);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m]! : arredondar((o[m - 1]! + o[m]!) / 2);
}

/** Índices (na lista ordenada) que formam a mediana: 1 se ímpar, 2 se par. */
export function indicesMediana(n: number): number[] {
  if (n <= 0) return [];
  const m = Math.floor(n / 2);
  return n % 2 ? [m] : [m - 1, m];
}

/** Moda(s): valores com a maior frequência. Lista vazia se todos aparecem igual número de vezes (amodal). */
export function moda(xs: number[]): number[] {
  const freq = new Map<number, number>();
  for (const x of xs) freq.set(x, (freq.get(x) ?? 0) + 1);
  const max = Math.max(...freq.values());
  if (freq.size > 1 && [...freq.values()].every((f) => f === max)) return [];
  return [...freq.entries()].filter(([, f]) => f === max).map(([v]) => v).sort((a, b) => a - b);
}

/**
 * Posição de cada valor original depois de ordenar (estável), para animar os pontos
 * "indo para o lugar": destino[i] = índice na lista ordenada do item i.
 */
export function destinoAoOrdenar(xs: number[]): number[] {
  const idx = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v || a.i - b.i);
  const destino = new Array<number>(xs.length);
  idx.forEach((item, pos) => {
    destino[item.i] = pos;
  });
  return destino;
}
