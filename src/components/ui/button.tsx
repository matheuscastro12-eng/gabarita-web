import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Botões do original: pílula azul (primário), pílula no cinza do fundo (ghost), chip com borda 1,5px (outline). */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold",
    "transition-[background-color,color,border-color,transform,opacity] duration-(--duracao) ease-(--curva)",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.1em]",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primaria-hover",
        secondary: "bg-muted text-foreground hover:bg-muted-forte",
        ghost: "bg-transparent text-foreground hover:bg-muted font-semibold",
        outline: "border-[1.5px] border-border bg-card text-foreground hover:border-primary hover:text-primaria-texto font-semibold",
        erro: "bg-erro-suave text-erro hover:bg-erro-forte hover:text-erro-contraste",
        link: "text-primaria-texto underline-offset-4 hover:underline font-semibold",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
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
