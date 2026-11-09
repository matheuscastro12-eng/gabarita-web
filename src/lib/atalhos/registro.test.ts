import { describe, expect, it, vi } from "vitest";
import {
  RegistroAtalhos,
  analisarCombinacao,
  combina,
  ehCampoEditavel,
  normalizarEvento,
  teclasParaExibir,
} from "./registro";

const evento = (key: string, extras: Partial<Parameters<typeof normalizarEvento>[0]> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...extras,
});

describe("analisarCombinacao", () => {
  it("entende mod, shift, alt e tecla", () => {
    expect(analisarCombinacao("mod+k")).toEqual({ tecla: "k", mod: true, shift: false, alt: false });
    expect(analisarCombinacao("Shift+Enter")).toEqual({ tecla: "enter", mod: false, shift: true, alt: false });
    expect(analisarCombinacao("alt+r")).toEqual({ tecla: "r", mod: false, shift: false, alt: true });
    expect(analisarCombinacao("ctrl+cmd+meta+option+x").mod).toBe(true);
  });
  it("? implica shift", () => {
    expect(analisarCombinacao("?").shift).toBe(true);
  });
  it("ignora partes vazias", () => {
    expect(analisarCombinacao(" a + ").tecla).toBe("a");
  });
});

describe("normalizarEvento e combina", () => {
  it("normaliza espaço e escape", () => {
    expect(normalizarEvento(evento(" ")).tecla).toBe("space");
    expect(normalizarEvento(evento("Escape")).tecla).toBe("esc");
  });
  it("mod aceita ctrl ou meta", () => {
    const a = analisarCombinacao("mod+k");
    expect(combina(a, normalizarEvento(evento("k", { ctrlKey: true })))).toBe(true);
    expect(combina(a, normalizarEvento(evento("k", { metaKey: true })))).toBe(true);
    expect(combina(a, normalizarEvento(evento("k")))).toBe(false);
  });
  it("letra simples não dispara com mod nem alt", () => {
    const a = analisarCombinacao("h");
    expect(combina(a, normalizarEvento(evento("h", { ctrlKey: true })))).toBe(false);
    expect(combina(a, normalizarEvento(evento("h", { altKey: true })))).toBe(false);
    expect(combina(a, normalizarEvento(evento("H", { shiftKey: true })))).toBe(true);
  });
  it("tecla com nome longo sem shift não combina com shift", () => {
    expect(combina(analisarCombinacao("enter"), normalizarEvento(evento("Enter", { shiftKey: true })))).toBe(false);
    expect(combina(analisarCombinacao("shift+enter"), normalizarEvento(evento("Enter")))).toBe(false);
    expect(combina(analisarCombinacao("shift+enter"), normalizarEvento(evento("Enter", { shiftKey: true })))).toBe(true);
  });
  it("teclas diferentes não combinam", () => {
    expect(combina(analisarCombinacao("a"), normalizarEvento(evento("b")))).toBe(false);
  });
});

describe("ehCampoEditavel", () => {
  const el = (tagName: string, isContentEditable = false) => ({ tagName, isContentEditable }) as unknown as EventTarget;
  it("reconhece input, textarea, select e contentEditable", () => {
    expect(ehCampoEditavel(el("INPUT"))).toBe(true);
    expect(ehCampoEditavel(el("TEXTAREA"))).toBe(true);
    expect(ehCampoEditavel(el("SELECT"))).toBe(true);
    expect(ehCampoEditavel(el("DIV", true))).toBe(true);
    expect(ehCampoEditavel(el("DIV"))).toBe(false);
    expect(ehCampoEditavel(null)).toBe(false);
    expect(ehCampoEditavel({} as EventTarget)).toBe(false);
  });
});

describe("teclasParaExibir", () => {
  it("mostra ⌘ no Mac e Ctrl fora dele", () => {
    expect(teclasParaExibir("mod+k", true)).toEqual(["⌘", "K"]);
    expect(teclasParaExibir("mod+alt+k", false)).toEqual(["Ctrl", "Alt", "K"]);
    expect(teclasParaExibir("alt+k", true)).toEqual(["⌥", "K"]);
  });
  it("traduz teclas especiais", () => {
    expect(teclasParaExibir("shift+enter", false)).toEqual(["Shift", "Enter"]);
    expect(teclasParaExibir("?", false)).toEqual(["?"]);
    expect(teclasParaExibir("esc", false)).toEqual(["Esc"]);
    expect(teclasParaExibir("space", false)).toEqual(["Espaço"]);
    expect(teclasParaExibir("arrowup", false)).toEqual(["↑"]);
  });
});

describe("RegistroAtalhos", () => {
  it("registra, lista, despacha e cancela", () => {
    const r = new RegistroAtalhos();
    const acao = vi.fn();
    const ouvinte = vi.fn();
    r.assinar(ouvinte);
    const cancelar = r.registrar({ id: "x", combinacao: "mod+k", descricao: "Paleta", grupo: "Geral", acao });
    expect(r.listar()).toHaveLength(1);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(r.despachar(evento("k", { ctrlKey: true }))?.id).toBe("x");
    expect(acao).toHaveBeenCalledTimes(1);
    expect(r.despachar(evento("j"))).toBeNull();
    cancelar();
    expect(r.listar()).toHaveLength(0);
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });
  it("cancelar não remove um atalho substituído com o mesmo id", () => {
    const r = new RegistroAtalhos();
    const cancelarAntigo = r.registrar({ id: "x", combinacao: "a", descricao: "", grupo: "", acao: () => {} });
    const novo = { id: "x", combinacao: "b", descricao: "", grupo: "", acao: () => {} };
    r.registrar(novo);
    cancelarAntigo();
    expect(r.listar()).toEqual([novo]);
  });
  it("respeita ativo=false e campos editáveis", () => {
    const r = new RegistroAtalhos();
    const acao = vi.fn();
    const acaoCampo = vi.fn();
    r.registrar({ id: "a", combinacao: "a", descricao: "", grupo: "", acao, ativo: false });
    r.registrar({ id: "b", combinacao: "b", descricao: "", grupo: "", acao });
    r.registrar({ id: "c", combinacao: "mod+k", descricao: "", grupo: "", acao: acaoCampo, emCampos: true });
    expect(r.despachar(evento("a"))).toBeNull();
    const input = { tagName: "INPUT" } as unknown as EventTarget;
    expect(r.despachar({ ...evento("b"), target: input })).toBeNull();
    expect(r.despachar({ ...evento("k", { ctrlKey: true }), target: input })?.id).toBe("c");
    expect(acao).not.toHaveBeenCalled();
    expect(acaoCampo).toHaveBeenCalledTimes(1);
  });
  it("cancelar a assinatura para de notificar", () => {
    const r = new RegistroAtalhos();
    const ouvinte = vi.fn();
    const cancelar = r.assinar(ouvinte);
    cancelar();
    r.registrar({ id: "a", combinacao: "a", descricao: "", grupo: "", acao: () => {} });
    expect(ouvinte).not.toHaveBeenCalled();
  });
});
