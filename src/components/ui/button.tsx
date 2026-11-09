import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Botões do Cartão-resposta: raio de controle (8px), peso 500, tinta azul só no primário. */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-[background-color,color,border-color,transform,opacity] duration-(--duracao) ease-(--curva)",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.1em]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primaria-hover [&_kbd]:border-primary-foreground/40 [&_kbd]:bg-transparent [&_kbd]:text-primary-foreground",
        secondary: "bg-muted text-foreground hover:bg-muted-forte",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        outline: "border border-input bg-background text-foreground hover:bg-muted",
        erro: "bg-erro-suave text-erro hover:bg-erro-forte hover:text-erro-contraste",
        link: "text-primaria-texto underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm pointer-coarse:min-h-11",
        md: "h-9 px-4 text-sm pointer-coarse:min-h-11",
        lg: "h-11 px-5 text-base pointer-coarse:min-h-11",
        icon: "size-9 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        "icon-sm": "size-8 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Renderiza o filho como o próprio elemento (ex.: Link). */
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
