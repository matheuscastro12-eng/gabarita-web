"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FlaskConical, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { EditorPython } from "./editor-python";
import { Plotador } from "./plotador";

/** O Laboratório como gaveta lateral dentro da IDE (Radix Dialog ancorado à direita). */
export function GavetaLaboratorio({ aberta, aoMudar }: { aberta: boolean; aoMudar: (aberta: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={aberta} onOpenChange={aoMudar}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(29,29,31,0.35)] data-[state=open]:anim-fade-in data-[state=closed]:anim-fade-out dark:bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid="gaveta-laboratorio"
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-surface text-foreground shadow-flutuante md:inset-y-3 md:right-3 md:rounded-xl",
            "data-[state=open]:anim-slide-in-right data-[state=closed]:anim-fade-out",
          )}
        >
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <FlaskConical className="size-4 text-accent" strokeWidth={1.8} />
            <DialogPrimitive.Title className="text-sm font-bold">Laboratório</DialogPrimitive.Title>
            <span className="text-xs text-muted-foreground">
              gaveta · <Kbd>L</Kbd> abre e <Kbd>Esc</Kbd> fecha
            </span>
            <DialogPrimitive.Close className="ml-auto inline-flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-surface-2 hover:text-foreground dark:bg-surface-2" aria-label="Fechar o Laboratório">
              <X className="size-5" />
            </DialogPrimitive.Close>
          </header>
          <Tabs defaultValue="python" className="min-h-0 flex-1 gap-0">
            <TabsList className="mx-4 mt-3">
              <TabsTrigger value="python">Python + SymPy</TabsTrigger>
              <TabsTrigger value="grafico">Gráfico</TabsTrigger>
            </TabsList>
            <TabsContent value="python" className="min-h-0 overflow-y-auto px-4 py-4">
              <EditorPython compacto />
            </TabsContent>
            <TabsContent value="grafico" className="min-h-0 overflow-y-auto px-4 py-4">
              <Plotador compacto />
            </TabsContent>
          </Tabs>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
