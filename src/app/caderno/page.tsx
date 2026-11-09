import type { Metadata } from "next";
import { BookMarked } from "lucide-react";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";

export const metadata: Metadata = { title: "Caderno de erros" };

export default function PaginaCaderno() {
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Caderno de erros"
        descricao="Todo erro entra aqui sozinho, com a alternativa marcada e o porquê. Refazer e acertar fecha a entrada."
      />
      <EstadoVazio
        icone={<BookMarked />}
        titulo="A tela do caderno chega na próxima etapa"
        descricao="Os erros já estão sendo registrados a cada tentativa; a listagem por habilidade e o botão de refazer vêm em seguida."
      />
    </ConteudoPagina>
  );
}
