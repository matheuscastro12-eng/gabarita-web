"use client";

/**
 * Cliente do Web Worker do Pyodide (public/workers/pyodide.worker.js).
 * Carrega sob demanda, roda código com timeout e permite cancelar
 * (cancelar = terminar o worker; o próximo uso recarrega).
 */
import type { SaidaPython } from "@/lib/tutor/ferramentas";
import { mensagemErroCarga } from "./fallback";

export type EstadoPyodide = "parado" | "carregando" | "pronto" | "rodando" | "erro";

export interface StatusPyodide {
  estado: EstadoPyodide;
  etapa: string | null;
  erro: string | null;
  versao: string | null;
}

type Ouvinte = (status: StatusPyodide) => void;

export const TIMEOUT_PADRAO_MS = 30_000;
/** A primeira carga baixa ~15 MB do CDN; o tempo dela não conta no timeout da execução. */
export const TIMEOUT_CARGA_MS = 120_000;

interface Pendente {
  resolver: (saida: SaidaPython) => void;
  timer: number;
}

class ClientePyodide {
  private worker: Worker | null = null;
  private pendentes = new Map<string, Pendente>();
  private ouvintes = new Set<Ouvinte>();
  private status: StatusPyodide = { estado: "parado", etapa: null, erro: null, versao: null };
  private prontoPromessa: { promessa: Promise<void>; resolver: () => void; rejeitar: (e: Error) => void } | null = null;
  private contador = 0;

  obterStatus(): StatusPyodide {
    return this.status;
  }

  assinar(ouvinte: Ouvinte): () => void {
    this.ouvintes.add(ouvinte);
    return () => {
      this.ouvintes.delete(ouvinte);
    };
  }

  private definir(parcial: Partial<StatusPyodide>) {
    this.status = { ...this.status, ...parcial };
    for (const o of this.ouvintes) o(this.status);
  }

  private garantirWorker(): Worker {
    if (this.worker) return this.worker;
    const w = new Worker("/workers/pyodide.worker.js");
    w.onmessage = (ev: MessageEvent) => this.aoMensagem(ev.data as Record<string, unknown>);
    w.onerror = (ev) => {
      this.definir({ estado: "erro", erro: ev.message || "Falha no worker do Pyodide." });
      this.prontoPromessa?.rejeitar(new Error(ev.message || "Falha no worker."));
      this.prontoPromessa = null;
    };
    this.worker = w;
    return w;
  }

  private aoMensagem(msg: Record<string, unknown>) {
    switch (msg.tipo) {
      case "progresso":
        this.definir({ estado: "carregando", etapa: String(msg.etapa ?? ""), erro: null });
        break;
      case "pronto":
        this.definir({ estado: this.pendentes.size > 0 ? "rodando" : "pronto", etapa: null, erro: null, versao: String(msg.versao ?? "") });
        this.prontoPromessa?.resolver();
        this.prontoPromessa = null;
        break;
      case "erro-carga":
        this.definir({ estado: "erro", etapa: null, erro: String(msg.erro ?? "Não consegui carregar o Pyodide.") });
        this.prontoPromessa?.rejeitar(new Error(String(msg.erro ?? "carga")));
        this.prontoPromessa = null;
        break;
      case "resultado": {
        const id = String(msg.id);
        const p = this.pendentes.get(id);
        if (!p) return;
        window.clearTimeout(p.timer);
        this.pendentes.delete(id);
        if (this.pendentes.size === 0 && this.status.estado === "rodando") this.definir({ estado: "pronto" });
        p.resolver({
          ok: Boolean(msg.ok),
          saida: String(msg.saida ?? ""),
          resultado: msg.resultado == null ? null : String(msg.resultado),
          erro: msg.erro == null ? null : String(msg.erro),
          ms: Number(msg.ms ?? 0),
        });
        break;
      }
    }
  }

