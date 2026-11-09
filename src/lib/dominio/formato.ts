/** Formatação para textos de interface em pt-BR. */

/** Número com vírgula decimal e `casas` casas (arredondado). Ex.: 0.625 → "0,63". */
export function formatarDecimal(n: number, casas = 2): string {
  return n.toFixed(casas).replace(".", ",");
}

/**
 * Trunca (não arredonda) para `casas` casas. Usado em mensagens de meta, para
 * que 0,849 não apareça como "0,85" ao lado de "meta 0,85".
 */
export function truncar(n: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.floor(n * fator + 1e-9) / fator;
}

/** "1 item" / "3 itens". */
export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Data local no formato YYYY-MM-DD (fuso do aparelho). */
export function dataLocal(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export const MS_POR_DIA = 24 * 60 * 60 * 1000;
