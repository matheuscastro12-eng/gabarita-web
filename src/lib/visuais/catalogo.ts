/** Os visuais de "Aprender o básico" e como eles se ligam às questões (por assunto e habilidade). */
export type IdVisual = "porcentagem" | "proporcao" | "fracoes" | "graficos" | "estatistica" | "unidades" | "area" | "probabilidade";

export interface InfoVisual {
  id: IdVisual;
  titulo: string;
  resumo: string;
  /** Slugs de assunto (src/data/taxonomia.ts) que abrem este visual. */
  assuntos: string[];
}

export const VISUAIS: InfoVisual[] = [
  { id: "porcentagem", titulo: "Porcentagem, aumento e desconto", resumo: "100 quadradinhos e o fator multiplicativo.", assuntos: ["porcentagem", "matematica-financeira"] },
  { id: "proporcao", titulo: "Regra de três e proporção", resumo: "Duas barras que crescem juntas.", assuntos: ["regra-de-tres", "razao-proporcao"] },
  { id: "fracoes", titulo: "Frações", resumo: "Uma barra que se divide em partes iguais.", assuntos: ["numeros-operacoes"] },
  { id: "graficos", titulo: "Leitura de gráficos e tabelas", resumo: "Do topo da barra até o eixo.", assuntos: ["graficos-tabelas", "leitura-grafico-funcao"] },
  { id: "estatistica", titulo: "Média, moda e mediana", resumo: "Pontos na reta que se ordenam.", assuntos: ["estatistica-basica"] },
  { id: "unidades", titulo: "Escala e unidades", resumo: "A escada do metro e a escala do mapa.", assuntos: ["grandezas-unidades-escalas"] },
  { id: "area", titulo: "Área e perímetro", resumo: "Uma grade que se preenche.", assuntos: ["geometria-plana"] },
  { id: "probabilidade", titulo: "Probabilidade simples", resumo: "Favoráveis sobre possíveis, numa urna.", assuntos: ["probabilidade"] },
];

const porAssunto = new Map<string, IdVisual>(VISUAIS.flatMap((v) => v.assuntos.map((a) => [a, v.id] as const)));

/** Primeiro visual que serve para a questão, pela ordem dos assuntos dela. */
export function visualParaAssuntos(assuntos: readonly string[]): IdVisual | null {
  for (const a of assuntos) {
    const v = porAssunto.get(a);
    if (v) return v;
  }
  return null;
}

export function infoVisual(id: IdVisual): InfoVisual {
  return VISUAIS.find((v) => v.id === id)!;
}