  /** Começa a baixar o Pyodide (idempotente). */
  carregar(): Promise<void> {
    if (this.status.estado === "pronto" || this.status.estado === "rodando") return Promise.resolve();
    if (this.prontoPromessa) return this.prontoPromessa.promessa;
    let resolver!: () => void;
    let rejeitar!: (e: Error) => void;
    const promessa = new Promise<void>((res, rej) => {
      resolver = res;
      rejeitar = rej;
    });
    this.prontoPromessa = { promessa, resolver, rejeitar };
    this.definir({ estado: "carregando", etapa: "iniciando", erro: null });
    this.garantirWorker().postMessage({ tipo: "carregar" });
    return promessa;
  }

  /** Carga com limite de tempo próprio; falha vira erro de carga (não timeout de execução). */
  private carregarComLimite(ms: number): Promise<void> {
    return new Promise<void>((resolver, rejeitar) => {
      const timer = window.setTimeout(() => rejeitar(new Error(`demorou mais de ${Math.round(ms / 1000)} s`)), ms);
      this.carregar().then(
        () => {
          window.clearTimeout(timer);
          resolver();
        },
        (e: unknown) => {
          window.clearTimeout(timer);
          rejeitar(e instanceof Error ? e : new Error(String(e)));
        },
      );
    });
  }

  /**
   * Executa o código; resolve sempre (erro vira `ok: false`). Se o Pyodide não
   * carregar, o erro começa com `ERRO_CARGA_PREFIXO` para a interface oferecer
   * o fallback do mathjs. Timeout de execução → cancela e reinicia o worker.
   */
  async rodar(codigo: string, timeoutMs = TIMEOUT_PADRAO_MS): Promise<SaidaPython> {
    const inicio = Date.now();
    if (this.status.estado !== "pronto" && this.status.estado !== "rodando") {
      try {
        await this.carregarComLimite(TIMEOUT_CARGA_MS);
      } catch (e) {
        const motivo = e instanceof Error ? e.message : String(e);
        // Cancelamento pelo aluno não é falha do CDN.
        if (/^Cancelado/.test(motivo)) return { ok: false, saida: "", resultado: null, erro: motivo, ms: Date.now() - inicio };
        if (this.status.estado !== "erro") this.definir({ estado: "erro", etapa: null, erro: motivo });
        return { ok: false, saida: "", resultado: null, erro: mensagemErroCarga(motivo), ms: Date.now() - inicio };
      }
    }
    const id = `py-${++this.contador}`;
    const w = this.garantirWorker();
    return new Promise<SaidaPython>((resolver) => {
      const timer = window.setTimeout(() => {
        this.pendentes.delete(id);
        this.cancelar(`Tempo esgotado (${Math.round(timeoutMs / 1000)} s). O ambiente foi reiniciado.`);
        resolver({ ok: false, saida: "", resultado: null, erro: `Tempo esgotado após ${Math.round(timeoutMs / 1000)} s.`, ms: timeoutMs });
      }, timeoutMs);
      this.pendentes.set(id, { resolver, timer });
      if (this.status.estado === "pronto") this.definir({ estado: "rodando" });
      w.postMessage({ tipo: "rodar", id, codigo });
    });
  }

  /** Cancela tudo que está rodando: termina o worker. O próximo `rodar` recarrega. */
  cancelar(motivo = "Cancelado.") {
    for (const [id, p] of this.pendentes) {
      window.clearTimeout(p.timer);
      p.resolver({ ok: false, saida: "", resultado: null, erro: motivo, ms: 0 });
      this.pendentes.delete(id);
    }
    this.worker?.terminate();
    this.worker = null;
    this.prontoPromessa?.rejeitar(new Error(motivo));
    this.prontoPromessa = null;
    this.definir({ estado: "parado", etapa: null, erro: null });
  }
}

let instancia: ClientePyodide | null = null;

/** Instância única por aba. */
export function pyodideCliente(): ClientePyodide {
  instancia ??= new ClientePyodide();
  return instancia;
}
