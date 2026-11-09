import { describe, expect, it } from "vitest";
import { estadoInicial, registrarTentativa } from "@/lib/dominio/estado";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { exportarBackup, importarBackup } from "./backup";

const agora = new Date(2026, 10, 9, 10);

function estadoCheio() {
  const { estado } = registrarTentativa(
    estadoInicial(agora),
    {
      questao: questaoFake(),
      escolha: "A",
      segundos: 60,
      degrauMaximo: 1,
      pediuResposta: false,
      origem: "oficial",
      sprintId: null,
    },
    agora,
  );
  return {
    ...estado,
    perfil: { ...estado.perfil, dataProva: "2026-11-15" },
    sprints: [{ id: "s", iniciadoEm: agora.toISOString(), terminadoEm: null, questaoIds: [], tentativaIds: [] }],
    simulados: [
      {
        id: "sim",
        tipo: "faceis-15" as const,
        iniciadoEm: agora.toISOString(),
        terminadoEm: agora.toISOString(),
        total: 15,
        acertos: 14,
        maiorTempoItem: 100,
        tentativaIds: [],
      },
    ],
  };
}

describe("backup", () => {
  it("exporta JSON indentado e importa de volta (ida e volta)", () => {
    const estado = estadoCheio();
    const json = exportarBackup(estado, agora);
    expect(json).toContain('\n  "app": "gabarita"');
    const obj = JSON.parse(json);
    expect(obj).toMatchObject({ app: "gabarita", versao: 1, exportadoEm: agora.toISOString() });
    expect(importarBackup(json)).toEqual(estado);
    expect(JSON.parse(exportarBackup(estado)).exportadoEm).toEqual(expect.any(String));
  });

  it("erros em pt-BR", () => {
    expect(() => importarBackup("{nao json")).toThrow("Backup inválido: o arquivo não é um JSON válido.");
    expect(() => importarBackup("[1]")).toThrow("não tem o formato de backup");
    expect(() => importarBackup(JSON.stringify({ app: "outro", versao: 1, estado: {} }))).toThrow(
      "não é um backup do Gabarita",
    );
    expect(() => importarBackup(JSON.stringify({ app: "gabarita", versao: 2, estado: {} }))).toThrow(
      "versão 2 não suportada",
    );
  });

  it("aponta os campos com problema", () => {
    const estado = estadoCheio();
    const ruim = { ...estado, perfil: { ...estado.perfil, metaNota: "alta" } };
    const json = JSON.stringify({ app: "gabarita", versao: 1, exportadoEm: "", estado: ruim });
    expect(() => importarBackup(json)).toThrow(/estado\.perfil\.metaNota/);
    const raiz = JSON.stringify({ app: "gabarita", versao: 1, estado: null });
    expect(() => importarBackup(raiz)).toThrow("campo com formato errado ou ausente: estado.");
    const data = JSON.stringify({
      app: "gabarita",
      versao: 1,
      estado: { ...estado, criadoEm: "ontem", tentativas: [{ ...estado.tentativas[0], habilidade: "H99" }] },
    });
    expect(() => importarBackup(data)).toThrow(/estado\.criadoEm.*estado\.tentativas\.0\.habilidade/);
  });
});
