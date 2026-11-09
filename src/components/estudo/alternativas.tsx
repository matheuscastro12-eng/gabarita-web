"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import type { Alternativa, Letra } from "@/data/tipos";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { ImagemQuestao } from "./imagem-questao";
import { Markdown } from "./markdown";

interface Props {
  alternativas: Alternativa[];
  marcada: Letra | null;
  /** Depois de confirmar: mostra acerto/erro. */
  gabarito?: Letra | null;
  confirmada: boolean;
  desabilitada?: boolean;
  aoMarcar: (letra: Letra) => void;
}

/** Lista A–E com radio semântico, atalho visível e estado pós-confirmação. */
export function Alternativas({ alternativas, marcada, gabarito, confirmada, desabilitada, aoMarcar }: Props) {
  return (
    <div role="radiogroup" aria-label="Alternativas" className="flex flex-col gap-2">
      {alternativas.map((alt) => {
        const selecionada = marcada === alt.letra;
        const ehGabarito = confirmada && gabarito === alt.letra;
        const ehErro = confirmada && selecionada && gabarito !== alt.letra;
        return (
          <button
            key={alt.letra}
            type="button"
            role="radio"
            aria-checked={selecionada}
            disabled={desabilitada || confirmada}
            onClick={() => aoMarcar(alt.letra)}
            data-letra={alt.letra}
            className={cn(
              "group flex min-h-12 w-full items-start gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-left",
              "transition-[background-color,border-color,color] duration-(--duration) ease-(--ease)",
              "hover:bg-surface-2 disabled:cursor-default disabled:hover:bg-surface",
              selecionada && !confirmada && "border-accent bg-accent-soft",
              ehGabarito && "border-success bg-success-soft",
              ehErro && "border-danger bg-danger-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-sm border text-sm font-semibold",
                selecionada && !confirmada
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface-2 text-muted-foreground",
                ehGabarito && "border-success bg-success text-background",
                ehErro && "border-danger bg-danger text-background",
              )}
            >
              {ehGabarito ? <Check className="size-4" /> : ehErro ? <X className="size-4" /> : alt.letra}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              {alt.texto && <Markdown inline>{alt.texto}</Markdown>}
              {alt.imagem && <ImagemQuestao src={alt.imagem} alt={`Alternativa ${alt.letra}`} className="my-1 max-h-40 rounded-sm" />}
            </span>
            {!confirmada && (
              <Kbd className="mt-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {alt.letra}
              </Kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
