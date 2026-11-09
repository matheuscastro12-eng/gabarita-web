import { describe, expect, it } from "vitest";
import { ASSUNTOS_DE_FOCO } from "@/data/taxonomia";
import { estadoInicial, registrarTentativa } from "./estado";
import { novoEstadoHabilidade } from "./evidencia";
import { agruparPorCompetencia, dominioPorAssunto, DOMINIO_SEM_DADOS, mapaHabilidades, nivelCalor } from "./mapa";
import { revisarCartao } from "./revisao";
import { questaoFake, tentativaFake } from "./teste-fixtures";

const agora = new Date(2026, 10, 9, 10);

describe("nivelCalor", () => {
  it("mapeia null e faixas de domínio para 0–4", () => {
    expect(nivelCalor(null)).toBe(0);
    expect(nivelCalor(0.3)).toBe(1);
    expect(nivelCalor(0.5)).toBe(2);
    expect(nivelCalor(0.7)).toBe(3);
    expect(nivelCalor(0.9)).toBe(4);
  });
});

describe("mapaHabilidades", () => {
  it("devolve 30 células; sem dados usa o domínio inicial e lista as faltas", () => {
    const celulas = mapaHabilidades(estadoInicial(agora), agora);
    expect(celulas).toHaveLength(30);
    expect(celulas[0]).toMatchObject({ habilidade: "H1", competencia: "C1", nome: "Sistemas de numeração", dominio: DOMINIO_SEM_DADOS, semDados: true, daSemana: false, revisaoVencida: false, pronto: false });
    expect(celulas[0]!.faltas.length).toBeGreaterThan(0);
    expect(celulas.find((c) => c.habilidade === "H24")?.daSemana).toBe(true);
    expect(celulas[29]!.competencia).toBe("C7");
  });

  it("reflete tentativas, retenção vencida e habilidade com estado mas sem itens", () => {
    let estado = estadoInicial(agora);
    const q = questaoFake({ habilidade: "H16" });
    estado = registrarTentativa(estado, { questao: q, escolha: "C", segundos: 60, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null }, agora).estado;
    // H24 com cartão revisado há muito tempo: retenção baixa → revisão vencida.
    const h24 = novoEstadoHabilidade("H24", new Date(2026, 0, 1));
    estado = { ...estado, habilidades: { ...estado.habilidades, H24: { ...h24, cartao: revisarCartao(h24.cartao, "good", new Date(2026, 0, 1)) } } };
    const celulas = mapaHabilidades(estado, agora);
    const c16 = celulas.find((c) => c.habilidade === "H16")!;
    expect(c16.semDados).toBe(false);
    expect(c16.itensOficiais).toBe(1);
    expect(c16.acertos).toBe(1);
    expect(c16.dominio).toBeGreaterThan(DOMINIO_SEM_DADOS);
    const c24 = celulas.find((c) => c.habilidade === "H24")!;
    expect(c24.revisaoVencida).toBe(true);
    expect(c24.semDados).toBe(true);
    expect(c24.retencao).toBeLessThan(0.9);
  });
});

describe("agruparPorCompetencia", () => {
  it("7 grupos na ordem C1–C7, média só das habilidades com dados", () => {
    let estado = estadoInicial(agora);
    estado = registrarTentativa(estado, { questao: questaoFake({ habilidade: "H16" }), escolha: "C", segundos: 60, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null }, agora).estado;
    const grupos = agruparPorCompetencia(mapaHabilidades(estado, agora));
    expect(grupos.map((g) => g.competencia.id)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7"]);
    expect(grupos[0]!.media).toBeNull();
    expect(grupos[3]!.celulas.map((c) => c.habilidade)).toEqual(["H15", "H16", "H17", "H18"]);
    const c16 = grupos[3]!.celulas.find((c) => c.habilidade === "H16")!;
    expect(grupos[3]!.media).toBeCloseTo(c16.dominioEfetivo, 10);
  });
});

describe("dominioPorAssunto", () => {
  it("conta tentativas oficiais nas questões do assunto e a média das habilidades com dados", () => {
    let estado = estadoInicial(agora);
    const q1 = questaoFake({ id: "enem-2023-1", numero: 1, habilidade: "H16", assuntos: ["porcentagem"] });
    const q2 = questaoFake({ id: "enem-2023-2", numero: 2, habilidade: "H24", assuntos: ["graficos-tabelas"] });
    estado = registrarTentativa(estado, { questao: q1, escolha: "C", segundos: 60, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null }, agora).estado;
    estado = registrarTentativa(estado, { questao: q2, escolha: "A", segundos: 60, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null }, agora).estado;
    estado = { ...estado, tentativas: [...estado.tentativas, tentativaFake({ id: "g", questaoId: "enem-2023-1", origem: "gemea" }), tentativaFake({ id: "x", questaoId: "inexistente" })] };
    const porId = new Map([q1, q2].map((q) => [q.id, q]));
    const r = dominioPorAssunto(mapaHabilidades(estado, agora), estado, porId);
    expect(r).toHaveLength(ASSUNTOS_DE_FOCO.length);
    const porc = r.find((d) => d.assunto.id === "porcentagem")!;
    expect(porc.tentativas).toBe(1);
    expect(porc.acertos).toBe(1);
    expect(porc.media).not.toBeNull();
    const graf = r.find((d) => d.assunto.id === "graficos-tabelas")!;
    expect(graf.tentativas).toBe(1);
    expect(graf.acertos).toBe(0);
    const prob = r.find((d) => d.assunto.id === "probabilidade")!;
    expect(prob.media).toBeNull();
    expect(prob.tentativas).toBe(0);
    // Aceita busca por função e lista de assuntos customizada.
    const r2 = dominioPorAssunto(mapaHabilidades(estado, agora), estado, (id) => porId.get(id), [ASSUNTOS_DE_FOCO[0]!]);
    expect(r2).toHaveLength(1);
  });
});
