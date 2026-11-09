"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAtalho } from "@/lib/atalhos/provider";
import { NAVEGACAO, itemAtivo, type ItemNavegacao } from "./navegacao";
import { ThemeToggle } from "./theme-toggle";

function ItemLateral({ item, ativo }: { item: ItemNavegacao; ativo: boolean }) {
  const Icone = item.icone;
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      title={`${item.rotulo} (Alt+${item.indice})`}
      className={cn(
        "group relative flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-texto-2",
        "transition-colors duration-(--duracao) ease-(--curva) hover:bg-muted",
        ativo &&
          "bg-muted font-semibold text-foreground before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
      )}
    >
      <Icone className={cn("size-4 shrink-0", ativo ? "text-foreground" : "text-muted-foreground")} strokeWidth={1.5} />
      <span className="truncate">{item.rotulo}</span>
    </Link>
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

/** Barra lateral: 232px, papel branco com linha à direita, marca com capelo e itens com ícone de traço. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-background px-3 pt-5 pb-3">
      {NAVEGACAO.map((item) => (
        <AtalhoNavegacao key={item.href} item={item} />
      ))}
      <Marca className="px-2.5 pb-6" />
      <ul className="flex flex-col gap-0.5">
        {NAVEGACAO.map((item) => (
          <li key={item.href}>
            <ItemLateral item={item} ativo={itemAtivo(pathname, item.href)} />
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2">
        <ThemeToggle />
      </div>
    </nav>
  );
}

/** Marca: capelo azul + "Gabarita" 16px/600. */
export function Marca({ className, compacta = false }: { className?: string; compacta?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Gabarita, início"
      className={cn("flex items-center text-base font-semibold text-foreground", compacta ? "gap-1.5" : "gap-2", className)}
    >
      <Logo className="size-5" />
      <span>Gabarita</span>
    </Link>
  );
}

/** Ícone do capelo do original (traço, pontas arredondadas), em azul. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("size-6 shrink-0 text-primary", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.5L2 8.3l10 4.8 10-4.8-10-4.8z" />
      <path d="M6.2 10.8v4.4c0 1.6 2.6 2.9 5.8 2.9s5.8-1.3 5.8-2.9v-4.4" />
      <path d="M22 8.3v5.2" />
    </svg>
  );
}

/** Celular (< md): barra superior fixa com a marca e os destinos em linha rolável, como no original. */
export function BarraSuperior() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="flex h-12 shrink-0 items-stretch gap-0.5 overflow-x-auto border-b border-border bg-background px-2 [scrollbar-width:none]"
    >
      <Marca compacta className="shrink-0 px-2" />
      <ul className="flex items-stretch">
        {NAVEGACAO.map((item) => {
          const ativo = itemAtivo(pathname, item.href);
          return (
            <li key={item.href} className="flex shrink-0">
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "relative flex h-full items-center px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  ativo &&
                    "font-semibold text-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:bg-primary",
                )}
              >
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="ml-auto flex shrink-0 items-center pl-1">
        <ThemeToggle compacto />
      </div>
    </nav>
  );
}
