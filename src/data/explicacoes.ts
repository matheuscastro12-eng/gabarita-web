/**
 * Explicações geradas por IA (app antigo do Matheus, tabela `explanation`) para as
 * questões oficiais de matemática. Gerado por `scripts/explicacoes/importar.py`.
 * `divergente` = a IA discordou do gabarito oficial na geração (o oficial vale).
 */
export interface ExplicacaoIA {
  texto: string;
  divergente: boolean;
  modelo: string | null;
}

let cache: Promise<Record<string, ExplicacaoIA>> | undefined;

/** Carrega o arquivo (≈ 750 KB) só quando a primeira resolução é aberta. */
export function carregarExplicacoes(): Promise<Record<string, ExplicacaoIA>> {
  cache ??= import("./explicacoes-ia.json").then((m) => m.default as Record<string, ExplicacaoIA>);
  return cache;
}

export async function carregarExplicacao(id: string): Promise<ExplicacaoIA | undefined> {
  return (await carregarExplicacoes())[id];
}
