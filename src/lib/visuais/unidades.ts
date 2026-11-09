import { arredondar } from "./porcentagem";

/** Escada do metro: cada degrau para a direita multiplica por 10. */
export const ESCADA_METRO = ["km", "hm", "dam", "m", "dm", "cm", "mm"] as const;
export type UnidadeMetro = (typeof ESCADA_METRO)[number];

/** Degraus entre duas unidades (positivo = descer a escada, multiplica por 10 a cada degrau). */
export function degraus(de: UnidadeMetro, para: UnidadeMetro): number {
  return ESCADA_METRO.indexOf(para) - ESCADA_METRO.indexOf(de);
}

export function converter(valor: number, de: UnidadeMetro, para: UnidadeMetro): number {
  return arredondar(valor * 10 ** degraus(de, para), 6);
}

/** Escala 1:E — `mapaCm` centímetros no mapa viram quantos km reais. */
export function escalaParaKm(mapaCm: number, denominador: number): number {
  return converter(mapaCm * denominador, "cm", "km");
}

/** Área: cada degrau da escada vale ×100 (m² → cm² = ×10 000). */
export function converterArea(valor: number, de: UnidadeMetro, para: UnidadeMetro): number {
  return arredondar(valor * 100 ** degraus(de, para), 6);
}
