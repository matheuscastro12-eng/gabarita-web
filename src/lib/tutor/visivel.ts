/**
 * Liga a interface do tutor de IA (painel, atalhos, ajustes e textos).
 *
 * Desligada por padrão, para o site público. O código do tutor continua no
 * repositório. Para religar, defina NEXT_PUBLIC_TUTOR_VISIVEL=1 (ou true, on, sim)
 * e faça um novo build: o Next embute NEXT_PUBLIC_ na compilação.
 *
 * A comparação fica escrita direto em `process.env.NEXT_PUBLIC_TUTOR_VISIVEL`
 * para o bundler apagar a interface do pacote do navegador quando está desligada.
 */
export function interpretarTutorVisivel(valor: string | undefined): boolean {
  return valor === "1" || valor === "true" || valor === "on" || valor === "sim";
}

export const TUTOR_VISIVEL =
  process.env.NEXT_PUBLIC_TUTOR_VISIVEL === "1" ||
  process.env.NEXT_PUBLIC_TUTOR_VISIVEL === "true" ||
  process.env.NEXT_PUBLIC_TUTOR_VISIVEL === "on" ||
  process.env.NEXT_PUBLIC_TUTOR_VISIVEL === "sim";
