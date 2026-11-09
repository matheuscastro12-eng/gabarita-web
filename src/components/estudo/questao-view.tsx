"use client";

import * as React from "react";
import type { Questao, Letra } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Alternativas } from "./alternativas";
import { Markdown } from "./markdown";

interface Props {
  questao: Questao;
  marcada: Letra | null;
  confirmada: boolean;
  aoMarcar: (letra: Letra) => void;
  aoConfirmar: () => void;
  aoPular: () => void;
  aoProxima: () => void;
  ehUltima: boolean;
}

function rotuloDificuldade(q: Questao): { texto: string; variant: "success" | "warning" | "danger" | "outline" } {
  if (q.tri) {
    const d = q.dificuldade_estimada ?? "media";
    return d === "facil"
      ? { texto: `fácil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "success" }
      : d === "media"
        ? { texto: `média · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "warning" }
        : { texto: `difícil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "danger" };
  }
  return { texto: "sem parâmetro TRI", variant: "outline" };
}

/** Painel da questão: cabeçalho com fonte, enunciado em Markdown/KaTeX, alternativas e ações. */
export function QuestaoView({ questao, marcada, confirmada, aoMarcar, aoConfirmar, aoPular, aoProxima, ehUltima }: Props) {
  const dif = rotuloDificuldade(questao);
  const acertou = confirmada && marcada === questao.gabarito;
  const statusRef = React.useRef<HTMLParagraphElement | null>(null);

  // Ao confirmar, traz o resultado para a vista (as alternativas podem estar abaixo da dobra).
  React.useEffect(() => {
    if (confirmada) statusRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [confirmada]);

  return (
    <article className="flex h-full min-h-0 flex-col" aria-labelledby="titulo-questao">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3 text-sm">
        <h2 id="titulo-questao" className="font-semibold">
          ENEM {questao.ano} · Q{questao.numero}
        </h2>
        <Badge variant={dif.variant}>{dif.texto}</Badge>
        {questao.habilidade && (
          <Badge variant="accent" title={NOME_HABILIDADE[questao.habilidade]}>
            {questao.habilidade}
            {questao.habilidade_origem && questao.habilidade_origem !== "inep" ? " (estimada)" : ""}
          </Badge>
        )}
        {questao.anulada && <Badge variant="danger">anulada</Badge>}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <Markdown className="text-[1.03em] leading-relaxed">{questao.enunciado}</Markdown>
          <Alternativas
            alternativas={questao.alternativas}
            marcada={marcada}
            gabarito={questao.gabarito}
            confirmada={confirmada}
            aoMarcar={aoMarcar}
          />
          {confirmada && (
            <p
              ref={statusRef}
              role="status"
              className={acertou ? "font-medium text-success" : "font-medium text-danger"}
            >
              {acertou ? "Acertou." : `Não foi dessa vez. O gabarito é ${questao.gabarito}.`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Fonte: INEP, {questao.fonte.prova}. Transcrição: enem.dev.
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        {!confirmada ? (
          <>
            <Button onClick={aoConfirmar} disabled={!marcada} data-testid="confirmar">
              Confirmar <Kbd className="ml-1 border-accent-foreground/30 bg-transparent text-accent-foreground">Enter</Kbd>
            </Button>
            <Button variant="ghost" onClick={aoPular}>
              Pular
            </Button>
          </>
        ) : (
          <Button onClick={aoProxima} data-testid="proxima">
            {ehUltima ? "Ver resultado" : "Próxima"}{" "}
            <Kbd className="ml-1 border-accent-foreground/30 bg-transparent text-accent-foreground">N</Kbd>
          </Button>
        )}
      </footer>
    </article>
  );
}
