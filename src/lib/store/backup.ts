/** Exportar/importar backup JSON do estado do aluno. */
import { z } from "zod";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { estadoAlunoSchema } from "./schema";

export const APP_BACKUP = "gabarita";
export const VERSAO_BACKUP = 1;

export interface Backup {
  app: typeof APP_BACKUP;
  versao: typeof VERSAO_BACKUP;
  exportadoEm: string;
  estado: EstadoAluno;
}

export function exportarBackup(estado: EstadoAluno, agora: Date = new Date()): string {
  const backup: Backup = {
    app: APP_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm: agora.toISOString(),
    estado,
  };
  return JSON.stringify(backup, null, 2);
}

const envelopeSchema = z.object({ app: z.unknown(), versao: z.unknown(), estado: z.unknown() });

function invalido(motivo: string): never {
  throw new Error(`Backup inválido: ${motivo}`);
}

export function importarBackup(json: string): EstadoAluno {
  let dados: unknown;
  try {
    dados = JSON.parse(json);
  } catch {
    invalido("o arquivo não é um JSON válido.");
  }
  const envelope = envelopeSchema.safeParse(dados);
  if (!envelope.success) invalido("o arquivo não tem o formato de backup do Gabarita.");
  if (envelope.data.app !== APP_BACKUP) invalido("o arquivo não é um backup do Gabarita.");
  if (envelope.data.versao !== VERSAO_BACKUP) {
    invalido(`versão ${String(envelope.data.versao)} não suportada (esperada ${VERSAO_BACKUP}).`);
  }
  const r = estadoAlunoSchema.safeParse(envelope.data.estado);
  if (!r.success) {
    const campos = r.error.issues
      .slice(0, 3)
      .map((i) => (i.path.length ? `estado.${i.path.join(".")}` : "estado"));
    invalido(`campo com formato errado ou ausente: ${campos.join(", ")}.`);
  }
  return r.data;
}
