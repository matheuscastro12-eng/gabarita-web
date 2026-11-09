import * as React from "react";
import { origemDosDados } from "@/data/carregar";
import { cn } from "@/lib/utils";

/** Cabeçalho padrão das telas: título grande (28px/800), descrição curta e ações à direita. */
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
        <h1 className="text-[22px] font-extrabold tracking-[-0.4px] md:text-2xl">{titulo}</h1>
        {descricao && <p className="max-w-prose text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </header>
  );
}

/** Área de conteúdo (main do original: padding 26px 28px, largura máxima 1060px, alinhada à esquerda) com rolagem própria. */
export function ConteudoPagina({ className, children, semRodape = false, ...props }: React.ComponentProps<"div"> & { semRodape?: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={cn("entrada-stagger flex w-full max-w-[1060px] flex-col gap-5 px-3 pt-4 pb-10 md:px-7 md:pt-6.5", className)} {...props}>
        {children}
      </div>
      {!semRodape && <RodapeFonte />}
    </div>
  );
}

/** Rodapé discreto do original, com a fonte dos dados. */
export function RodapeFonte({ className }: { className?: string }) {
  const origem = origemDosDados();
  return (
    <footer className={cn("max-w-[1060px] px-4 pb-8 text-center text-[11.5px] leading-relaxed text-muted-foreground md:px-7", className)}>
      {origem.fixture
        ? `Dados de desenvolvimento (fixture): ${origem.total} questões reais do ENEM 2023, via enem.dev`
        : `${origem.total} questões oficiais do INEP (transcrição enem.dev)`}
      {" · nota TRI sempre estimada · explicações do tutor podem conter erros · seu progresso fica salvo neste navegador"}
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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-card-borda bg-surface px-6 py-12 text-center shadow-card">
      {icone && (
        <div className="inline-flex size-12 items-center justify-center rounded-[12px] bg-accent-soft text-accent [&_svg]:size-6">{icone}</div>
      )}
      <h2 className="text-lg font-bold">{titulo}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>
      {acao && <div className="pt-2">{acao}</div>}
    </div>
  );
}
