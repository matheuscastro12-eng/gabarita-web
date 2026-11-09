import type { Metadata } from "next";
import { Map } from "lucide-react";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";

export const metadata: Metadata = { title: "Mapa" };

export default function PaginaMapa() {
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Mapa"
        descricao="Domínio por habilidade (H1 a H30), nota estimada com intervalo e o que falta para estar pronto."
      />
      <EstadoVazio
        icone={<Map />}
        titulo="O mapa chega na próxima etapa"
        descricao="O modelo de domínio já está calculando por baixo. Aqui vai aparecer o calor de cada habilidade e os critérios de “pronto” que ainda faltam."
      />
    </ConteudoPagina>
  );
}
