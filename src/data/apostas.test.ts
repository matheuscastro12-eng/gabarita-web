import { describe, expect, it } from "vitest";
import apostasJson from "./apostas-2026.json";
import { carregarApostas, contarPorArea, ehIdAposta, filtrarPorArea } from "./apostas";
import { carregarQuestao, carregarQuestoes } from "./carregar";
import { AREAS, ehAposta, fonteDetalhada, questaoSchema } from "./tipos";

describe("coleção Apostas 2026", () => {
  it("tem as 50 questões, ids estáveis e todas passam no schema", async () => {
    const qs = await carregarApostas();
    expect(qs).toHaveLength(50);
    expect(qs.map((q) => q.id)).toEqual(Array.from({ length: 50 }, (_, i) => `apostas-2026-${String(i + 1).padStart(2, "0")}`));
    for (const q of apostasJson) expect(questaoSchema.safeParse(q).success).toBe(true);
  });

  it("toda questão tem gabarito, resolução do autor e explicação detalhada", async () => {
    for (const q of await carregarApostas()) {
      expect(q.alternativas.map((a) => a.letra)).toContain(q.gabarito);
      expect(q.resolucao_autor?.texto.length).toBeGreaterThan(200);
      expect(q.explicacao_detalhada?.length).toBeGreaterThan(300);
      expect(AREAS).toContain(q.area);
      expect(q.assuntos).toHaveLength(1);
    }
  });

  it("todas têm 5 alternativas, exceto a Q09, que no material tem só 4 (e está sinalizada)", async () => {
    const qs = await carregarApostas();
    const fora = qs.filter((q) => q.alternativas.length !== 5);
    expect(fora.map((q) => q.numero)).toEqual([9]);
    expect(fora[0]!.alternativas).toHaveLength(4);
    expect(fora[0]!.flags?.join(" ")).toMatch(/4 alternativas/);
  });

  it("gabaritos batem com a folha de respostas do autor", async () => {
    const folha = "EEACABDAACBCDBBCBBAACACACCCAEDDCACDABCCDEBCDDDCDDC";
    expect((await carregarApostas()).map((q) => q.gabarito).join("")).toBe(folha);
  });

  it("ficam fora do TRI, das habilidades e das questões oficiais", async () => {
    const qs = await carregarApostas();
    for (const q of qs) {
      expect(ehAposta(q)).toBe(true);
      expect(q.tri).toBeNull();
      expect(q.habilidade).toBeNull();
      expect(q.fonte.orgao).not.toBe("INEP");
      expect(fonteDetalhada(q).citacao).not.toMatch(/INEP/);
    }
    const oficiais = await carregarQuestoes();
    expect(oficiais.some((q) => ehIdAposta(q.id))).toBe(false);
  });

  it("o tutor acha a aposta pelo id (carregarQuestao)", async () => {
    const q = await carregarQuestao("apostas-2026-35");
    expect(q?.numero).toBe(35);
    expect(q?.imagens).toEqual(["/apostas-2026/q35.png"]);
  });

  it("filtra e conta por área", async () => {
    const qs = await carregarApostas();
    const c = contarPorArea(qs);
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(50);
    expect(filtrarPorArea(qs, "matematica")).toHaveLength(c.matematica);
    expect(filtrarPorArea(qs, "todas")).toHaveLength(50);
  });
});
