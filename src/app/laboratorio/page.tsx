import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";

export const metadata: Metadata = { title: "Laboratório" };

export default function PaginaLaboratorio() {
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Laboratório"
        descricao="Sandbox com SymPy no navegador e gráficos de função com sliders, para conferir qualquer conta."
      />
      <EstadoVazio
        icone={<FlaskConical />}
        titulo="O laboratório chega numa etapa futura"
        descricao="O Pyodide com SymPy é carregado sob demanda, roda num Web Worker e nunca sai do seu navegador."
      />
    </ConteudoPagina>
  );
}
