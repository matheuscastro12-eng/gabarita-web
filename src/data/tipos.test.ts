import { describe, expect, it } from "vitest";
import { questaoFake } from "@/lib/dominio/teste-fixtures";
import { citarFonte, competenciaDa, dificuldadeDoB, fonteDetalhada, questaoSchema } from "./tipos";

describe("tipos: fonte e atribuição", () => {
  it("citarFonte cita o INEP, o ano e a questão", () => {
    expect(citarFonte({ ano: 2023, numero: 137 })).toBe("INEP, ENEM 2023, questão 137");
  });

  it("fonteDetalhada distingue gabarito oficial, da transcrição e sem marcação", () => {
    const base = questaoFake({ ano: 2022, numero: 154, fonte: { orgao: "INEP", prova: "ENEM 2022", transcricao: "enem.dev", transcricao_url: "https://api.enem.dev/v1/exams/2022/questions/154", url_oficial: "https://www.gov.br/inep" } });
    const oficial = fonteDetalhada({ ...base, gabarito_fonte: "inep" });
    expect(oficial.citacao).toBe("Fonte: INEP, ENEM 2022, questão 154");
    expect(oficial.gabarito).toMatch(/oficial do INEP \(microdados\)/);
    expect(oficial.urlOficial).toBe("https://www.gov.br/inep");
    expect(oficial.transcricaoUrl).toMatch(/enem\.dev/);
    expect(fonteDetalhada({ ...base, gabarito_fonte: "transcricao" }).gabarito).toMatch(/transcrição/);
    expect(fonteDetalhada(base).gabarito).toBe("gabarito oficial do INEP");
    expect(fonteDetalhada({ ...base, fonte: { ...base.fonte, url_oficial: undefined } }).urlOficial).toBeNull();
  });

  it("fonteDetalhada descreve o TRI: fonte, correção, ausência e anulada", () => {
    const base = questaoFake();
    expect(fonteDetalhada({ ...base, tri: { a: 1, b: 0, c: 0.1, fonte: "INEP, microdados 2023" } }).tri).toBe("TRI: INEP, microdados 2023");
    expect(fonteDetalhada({ ...base, tri: { a: 1, b: 0, c: 0.1, corrigido: true } }).tri).toBe("TRI: microdados do INEP (decimal corrigido pelo PROVAS)");
    expect(fonteDetalhada({ ...base, tri: null }).tri).toBe("sem parâmetros TRI");
    expect(fonteDetalhada({ ...base, anulada: true }).tri).toMatch(/anulada/);
  });

  it("schema aceita os campos novos do PROVAS (tri.corrigido/fonte, gabarito_fonte, dados_da_imagem, espelho)", () => {
    const q = questaoFake({
      gabarito_fonte: "inep",
      tri: { a: 1.2, b: 0.3, c: 0.2, corrigido: false, fonte: "INEP, microdados" },
      fonte: { orgao: "INEP", prova: "ENEM 2023", transcricao: "enem.dev", transcricao_url: "https://api.enem.dev/x", microdados_espelho_url: "https://zenodo.org/records/18801899" },
    });
    const r = questaoSchema.safeParse(q);
    expect(r.success).toBe(true);
    expect(r.data?.tri?.fonte).toBe("INEP, microdados");
    expect(r.data?.fonte.microdados_espelho_url).toBe("https://zenodo.org/records/18801899");
  });

  it("competenciaDa e dificuldadeDoB", () => {
    expect(competenciaDa("H1")).toBe("C1");
    expect(competenciaDa("H30")).toBe("C7");
    expect(competenciaDa("H31")).toBeNull();
    expect(competenciaDa("x")).toBeNull();
    expect([dificuldadeDoB(0), dificuldadeDoB(1), dificuldadeDoB(2)]).toEqual(["facil", "media", "dificil"]);
  });
});
