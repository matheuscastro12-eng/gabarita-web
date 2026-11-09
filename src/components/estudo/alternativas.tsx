"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { Alternativa, Letra } from "@/data/tipos";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Bolha, type EstadoBolha } from "@/components/ui/bolha";
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
 * Lista A–E (composição 2): caixas separadas com a bolha da letra. Marcada = tinta azul;
 * certa = verde com check desenhado; errada = vermelha com X.
 */
export function Alternativas({ alternativas, marcada, gabarito, confirmada, desabilitada, aoMarcar }: Props) {
  return (
    <div role="radiogroup" aria-label="Alternativas" className="flex flex-col gap-2">
      {alternativas.map((alt) => {
        const selecionada = marcada === alt.letra;
        const ehGabarito = confirmada && gabarito === alt.letra;
        const ehErro = confirmada && selecionada && gabarito !== alt.letra;
        const acertou = ehGabarito && selecionada;
        const apagada = confirmada && !ehGabarito && !ehErro;
        const estado: EstadoBolha = ehGabarito ? "certa" : ehErro ? "errada" : selecionada ? "marcada" : "vazia";
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
              "group flex min-h-12 w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-left text-base leading-normal text-foreground",
              "transition-[background-color,border-color,color,opacity] duration-(--duracao) ease-(--curva)",
              "hover:border-input hover:bg-muted disabled:cursor-default disabled:hover:border-border disabled:hover:bg-background",
              selecionada && !confirmada && "border-primary bg-accent ring-1 ring-primary hover:border-primary hover:bg-accent",
              ehGabarito && "border-sucesso bg-sucesso-suave disabled:hover:border-sucesso disabled:hover:bg-sucesso-suave",
              ehErro && "border-erro bg-erro-suave disabled:hover:border-erro disabled:hover:bg-erro-suave",
              apagada && "opacity-60",
              acertou && "anim-assenta",
              ehErro && "anim-shake",
            )}
          >
            <Bolha tamanho="md" estado={estado}>
              {ehGabarito ? <CheckDesenhado /> : ehErro ? <X className="anim-pop size-4" strokeWidth={2.5} /> : alt.letra}
            </Bolha>
            <span className="qtext min-w-0 flex-1">
              {alt.texto && <Markdown inline>{alt.texto}</Markdown>}
              {alt.imagem && <ImagemQuestao src={alt.imagem} alt={`Alternativa ${alt.letra}`} className="my-1 max-h-40" />}
            </span>
            {!confirmada && (
              <Kbd className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{alt.letra}</Kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Check que se desenha (traço de 0 ao fim) ao revelar a certa. */
function CheckDesenhado() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={24} className="anim-desenha" style={{ ["--traco" as string]: 24 }} />
    </svg>
  );
}
