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
        "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-medium text-muted-foreground",
        "transition-[background-color,color] duration-(--duration) ease-(--ease)",
        "hover:bg-background hover:text-foreground dark:hover:bg-surface-2",
        ativo && "bg-accent-soft font-semibold text-accent-text hover:bg-accent-soft hover:text-accent-text",
      )}
    >
      <Icone className="size-[18px] shrink-0" strokeWidth={1.8} />
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

/** Barra lateral do original: 210px, branca, marca com capelo, rótulo MENU e itens com ícone de traço. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex h-full w-[210px] shrink-0 flex-col bg-surface px-3 pt-7 pb-4 dark:border-r dark:border-border">
      {NAVEGACAO.map((item) => (
        <AtalhoNavegacao key={item.href} item={item} />
      ))}
      <Marca className="px-2.5 pb-6" />
      <p className="px-2.5 pb-2 text-[10px] font-bold tracking-[1px] text-muted-foreground uppercase" aria-hidden>
        Menu
      </p>
      <ul className="flex flex-col gap-0.5">
        {NAVEGACAO.map((item) => (
          <li key={item.href}>
            <ItemLateral item={item} ativo={itemAtivo(pathname, item.href)} />
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-1">
        <ThemeToggle />
      </div>
    </nav>
  );
}

/** Marca: capelo azul + "Gabarita" em fonte arredondada, peso 800. */
export function Marca({ className, compacta = false }: { className?: string; compacta?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Gabarita, início"
      className={cn("flex items-center gap-2 font-rounded font-extrabold text-foreground", compacta ? "text-base" : "text-xl", className)}
    >
      <Logo className={compacta ? "size-5" : "size-[22px]"} />
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
      className={cn("size-6 shrink-0 text-accent", className)}
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
      className="flex h-[52px] shrink-0 items-center gap-0.5 overflow-x-auto bg-surface px-2 shadow-card [scrollbar-width:none] dark:border-b dark:border-border"
    >
      <Marca compacta className="shrink-0 px-2" />
      <ul className="flex items-center gap-0.5">
        {NAVEGACAO.map((item) => {
          const ativo = itemAtivo(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-[10px] px-2.5 py-2 text-[12.5px] font-medium text-muted-foreground",
                  ativo && "bg-accent-soft font-semibold text-accent-text",
                )}
              >
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="ml-auto shrink-0 pl-1">
        <ThemeToggle compacto />
      </div>
    </nav>
  );
}
