import { configuracaoTutor, statusPublico } from "@/lib/tutor/config";

/** Diz se o tutor de IA está configurado (booleano). Nunca devolve valores de chave. */
export async function GET(): Promise<Response> {
  return Response.json(statusPublico(configuracaoTutor(process.env)), {
    headers: { "cache-control": "no-store" },
  });
}
