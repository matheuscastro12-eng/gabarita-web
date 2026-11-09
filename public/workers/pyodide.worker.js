/* eslint-disable */
/**
 * Web Worker do run_python: carrega o Pyodide (e o sympy) do CDN oficial do
 * jsdelivr sob demanda, executa código Python com stdout capturado e devolve
 * o valor da última expressão. Arquivo estático (sem bundler) de propósito:
 * `importScripts` de um worker clássico é o caminho oficial do Pyodide.
 *
 * Protocolo: { tipo: "carregar" } → { tipo: "progresso", etapa } … { tipo: "pronto", versao }
 *            { tipo: "rodar", id, codigo } → { tipo: "resultado", id, ok, saida, resultado, erro, ms }
 * O cancelamento é feito pelo thread principal com worker.terminate().
 */
const VERSAO = "0.29.0";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${VERSAO}/full/`;

let pyodide = null;
let carregando = null;
let saidaAtual = [];

const PRELUDIO = [
  "import sys",
  "from sympy import *",
  "from fractions import Fraction",
  "import math",
  "init_printing(use_unicode=True)",
].join("\n");

function postar(msg) {
  self.postMessage(msg);
}

async function carregar() {
  if (pyodide) return pyodide;
  if (carregando) return carregando;
  carregando = (async () => {
    postar({ tipo: "progresso", etapa: "baixando o Pyodide" });
    importScripts(`${INDEX_URL}pyodide.js`);
    const py = await self.loadPyodide({
      indexURL: INDEX_URL,
      stdout: (linha) => saidaAtual.push(linha),
      stderr: (linha) => saidaAtual.push(linha),
    });
    postar({ tipo: "progresso", etapa: "baixando o SymPy" });
    await py.loadPackage("sympy");
    postar({ tipo: "progresso", etapa: "preparando o ambiente" });
    await py.runPythonAsync(PRELUDIO);
    pyodide = py;
    postar({ tipo: "pronto", versao: VERSAO });
    return py;
  })().catch((e) => {
    carregando = null;
    postar({ tipo: "erro-carga", erro: String((e && e.message) || e) });
    throw e;
  });
  return carregando;
}

async function rodar(id, codigo) {
  const inicio = Date.now();
  saidaAtual = [];
  try {
    const py = await carregar();
    const valor = await py.runPythonAsync(codigo);
    let resultado = null;
    if (valor !== undefined && valor !== null) {
      try {
        resultado = typeof valor === "object" && typeof valor.toString === "function" ? valor.toString() : String(valor);
        if (typeof valor.destroy === "function") valor.destroy();
      } catch {
        resultado = String(valor);
      }
    }
    postar({ tipo: "resultado", id, ok: true, saida: saidaAtual.join("\n"), resultado, erro: null, ms: Date.now() - inicio });
  } catch (e) {
    const erro = String((e && e.message) || e)
      .split("\n")
      .filter((l) => l.trim() && !/^\s*File "<exec>"|^Traceback|pyodide|_pyodide|^\s+\^/.test(l))
      .slice(-6)
      .join("\n");
    postar({ tipo: "resultado", id, ok: false, saida: saidaAtual.join("\n"), resultado: null, erro: erro || "Erro ao executar.", ms: Date.now() - inicio });
  }
}

self.onmessage = (evento) => {
  const msg = evento.data || {};
  if (msg.tipo === "carregar") {
    carregar().catch(() => {});
  } else if (msg.tipo === "rodar") {
    rodar(msg.id, String(msg.codigo || ""));
  }
};
