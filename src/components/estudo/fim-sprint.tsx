"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import type { Tentativa } from "@/lib/dominio/tipos";
import { formatarDecimal } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { useAtalho } from "@/lib/atalhos/provider";
import { cn } from "@/lib/utils";

interface Props {
  tentativas: Tentativa[];
  acertos: number;
  deltaPorHabilidade: Record<string, { antes: number; depois: number }>;
  porId: Map<string, Questao>;
  aoNovoSprint: () => void;
}

/** Fim do sprint: os 5 resultados e quanto o domínio mudou. */
export function FimSprint({ tentativas, acertos, deltaPorHabilidade, porId, aoNovoSprint }: Props) {
  useAtalho({ id: "novo-sprint", combinacao: "n", descricao: "Novo sprint", grupo: "Sprint", acao: aoNovoSprint });
  const limpo = acertos === tentativas.length;

  return (
    <ConteudoPagina className="max-w-[760px] gap-4">
      <CabecalhoPagina
        titulo={`${acertos} de ${tentativas.length}`}
        descricao={limpo ? "Sprint limpo. Faça uma pausa curta antes do próximo." : "Cada erro já está no caderno. Faça uma pausa curta antes do próximo."}
      />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <div className="hero-azul flex min-h-[104px] flex-col rounded-xl p-4.5">
          <span className="text-[13px] font-semibold text-white/90">Acertos</span>
          <span className="num mt-auto text-3xl font-extrabold">
            {acertos}
            <span className="text-lg font-bold text-white/80">/{tentativas.length}</span>
          </span>
        </div>
        <div className="flex min-h-[104px] flex-col rounded-xl border border-card-borda bg-surface p-4.5 shadow-card">
          <span className="text-[13px] font-semibold">Dicas usadas</span>
          <span className="num mt-auto text-3xl font-extrabold">{tentativas.filter((t) => t.degrauMaximo > 0).length}</span>
        </div>
        <div className="col-span-2 flex min-h-[104px] flex-col rounded-xl border border-card-borda bg-surface p-4.5 shadow-card sm:col-span-1">
          <span className="text-[13px] font-semibold">Tempo total</span>
          <span className="num mt-auto text-3xl font-extrabold">
            {Math.round(tentativas.reduce((s, t) => s + t.segundos, 0) / 60)}
            <span className="text-lg font-bold text-muted-foreground"> min</span>
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questões</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 divide-y divide-border">
          {tentativas.map((t, i) => {
            const q = porId.get(t.questaoId);
            return (
              <div key={t.id} className="flex items-center gap-3 py-2.5 text-sm" data-testid="resultado-questao">
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white",
                    t.acertou ? "bg-success" : "bg-danger",
                  )}
                  aria-label={t.acertou ? "acertou" : "errou"}
                >
                  {t.acertou ? <Check className="size-4" strokeWidth={2.5} /> : <X className="size-4" strokeWidth={2.5} />}
                </span>
                <span className="num w-5 text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {q ? `ENEM ${q.ano} · Q${q.numero}` : t.questaoId}
                  <span className="font-normal text-muted-foreground"> · {t.habilidade}</span>
                </span>
                <span className="num text-[13px] text-muted-foreground">
                  {t.escolha ? `marcou ${t.escolha}` : "pulou"}
                  {t.degrauMaximo > 0 ? ` · dica ${t.degrauMaximo}` : ""}
                  {t.chuteSuspeito ? " · rápido demais" : ""}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domínio</CardTitle>
          <CardDescription>Como cada habilidade mudou neste sprint (de 0 a 1).</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(deltaPorHabilidade).map(([h, d]) => {
            const delta = d.depois - d.antes;
            return (
              <div key={h} className="flex flex-col gap-1.5" data-testid="delta-habilidade">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="num font-bold">{h}</span> <span className="text-muted-foreground">{NOME_HABILIDADE[h]}</span>
                  </span>
                  <span className="num">
                    {formatarDecimal(d.antes, 2)} → {formatarDecimal(d.depois, 2)}{" "}
                    <span className={cn("font-bold", delta >= 0 ? "text-success-text" : "text-danger-text")}>
                      ({delta >= 0 ? "+" : "−"}
                      {formatarDecimal(Math.abs(delta), 2)})
                    </span>
                  </span>
                </div>
                <Progress value={d.depois * 100} tom={delta >= 0 ? "accent" : "danger"} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={aoNovoSprint} data-testid="novo-sprint">
          <RotateCcw /> Novo sprint <Kbd className="border-white/40 bg-transparent text-white">N</Kbd>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">
            Voltar para Hoje <ArrowRight />
          </Link>
        </Button>
      </div>
    </ConteudoPagina>
  );
}
