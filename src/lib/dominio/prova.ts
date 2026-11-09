/**
 * Simulados longos (referência: SimuladoView.swift do app antigo): prova completa do 2º dia
 * (CN + MT na ordem oficial, 5h), bloco de 45 de uma área (2h15) e blocos menores por assunto
 * (matemática) ou competência (natureza). Folha de respostas livre, correção só no fim.
 * Algumas provas têm menos de 45 de uma área (faltam questões na fonte): vale o número real.
 */
import { z } from "zod";
import { LETRAS, type Area, type Letra, type Questao } from "@/data/tipos";
import { criarAleatorio, sementeDeTexto } from "@/lib/aleatorio";
import { estimarTheta, notaEstimada } from "./tri";
import type { IntervaloNota, TipoSimulado } from "./tipos";

export const ANOS_PROVA = Array.from({ length: 15 }, (_, i) => 2009 + i);
/** 2º dia: 5h (CN + MT). */
export const SEGUNDOS_DIA2 = 5 * 3600;
/** Bloco de 45 de uma área: 2h15 (metade do dia de 4h30 sem redação). */
export const SEGUNDOS_BLOCO_45 = 2 * 3600 + 15 * 60;
export const TAMANHO_BLOCO = 45;
/** Bloco por assunto: até 10 questões, 3 min cada. */
export const TAMANHO_BLOCO_ASSUNTO = 10;
export const SEGUNDOS_POR_ITEM_ASSUNTO = 180;

const porOrdem = (x: Questao, y: Questao) => x.ano - y.ano || x.numero - y.numero;

/** Prova do 2º dia de um ano: natureza e depois matemática, na ordem oficial (caderno azul). */
export function montarProvaDia2(questoes: readonly Questao[], ano: number): Questao[] {
  const doAno = questoes.filter((q) => q.ano === ano);
  const cn = doAno.filter((q) => q.area === "natureza").sort(porOrdem);
  const mt = doAno.filter((q) => q.area === "matematica").sort(porOrdem);
  return [...cn, ...mt];
}

/**
 * Bloco de 45 de uma área: de um ano (ordem oficial) ou com anos misturados (sorteio com
 * semente, inéditas primeiro, depois na ordem de ano e número para ficar com cara de prova).
 */
export function montarBloco45({
  questoes,
  area,
  ano,
  tentadas = new Set<string>(),
  semente = "bloco",
}: {
  questoes: readonly Questao[];
  area: Area;
  ano: number | null;
  tentadas?: ReadonlySet<string>;
  semente?: string;
}): Questao[] {
  const daArea = questoes.filter((q) => q.area === area && !q.anulada);
  if (ano !== null) return questoes.filter((q) => q.area === area && q.ano === ano).sort(porOrdem);
  const rng = criarAleatorio(sementeDeTexto(semente));
  const ineditas = rng.embaralhar(daArea.filter((q) => !tentadas.has(q.id)));
  const feitas = rng.embaralhar(daArea.filter((q) => tentadas.has(q.id)));
  return [...ineditas, ...feitas].slice(0, TAMANHO_BLOCO).sort(porOrdem);
}

/** Opções de bloco menor: assuntos (matemática) ou competências (natureza) com questões. */
export interface OpcaoAssunto {
  chave: string;
  nome: string;
  total: number;
}

export function montarBlocoAssunto({
  questoes,
  area,
  chave,
  tentadas = new Set<string>(),
  semente = "assunto",
  tamanho = TAMANHO_BLOCO_ASSUNTO,
}: {
  questoes: readonly Questao[];
  area: Area;
  /** Slug do assunto (matemática) ou id da competência, ex. "C6" (natureza). */
  chave: string;
  tentadas?: ReadonlySet<string>;
  semente?: string;
  tamanho?: number;
}): Questao[] {
  const alvo = questoes.filter(
    (q) => q.area === area && !q.anulada && (area === "natureza" ? q.competencia === chave : q.assuntos.includes(chave)),
  );
  const rng = criarAleatorio(sementeDeTexto(`${semente}:${chave}`));
  const ineditas = rng.embaralhar(alvo.filter((q) => !tentadas.has(q.id)));
  const feitas = rng.embaralhar(alvo.filter((q) => tentadas.has(q.id)));
  return [...ineditas, ...feitas].slice(0, tamanho).sort(porOrdem);
}

