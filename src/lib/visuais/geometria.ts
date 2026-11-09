export function areaRetangulo(base: number, altura: number): number {
  return base * altura;
}

export function perimetroRetangulo(base: number, altura: number): number {
  return 2 * (base + altura);
}

/** Células (linha, coluna) preenchidas até o passo `k` (preenche linha a linha). */
export function celulasPreenchidas(base: number, altura: number, k: number): number {
  return Math.min(base * altura, Math.max(0, k));
}
