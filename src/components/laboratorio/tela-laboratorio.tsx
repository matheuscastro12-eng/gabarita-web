"use client";

import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { EditorPython } from "./editor-python";
import { Plotador } from "./plotador";

/** Laboratório: Python/SymPy no navegador (Web Worker + Pyodide) e gráficos com sliders. */
export function TelaLaboratorio() {
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Laboratório"
        descricao="Python com SymPy rodando no seu navegador (nada sai da máquina) e gráficos de função com sliders. Dentro de um sprint, abra com L."
      />
      <div className="grid border-t border-border xl:grid-cols-2 xl:divide-x xl:divide-border">
        <section className="min-w-0 py-6 xl:pr-8">
          <EditorPython />
        </section>
        <section className="min-w-0 border-t border-border py-6 xl:border-t-0 xl:pl-8">
          <Plotador />
        </section>
      </div>
    </ConteudoPagina>
  );
}