export interface CorrecaoArea {
  area: Area;
  acertos: number;
  total: number;
  respondidas: number;
  /** Nota estimada só com os itens deste simulado (null se nenhum tem TRI). */
  nota: IntervaloNota | null;
}

/** Correção: acertos por área e nota TRI estimada por área (em branco conta como erro, como no ENEM). */
export function corrigirProva(questoes: readonly Questao[], escolhas: readonly (Letra | null)[]): CorrecaoArea[] {
  const areas = [...new Set(questoes.map((q) => q.area))];
  return areas.map((area) => {
    let acertos = 0;
    let total = 0;
    let respondidas = 0;
    const respostas: { a: number; b: number; c: number; acertou: boolean }[] = [];
    questoes.forEach((q, i) => {
      if (q.area !== area) return;
      total++;
      const e = escolhas[i] ?? null;
      if (e) respondidas++;
      const acertou = !q.anulada && e === q.gabarito;
      if (acertou) acertos++;
      if (q.tri && !q.anulada) respostas.push({ a: q.tri.a, b: q.tri.b, c: q.tri.c, acertou });
    });
    const est = estimarTheta(respostas);
    return { area, acertos, total, respondidas, nota: est.itens > 0 ? notaEstimada(est.theta, est.erroPadrao, est.itens) : null };
  });
}

/* --------------------------- progresso salvo --------------------------- */

export const CHAVE_ANDAMENTO = "gabarita:simulado-em-andamento";

const andamentoSchema = z.object({
  versao: z.literal(1),
  tipo: z.enum(["completo-45", "prova-dia2", "assunto"]),
  titulo: z.string(),
  areas: z.array(z.enum(["matematica", "natureza", "humanas", "linguagens"])),
  ano: z.number().int().nullable(),
  questaoIds: z.array(z.string()).min(1),
  escolhas: z.array(z.enum(LETRAS).nullable()),
  indice: z.number().int().min(0),
  iniciadoEm: z.string(),
  duracaoSegundos: z.number().int().positive(),
  /** Segundos já usados (o relógio para enquanto a aba está fechada). */
  usadosSegundos: z.number().min(0),
});
export type Andamento = z.infer<typeof andamentoSchema> & { tipo: Exclude<TipoSimulado, "faceis-15"> };

export function serializarAndamento(a: Andamento): string {
  return JSON.stringify(a);
}

/** Lê o andamento salvo; null se não houver ou se estiver corrompido. */
export function lerAndamento(texto: string | null): Andamento | null {
  if (!texto) return null;
  try {
    const r = andamentoSchema.safeParse(JSON.parse(texto));
    if (!r.success || r.data.escolhas.length !== r.data.questaoIds.length) return null;
    return { ...r.data, indice: Math.min(r.data.indice, r.data.questaoIds.length - 1) };
  } catch {
    return null;
  }
}

export function novoAndamento({
  tipo,
  titulo,
  questoes,
  ano,
  duracaoSegundos,
  agora,
}: {
  tipo: Andamento["tipo"];
  titulo: string;
  questoes: readonly Questao[];
  ano: number | null;
  duracaoSegundos: number;
  agora: Date;
}): Andamento {
  return {
    versao: 1,
    tipo,
    titulo,
    areas: [...new Set(questoes.map((q) => q.area))],
    ano,
    questaoIds: questoes.map((q) => q.id),
    escolhas: questoes.map(() => null),
    indice: 0,
    iniciadoEm: agora.toISOString(),
    duracaoSegundos,
    usadosSegundos: 0,
  };
}

export function restanteSegundos(a: Andamento): number {
  return Math.max(0, Math.round(a.duracaoSegundos - a.usadosSegundos));
}
