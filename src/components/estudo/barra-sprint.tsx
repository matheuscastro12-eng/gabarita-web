"use client";

import * as React from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/app/sidebar";

export type EstadoBolinha = "acertou" | "errou" | "atual" | "pendente";

interface Props {
  bolinhas: EstadoBolinha[];
  indice: number;
  rotuloHabilidade: string | null;
  segundos: number;
  mostrarTimer: boolean;
  foco: boolean;
  aoAlternarFoco: () => void;
}

export function formatarTempo(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Barra superior da IDE: logo, ●●◐○○, habilidade, timer discreto e modo foco. */
export function BarraSprint({ bolinhas, indice, rotuloHabilidade, segundos, mostrarTimer, foco, aoAlternarFoco }: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border px-4 text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <Logo className="size-5 text-accent-text" />
        <span className="hidden sm:inline">Gabarita</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">Sprint</span>
        <span className="flex items-center gap-1" role="img" aria-label={`questão ${indice + 1} de ${bolinhas.length}`}>
          {bolinhas.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "size-2.5 rounded-full border",
                b === "acertou" && "border-success bg-success",
                b === "errou" && "border-danger bg-danger",
                b === "atual" && "border-accent bg-[linear-gradient(90deg,var(--accent)_50%,transparent_50%)]",
                b === "pendente" && "border-border bg-transparent",
              )}
            />
          ))}
        </span>
        <span className="tabular text-muted-foreground">
          {indice + 1}/{bolinhas.length}
        </span>
      </span>
      {rotuloHabilidade && <span className="hidden truncate text-muted-foreground md:inline">{rotuloHabilidade}</span>}
      <span className="ml-auto flex items-center gap-2">
        {mostrarTimer && (
          <span className="tabular text-muted-foreground" aria-label="tempo nesta questão">
            {formatarTempo(segundos)}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-pressed={foco} aria-label="Modo foco" onClick={aoAlternarFoco}>
              {foco ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            Modo foco <Kbd>F</Kbd>
          </TooltipContent>
        </Tooltip>
      </span>
    </header>
  );
}
