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
    <section className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-card p-3" aria-label="Questão gêmea" data-testid="gemea">
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="destaque">Gêmea · {ROTULO_GERADOR[gemea.gerador]}</Badge>
        <Badge variant="outline" title="Resposta calculada pelo código, não pelo modelo">
          <Check className="size-3" strokeWidth={1.5} /> resposta calculada
        </Badge>
      </header>
      <Markdown className="qtext">{gemea.enunciado}</Markdown>
      <Alternativas alternativas={gemea.alternativas} marcada={marcada} gabarito={gemea.gabarito} confirmada={confirmada} aoMarcar={setMarcada} />
      {!confirmada ? (
        <div>
          <Button size="sm" onClick={confirmar} disabled={!marcada} data-testid="confirmar-gemea">
            Confirmar gêmea
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm" role="status">
          <p className={acertou ? "flex items-center gap-1.5 font-medium text-sucesso" : "flex items-center gap-1.5 font-medium text-erro"}>
            {acertou ? <Check className="size-4" /> : <X className="size-4" />}
            {acertou ? "Acertou a gêmea." : `Não foi dessa vez. O gabarito é ${gemea.gabarito}.`}
          </p>
          {erro && (
            <p>
              <span className="font-medium">Erro típico de quem marca {marcada}:</span> {erro}
            </p>
          )}
          {verResolucao ? (
            <Markdown className="border-t border-border pt-3">{gemea.resolucao}</Markdown>
          ) : (
            <div>
              <Button variant="outline" size="sm" onClick={() => setVerResolucao(true)}>
                Ver a resolução
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
