/** Validação em runtime do EstadoAluno (dados do IndexedDB e de backups). */
import { z } from "zod";
import { State } from "ts-fsrs";
import { LETRAS } from "@/data/tipos";
import type {
  CartaoSerializado,
  EntradaCaderno,
  EstadoAluno,
  EstadoHabilidade,
  Habilidade,
  Perfil,
  Simulado,
  Sprint,
  Tentativa,
} from "@/lib/dominio/tipos";

const isoSchema = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "data inválida");

export const habilidadeSchema = z.custom<Habilidade>(
  (v) => typeof v === "string" && /^H([1-9]|[12][0-9]|30)$/.test(v),
  "habilidade inválida",
);
const letraSchema = z.enum(LETRAS);
const degrauSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const origemSchema = z.enum(["oficial", "gemea"]);

export const cartaoSchema: z.ZodType<CartaoSerializado> = z.object({
  due: isoSchema,
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: z.enum(State),
  last_review: isoSchema.nullable(),
});

export const tentativaSchema: z.ZodType<Tentativa> = z.object({
  id: z.string(),
  questaoId: z.string(),
  habilidade: habilidadeSchema,
  origem: origemSchema,
  escolha: letraSchema.nullable(),
  gabarito: letraSchema,
  acertou: z.boolean(),
  segundos: z.number().min(0),
  degrauMaximo: degrauSchema,
  pediuResposta: z.boolean(),
  b: z.number().nullable(),
  thetaAntes: z.number().nullable(),
  chuteSuspeito: z.boolean(),
  evidencia: z.number(),
  peso: z.number(),
  dominioAntes: z.number(),
  dominioDepois: z.number(),
  em: isoSchema,
  sprintId: z.string().nullable(),
});

export const estadoHabilidadeSchema: z.ZodType<EstadoHabilidade> = z.object({
  habilidade: habilidadeSchema,
  dominio: z.number().min(0).max(1),
  itensOficiais: z.number().int().min(0),
  itensGemeos: z.number().int().min(0),
  acertos: z.number().int().min(0),
  cartao: cartaoSchema,
  atualizadoEm: isoSchema.nullable(),
});

export const entradaCadernoSchema: z.ZodType<EntradaCaderno> = z.object({
  id: z.string(),
  tentativaId: z.string(),
  questaoId: z.string(),
  habilidade: habilidadeSchema,
  escolha: letraSchema.nullable(),
  gabarito: letraSchema,
  porQue: z.string().nullable(),
  em: isoSchema,
  resolvidaEm: isoSchema.nullable(),
});

export const sprintSchema: z.ZodType<Sprint> = z.object({
  id: z.string(),
  iniciadoEm: isoSchema,
  terminadoEm: isoSchema.nullable(),
  questaoIds: z.array(z.string()),
  tentativaIds: z.array(z.string()),
});

export const simuladoSchema: z.ZodType<Simulado> = z.object({
  id: z.string(),
  tipo: z.enum(["faceis-15", "completo-45"]),
  iniciadoEm: isoSchema,
  terminadoEm: isoSchema,
  total: z.number().int().min(0),
  acertos: z.number().int().min(0),
  maiorTempoItem: z.number().min(0),
  tentativaIds: z.array(z.string()),
});

export const perfilSchema: z.ZodType<Perfil> = z.object({
  nome: z.string(),
  dataProva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  metaNota: z.number(),
  explicaDoMeuJeito: z.string(),
  habilidadesDaSemana: z.array(habilidadeSchema),
  mostrarTimer: z.boolean(),
});

export const estadoAlunoSchema: z.ZodType<EstadoAluno> = z.object({
  versao: z.literal(1),
  criadoEm: isoSchema,
  atualizadoEm: isoSchema,
  perfil: perfilSchema,
  habilidades: z.record(z.string(), estadoHabilidadeSchema),
  tentativas: z.array(tentativaSchema),
  caderno: z.array(entradaCadernoSchema),
  sprints: z.array(sprintSchema),
  simulados: z.array(simuladoSchema),
});
