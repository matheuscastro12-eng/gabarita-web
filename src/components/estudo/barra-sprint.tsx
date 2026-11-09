"use client";

import * as React from "react";
import { FlaskConical, Maximize2, Minimize2 } from "lucide-react";
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
  /** Abre a gaveta do Laboratório (opcional: o simulado não tem). */
  aoAbrirLaboratorio?: () => void;
}

export function formatarTempo(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Caixa do cronômetro do original: monoespaçada, dentro de uma tag. */
export function CaixaTempo({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("rounded-sm bg-background px-2 py-0.5 font-mono text-[13px] font-semibold text-muted-foreground dark:bg-surface-2", className)} {...props}>
      {children}
    </span>
  );
}

/** Barra superior da IDE: marca, ●●◐○○, habilidade, timer discreto, Laboratório e modo foco. */
export function BarraSprint({ bolinhas, indice, rotuloHabilidade, segundos, mostrarTimer, foco, aoAlternarFoco, aoAbrirLaboratorio }: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-surface px-4 text-sm">
      <span className="flex items-center gap-2 font-rounded text-base font-extrabold">
        <Logo className="size-5" />
        <span className="hidden sm:inline">Gabarita</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="hidden text-muted-foreground sm:inline">Sprint</span>
        <span className="flex items-center gap-1.25" role="img" aria-label={`questão ${indice + 1} de ${bolinhas.length}`}>
          {bolinhas.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "size-2.5 rounded-full border-[1.5px]",
                b === "acertou" && "border-success bg-success",
                b === "errou" && "border-danger bg-danger",
                b === "atual" && "border-accent bg-[linear-gradient(90deg,var(--accent)_50%,transparent_50%)]",
                b === "pendente" && "border-border bg-transparent",
              )}
            />
          ))}
        </span>
        <span className="num text-muted-foreground">
          {indice + 1}/{bolinhas.length}
        </span>
      </span>
      {rotuloHabilidade && <span className="hidden truncate text-muted-foreground md:inline">{rotuloHabilidade}</span>}
      <span className="ml-auto flex items-center gap-1.5">
        {mostrarTimer && <CaixaTempo aria-label="tempo nesta questão">{formatarTempo(segundos)}</CaixaTempo>}
        {aoAbrirLaboratorio && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Abrir o Laboratório" onClick={aoAbrirLaboratorio} data-testid="abrir-laboratorio" className="text-muted-foreground hover:text-foreground">
                <FlaskConical strokeWidth={1.8} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              Laboratório <Kbd>L</Kbd>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-pressed={foco} aria-label="Modo foco" onClick={aoAlternarFoco} className="text-muted-foreground hover:text-foreground">
              {foco ? <Minimize2 strokeWidth={1.8} /> : <Maximize2 strokeWidth={1.8} />}
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
