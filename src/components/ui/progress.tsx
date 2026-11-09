"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Valor de 0 a 100. */
  value?: number;
  tom?: "accent" | "success" | "danger" | "neutral";
};

const tons = {
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
};

function Progress({ className, value = 0, tom = "accent", ...props }: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
      value={v}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full rounded-full transition-transform duration-(--duration) ease-(--ease)",
          tons[tom],
        )}
        style={{ transform: `translateX(-${100 - v}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
