"use client";

import * as React from "react";
import { Lightbulb, SendHorizontal, Sparkles } from "lucide-react";
import type { Questao } from "@/data/tipos";
import type { DegrauDica } from "@/lib/dominio/tipos";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

interface Props {
  questao: Questao;
  degrau: DegrauDica;
  aoPedirDica: () => void;
  confirmada: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const NOMES_DEGRAU = ["pergunta", "conceito", "primeiro passo", "quase lá", "resolução"];

/**
 * Esqueleto do tutor: escada de dicas com o conteúdo curado do PROVAS (modo guiado offline)
 * e o campo de pergunta. A conversa com IA entra na etapa 2.
 */
export function PainelTutor({ questao, degrau, aoPedirDica, confirmada, inputRef }: Props) {
  const res = questao.resolucao;
  const dicas = res ? [res.dicas.dica1, res.dicas.dica2, res.dicas.dica3, res.resolucao] : [];
  const temCuradoria = dicas.length > 0;

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Tutor">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-accent-text" />
        <h2 className="text-sm font-semibold">Tutor</h2>
        <Badge variant="warning" className="ml-auto">
          modo guiado
        </Badge>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-foreground">
            Tutor de IA desligado: falta a chave <code className="font-mono text-xs">ANTHROPIC_API_KEY</code>. Usando
            dicas verificadas.
          </div>

          <Balao>
            Antes de calcular: o que a questão está pedindo, com as suas palavras?
          </Balao>

          {temCuradoria ? (
            dicas.slice(0, degrau).map((texto, i) => (
              <Balao key={i} rotulo={`Degrau ${i + 1} · ${NOMES_DEGRAU[i + 1]}`}>
                <Markdown>{texto}</Markdown>
              </Balao>
            ))
          ) : degrau > 0 ? (
            <Balao rotulo="Sem dicas curadas">
              Esta questão ainda não tem resolução curada no PROVAS. Confirme sua resposta para ver o gabarito, ou leve
              a conta para o Laboratório.
            </Balao>
          ) : null}

          {confirmada && res && degrau < 4 && (
            <Balao rotulo="Por que errei?">
              {res.erros_comuns.length > 0
                ? "Cada alternativa errada do ENEM corresponde a um erro típico. Peça o próximo degrau para ver."
                : "Confira a resolução completa no último degrau."}
            </Balao>
          )}
        </div>
      </div>

      <footer className="flex flex-col gap-2 border-t border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Dica</span>
            <EscadaDicas degrau={degrau} />
          </div>
          <Button variant="secondary" size="sm" onClick={aoPedirDica} disabled={degrau >= 4} data-testid="dica">
            <Lightbulb /> {degrau >= 4 ? "Resolução mostrada" : "Próximo degrau"} <Kbd>H</Kbd>
          </Button>
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label htmlFor="pergunta-tutor" className="sr-only">
            Pergunte do seu jeito
          </label>
          <textarea
            id="pergunta-tutor"
            ref={inputRef}
            rows={1}
            placeholder="pergunte do seu jeito… (/)"
            className="min-h-11 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled title="O chat com IA chega na etapa 2">
            <SendHorizontal />
          </Button>
        </form>
      </footer>
    </section>
  );
}

function Balao({ children, rotulo }: { children: React.ReactNode; rotulo?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3.5 py-3 text-[0.97em] leading-relaxed">
      {rotulo && <span className="text-xs font-semibold text-muted-foreground">{rotulo}</span>}
      <div>{children}</div>
    </div>
  );
}

/** ▮▮▯▯ dos degraus de dica usados. */
export function EscadaDicas({ degrau, className }: { degrau: DegrauDica; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`degrau ${degrau} de 4`} role="img">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          aria-hidden
          className={cn("h-3.5 w-2 rounded-[2px]", n <= degrau ? "bg-accent" : "bg-surface-2 border border-border")}
        />
      ))}
    </span>
  );
}
