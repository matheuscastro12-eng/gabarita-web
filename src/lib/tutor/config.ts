/**
 * Configuração do tutor de IA a partir do ambiente. Puro: recebe o `env`
 * como objeto, nunca lê `process.env` direto (testável) e nunca devolve a chave.
 */

export const MODELO_PADRAO = "claude-sonnet-5-5";
export type Esforco = "low" | "medium" | "high";
export const ESFORCO_PADRAO: Esforco = "low";

export type Provedor = "anthropic" | "gateway";

export interface ConfiguracaoTutor {
  /** null quando nenhuma chave está definida (modo guiado offline). */
  provedor: Provedor | null;
  modelo: string;
  esforco: Esforco;
}

type Env = Record<string, string | undefined>;

function limpar(valor: string | undefined): string {
  return (valor ?? "").trim();
}

/** Lê ANTHROPIC_API_KEY (prioridade), AI_GATEWAY_API_KEY, TUTOR_MODEL e TUTOR_EFFORT. */
export function configuracaoTutor(env: Env): ConfiguracaoTutor {
  const modelo = limpar(env.TUTOR_MODEL) || MODELO_PADRAO;
  const esforcoBruto = limpar(env.TUTOR_EFFORT);
  const esforco: Esforco =
    esforcoBruto === "low" || esforcoBruto === "medium" || esforcoBruto === "high" ? esforcoBruto : ESFORCO_PADRAO;
  if (limpar(env.ANTHROPIC_API_KEY)) return { provedor: "anthropic", modelo, esforco };
  if (limpar(env.AI_GATEWAY_API_KEY)) return { provedor: "gateway", modelo, esforco };
  return { provedor: null, modelo, esforco };
}

/** Id do modelo para o AI Gateway: precisa do prefixo do provedor. */
export function modeloGateway(modelo: string): string {
  return modelo.includes("/") ? modelo : `anthropic/${modelo}`;
}

/** Resposta pública de /api/status: nunca inclui valores de chave. */
export function statusPublico(config: ConfiguracaoTutor): { ia: boolean; provedor: Provedor | null; modelo: string } {
  return { ia: config.provedor !== null, provedor: config.provedor, modelo: config.modelo };
}
