import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelMessage } from "ai";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { anexarImagens, imagensDaQuestao, limparCacheImagens, urlsImagens, MAX_IMAGENS } from "./imagens";

const png = (corpo = "abc", tipo = "image/png") =>
  new Response(new TextEncoder().encode(corpo), { status: 200, headers: { "content-type": tipo } });

const base = questaoFake({ id: "qi" });
const questao = {
  ...base,
  imagens: ["https://x.dev/a.png", "https://x.dev/b.jpg"],
  alternativas: base.alternativas.map((a, i) => ({ ...a, imagem: i === 0 ? "https://x.dev/alt.png" : i === 1 ? "https://x.dev/a.png" : null })),
};

beforeEach(() => limparCacheImagens());

describe("urlsImagens", () => {
  it("enunciado primeiro, alternativas depois, sem repetir", () => {
    expect(urlsImagens(questao)).toEqual(["https://x.dev/a.png", "https://x.dev/b.jpg", "https://x.dev/alt.png"]);
  });
  it("limita a quantidade", () => {
    const muitas = { ...questao, imagens: Array.from({ length: 10 }, (_, i) => `https://x.dev/${i}.png`) };
    expect(urlsImagens(muitas)).toHaveLength(MAX_IMAGENS);
  });
});

describe("imagensDaQuestao", () => {
  it("baixa em base64, usa a extensão quando o content-type não ajuda e guarda em cache", async () => {
    const buscar = vi.fn(async (url: string) => (url.endsWith(".jpg") ? png("j", "application/octet-stream") : png()));
    const imgs = await imagensDaQuestao(questao, buscar);
    expect(imgs.map((i) => i.mediaType)).toEqual(["image/png", "image/jpeg", "image/png"]);
    expect(imgs[0]?.base64).toBe(Buffer.from("abc").toString("base64"));
    await imagensDaQuestao(questao, buscar);
    expect(buscar).toHaveBeenCalledTimes(3);
  });
  it("falha (rede, 404, tipo desconhecido, vazio) só omite a imagem e não fica em cache", async () => {
    const q = { ...questao, imagens: ["https://x.dev/a.png", "https://x.dev/b.png", "https://x.dev/c.bin", "https://x.dev/d.png"], alternativas: base.alternativas };
    const buscar = vi.fn(async (url: string) => {
      if (url.includes("/a.")) throw new Error("rede");
      if (url.includes("/b.")) return new Response("", { status: 404 });
      if (url.includes("/c.")) return png("x", "text/html");
      return png("");
    });
    expect(await imagensDaQuestao(q, buscar)).toEqual([]);
    await imagensDaQuestao(q, buscar);
    expect(buscar).toHaveBeenCalledTimes(8);
  });
});

describe("anexarImagens", () => {
  const img = { url: "u", mediaType: "image/png", base64: "QUJD" };
  it("põe as imagens no começo da primeira mensagem do usuário", () => {
    const msgs: ModelMessage[] = [
      { role: "user", content: "oi" },
      { role: "assistant", content: "olá" },
      { role: "user", content: [{ type: "text", text: "e aí" }] },
    ];
    const r = anexarImagens(msgs, [img]);
    expect(r[0]).toEqual({ role: "user", content: [{ type: "file", mediaType: "image/png", data: "QUJD" }, { type: "text", text: "oi" }] });
    expect(r[2]).toBe(msgs[2]);
    expect(msgs[0]?.content).toBe("oi");
  });
  it("sem imagem ou sem mensagem do usuário, devolve igual", () => {
    const msgs: ModelMessage[] = [{ role: "assistant", content: "x" }];
    expect(anexarImagens(msgs, [])).toBe(msgs);
    expect(anexarImagens(msgs, [img])).toBe(msgs);
  });
});
