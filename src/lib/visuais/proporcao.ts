import { arredondar } from "./porcentagem";

/** Regra de três direta: a está para b assim como c está para x → x = b·c/a. */
export function regraDeTresDireta(a: number, b: number, c: number): number {
  if (a === 0) throw new Error("a não pode ser zero");
  return arredondar((b * c) / a);
}

/** Regra de três inversa: a·b = c·x → x = a·b/c. */
export function regraDeTresInversa(a: number, b: number, c: number): number {
  if (c === 0) throw new Error("c não pode ser zero");
  return arredondar((a * b) / c);
}

/** Valor unitário (quanto vale 1) e o total para `n` unidades. */
export function pelaUnidade(quantidade: number, total: number, n: number): { unitario: number; resultado: number } {
  const unitario = total / quantidade;
  return { unitario: arredondar(unitario), resultado: arredondar(unitario * n) };
}
