"use client";

import * as React from "react";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConteudoPagina, EstadoVazio } from "./pagina";
import { useVersao } from "./versao";

/** Resumos e Aprender só existem para matemática: nas outras versões, um estado honesto. */
export function SoMatematica({ recurso, children }: { recurso: string; children: React.ReactNode }) {
  const { versao, definir } = useVersao();
  if (!versao || versao === "matematica") return <>{children}</>;
  return (
    <ConteudoPagina>
      <EstadoVazio
        icone={<NotebookPen />}
        titulo={`${recurso} de Natureza ainda não existem`}
        descricao={`Por enquanto, ${recurso.toLowerCase()} são só de matemática. Para estudar natureza, use os sprints, o Mapa e os simulados.`}
        acao={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/estudar">Fazer um sprint</Link>
            </Button>
            <Button variant="outline" onClick={() => definir("matematica")}>
              Ver {recurso.toLowerCase()} de matemática
            </Button>
          </div>
        }
      />
    </ConteudoPagina>
  );
}
