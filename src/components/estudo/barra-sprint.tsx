"use client";

import * as React from "react";
import { Clock, FlaskConical, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bolha, type EstadoBolha } from "@/components/ui/bolha";

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

/** Cronômetro: mono, ícone de relógio, sem fundo. No alerta do simulado o chamador passa `rounded-sm bg-aviso-suave text-aviso px-1.5`. */
export function CaixaTempo({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("num inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground [&.bg-aviso-suave]:px-1.5", className)} {...props}>
      <Clock className="size-3.5" strokeWidth={1.5} aria-hidden />
      {children}
    </span>
  );
}

const estadoDaBolinha: Record<EstadoBolinha, EstadoBolha> = {
  acertou: "certa",
  errou: "errada",
  atual: "meia",
  pendente: "vazia",
};

/** Barra superior da IDE: marca, ●●◐○○, habilidade, timer discreto, Laboratório e modo foco. */
export function BarraSprint({ bolinhas, indice, rotuloHabilidade, segundos, mostrarTimer, foco, aoAlternarFoco, aoAbrirLaboratorio }: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 text-sm sm:gap-4">
      <span className="flex items-center gap-3">
        <span className="hidden text-sm font-semibold sm:inline">Sprint</span>
        <span className="flex items-center gap-1.5" role="img" aria-label={`questão ${indice + 1} de ${bolinhas.length}`}>
          {bolinhas.map((b, i) => (
            <Bolha key={`${i}-${b}`} tamanho="xs" estado={estadoDaBolinha[b]} className={cn((b === "acertou" || b === "errou") && "anim-pop")} />
          ))}
        </span>
        <span className="num text-sm text-muted-foreground">
          {indice + 1}/{bolinhas.length}
        </span>
      </span>
      {rotuloHabilidade && <RotuloHabilidade texto={rotuloHabilidade} />}
      <span className="ml-auto flex items-center gap-2">
        {mostrarTimer && <CaixaTempo aria-label="tempo nesta questão">{formatarTempo(segundos)}</CaixaTempo>}
        {aoAbrirLaboratorio && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Abrir o Laboratório" onClick={aoAbrirLaboratorio} data-testid="abrir-laboratorio">
                <FlaskConical strokeWidth={1.5} className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              Laboratório <Kbd>L</Kbd>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-pressed={foco} aria-label="Modo foco" onClick={aoAlternarFoco}>
              {foco ? <Minimize2 strokeWidth={1.5} className="size-4" /> : <Maximize2 strokeWidth={1.5} className="size-4" />}
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

/** "{nome} · {H}" com o código em mono (só `md`+). */
function RotuloHabilidade({ texto }: { texto: string }) {
  const corte = texto.lastIndexOf(" · ");
  const nome = corte >= 0 ? texto.slice(0, corte) : texto;
  const codigo = corte >= 0 ? texto.slice(corte + 3) : null;
  return (
    <span className="hidden min-w-0 truncate border-l border-border pl-4 text-sm text-muted-foreground md:inline">
      {nome}
      {codigo && (
        <>
          {" · "}
          <span className="num">{codigo}</span>
        </>
      )}
    </span>
  );
}
