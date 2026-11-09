import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConteudoPagina, EstadoVazio } from "@/components/app/pagina";

export default function NaoEncontrada() {
  return (
    <ConteudoPagina className="justify-center">
      <EstadoVazio
        titulo="Essa página não existe"
        descricao="O endereço pode ter mudado. Volte para a tela de hoje e comece um sprint."
        acao={
          <Button asChild>
            <Link href="/">Ir para Hoje</Link>
          </Button>
        }
      />
    </ConteudoPagina>
  );
}
