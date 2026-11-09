"use client";

import * as React from "react";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { COMPONENTE_VISUAL } from "@/components/visuais";
import { VISUAIS, type IdVisual } from "@/lib/visuais/catalogo";
import { cn } from "@/lib/utils";

function idDoHash(): IdVisual | null {
  const h = window.location.hash.slice(1);
  return VISUAIS.some((v) => v.id === h) ? (h as IdVisual) : null;
}

function assinarHash(aviso: () => void) {
  window.addEventListener("hashchange", aviso);
  return () => window.removeEventListener("hashchange", aviso);
}

/** "Aprender o básico": a matemática por trás das questões fáceis, em visuais curtos com controle do aluno. */
export function TelaAprender() {
  // O tema escolhido vive no hash da URL (#porcentagem), para dar para linkar direto.
  const atual = React.useSyncExternalStore(assinarHash, () => idDoHash() ?? "porcentagem", () => "porcentagem" as IdVisual);

  const escolher = (id: IdVisual) => {
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const info = VISUAIS.find((v) => v.id === atual)!;
  const Visual = COMPONENTE_VISUAL[atual];

  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Aprender o básico"
        descricao="A matemática que mais cai nas questões fáceis do ENEM, em visuais curtos: avance no seu ritmo, mexa nos números e faça o teste de um clique."
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-0 lg:divide-x lg:divide-border">
        <nav
          aria-label="Temas"
          className="-mx-4 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] md:-mx-8 md:px-8 lg:mx-0 lg:border-b-0 lg:px-0 lg:pr-4 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex gap-4 lg:flex-col lg:gap-0">
            {VISUAIS.map((v) => (
              <li key={v.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => escolher(v.id)}
                  aria-current={v.id === atual ? "true" : undefined}
                  className={cn(
                    "relative flex min-h-11 w-full flex-col justify-center text-left text-sm font-medium whitespace-nowrap text-muted-foreground",
                    "transition-colors duration-(--duracao) ease-(--curva) hover:text-foreground",
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent",
                    "lg:rounded-md lg:px-3 lg:py-2 lg:whitespace-normal lg:text-foreground lg:after:hidden lg:hover:bg-muted",
                    "before:absolute before:inset-y-2 before:left-0 before:hidden before:w-0.5 before:bg-transparent lg:before:block",
                    v.id === atual && "text-foreground after:bg-primary lg:bg-muted lg:font-semibold lg:before:bg-primary",
                  )}
                >
                  {v.titulo}
                  <span className="hidden text-xs font-normal text-muted-foreground lg:block">{v.resumo}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section key={atual} className="anim-entrada flex min-w-0 flex-col gap-5 lg:pl-8" data-testid="card-visual">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">{info.titulo}</h2>
            <p className="text-sm text-muted-foreground">{info.resumo}</p>
          </div>
          <Visual />
        </section>
      </div>
    </ConteudoPagina>
  );
}
