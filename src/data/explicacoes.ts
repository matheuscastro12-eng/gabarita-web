/**
 * Explicações geradas por IA (app antigo do Matheus, tabela `explanation`) para as
 * questões oficiais. Matemática: `scripts/explicacoes/importar.py` (explicacoes-ia.json);
 * natureza: `scripts/natureza/importar.py` (explicacoes-ia-natureza.json). Um arquivo por
 * área, carregado só quando a primeira resolução daquela área é aberta.
 * `divergente` = a IA discordou do gabarito oficial na geração (o oficial vale).
 */
import { areaDoId } from "./carregar";

export interface ExplicacaoIA {
  texto: string;
  divergente: boolean;
  modelo: string | null;
}

let cache: Promise<Record<string, ExplicacaoIA>> | undefined;
let cacheNatureza: Promise<Record<string, ExplicacaoIA>> | undefined;

/** Carrega o arquivo de matemática (≈ 750 KB) só quando a primeira resolução é aberta. */
export function carregarExplicacoes(): Promise<Record<string, ExplicacaoIA>> {
  cache ??= import("./explicacoes-ia.json").then((m) => m.default as Record<string, ExplicacaoIA>);
  return cache;
}

/** Explicações de natureza (≈ 780 KB), carregadas à parte. */
export function carregarExplicacoesNatureza(): Promise<Record<string, ExplicacaoIA>> {
  cacheNatureza ??= import("./explicacoes-ia-natureza.json").then((m) => m.default as Record<string, ExplicacaoIA>);
  return cacheNatureza;
}

export async function carregarExplicacao(id: string): Promise<ExplicacaoIA | undefined> {
  const arquivo = areaDoId(id) === "natureza" ? carregarExplicacoesNatureza() : carregarExplicacoes();
  return (await arquivo)[id];
}
