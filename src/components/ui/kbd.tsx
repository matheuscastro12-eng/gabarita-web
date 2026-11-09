import * as React from "react";
import { cn } from "@/lib/utils";

/** Tecla de atalho: discreta, no cinza da página. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-[6px] border border-border bg-background px-1.5",
        "font-mono text-[11px] font-semibold text-muted-foreground dark:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
