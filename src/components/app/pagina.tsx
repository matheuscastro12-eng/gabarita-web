import * as React from "react";
import { origemDosDados } from "@/data/carregar";
import { cn } from "@/lib/utils";

/** Cabeçalho padrão das telas: título 20/24px semibold, descrição curta e ações à direita. */
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
    <header className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-3", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold md:text-2xl">{titulo}</h1>
        {descricao && <p className="max-w-prose text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </header>
  );
}

/** Área de conteúdo: largura máxima 1400px centralizada, com rolagem própria. */
export function ConteudoPagina({ className, children, semRodape = false, ...props }: React.ComponentProps<"div"> & { semRodape?: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className={cn("entrada-stagger mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-5 md:px-8 md:py-7", className)} {...props}>
        {children}
      </div>
      {!semRodape && <RodapeFonte />}
    </div>
  );
}

/** Rodapé discreto com a fonte dos dados. */
export function RodapeFonte({ className }: { className?: string }) {
  const origem = origemDosDados();
  return (
    <footer className={cn("mx-auto max-w-[1400px] px-4 pb-8 md:px-8", className)}>
      <p className="border-t border-border pt-4 text-left text-xs leading-relaxed text-muted-foreground">
      {origem.fixture
        ? `Dados de desenvolvimento (fixture): ${origem.total} questões reais do ENEM 2023, via enem.dev`
        : `${origem.total} questões oficiais do INEP (transcrição enem.dev)`}
      {" · nota TRI sempre estimada · explicações do tutor podem conter erros · seu progresso fica salvo neste navegador"}
      </p>
    </footer>
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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center">
      {icone && (
        <div className="inline-flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-6">{icone}</div>
      )}
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>
      {acao && <div className="pt-2">{acao}</div>}
    </div>
  );
}
