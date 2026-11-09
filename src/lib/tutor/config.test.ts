import { describe, expect, it } from "vitest";
import { configuracaoTutor, modeloGateway, statusPublico, MODELO_PADRAO } from "./config";

describe("configuracaoTutor", () => {
  it("sem chave nenhuma: provedor null, modelo padrão", () => {
    expect(configuracaoTutor({})).toEqual({ provedor: null, modelo: MODELO_PADRAO, esforco: "low" });
  });
  it("chave vazia ou só espaços conta como ausente", () => {
    expect(configuracaoTutor({ ANTHROPIC_API_KEY: "   " }).provedor).toBeNull();
  });
  it("ANTHROPIC_API_KEY tem prioridade sobre o gateway", () => {
    const c = configuracaoTutor({ ANTHROPIC_API_KEY: "x", AI_GATEWAY_API_KEY: "y" });
    expect(c.provedor).toBe("anthropic");
  });
  it("AI_GATEWAY_API_KEY sozinha liga o gateway", () => {
    expect(configuracaoTutor({ AI_GATEWAY_API_KEY: "y" }).provedor).toBe("gateway");
  });
  it("TUTOR_MODEL e TUTOR_EFFORT são respeitados; esforço inválido cai no padrão", () => {
    expect(configuracaoTutor({ TUTOR_MODEL: "claude-opus-5-5", TUTOR_EFFORT: "medium" })).toMatchObject({
      modelo: "claude-opus-5-5",
      esforco: "medium",
    });
    expect(configuracaoTutor({ TUTOR_EFFORT: "max" }).esforco).toBe("low");
  });
  it("modeloGateway prefixa anthropic/ quando falta", () => {
    expect(modeloGateway("claude-sonnet-5-5")).toBe("anthropic/claude-sonnet-5-5");
    expect(modeloGateway("anthropic/claude-sonnet-5-5")).toBe("anthropic/claude-sonnet-5-5");
  });
  it("statusPublico não expõe a chave", () => {
    const s = statusPublico(configuracaoTutor({ ANTHROPIC_API_KEY: "sk-secreta" }));
    expect(s).toEqual({ ia: true, provedor: "anthropic", modelo: MODELO_PADRAO });
    expect(JSON.stringify(s)).not.toContain("secreta");
  });
});

describe("TUTOR_PROVIDER=claude-local", () => {
  it("liga o provedor local sem chave nenhuma", () => {
    expect(configuracaoTutor({ TUTOR_PROVIDER: "claude-local" })).toEqual({ provedor: "claude-local", modelo: MODELO_PADRAO, esforco: "low" });
  });
  it("tem prioridade sobre as duas chaves", () => {
    expect(configuracaoTutor({ TUTOR_PROVIDER: " Claude-Local ", ANTHROPIC_API_KEY: "x", AI_GATEWAY_API_KEY: "y" }).provedor).toBe("claude-local");
  });
  it("valor desconhecido é ignorado e cai nas chaves", () => {
    expect(configuracaoTutor({ TUTOR_PROVIDER: "openai", ANTHROPIC_API_KEY: "x" }).provedor).toBe("anthropic");
    expect(configuracaoTutor({ TUTOR_PROVIDER: "" }).provedor).toBeNull();
  });
  it("statusPublico informa a IA ligada com o provedor local", () => {
    expect(statusPublico(configuracaoTutor({ TUTOR_PROVIDER: "claude-local" }))).toEqual({ ia: true, provedor: "claude-local", modelo: MODELO_PADRAO });
  });
});
