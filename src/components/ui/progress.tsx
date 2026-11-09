"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Valor de 0 a 100. */
  value?: number;
  tom?: "destaque" | "sucesso" | "erro" | "aviso" | "neutral";
};

const tons = {
  destaque: "bg-primary",
  sucesso: "bg-sucesso-forte",
  erro: "bg-erro-forte",
  aviso: "bg-aviso",
  neutral: "bg-muted-foreground/50",
};

/** Barra do original: 11px de altura, pílula, trilho no cinza da página. */
function Progress({ className, value = 0, tom = "destaque", ...props }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  // Começa vazia e cresce até o valor depois de montar (transform; 0ms com reduced motion).
  const [montada, setMontada] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMontada(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-[11px] w-full overflow-hidden rounded-full bg-muted", className)}
      value={v}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full rounded-full transition-transform duration-[240ms] ease-(--curva)", tons[tom])}
        style={{ transform: `translateX(-${100 - (montada ? v : 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
