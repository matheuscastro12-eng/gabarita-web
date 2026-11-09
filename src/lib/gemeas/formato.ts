/** Formatação de números no estilo do ENEM (pt-BR). */

/** 115600 → "115 600"; 1250.5 → "1 250,5"; 0.25 → "0,25". */
export function numeroEnem(valor: number, casas = 2): string {
  const arredondado = Math.round(valor * 10 ** casas) / 10 ** casas;
  const negativo = arredondado < 0;
  const [inteira = "0", decimal] = String(Math.abs(arredondado)).split(".");
  const comEspaco = inteira.length > 4 ? inteira.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : inteira;
  return `${negativo ? "−" : ""}${comEspaco}${decimal ? `,${decimal}` : ""}`;
}

export function reais(valor: number): string {
  const v = Math.round(valor * 100) / 100;
  const [inteira = "0", dec = ""] = v.toFixed(2).split(".");
  const comPonto = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${comPonto},${dec}`;
}

export function mdc(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const resto = x % y;
    x = y;
    y = resto;
  }
  return x || 1;
}

/** Fração simplificada em LaTeX, ex.: $\frac{3}{20}$ (inteiro quando denominador 1). */
export function fracaoLatex(numerador: number, denominador: number): string {
  const d = mdc(numerador, denominador);
  const n = numerador / d;
  const m = denominador / d;
  if (m === 1) return `$${n}$`;
  return `$\\frac{${n}}{${m}}$`;
}

export function porcentagemTexto(valor: number): string {
  return `${numeroEnem(valor, 1)}%`;
}
