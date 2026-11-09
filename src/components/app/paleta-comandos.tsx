"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Keyboard, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useAtalho, useListaAtalhos } from "@/lib/atalhos/provider";
import { teclasParaExibir } from "@/lib/atalhos/registro";
import { useEhMac } from "@/lib/use-cliente";
import { NAVEGACAO } from "./navegacao";

interface Props {
  aberta: boolean;
  aoMudar: (aberta: boolean) => void;
  abrirAjuda: () => void;
}

/** Paleta de comandos (Ctrl/Cmd+K): navegação, tema, ajuda e todos os atalhos ativos. */
export function PaletaComandos({ aberta, aoMudar, abrirAjuda }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const atalhos = useListaAtalhos();
  const mac = useEhMac();

  useAtalho({
    id: "paleta",
    combinacao: "mod+k",
    descricao: "Abrir a paleta de comandos",
    grupo: "Geral",
    emCampos: true,
    acao: () => aoMudar(!aberta),
  });

  const executar = (fn: () => void) => () => {
    aoMudar(false);
    // Deixa o diálogo fechar antes de agir (evita foco preso).
    setTimeout(fn, 0);
  };

  const acoesDeTela = atalhos.filter((a) => a.grupo !== "Navegação" && a.grupo !== "Geral" && a.ativo !== false);

  return (
    <Dialog open={aberta} onOpenChange={aoMudar}>
      <DialogContent semFechar className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
        <Command label="Paleta de comandos" className="flex flex-col">
          <Command.Input
            autoFocus
            placeholder="O que você quer fazer?"
            className="h-13 w-full border-b border-border bg-transparent px-5 text-base font-medium outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nada encontrado.
            </Command.Empty>
            <Command.Group heading="Ir para" className="cmdk-grupo">
              {NAVEGACAO.map((item) => {
                const Icone = item.icone;
                return (
                  <Command.Item
                    key={item.href}
                    value={`ir ${item.rotulo}`}
                    onSelect={executar(() => router.push(item.href))}
                    className="cmdk-item"
                  >
                    <Icone className="size-4 text-muted-foreground" />
                    <span className="flex-1">{item.rotulo}</span>
                    <Kbd>Alt+{item.indice}</Kbd>
                  </Command.Item>
                );
              })}
            </Command.Group>
            {acoesDeTela.length > 0 && (
              <Command.Group heading="Nesta tela" className="cmdk-grupo">
                {acoesDeTela.map((a) => (
                  <Command.Item key={a.id} value={`${a.descricao} ${a.combinacao}`} onSelect={executar(a.acao)} className="cmdk-item">
                    <span className="flex-1">{a.descricao}</span>
                    <span className="flex gap-1">
                      {teclasParaExibir(a.combinacao, mac).map((t) => (
                        <Kbd key={t}>{t}</Kbd>
                      ))}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            <Command.Group heading="Geral" className="cmdk-grupo">
              <Command.Item
                value="tema claro escuro alternar"
                onSelect={executar(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
                className="cmdk-item"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-4 text-muted-foreground" />
                ) : (
                  <Moon className="size-4 text-muted-foreground" />
                )}
                <span className="flex-1">
                  {resolvedTheme === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
                </span>
              </Command.Item>
              <Command.Item value="atalhos ajuda teclado" onSelect={executar(abrirAjuda)} className="cmdk-item">
                <Keyboard className="size-4 text-muted-foreground" />
                <span className="flex-1">Ver atalhos de teclado</span>
                <Kbd>?</Kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
