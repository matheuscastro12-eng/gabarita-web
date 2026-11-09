import * as React from "react";
import { cn } from "@/lib/utils";

export type EstadoBolha = "vazia" | "marcada" | "meia" | "certa" | "errada" | "feita";
export type TamanhoBolha = "xs" | "sm" | "md";

const estados: Record<EstadoBolha, string> = {
  vazia: "border-input bg-background text-texto-2",
  marcada: "border-primary bg-primary text-primary-foreground",
  meia: "border-primary bg-[linear-gradient(90deg,var(--cor-primaria)_50%,transparent_50%)] text-texto-2",
  certa: "border-sucesso-forte bg-sucesso-forte text-sucesso-contraste",
  errada: "border-erro-forte bg-erro-forte text-erro-contraste",
  feita: "border-primary bg-primary text-primary-foreground",
};

const tamanhos: Record<TamanhoBolha, string> = {
  xs: "size-3",
  sm: "size-5 [&_svg]:size-3",
  md: "size-7 font-mono text-[13px] font-medium",
};

export type BolhaProps = Omit<React.ComponentProps<"span">, "children"> & {
  estado?: EstadoBolha;
  tamanho?: TamanhoBolha;
  children?: React.ReactNode;
};

/**
 * A bolha do cartão-resposta (assinatura do sistema). Decorativa por padrão
 * (`aria-hidden`): quem usa dá o nome acessível.
 */
function Bolha({ estado = "vazia", tamanho = "sm", children, className, ...props }: BolhaProps) {
  return (
    <span
      aria-hidden
      data-slot="bolha"
      data-estado={estado}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] leading-none",
        "transition-colors duration-(--duracao) ease-(--curva)",
        estados[estado],
        tamanhos[tamanho],
        className,
      )}
      {...props}
    >
      {tamanho === "xs" ? null : children}
    </span>
  );
}

export { Bolha };
