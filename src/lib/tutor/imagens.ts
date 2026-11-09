/**
 * Imagens da questão (enunciado e alternativas) para o tutor enxergar gráficos e
 * figuras. Baixadas no servidor e anexadas como base64 à primeira mensagem do
 * aluno: funciona na API da Anthropic, no AI Gateway e no claude-local (que não
 * aceita URL remota). Cache em memória por URL; falha numa imagem só a omite.
 */
import type { FilePart, ModelMessage } from "ai";
import type { Questao } from "@/data/tipos";

export const MAX_IMAGENS = 6;
const MAX_BYTES = 4_000_000;
const TIPOS = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export interface ImagemBaixada {
  url: string;
  mediaType: string;
  base64: string;
}

/** URLs das imagens, sem repetir: enunciado primeiro, depois alternativas. */
export function urlsImagens(questao: Questao): string[] {
  const todas = [...questao.imagens, ...questao.alternativas.map((a) => a.imagem ?? null)].filter((u): u is string => !!u);
  return [...new Set(todas)].slice(0, MAX_IMAGENS);
}

function tipoPorExtensao(url: string): string | null {
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return null;
}

const cache = new Map<string, Promise<ImagemBaixada | null>>();

export type Buscar = (url: string, init?: RequestInit) => Promise<Response>;

async function baixar(url: string, buscar: Buscar): Promise<ImagemBaixada | null> {
  try {
    const r = await buscar(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const cabecalho = (r.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
    const mediaType = TIPOS.has(cabecalho) ? cabecalho : tipoPorExtensao(url);
    if (!mediaType) return null;
    const bytes = Buffer.from(await r.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
    return { url, mediaType, base64: bytes.toString("base64") };
  } catch {
    return null;
  }
}

/** Baixa (com cache) as imagens da questão. */
export async function imagensDaQuestao(questao: Questao, buscar: Buscar = fetch): Promise<ImagemBaixada[]> {
  const urls = urlsImagens(questao);
  const res = await Promise.all(
    urls.map((u) => {
      let p = cache.get(u);
      if (!p) {
        p = baixar(u, buscar).then((img) => {
          if (!img) cache.delete(u); // tenta de novo na próxima
          return img;
        });
        cache.set(u, p);
      }
      return p;
    }),
  );
  return res.filter((i): i is ImagemBaixada => i !== null);
}

export function limparCacheImagens() {
  cache.clear();
}

/** Anexa as imagens ao começo da primeira mensagem do usuário (prefixo estável, bom para cache). */
export function anexarImagens(mensagens: ModelMessage[], imagens: ImagemBaixada[]): ModelMessage[] {
  if (imagens.length === 0) return mensagens;
  const i = mensagens.findIndex((m) => m.role === "user");
  if (i < 0) return mensagens;
  const m = mensagens[i] as Extract<ModelMessage, { role: "user" }>;
  const partes: FilePart[] = imagens.map((img) => ({ type: "file", mediaType: img.mediaType, data: img.base64 }));
  const conteudo = typeof m.content === "string" ? [{ type: "text" as const, text: m.content }] : m.content;
  const copia = [...mensagens];
  copia[i] = { ...m, content: [...partes, ...conteudo] };
  return copia;
}
