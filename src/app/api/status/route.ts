import { connection } from "next/server";
import { configuracaoTutor, statusPublico } from "@/lib/tutor/config";

/**
 * Diz se o tutor de IA está configurado (booleano). Nunca devolve valores de chave.
 * `connection()` garante leitura do ambiente a cada requisição (nada fica pré-renderizado).
 */
export async function GET(): Promise<Response> {
  await connection();
  return Response.json(statusPublico(configuracaoTutor(process.env)), {
    headers: { "cache-control": "no-store" },
  });
}
