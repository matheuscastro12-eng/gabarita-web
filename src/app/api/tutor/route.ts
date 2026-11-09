import { carregarQuestao } from "@/data/carregar";
import { responderTutor } from "@/lib/tutor/servidor";
import { TUTOR_VISIVEL } from "@/lib/tutor/visivel";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  if (!TUTOR_VISIVEL) {
    return Response.json({ codigo: "disabled" }, { status: 404 });
  }
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ codigo: "invalid_body", mensagem: "JSON inválido." }, { status: 400 });
  }
  return responderTutor({ corpo, env: process.env, buscarQuestao: carregarQuestao });
}
