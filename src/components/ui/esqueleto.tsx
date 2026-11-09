import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bloco de carregamento estático (sem piscar): a estrutura da tela aparece
 * estável enquanto o estado vem do IndexedDB.
 */
function Esqueleto({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden data-slot="esqueleto" className={cn("rounded-md bg-surface-2", className)} {...props} />;
}

/** Linhas de texto falsas com larguras variadas. */
function EsqueletoTexto({ linhas = 3, className }: { linhas?: number; className?: string }) {
  const larguras = ["w-full", "w-11/12", "w-3/4", "w-5/6", "w-2/3"];
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} className={cn("h-4", larguras[i % larguras.length])} />
      ))}
    </div>
  );
}

export { Esqueleto, EsqueletoTexto };
