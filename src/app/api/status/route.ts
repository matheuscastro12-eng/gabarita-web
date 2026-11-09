import { connection } from "next/server";
import { configuracaoTutor, statusPublico } from "@/lib/tutor/config";
import { TUTOR_VISIVEL } from "@/lib/tutor/visivel";

/**
 * Diz se o tutor de IA está configurado (booleano). Nunca devolve valores de chave.
 * `connection()` garante leitura do ambiente a cada requisição (nada fica pré-renderizado).
 * Com a interface oculta, responde sempre desligado, sem consultar chaves.
 */
export async function GET(): Promise<Response> {
  await connection();
  if (!TUTOR_VISIVEL) {
    return Response.json(
      { ia: false, provedor: null, modelo: null },
      { headers: { "cache-control": "no-store" } },
    );
  }
  return Response.json(statusPublico(configuracaoTutor(process.env)), {
    headers: { "cache-control": "no-store" },
  });
}
