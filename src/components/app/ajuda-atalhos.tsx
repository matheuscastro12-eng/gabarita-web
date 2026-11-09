"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useAtalho, useListaAtalhos } from "@/lib/atalhos/provider";
import { teclasParaExibir, type Atalho } from "@/lib/atalhos/registro";
import { useEhMac } from "@/lib/use-cliente";

interface Props {
  aberta: boolean;
  aoMudar: (aberta: boolean) => void;
}

const ORDEM_GRUPOS = ["Geral", "Questão", "Tutor", "Sprint", "Navegação"];

function agrupar(atalhos: Atalho[]): [string, Atalho[]][] {
  const grupos = new Map<string, Atalho[]>();
  for (const a of atalhos) {
    const lista = grupos.get(a.grupo) ?? [];
    lista.push(a);
    grupos.set(a.grupo, lista);
  }
  return [...grupos.entries()].sort(([a], [b]) => {
    const ia = ORDEM_GRUPOS.indexOf(a);
    const ib = ORDEM_GRUPOS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

/** Overlay com todos os atalhos registrados (tecla ?). */
export function AjudaAtalhos({ aberta, aoMudar }: Props) {
  const atalhos = useListaAtalhos();
  const mac = useEhMac();

  useAtalho({
    id: "ajuda",
    combinacao: "?",
    descricao: "Mostrar os atalhos de teclado",
    grupo: "Geral",
    acao: () => aoMudar(!aberta),
  });

  const grupos = agrupar(atalhos);

  return (
    <Dialog open={aberta} onOpenChange={aoMudar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>Dá para fazer um sprint inteiro sem tirar a mão do teclado.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-6 overflow-y-auto pr-1 sm:grid-cols-2">
          {grupos.map(([grupo, lista]) => (
            <section key={grupo} className="flex flex-col gap-2">
              <h3 className="text-[10px] font-semibold tracking-[1px] text-muted-foreground uppercase">{grupo}</h3>
              <ul className="flex flex-col divide-y divide-border">
                {lista.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-1.5 text-sm">
                    <span className={a.ativo === false ? "text-muted-foreground" : undefined}>{a.descricao}</span>
                    <span className="flex shrink-0 gap-1">
                      {teclasParaExibir(a.combinacao, mac).map((t) => (
                        <Kbd key={t}>{t}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
