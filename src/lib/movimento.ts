/** Curva do sistema, cubic-bezier(.2,0,0,1), aproximada por ease-out exponencial suave. */
export function suavizar(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

/** Valor do contador no instante `t` (0 a 1) entre `de` e `para`, arredondado a `casas`. */
export function interpolarContador(de: number, para: number, t: number, casas = 0): number {
  const v = de + (para - de) * suavizar(t);
  const f = 10 ** casas;
  return t >= 1 ? para : Math.round(v * f) / f;
}

/** Extrai a parte numérica de um texto de stat ("12", "640", "—"). `null` se não for número. */
export function numeroDoTexto(texto: string): number | null {
  return /^-?\d+$/.test(texto.trim()) ? Number(texto) : null;
}
