import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import { Bolha } from "@/components/ui/bolha";

export const metadata: Metadata = { title: "Página não encontrada" };

/** 404: uma questão anulada do cartão-resposta. Bloco à esquerda, no topo, uma ação principal. */
export default function NaoEncontrada() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="flex w-full max-w-[560px] flex-col items-start gap-6 px-4 py-5 md:px-8 md:py-7" aria-labelledby="titulo-404">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2">
            <span className="num text-xs text-muted-foreground">Erro 404</span>
            <Badge variant="aviso">anulada</Badge>
          </p>
          <h1 id="titulo-404" className="text-2xl font-semibold">
            Essa página não existe
          </h1>
        </div>
        <div aria-hidden className="relative flex gap-3 opacity-60">
          {["A", "B", "C", "D", "E"].map((l) => (
            <Bolha key={l} tamanho="md">
              {l}
            </Bolha>
          ))}
          <span className="absolute inset-x-[-8px] top-1/2 h-px bg-input" />
        </div>
        <p className="text-sm text-muted-foreground">
          O endereço pode ter mudado ou foi digitado errado. Nada do seu progresso se perdeu: ele continua neste navegador.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <Home /> Ir para Hoje
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/estudar">
              Começar um sprint <ArrowRight />
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Dica: <Kbd>Alt</Kbd> + <Kbd>1</Kbd> a <Kbd>6</Kbd> vão direto para cada tela, e <Kbd>?</Kbd> mostra todos os atalhos.
        </p>
      </section>
    </div>
  );
}
