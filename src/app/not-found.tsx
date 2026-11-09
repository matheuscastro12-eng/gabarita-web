import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Logo } from "@/components/app/sidebar";

export const metadata: Metadata = { title: "Página não encontrada" };

/** 404: a mesma casca do app, um card branco, uma ação principal, sem susto. */
export default function NaoEncontrada() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
      <section className="flex w-full max-w-md flex-col items-start gap-5 rounded-xl border border-card-borda bg-surface p-6 shadow-card md:p-8" aria-labelledby="titulo-404">
        <span className="inline-flex size-12 items-center justify-center rounded-[12px] bg-accent-soft">
          <Logo className="size-6" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="num text-sm font-semibold text-muted-foreground">Erro 404</p>
          <h1 id="titulo-404" className="text-2xl font-extrabold tracking-[-0.4px]">
            Essa página não existe
          </h1>
          <p className="text-sm text-muted-foreground">
            O endereço pode ter mudado ou foi digitado errado. Nada do seu progresso se perdeu: ele continua neste navegador.
          </p>
        </div>
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
