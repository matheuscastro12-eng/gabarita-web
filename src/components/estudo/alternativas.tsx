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

/**
 * Lista A–E como no original: cartões com borda 1,5px e raio 14px, texto serifado,
 * letra num círculo de 29px. Marcada = azul; certa = verde; errada = vermelha.
 */
export function Alternativas({ alternativas, marcada, gabarito, confirmada, desabilitada, aoMarcar }: Props) {
  return (
    <div role="radiogroup" aria-label="Alternativas" className="flex flex-col gap-2.25">
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
              "group flex w-full items-start gap-3 rounded-lg border-[1.5px] border-border bg-surface px-3.25 py-3 text-left font-serif text-[15px] leading-normal text-foreground",
              "transition-[background-color,border-color,color] duration-(--duration) ease-(--ease)",
              "hover:border-accent/60 disabled:cursor-default disabled:hover:border-border",
              selecionada && !confirmada && "border-accent hover:border-accent",
              ehGabarito && "border-success bg-success-tint disabled:hover:border-success",
              ehErro && "border-danger bg-danger-tint disabled:hover:border-danger",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "inline-flex size-[29px] shrink-0 items-center justify-center rounded-full border-[1.5px] font-sans text-[13px] font-extrabold",
                selecionada && !confirmada ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground",
                ehGabarito && "border-success bg-success text-white",
                ehErro && "border-danger bg-danger text-white",
              )}
            >
              {ehGabarito ? <Check className="size-4" strokeWidth={2.5} /> : ehErro ? <X className="size-4" strokeWidth={2.5} /> : alt.letra}
            </span>
            <span className="min-w-0 flex-1 pt-0.75">
              {alt.texto && <Markdown inline>{alt.texto}</Markdown>}
              {alt.imagem && <ImagemQuestao src={alt.imagem} alt={`Alternativa ${alt.letra}`} className="my-1 max-h-40 rounded-sm" />}
            </span>
            {!confirmada && (
              <Kbd className="mt-1 font-sans opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{alt.letra}</Kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
