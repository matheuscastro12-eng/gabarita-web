import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Tag do original: fundo no cinza da página, texto muted, raio 8px, 12px/700; variantes azul/verde/âmbar/vermelho suaves. */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2.25 py-0.75 text-xs font-bold leading-5 whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-background text-muted-foreground dark:bg-surface-2",
        accent: "bg-accent-soft text-accent-text",
        success: "bg-success-soft text-success-text",
        danger: "bg-danger-soft text-danger-text",
        warning: "bg-warning-soft text-warning-text",
        outline: "border-[1.5px] border-border bg-transparent text-muted-foreground",
        solid: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
