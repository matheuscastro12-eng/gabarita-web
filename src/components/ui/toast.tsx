"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TipoToast = "info" | "sucesso" | "erro" | "aviso";

export interface ToastOpcoes {
  titulo: string;
  descricao?: string;
  tipo?: TipoToast;
  /** Duração em ms (padrão 4000). */
  duracao?: number;
}

interface ToastItem extends ToastOpcoes {
  id: number;
}

interface ToastContexto {
  notificar: (opcoes: ToastOpcoes) => void;
}

const Contexto = React.createContext<ToastContexto | null>(null);

const icones: Record<TipoToast, React.ComponentType<{ className?: string }>> = {
  info: Info,
  sucesso: CheckCircle2,
  erro: XCircle,
  aviso: TriangleAlert,
};

const cores: Record<TipoToast, string> = {
  info: "text-accent-text",
  sucesso: "text-success",
  erro: "text-danger",
  aviso: "text-warning",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = React.useState<ToastItem[]>([]);
  const proximoId = React.useRef(1);

  const notificar = React.useCallback((opcoes: ToastOpcoes) => {
    const id = proximoId.current++;
    setItens((atual) => [...atual.slice(-3), { ...opcoes, id }]);
  }, []);

  const remover = React.useCallback((id: number) => {
    setItens((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const valor = React.useMemo(() => ({ notificar }), [notificar]);

  return (
    <Contexto.Provider value={valor}>
      <ToastPrimitive.Provider swipeDirection="right" label="Notificações">
        {children}
        {itens.map((t) => {
          const tipo = t.tipo ?? "info";
          const Icone = icones[tipo];
          return (
            <ToastPrimitive.Root
              key={t.id}
              duration={t.duracao ?? 4000}
              onOpenChange={(aberto) => {
                if (!aberto) remover(t.id);
              }}
              className={cn(
                "group pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border border-card-borda bg-surface p-4 pr-10 shadow-flutuante",
                "data-[state=open]:anim-slide-in-right data-[state=closed]:anim-fade-out",
                "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=cancel]:translate-x-0",
              )}
            >
              <Icone className={cn("mt-0.5 size-5 shrink-0", cores[tipo])} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <ToastPrimitive.Title className="text-sm font-bold">{t.titulo}</ToastPrimitive.Title>
                {t.descricao && (
                  <ToastPrimitive.Description className="text-sm text-muted-foreground">
                    {t.descricao}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Fechar"
                className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </Contexto.Provider>
  );
}

export function useToast(): ToastContexto {
  const ctx = React.useContext(Contexto);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return ctx;
}
