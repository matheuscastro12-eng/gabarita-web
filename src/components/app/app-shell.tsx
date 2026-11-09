"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AjudaAtalhos } from "./ajuda-atalhos";
import { PaletaComandos } from "./paleta-comandos";
import { BarraSuperior, Sidebar } from "./sidebar";
import { AvisoArmazenamento } from "./aviso-armazenamento";
import { TelaEntrada } from "./tela-entrada";
import { useVersao } from "./versao";

/**
 * Casca do app: barra lateral (desktop) ou barra superior (celular), conteúdo,
 * paleta de comandos e ajuda de atalhos. O modo foco esconde a navegação.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletaAberta, setPaletaAberta] = React.useState(false);
  const [ajudaAberta, setAjudaAberta] = React.useState(false);
  const pathname = usePathname();
  // O modo foco é controlado pela tela de estudo via evento global e
  // vale só para a rota em que foi ligado (mudar de página desliga).
  const [focoEm, setFocoEm] = React.useState<{ pathname: string; ativo: boolean } | null>(null);
  const foco = focoEm !== null && focoEm.pathname === pathname && focoEm.ativo;

  React.useEffect(() => {
    const aoMudar = (e: Event) =>
      setFocoEm({ pathname: window.location.pathname, ativo: (e as CustomEvent<boolean>).detail });
    window.addEventListener("gabarita:foco", aoMudar);
    return () => window.removeEventListener("gabarita:foco", aoMudar);
  }, []);

  const { versao, carregada } = useVersao();
  if (carregada && versao === null) return <TelaEntrada />;

  return (
    <div className="flex h-dvh w-full flex-col bg-background md:flex-row">
      {!foco && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}
      {!foco && (
        <div className="md:hidden">
          <BarraSuperior />
        </div>
      )}
      <main id="conteudo" className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AvisoArmazenamento />
        {children}
      </main>
      <PaletaComandos aberta={paletaAberta} aoMudar={setPaletaAberta} abrirAjuda={() => setAjudaAberta(true)} />
      <AjudaAtalhos aberta={ajudaAberta} aoMudar={setAjudaAberta} />
    </div>
  );
}

/** Dispara o modo foco para a casca. */
export function definirModoFoco(ativo: boolean) {
  window.dispatchEvent(new CustomEvent("gabarita:foco", { detail: ativo }));
}
