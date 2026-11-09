"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import type { Letra } from "@/data/tipos";
import type { Gemea } from "@/lib/gemeas";
import { ROTULO_GERADOR } from "@/lib/gemeas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alternativas } from "./alternativas";
import { Markdown } from "./markdown";

export interface RespostaGemea {
  gemea: Gemea;
  escolha: Letra;
  acertou: boolean;
  segundos: number;
}

interface Props {
  gemea: Gemea;
  aoResponder?: (r: RespostaGemea) => void;
}

/** Questão gêmea dentro do chat: marcar, confirmar, ver o erro típico e a resolução. */
export function GemeaCard({ gemea, aoResponder }: Props) {
  const [marcada, setMarcada] = React.useState<Letra | null>(null);
  const [confirmada, setConfirmada] = React.useState(false);
  const [verResolucao, setVerResolucao] = React.useState(false);
  const [inicio] = React.useState(() => Date.now());

  const acertou = confirmada && marcada === gemea.gabarito;
  const erro = confirmada && marcada && !acertou ? gemea.erros[marcada] : null;

  function confirmar() {
    if (!marcada || confirmada) return;
    setConfirmada(true);
    aoResponder?.({ gemea, escolha: marcada, acertou: marcada === gemea.gabarito, segundos: Math.round((Date.now() - inicio) / 1000) });
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-accent/40 bg-surface p-3.5" aria-label="Questão gêmea" data-testid="gemea">
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="accent">Gêmea · {ROTULO_GERADOR[gemea.gerador]}</Badge>
        <Badge variant="outline" title="Resposta calculada pelo código, não pelo modelo">
          <Check className="size-3" /> resposta calculada
        </Badge>
      </header>
      <Markdown className="text-[0.97em]">{gemea.enunciado}</Markdown>
      <Alternativas alternativas={gemea.alternativas} marcada={marcada} gabarito={gemea.gabarito} confirmada={confirmada} aoMarcar={setMarcada} />
      {!confirmada ? (
        <div>
          <Button size="sm" onClick={confirmar} disabled={!marcada} data-testid="confirmar-gemea">
            Confirmar gêmea
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm" role="status">
          <p className={acertou ? "flex items-center gap-1.5 font-medium text-success" : "flex items-center gap-1.5 font-medium text-danger"}>
            {acertou ? <Check className="size-4" /> : <X className="size-4" />}
            {acertou ? "Acertou a gêmea." : `Não foi dessa vez. O gabarito é ${gemea.gabarito}.`}
          </p>
          {erro && (
            <p>
              <span className="font-semibold">Erro típico de quem marca {marcada}:</span> {erro}
            </p>
          )}
          {verResolucao ? (
            <Markdown className="rounded-md border border-border bg-background px-3 py-2">{gemea.resolucao}</Markdown>
          ) : (
            <div>
              <Button variant="secondary" size="sm" onClick={() => setVerResolucao(true)}>
                Ver a resolução
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
