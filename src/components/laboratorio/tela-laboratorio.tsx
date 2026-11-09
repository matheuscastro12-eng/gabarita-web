"use client";

import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { Card } from "@/components/ui/card";
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
      <Card>
        <EditorPython />
      </Card>
      <Card>
        <Plotador />
      </Card>
    </ConteudoPagina>
  );
}
