import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";

export const metadata: Metadata = { title: "Ajustes" };

export default function PaginaAjustes() {
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Ajustes"
        descricao="Perfil “explica do meu jeito”, data da prova, meta de nota, estado do tutor e backup em JSON."
      />
      <EstadoVazio
        icone={<Settings />}
        titulo="Os ajustes chegam numa etapa futura"
        descricao="Exportar e importar o backup já funcionam por baixo (StudentStore); a tela vem junto com o tutor."
      />
    </ConteudoPagina>
  );
}
