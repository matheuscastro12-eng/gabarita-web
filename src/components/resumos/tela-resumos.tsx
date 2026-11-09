"use client";

import * as React from "react";
import Link from "next/link";
import { Check, NotebookPen, Search } from "lucide-react";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { COMPETENCIAS } from "@/data/taxonomia";
import { RESUMOS } from "@/lib/resumos/conteudo";
import { agruparPorCompetencia, buscarResumos, mapaGeral } from "@/lib/resumos/logica";
import { cn } from "@/lib/utils";
import { MapaMental } from "./mapa-mental";
import { SeloIncidencia } from "./selo";
import { useEstudados } from "./use-estudados";

/** Índice dos resumos: mapa geral, busca e grade por competência, com "estudado". */
export function TelaResumos() {
  const [consulta, setConsulta] = React.useState("");
  const { estudados } = useEstudados();
  const grupos = agruparPorCompetencia(buscarResumos(consulta));
  const geral = React.useMemo(() => mapaGeral(), []);
  const feitos = estudados.length;

  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Resumos"
        descricao="Resumos de caderno da matemática do ENEM: mapa mental, fórmulas, exemplo resolvido, pegadinhas e questões reais para treinar."
      />

      <Card className="gap-3">
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-2">
          <div>
            <CardTitle>Mapa da matemática do ENEM</CardTitle>
            <CardDescription>As 7 competências da Matriz de Referência e os resumos de cada uma.</CardDescription>
          </div>
          <div className="flex min-w-48 flex-col gap-1.5" data-testid="progresso-resumos">
            <span className="text-xs font-semibold text-muted-foreground">
              <span className="num text-foreground">{feitos}</span> de {RESUMOS.length} estudados
            </span>
            <Progress value={(feitos / RESUMOS.length) * 100} aria-label="Resumos estudados" />
          </div>
        </CardHeader>
        <MapaMental centro={geral.centro} ramos={geral.ramos} titulo="matemática do ENEM" abertoInicial={null} />
      </Card>

      <label className="relative block max-w-md">
        <span className="sr-only">Buscar resumo</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar: mediana, juros, H27, cilindro..."
          className="h-11 w-full rounded-[12px] border-[1.5px] border-border bg-surface pr-3 pl-10 text-sm outline-none transition-colors duration-(--duration) ease-(--ease) focus:border-accent"
          data-testid="busca-resumos"
        />
      </label>

      {grupos.length === 0 ? (
        <EstadoVazio icone={<NotebookPen />} titulo="Nenhum resumo com esse termo" descricao="Tente o nome do assunto (porcentagem, volume) ou a habilidade (H16)." />
      ) : (
        grupos.map((g) => (
          <section key={g.competencia} aria-labelledby={`comp-${g.competencia}`} className="flex flex-col gap-3">
            <h2 id={`comp-${g.competencia}`} className="flex items-baseline gap-2 text-[19px] font-bold">
              <span className="num text-accent-text">{g.competencia}</span> {g.nome}
              <span className="sr-only">: {COMPETENCIAS.find((c) => c.id === g.competencia)?.descricao}</span>
            </h2>
            <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {g.resumos.map((r) => {
                const feito = estudados.includes(r.id);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/resumos/${r.id}`}
                      data-testid="card-resumo"
                      className={cn(
                        "caderno-pauta flex h-full flex-col gap-2 rounded-xl border border-card-borda p-5 shadow-card",
                        "transition-[border-color] duration-(--duration) ease-(--ease) hover:border-accent focus-visible:border-accent",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <SeloIncidencia incidencia={r.incidencia} />
                        {feito && (
                          <Badge variant="success" data-testid="selo-estudado">
                            <Check className="size-3" strokeWidth={3} /> estudado
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base leading-snug font-bold">{r.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{r.chamada}</p>
                      <p className="mt-auto pt-1 text-xs font-bold text-accent-text">{r.habilidades.join(" · ")}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </ConteudoPagina>
  );
}
