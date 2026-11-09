/** Quantos quadradinhos de um grid de 100 ficam pintados para `p`% (0 a 100, inteiro). */
export function quadradosPintados(p: number): number {
  return Math.round(Math.min(100, Math.max(0, p)));
}

/** `p`% de `valor`. */
export function porcentagemDe(p: number, valor: number): number {
  return arredondar((p / 100) * valor);
}

/** Fator multiplicativo de um aumento (+) ou desconto (−) de `p`%: 1 + p/100. */
export function fator(p: number): number {
  return arredondar(1 + p / 100, 6);
}

/** Valor depois de aplicar uma lista de variações percentuais em sequência. */
export function aplicarVariacoes(valor: number, variacoes: number[]): number {
  return arredondar(variacoes.reduce((v, p) => v * fator(p), valor));
}

/** Variação percentual total equivalente a uma sequência (ex.: +10% e −10% = −1%). */
export function variacaoEquivalente(variacoes: number[]): number {
  return arredondar((variacoes.reduce((f, p) => f * fator(p), 1) - 1) * 100);
}

export function arredondar(x: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round((x + Number.EPSILON) * f) / f;
}
