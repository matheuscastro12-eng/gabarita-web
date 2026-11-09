"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMontado } from "@/lib/use-cliente";
import { cn } from "@/lib/utils";

/** Alterna claro/escuro. Na barra lateral vira um item de menu; `compacto` é só o ícone (barra superior do celular). */
export function ThemeToggle({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const escuro = montado ? resolvedTheme === "dark" : false;
  const rotulo = escuro ? "Mudar para o modo claro" : "Mudar para o modo escuro";
  const Icone = escuro ? Sun : Moon;

  if (compacto) {
    return (
      <button
        type="button"
        aria-label={rotulo}
        title={rotulo}
        onClick={() => setTheme(escuro ? "light" : "dark")}
        className={cn("inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:size-11", className)}
      >
        <Icone className="size-4" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={rotulo}
      onClick={() => setTheme(escuro ? "light" : "dark")}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-texto-2",
        "transition-colors duration-(--duracao) ease-(--curva) hover:bg-muted",
        className,
      )}
    >
      <Icone className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <span>{escuro ? "Modo claro" : "Modo escuro"}</span>
    </button>
  );
}
