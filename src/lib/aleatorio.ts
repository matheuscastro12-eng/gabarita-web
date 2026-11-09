/**
 * Gerador pseudoaleatório determinístico (mulberry32). Mesma semente, mesma
 * sequência: usado pelas questões gêmeas e pela verificação numérica.
 */
export interface Aleatorio {
  /** Número em [0, 1). */
  proximo(): number;
  /** Inteiro em [min, max], inclusive. */
  inteiro(min: number, max: number): number;
  /** Elemento aleatório de uma lista não vazia. */
  escolher<T>(lista: readonly T[]): T;
  /** Cópia embaralhada (Fisher–Yates). */
  embaralhar<T>(lista: readonly T[]): T[];
}

/** Semente a partir de um texto (FNV-1a 32 bits). */
export function sementeDeTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function criarAleatorio(semente: number): Aleatorio {
  let a = semente >>> 0;
  const proximo = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    proximo,
    inteiro(min, max) {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      return lo + Math.floor(proximo() * (hi - lo + 1));
    },
    escolher(lista) {
      if (lista.length === 0) throw new Error("Lista vazia.");
      return lista[Math.floor(proximo() * lista.length)] as (typeof lista)[number];
    },
    embaralhar(lista) {
      const copia = [...lista];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(proximo() * (i + 1));
        [copia[i], copia[j]] = [copia[j] as (typeof lista)[number], copia[i] as (typeof lista)[number]];
      }
      return copia;
    },
  };
}
