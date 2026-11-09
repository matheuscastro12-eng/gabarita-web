/** Fábricas de dados para os testes do domínio (não usar em produção). */
import type { Questao } from "@/data/tipos";
import type { Tentativa } from "./tipos";

export function questaoFake(sobrescrever: Partial<Questao> = {}): Questao {
  return {
    id: "enem-2023-136",
    ano: 2023,
    dia: 2,
    caderno: "azul",
    numero: 136,
    area: "matematica",
    enunciado: "Enunciado",
    imagens: [],
    alternativas: (["A", "B", "C", "D", "E"] as const).map((letra) => ({ letra, texto: letra })),
    gabarito: "C",
    anulada: false,
    habilidade: "H16",
    competencia: "C4",
    assuntos: ["proporcao"],
    classificacao: "heuristica",
    tri: { a: 1.5, b: 0.5, c: 0.2 },
    dificuldade_estimada: "media",
    fonte: {
      orgao: "INEP",
      prova: "ENEM 2023",
      transcricao: "enem.dev",
      transcricao_url: "https://enem.dev",
    },
    ...sobrescrever,
  };
}

export function tentativaFake(sobrescrever: Partial<Tentativa> = {}): Tentativa {
  return {
    id: "tentativa-1",
    questaoId: "enem-2023-136",
    habilidade: "H16",
    origem: "oficial",
    escolha: "C",
    gabarito: "C",
    acertou: true,
    segundos: 90,
    degrauMaximo: 0,
    pediuResposta: false,
    b: 0.5,
    thetaAntes: null,
    chuteSuspeito: false,
    evidencia: 1,
    peso: 1,
    dominioAntes: 0.3,
    dominioDepois: 0.475,
    em: new Date(2026, 10, 9, 10).toISOString(),
    sprintId: null,
    ...sobrescrever,
  };
}
