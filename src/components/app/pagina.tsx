import * as React from "react";
import { cn } from "@/lib/utils";

/** Cabeçalho padrão das telas: título, descrição curta e ações à direita. */
export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
  className,
}: {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="max-w-prose text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </header>
  );
}

/** Área de conteúdo com largura confortável e rolagem própria. */
export function ConteudoPagina({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 md:px-8", className)} {...props} />
    </div>
  );
}

/** Estado vazio: diz por que está vazio e qual é a próxima ação. */
export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: React.ReactNode;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {icone && <div className="text-muted-foreground [&_svg]:size-8">{icone}</div>}
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>
      {acao && <div className="pt-2">{acao}</div>}
    </div>
  );
}
