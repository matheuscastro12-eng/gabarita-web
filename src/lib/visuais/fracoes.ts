export function mdc(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

/** Fração simplificada. */
export function simplificar(n: number, d: number): { n: number; d: number } {
  if (d === 0) throw new Error("denominador zero");
  const g = mdc(n, d);
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
}

/** Soma de frações já simplificada. */
export function somar(a: { n: number; d: number }, b: { n: number; d: number }): { n: number; d: number } {
  return simplificar(a.n * b.d + b.n * a.d, a.d * b.d);
}

/** Fração de uma quantidade: (n/d) de q. */
export function fracaoDe(n: number, d: number, q: number): number {
  return (n * q) / d;
}

/** Fatias de uma barra dividida em `d` partes, com as `n` primeiras pintadas. */
export function fatias(n: number, d: number): boolean[] {
  return Array.from({ length: d }, (_, i) => i < n);
}
