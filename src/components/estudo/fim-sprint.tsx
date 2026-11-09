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

  return (
    <ConteudoPagina className="max-w-3xl gap-6">
      <CabecalhoPagina
        titulo={`${acertos} de ${tentativas.length}`}
        descricao={
          acertos === tentativas.length
            ? "Sprint limpo. Faça uma pausa curta antes do próximo."
            : "Cada erro já está no caderno. Faça uma pausa curta antes do próximo."
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Questões</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 divide-y divide-border">
          {tentativas.map((t, i) => {
            const q = porId.get(t.questaoId);
            return (
              <div key={t.id} className="flex items-center gap-3 py-2.5 text-sm" data-testid="resultado-questao">
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-sm",
                    t.acertou ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                  )}
                  aria-label={t.acertou ? "acertou" : "errou"}
                >
                  {t.acertou ? <Check className="size-4" /> : <X className="size-4" />}
                </span>
                <span className="w-6 text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate">
                  {q ? `ENEM ${q.ano} · Q${q.numero}` : t.questaoId}
                  <span className="text-muted-foreground"> · {t.habilidade}</span>
                </span>
                <span className="tabular text-muted-foreground">
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
          <CardTitle className="text-base">Domínio</CardTitle>
          <CardDescription>Como cada habilidade mudou neste sprint (de 0 a 1).</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(deltaPorHabilidade).map(([h, d]) => {
            const delta = d.depois - d.antes;
            return (
              <div key={h} className="flex flex-col gap-1.5" data-testid="delta-habilidade">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold">{h}</span>{" "}
                    <span className="text-muted-foreground">{NOME_HABILIDADE[h]}</span>
                  </span>
                  <span className="tabular">
                    {formatarDecimal(d.antes, 2)} → {formatarDecimal(d.depois, 2)}{" "}
                    <span className={delta >= 0 ? "text-success" : "text-danger"}>
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
          <RotateCcw /> Novo sprint <Kbd className="border-accent-foreground/30 bg-transparent text-accent-foreground">N</Kbd>
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
