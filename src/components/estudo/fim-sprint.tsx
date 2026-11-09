"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import type { Tentativa } from "@/lib/dominio/tipos";
import { formatarDecimal } from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Bolha } from "@/components/ui/bolha";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { useAtalho } from "@/lib/atalhos/provider";

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

  const dicas = tentativas.filter((t) => t.degrauMaximo > 0).length;
  const minutos = Math.round(tentativas.reduce((soma, t) => soma + t.segundos, 0) / 60);

  return (
    <ConteudoPagina className="mx-0 max-w-[720px] gap-0">
      <CabecalhoPagina
        titulo={`${acertos} de ${tentativas.length}`}
        descricao={limpo ? "Sprint limpo. Faça uma pausa curta antes do próximo." : "Cada erro já está no caderno. Faça uma pausa curta antes do próximo."}
      />

      {/* O resultado como cartão-resposta: uma bolha por questão. */}
      <div className="flex flex-wrap items-center gap-2 pt-6" aria-hidden>
        {tentativas.map((t, i) => (
          <Bolha key={t.id} tamanho="md" estado={t.acertou ? "certa" : "errada"}>
            {i + 1}
          </Bolha>
        ))}
      </div>

      <dl className="grid grid-cols-3 gap-4 py-6">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Acertos</dt>
          <dd className="num text-2xl font-medium">
            {acertos}
            <span className="text-muted-foreground">/{tentativas.length}</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Dicas usadas</dt>
          <dd className="num text-2xl font-medium">{dicas}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Tempo total</dt>
          <dd className="num text-2xl font-medium">
            {minutos}
            <span className="text-base text-muted-foreground"> min</span>
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-2 border-t border-border py-6">
        <h2 className="text-base font-semibold">Questões</h2>
        <div className="flex flex-col divide-y divide-border">
          {tentativas.map((t, i) => {
            const q = porId.get(t.questaoId);
            return (
              <div key={t.id} className="flex min-h-10 items-center gap-3 py-2 text-sm" data-testid="resultado-questao">
                <Bolha tamanho="sm" estado={t.acertou ? "certa" : "errada"} aria-hidden={false} role="img" aria-label={t.acertou ? "acertou" : "errou"}>
                  {t.acertou ? <Check strokeWidth={2.5} /> : <X strokeWidth={2.5} />}
                </Bolha>
                <span className="num w-5 shrink-0 text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="num">{q ? `ENEM ${q.ano} · Q${q.numero}` : t.questaoId}</span>
                  <span className="text-muted-foreground">
                    {" · "}
                    <span className="num">{t.habilidade}</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t.escolha ? `marcou ${t.escolha}` : "pulou"}
                  {t.degrauMaximo > 0 ? ` · dica ${t.degrauMaximo}` : ""}
                  {t.chuteSuspeito ? " · rápido demais" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border py-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Domínio</h2>
          <p className="text-sm text-muted-foreground">Como cada habilidade mudou neste sprint (de 0 a 1).</p>
        </div>
        <div className="flex flex-col gap-4">
          {Object.entries(deltaPorHabilidade).map(([h, d]) => {
            const delta = d.depois - d.antes;
            return (
              <div key={h} className="flex flex-col gap-2" data-testid="delta-habilidade">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="min-w-0">
                    <span className="num font-medium">{h}</span> <span className="text-muted-foreground">{NOME_HABILIDADE[h]}</span>
                  </span>
                  <span className="num">
                    {formatarDecimal(d.antes, 2)} → {formatarDecimal(d.depois, 2)}{" "}
                    <span className={delta >= 0 ? "text-sucesso" : "text-erro"}>
                      ({delta >= 0 ? "+" : "−"}
                      {formatarDecimal(Math.abs(delta), 2)})
                    </span>
                  </span>
                </div>
                <Progress value={d.depois * 100} tom={delta >= 0 ? "destaque" : "erro"} />
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button size="lg" onClick={aoNovoSprint} data-testid="novo-sprint">
          <RotateCcw className="size-4" strokeWidth={1.5} /> Novo sprint <Kbd>N</Kbd>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">
            Voltar para Hoje <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </Button>
      </div>
    </ConteudoPagina>
  );
}
