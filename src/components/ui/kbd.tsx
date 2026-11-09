import * as React from "react";
import { cn } from "@/lib/utils";

/** Tecla de atalho: discreta, 20px. Dentro do botão primário a borda e o texto viram primary-foreground (ver button.tsx). */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-border bg-background px-1",
        "font-mono text-[11px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
