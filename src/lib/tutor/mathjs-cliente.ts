"use client";

/**
 * Acesso preguiçoso ao mathjs no navegador: o pacote é pesado, então só entra
 * no bundle da tela quando o aluno pede uma conta ou um gráfico.
 */
import type { ResultadoCalculo } from "./mathjs";

type Modulo = typeof import("./mathjs");
let modulo: Promise<Modulo> | null = null;

export function carregarMathjs(): Promise<Modulo> {
  modulo ??= import("./mathjs");
  return modulo;
}

export async function calcularNoCliente(expressao: string): Promise<ResultadoCalculo> {
  const m = await carregarMathjs();
  return m.calcular(expressao);
}

export type Compilador = (expressao: string) => (escopo: Record<string, number>) => number;

export async function compiladorNoCliente(): Promise<Compilador> {
  const m = await carregarMathjs();
  return m.compilarFuncao;
}
