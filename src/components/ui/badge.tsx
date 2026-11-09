import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Tag do original: fundo no cinza da página, texto muted, raio 8px, 12px/700; variantes azul/verde/âmbar/vermelho suaves. */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2.25 py-0.75 text-xs font-semibold leading-5 whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        destaque: "bg-accent text-primaria-texto",
        sucesso: "bg-sucesso-suave text-sucesso",
        erro: "bg-erro-suave text-erro",
        aviso: "bg-aviso-suave text-aviso",
        outline: "border-[1.5px] border-border bg-transparent text-muted-foreground",
        solid: "bg-primary text-primary-foreground",
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
