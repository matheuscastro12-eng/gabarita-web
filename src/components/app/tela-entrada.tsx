"use client";

import * as React from "react";
import { Atom, Layers, Sigma, type LucideIcon } from "lucide-react";
import { INFO_VERSAO, VERSOES, type Versao } from "@/lib/versao";
import { cn } from "@/lib/utils";
import { Logo } from "./sidebar";
import { useVersao } from "./versao";

const ICONE: Record<Versao, LucideIcon> = { matematica: Sigma, natureza: Atom, geral: Layers };

/** Primeira abertura: escolher a versão do Gabarita. Trocável depois pela sidebar e pelos Ajustes. */
export function TelaEntrada() {
  const { definir } = useVersao();
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-4 py-10" data-testid="tela-entrada">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 font-rounded text-2xl font-extrabold">
            <Logo className="size-7" />
            Gabarita
          </div>
          <h1 className="text-xl font-bold">O que você vai estudar?</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Dá para trocar quando quiser, pela barra lateral ou nos Ajustes. Seu progresso fica junto e separado por área.
          </p>
        </div>
        <ul className="grid gap-3.5 md:grid-cols-3">
          {VERSOES.map((v) => {
            const Icone = ICONE[v];
            return (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => definir(v)}
                  data-testid={`entrada-${v}`}
                  className={cn(
                    "flex h-full w-full flex-col items-start gap-3 rounded-xl border border-card-borda bg-surface p-5 text-left shadow-card",
                    "transition-[border-color,transform] duration-(--duration) ease-(--ease) hover:border-accent active:translate-y-px",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  )}
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
                    <Icone className="size-5" strokeWidth={1.8} />
                  </span>
                  <span className="font-rounded text-lg font-extrabold">Gabarita {INFO_VERSAO[v].nome}</span>
                  <span className="text-sm text-muted-foreground">{INFO_VERSAO[v].descricao}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
