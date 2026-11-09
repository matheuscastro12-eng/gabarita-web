"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAtalho } from "@/lib/atalhos/provider";
import { NAVEGACAO, itemAtivo, type ItemNavegacao } from "./navegacao";
import { ThemeToggle } from "./theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";

function ItemLateral({ item, ativo }: { item: ItemNavegacao; ativo: boolean }) {
  const Icone = item.icone;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          aria-current={ativo ? "page" : undefined}
          aria-label={item.rotulo}
          className={cn(
            "relative flex size-11 items-center justify-center rounded-md text-muted-foreground",
            "transition-[background-color,color] duration-(--duration) ease-(--ease)",
            "hover:bg-surface-2 hover:text-foreground",
            ativo && "bg-surface-2 text-foreground",
          )}
        >
          {ativo && <span aria-hidden className="absolute top-2 bottom-2 -left-3 w-0.5 rounded-full bg-accent" />}
          <Icone className="size-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {item.rotulo}
        <Kbd>Alt+{item.indice}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function AtalhoNavegacao({ item }: { item: ItemNavegacao }) {
  const router = useRouter();
  useAtalho({
    id: `nav-${item.indice}`,
    combinacao: `alt+${item.indice}`,
    descricao: `Ir para ${item.rotulo}`,
    grupo: "Navegação",
    emCampos: true,
    acao: () => router.push(item.href),
  });
  return null;
}

/** Barra lateral estreita: logo, seis destinos, tema. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-background px-2.5 py-3"
    >
      {NAVEGACAO.map((item) => (
        <AtalhoNavegacao key={item.href} item={item} />
      ))}
      <Link
        href="/"
        aria-label="Gabarita, início"
        className="mb-2 flex size-11 items-center justify-center rounded-md text-accent-text"
      >
        <Logo />
      </Link>
      {NAVEGACAO.map((item) => (
        <ItemLateral key={item.href} item={item} ativo={itemAtivo(pathname, item.href)} />
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        <ThemeToggle />
      </div>
    </nav>
  );
}

/** Marca: um losango (gabarito marcado) em âmbar. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)} fill="none">
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m8.5 12 2.4 2.4L15.5 9.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Navegação inferior para telas estreitas. */
export function BarraInferior() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="flex h-16 shrink-0 items-stretch justify-around border-t border-border bg-background px-1"
    >
      {NAVEGACAO.map((item) => {
        const ativo = itemAtivo(pathname, item.href);
        const Icone = item.icone;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] text-muted-foreground",
              ativo && "text-accent-text",
            )}
          >
            <Icone className="size-5" />
            <span>{item.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
