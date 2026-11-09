/** Controle de um passo a passo: avançar/voltar presos ao intervalo [0, total-1]. */
export function proximoPasso(atual: number, total: number): number {
  return Math.min(total - 1, atual + 1);
}

export function passoAnterior(atual: number): number {
  return Math.max(0, atual - 1);
}

export function rotuloPasso(atual: number, total: number): string {
  return `Passo ${atual + 1} de ${total}`;
}
