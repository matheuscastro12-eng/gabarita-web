"use client";

/**
 * Executa Python no Pyodide e, se ele não carregar, resolve contas simples
 * pelo mathjs (carregado sob demanda). Uso: Laboratório e `run_python` do tutor.
 */
import type { SaidaPython } from "@/lib/tutor/ferramentas";
import { carregarMathjs } from "@/lib/tutor/mathjs-cliente";
import { pyodideCliente } from "./cliente";
import { comFallbackMathjs, ehErroDeCarga } from "./fallback";

export async function rodarPython(codigo: string): Promise<SaidaPython> {
  const saida = await pyodideCliente().rodar(codigo);
  if (!ehErroDeCarga(saida)) return saida;
  try {
    const { calcular } = await carregarMathjs();
    return comFallbackMathjs(codigo, saida, calcular);
  } catch {
    return saida;
  }
}
