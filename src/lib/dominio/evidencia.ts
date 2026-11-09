/**
 * Evidência e atualização do domínio por habilidade (seção 6 do BRAINSTORM).
 */
import { novoCartao, notaPorEvidencia, revisarCartao } from "./revisao";
import type { DegrauDica, EstadoHabilidade, Habilidade, OrigemItem, Tentativa } from "./tipos";

export const DOMINIO_INICIAL = 0.3;
export const TAXA_APRENDIZADO = 0.25;
export const PESO_OFICIAL = 1;
export const PESO_GEMEA = 0.6;
export const FATOR_CHUTE = 0.5;
export const FRACAO_TEMPO_CHUTE = 0.25;
export const BONUS_ACERTO_DIFICIL = 1.2;
export const BONUS_ERRO_FACIL = 1.3;
/** "Muito mais fácil que θ": b < θ − 1 (o mesmo limiar do critério de prova). */
export const MARGEM_MUITO_FACIL = 1;
/** Mediana padrão (s) quando ainda não há tentativas. */
export const MEDIANA_PADRAO = 90;

export interface DadosEvidencia {
  acertou: boolean;
  degrauMaximo: DegrauDica;
  pediuResposta: boolean;
}

/** Tabela da seção 6: errou 0; sem dica 1; degrau 1 → 0,8; degrau 2 → 0,5; degrau 3–4 ou pediu a resposta → 0,1. */
export function calcularEvidencia({ acertou, degrauMaximo, pediuResposta }: DadosEvidencia): number {
  if (!acertou) return 0;
  if (pediuResposta || degrauMaximo >= 3) return 0.1;
  if (degrauMaximo === 2) return 0.5;
  if (degrauMaximo === 1) return 0.8;
  return 1;
}

/** Acerto em menos de 25% do tempo mediano é chute suspeito. Sem mediana válida → false. */
export function detectarChute({
  acertou,
  segundos,
  medianaSegundos,
}: {
  acertou: boolean;
  segundos: number;
  medianaSegundos: number | null;
}): boolean {
  if (!acertou || medianaSegundos == null || medianaSegundos <= 0) return false;
  return segundos < FRACAO_TEMPO_CHUTE * medianaSegundos;
}

/** Mediana dos segundos de todas as tentativas; `padrao` se não houver nenhuma. */
export function medianaSegundos(tentativas: Tentativa[], padrao = MEDIANA_PADRAO): number {
  if (tentativas.length === 0) return padrao;
  const s = tentativas.map((t) => t.segundos).sort((x, y) => x - y);
  const meio = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[meio]! : (s[meio - 1]! + s[meio]!) / 2;
}

/**
 * Peso w: 1 (oficial) ou 0,6 (gêmea); ×1,2 se acertou item com b > θ;
 * ×1,3 se errou item com b < θ − 1. Sem b (gêmeas) ou sem θ: sem bônus.
 */
export function pesoTentativa({
  origem,
  acertou,
  b,
  theta,
}: {
  origem: OrigemItem;
  acertou: boolean;
  b: number | null;
  theta: number | null;
}): number {
  const base = origem === "oficial" ? PESO_OFICIAL : PESO_GEMEA;
  if (b == null || theta == null) return base;
  if (acertou && b > theta) return base * BONUS_ACERTO_DIFICIL;
  if (!acertou && b < theta - MARGEM_MUITO_FACIL) return base * BONUS_ERRO_FACIL;
  return base;
}

/** m ← m + 0,25·w·(e − m), limitado a [0, 1]. */
export function atualizarDominio(m: number, e: number, w: number): number {
  const novo = m + TAXA_APRENDIZADO * w * (e - m);
  return Math.min(1, Math.max(0, novo));
}

export function novoEstadoHabilidade(habilidade: Habilidade, agora: Date): EstadoHabilidade {
  return {
    habilidade,
    dominio: DOMINIO_INICIAL,
    itensOficiais: 0,
    itensGemeos: 0,
    acertos: 0,
    cartao: novoCartao(agora),
    atualizadoEm: null,
  };
}

export interface DadosTentativa extends DadosEvidencia {
  origem: OrigemItem;
  segundos: number;
  medianaSegundos: number | null;
  b: number | null;
  theta: number | null;
}

export function aplicarTentativa(
  estado: EstadoHabilidade,
  dados: DadosTentativa,
  agora: Date,
): { estado: EstadoHabilidade; evidencia: number; peso: number; chuteSuspeito: boolean } {
  const chuteSuspeito = detectarChute(dados);
  const bruta = calcularEvidencia(dados);
  const evidencia = chuteSuspeito ? bruta * FATOR_CHUTE : bruta;
  const peso = pesoTentativa(dados);
  const oficial = dados.origem === "oficial";
  return {
    estado: {
      ...estado,
      dominio: atualizarDominio(estado.dominio, evidencia, peso),
      itensOficiais: estado.itensOficiais + (oficial ? 1 : 0),
      itensGemeos: estado.itensGemeos + (oficial ? 0 : 1),
      acertos: estado.acertos + (dados.acertou ? 1 : 0),
      cartao: revisarCartao(estado.cartao, notaPorEvidencia(evidencia), agora),
      atualizadoEm: agora.toISOString(),
    },
    evidencia,
    peso,
    chuteSuspeito,
  };
}
