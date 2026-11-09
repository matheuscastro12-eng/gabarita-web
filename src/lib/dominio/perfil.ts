/** Perfil "explica do meu jeito", data da prova e meta de nota (tela Ajustes). */
import { MS_POR_DIA } from "./formato";

export interface PresetExplicacao {
  id: "direto" | "analogias" | "passo-a-passo";
  rotulo: string;
  /** Texto que vai para o prompt do tutor. */
  texto: string;
}

export const PRESETS_EXPLICACAO: PresetExplicacao[] = [
  {
    id: "direto",
    rotulo: "Direto ao ponto",
    texto: "Vá direto ao ponto: diga o que fazer agora, sem introdução nem repetir o enunciado. Uma ideia por mensagem.",
  },
  {
    id: "analogias",
    rotulo: "Com analogias",
    texto: "Explique com uma analogia do dia a dia antes da conta (dinheiro, receita, trajeto). Depois mostre como a analogia vira a conta.",
  },
  {
    id: "passo-a-passo",
    rotulo: "Passo a passo",
    texto: "Explique em passos numerados bem pequenos, um de cada vez, e espere eu confirmar cada passo antes de seguir.",
  },
];

/** Acrescenta o texto do preset ao perfil, sem duplicar se já estiver lá. */
export function aplicarPreset(atual: string, preset: PresetExplicacao): string {
  const base = atual.trim();
  if (base.includes(preset.texto)) return base;
  return base ? `${base}\n${preset.texto}` : preset.texto;
}

/** true quando o texto do perfil já contém o preset. */
export function presetAtivo(atual: string, preset: PresetExplicacao): boolean {
  return atual.includes(preset.texto);
}

/** Remove o texto do preset (e linhas vazias sobrando). */
export function removerPreset(atual: string, preset: PresetExplicacao): string {
  return atual
    .split("\n")
    .filter((linha) => linha.trim() !== preset.texto)
    .join("\n")
    .trim();
}

/** Dias inteiros até a prova (negativo se já passou); null sem data ou data inválida. */
export function diasAteProva(dataProva: string | null, agora: Date): number | null {
  if (!dataProva || !/^\d{4}-\d{2}-\d{2}$/.test(dataProva)) return null;
  const [a, m, d] = dataProva.split("-").map(Number) as [number, number, number];
  const prova = new Date(a, m - 1, d);
  // new Date(2026, 12, 45) "transborda" para outra data válida: exige mês e dia iguais.
  if (prova.getMonth() !== m - 1 || prova.getDate() !== d) return null;
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((prova.getTime() - hoje.getTime()) / MS_POR_DIA);
}

/** "faltam 12 dias" / "é amanhã" / "é hoje" / "foi há 3 dias". */
export function descreverPrazo(dias: number): string {
  if (dias === 0) return "é hoje";
  if (dias === 1) return "é amanhã";
  if (dias > 1) return `faltam ${dias} dias`;
  if (dias === -1) return "foi ontem";
  return `foi há ${-dias} dias`;
}

export const META_NOTA_MIN = 300;
export const META_NOTA_MAX = 1000;

/** Meta de nota válida: inteiro entre 300 e 1000. */
export function normalizarMeta(valor: number): number | null {
  if (!Number.isFinite(valor)) return null;
  const n = Math.round(valor);
  if (n < META_NOTA_MIN || n > META_NOTA_MAX) return null;
  return n;
}
