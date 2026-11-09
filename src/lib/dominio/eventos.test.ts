import { describe, expect, it } from "vitest";
import { estadoInicial } from "./estado";
import { equivocosRecorrentes, MAX_EVENTOS, registrarEventoTutor } from "./eventos";
import type { EstadoAluno } from "./tipos";

const agora = new Date("2026-11-09T12:00:00Z");

describe("registrarEventoTutor", () => {
  it("adiciona o evento com id, degrau e data", () => {
    const { estado, evento } = registrarEventoTutor(
      estadoInicial(agora),
      { tipo: "dica", questaoId: "enem-2022-154", detalhe: "degrau 1", degrau: 1 },
      agora,
      (p) => `${p}-1`,
    );
    expect(evento).toEqual({ id: "evento-1", tipo: "dica", questaoId: "enem-2022-154", detalhe: "degrau 1", degrau: 1, em: agora.toISOString() });
    expect(estado.eventosTutor).toEqual([evento]);
    expect(estado.atualizadoEm).toBe(agora.toISOString());
  });
  it("funciona com estado antigo sem eventosTutor e gera id sozinho", () => {
    const antigo = { ...estadoInicial(agora) } as EstadoAluno;
    delete antigo.eventosTutor;
    const { estado, evento } = registrarEventoTutor(antigo, { tipo: "erro", questaoId: "q", detalhe: "x" }, agora);
    expect(estado.eventosTutor).toHaveLength(1);
    expect(evento.id).toMatch(/^evento-/);
    expect(evento.degrau).toBeNull();
  });
  it("preenche o porQue do erro aberto no caderno quando é equívoco", () => {
    const base = estadoInicial(agora);
    const comCaderno: EstadoAluno = {
      ...base,
      caderno: [
        { id: "e1", tentativaId: "t1", questaoId: "q1", habilidade: "H3", escolha: "B", gabarito: "C", porQue: null, em: agora.toISOString(), resolvidaEm: null },
        { id: "e2", tentativaId: "t2", questaoId: "q1", habilidade: "H3", escolha: "B", gabarito: "C", porQue: "já tinha", em: agora.toISOString(), resolvidaEm: null },
        { id: "e3", tentativaId: "t3", questaoId: "q2", habilidade: "H3", escolha: "B", gabarito: "C", porQue: null, em: agora.toISOString(), resolvidaEm: null },
      ],
    };
    const { estado } = registrarEventoTutor(comCaderno, { tipo: "equivoco", questaoId: "q1", detalhe: "Multiplicou por 3" }, agora);
    expect(estado.caderno.map((e) => e.porQue)).toEqual(["Multiplicou por 3", "já tinha", null]);
  });
  it("limita o detalhe e a quantidade de eventos", () => {
    let estado = estadoInicial(agora);
    for (let i = 0; i < MAX_EVENTOS + 5; i++) {
      estado = registrarEventoTutor(estado, { tipo: "dica", questaoId: "q", detalhe: "d".repeat(600) }, agora).estado;
    }
    expect(estado.eventosTutor).toHaveLength(MAX_EVENTOS);
    expect(estado.eventosTutor?.[0]?.detalhe).toHaveLength(500);
  });
});

describe("equivocosRecorrentes", () => {
  it("conta equívocos dos eventos e do caderno, ordenados", () => {
    let estado = estadoInicial(agora);
    estado = registrarEventoTutor(estado, { tipo: "equivoco", questaoId: "q", detalhe: "Dividiu pelo valor novo" }, agora).estado;
    estado = registrarEventoTutor(estado, { tipo: "equivoco", questaoId: "q", detalhe: "dividiu pelo valor novo" }, agora).estado;
    estado = registrarEventoTutor(estado, { tipo: "dica", questaoId: "q", detalhe: "ignorado" }, agora).estado;
    estado = {
      ...estado,
      caderno: [
        { id: "e1", tentativaId: "t1", questaoId: "q", habilidade: "H3", escolha: "B", gabarito: "C", porQue: "Esqueceu o 100%", em: agora.toISOString(), resolvidaEm: null },
        { id: "e2", tentativaId: "t2", questaoId: "q", habilidade: "H3", escolha: "B", gabarito: "C", porQue: null, em: agora.toISOString(), resolvidaEm: null },
        { id: "e3", tentativaId: "t3", questaoId: "q", habilidade: "H3", escolha: "B", gabarito: "C", porQue: "Esqueceu o 100%", em: agora.toISOString(), resolvidaEm: null },
      ],
    };
    expect(equivocosRecorrentes(estado)).toEqual([
      { detalhe: "dividiu pelo valor novo", vezes: 2 },
      { detalhe: "esqueceu o 100%", vezes: 2 },
    ]);
    expect(equivocosRecorrentes(estado, 1)).toHaveLength(1);
    const semEventos = { ...estadoInicial(agora) } as EstadoAluno;
    delete semEventos.eventosTutor;
    expect(equivocosRecorrentes(semEventos)).toEqual([]);
  });
});
