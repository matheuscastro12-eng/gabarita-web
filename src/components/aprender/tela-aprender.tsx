"use client";

import * as React from "react";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Temas" className="-mx-3 overflow-x-auto px-3 lg:mx-0 lg:px-0">
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {VISUAIS.map((v) => (
              <li key={v.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => escolher(v.id)}
                  aria-current={v.id === atual ? "true" : undefined}
                  className={cn(
                    "w-full rounded-full border-[1.5px] border-border bg-surface px-4 py-2 text-left text-[13px] font-semibold whitespace-nowrap",
                    "transition-[background-color,border-color,color] duration-(--duration) ease-(--ease) hover:border-accent",
                    "lg:rounded-[12px] lg:border-transparent lg:bg-transparent lg:px-3 lg:py-2.5 lg:whitespace-normal lg:hover:border-transparent lg:hover:bg-surface",
                    v.id === atual && "border-accent bg-accent-solid text-white hover:border-accent lg:bg-accent-soft lg:text-accent-text lg:hover:bg-accent-soft",
                  )}
                >
                  {v.titulo}
                  <span className={cn("hidden text-xs font-medium lg:block", v.id === atual ? "text-accent-text" : "text-muted-foreground")}>{v.resumo}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <Card key={atual} className="anim-entrada gap-5" data-testid="card-visual">
          <CardHeader>
            <CardTitle>{info.titulo}</CardTitle>
            <CardDescription>{info.resumo}</CardDescription>
          </CardHeader>
          <Visual />
        </Card>
      </div>
    </ConteudoPagina>
  );
}
