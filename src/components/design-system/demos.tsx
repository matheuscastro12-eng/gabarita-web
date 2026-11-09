"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/** Amostra de cor: lê o valor atual do token (muda com o tema). */
export function AmostraCor({ token, classe, papel }: { token: string; classe: string; papel: string }) {
  const { resolvedTheme } = useTheme();
  const [valor, setValor] = React.useState("");
  React.useEffect(() => {
    const id = requestAnimationFrame(() =>
      setValor(getComputedStyle(document.documentElement).getPropertyValue(token).trim()),
    );
    return () => cancelAnimationFrame(id);
  }, [token, resolvedTheme]);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={cn("size-12 shrink-0 rounded-md border border-border", classe)} aria-hidden />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-mono text-xs text-foreground">{token}</span>
        <span className="truncate text-xs text-muted-foreground">{papel}</span>
        <span className="num truncate text-xs text-muted-foreground">{valor || "…"}</span>
      </div>
    </div>
  );
}

export function DemoDialogo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">Abrir diálogo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zerar o progresso?</DialogTitle>
          <DialogDescription>Exemplo: as tentativas somem deste navegador. O backup exportado continua valendo.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="erro">Zerar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DemoToast() {
  const { notificar } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => notificar({ titulo: "Meta 5 salva.", tipo: "sucesso" })}>
        Toast de sucesso
      </Button>
      <Button
        variant="outline"
        onClick={() => notificar({ titulo: "Não consegui salvar", descricao: "Exemplo: tente de novo.", tipo: "erro" })}
      >
        Toast de erro
      </Button>
      <Button
        variant="outline"
        onClick={() => notificar({ titulo: "Progresso só em memória", descricao: "Exemplo de aviso.", tipo: "aviso" })}
      >
        Toast de aviso
      </Button>
    </div>
  );
}

export function DemoTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className="w-fit">Passe o mouse</Button>
      </TooltipTrigger>
      <TooltipContent>
        Abrir a paleta <Kbd>Ctrl+K</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

const ANIMACOES = ["anim-entrada", "anim-pop", "anim-assenta", "anim-shake"];

export function DemoMovimento() {
  const [rodada, setRodada] = React.useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ANIMACOES.map((a) => (
          <div key={`${a}-${rodada}`} className="flex flex-col items-center gap-2">
            <div className={cn("size-14 rounded-lg border border-border bg-accent", a)} aria-hidden />
            <span className="font-mono text-xs text-muted-foreground">{a}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setRodada((r) => r + 1)}>
          Repetir
        </Button>
        <p className="text-sm text-muted-foreground">
          160ms, cubic-bezier(.2,0,0,1); só transform e opacity; some com prefers-reduced-motion
        </p>
      </div>
    </div>
  );
}
