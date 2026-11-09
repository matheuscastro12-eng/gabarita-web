"use client";

import * as React from "react";
import Link from "next/link";
import katex from "katex";
import { ArrowLeft, BookOpenCheck, Check, Lightbulb, Pencil, Shapes } from "lucide-react";
import { ConteudoPagina } from "@/components/app/pagina";
import { Markdown } from "@/components/estudo/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Esqueleto } from "@/components/ui/esqueleto";
import { NOME_HABILIDADE } from "@/data/tipos";
import { useQuestoes } from "@/data/use-questoes";
import { RESUMOS, type Resumo } from "@/lib/resumos/conteudo";
import { questoesDoResumo } from "@/lib/resumos/logica";
import { infoVisual } from "@/lib/visuais/catalogo";
import { cn } from "@/lib/utils";
import { MapaMental } from "./mapa-mental";
import { SeloIncidencia } from "./selo";
import { useEstudados } from "./use-estudados";
import "katex/dist/katex.min.css";

function Formula({ tex }: { tex: string }) {
  const html = React.useMemo(() => katex.renderToString(tex, { displayMode: true, throwOnError: false }), [tex]);
  return <div className="overflow-x-auto py-1 text-[1.05em]" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Secao({ titulo, children, className, testid }: { titulo: string; children: React.ReactNode; className?: string; testid?: string }) {
  return (
    <Card className={cn("caderno-pauta gap-3", className)} data-testid={testid}>
      <CardTitle className="text-[17px]">{titulo}</CardTitle>
      {children}
    </Card>
  );
}

const MAX_QUESTOES = 8;

/** Um resumo de caderno: mapa mental, fórmulas, como o ENEM cobra, exemplo, pegadinhas, truque e treino. */
export function TelaResumo({ resumo }: { resumo: Resumo }) {
  const { estudados, alternar } = useEstudados();
  const feito = estudados.includes(resumo.id);
  const { questoes, erro } = useQuestoes();
  const ligadas = React.useMemo(() => (questoes ? questoesDoResumo(resumo, questoes) : null), [questoes, resumo]);
  const indice = RESUMOS.findIndex((r) => r.id === resumo.id);
  const proximo = RESUMOS[(indice + 1) % RESUMOS.length]!;

  return (
    <ConteudoPagina>
      <Link href="/resumos" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Resumos
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <SeloIncidencia incidencia={resumo.incidencia} />
            {resumo.habilidades.map((h) => (
              <Badge key={h} variant="accent" title={NOME_HABILIDADE[h]} data-testid="habilidade-resumo">
                {h} · {NOME_HABILIDADE[h]}
              </Badge>
            ))}
          </div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] md:text-[28px]">{resumo.titulo}</h1>
          <p className="max-w-prose text-sm text-muted-foreground">{resumo.chamada}</p>
        </div>
        <Button variant={feito ? "secondary" : "primary"} aria-pressed={feito} onClick={() => alternar(resumo.id)} data-testid="marcar-estudado">
          {feito ? (
            <>
              <Check strokeWidth={2.5} className="text-success-text" /> Estudado
            </>
          ) : (
            <>
              <BookOpenCheck /> Marcar como estudado
            </>
          )}
        </Button>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div className="flex flex-col gap-3.5">
          <Card className="gap-3">
            <CardTitle className="text-[17px]">Mapa mental</CardTitle>
            <MapaMental centro={resumo.mapa.centro} ramos={resumo.mapa.ramos} titulo={resumo.titulo} />
          </Card>

          <Secao titulo="Fórmulas" testid="formulas">
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {resumo.formulas.map((f) => (
                <li key={f.rotulo} className="rounded-[14px] border-[1.5px] border-accent-soft bg-surface px-4 py-2.5">
                  <p className="text-xs font-bold text-accent-text">{f.rotulo}</p>
                  <Formula tex={f.tex} />
                </li>
              ))}
            </ul>
          </Secao>

          <Secao titulo="Como o ENEM cobra">
            <p className="text-[15px] leading-7">{resumo.comoCobra}</p>
          </Secao>

          <Secao titulo="Exemplo resolvido" testid="exemplo">
            <Markdown className="qtext">{resumo.exemplo.enunciado}</Markdown>
            <ol className="flex flex-col gap-2">
              {resumo.exemplo.passos.map((p, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-7">
                  <span className="num mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-extrabold text-accent-text">
                    {i + 1}
                  </span>
                  <Markdown>{p}</Markdown>
                </li>
              ))}
            </ol>
            <p className="text-[15px] font-bold" data-testid="resposta-exemplo">
              Resposta: <span className="sublinhado">{resumo.exemplo.respostaTexto}</span>
            </p>
          </Secao>

          <Secao titulo="Pegadinhas" testid="pegadinhas">
            <ul className="flex flex-col gap-2.5">
              {resumo.pegadinhas.map((p, i) => (
                <li key={i} className="grifo text-[15px] leading-7">
                  <Markdown>{p}</Markdown>
                </li>
              ))}
            </ul>
          </Secao>

          <div className="flex gap-3 rounded-xl bg-accent-soft p-5 text-accent-text" data-testid="truque">
            <Lightbulb className="mt-0.5 size-5 shrink-0" />
            <div className="flex flex-col gap-1 text-foreground">
              <p className="text-sm font-bold text-accent-text">Truque de prova</p>
              <Markdown className="text-[15px] leading-7">{resumo.truque}</Markdown>
            </div>
          </div>

          <Card className="gap-3" data-testid="treinar">
            <CardTitle className="text-[17px]">Treinar</CardTitle>
            {erro ? (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text">Não deu para carregar as questões: {erro}</p>
            ) : !ligadas ? (
              <Esqueleto className="h-16" />
            ) : ligadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há questões do banco com estas habilidades e este assunto.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="num font-bold text-foreground">{ligadas.length}</span> {ligadas.length === 1 ? "questão real" : "questões reais"} do app com{" "}
                  {resumo.habilidades.join(", ")} neste assunto.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {ligadas.slice(0, MAX_QUESTOES).map((q) => (
                    <li key={q.id}>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/estudar?questao=${encodeURIComponent(q.id)}`} data-testid="questao-resumo">
                          <Pencil /> ENEM {q.ano} · Q{q.numero} · {q.habilidade}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {resumo.visual && (
              <Link href={`/aprender#${resumo.visual}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent-text underline-offset-4 hover:underline" data-testid="link-aprender">
                <Shapes className="size-4" /> Ver visualmente em Aprender: {infoVisual(resumo.visual).titulo}
              </Link>
            )}
          </Card>
        </div>

        <aside aria-label="Anotações na margem" className="flex flex-wrap gap-2 lg:sticky lg:top-4 lg:flex-col lg:gap-3 lg:border-l-2 lg:border-accent-soft lg:pl-4" data-testid="margem">
          <p className="hidden text-[10px] font-bold tracking-[1px] text-muted-foreground uppercase lg:block">Na margem</p>
          {resumo.margem.map((m) => (
            <p key={m} className="rounded-sm bg-background px-2.5 py-1 text-[13px] font-semibold text-muted-foreground lg:bg-transparent lg:p-0 lg:text-sm dark:bg-surface-2 lg:dark:bg-transparent">
              {m}
            </p>
          ))}
          <Link href={`/resumos/${proximo.id}`} className="hidden pt-4 text-sm font-semibold text-accent-text hover:underline lg:block">
            Próximo: {proximo.titulo}
          </Link>
        </aside>
      </div>
    </ConteudoPagina>
  );
}
