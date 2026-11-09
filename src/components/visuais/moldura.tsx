"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { passoAnterior, proximoPasso, rotuloPasso } from "@/lib/visuais/passos";
import { cn } from "@/lib/utils";

export interface Exercicio {
  pergunta: string;
  opcoes: string[];
  /** Índice da opção certa. */
  certa: number;
  /** Uma frase curta mostrada depois do clique (certo ou errado). */
  explicacao: string;
}

/** Formata número em pt-BR (vírgula decimal). */
export function fmt(n: number, casas = 2): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

/** Dinheiro: inteiro sem centavos ("R$ 80"), quebrado com duas casas ("R$ 0,80"). */
export function reais(n: number): string {
  return Number.isInteger(n) ? fmt(n) : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Moldura comum dos visuais de "Aprender o básico": exemplo com números, passo a passo
 * com Voltar/Avançar, o truque do ENEM numa linha e um mini exercício de um clique.
 * `children` recebe o passo atual e desenha o visual.
 */
export function MolduraVisual({
  id,
  passos,
  truque,
  exercicio,
  controles,
  children,
}: {
  id: string;
  /** Texto de cada passo (o que olhar no visual). */
  passos: React.ReactNode[];
  truque: string;
  exercicio: Exercicio;
  /** Controles livres (slider, chips) que aparecem sob o visual. */
  controles?: React.ReactNode;
  children: (passo: number) => React.ReactNode;
}) {
  const [passo, setPasso] = React.useState(0);
  const total = passos.length;
  return (
    <section className="flex flex-col gap-4" data-testid={`visual-${id}`} aria-label="Explicação visual">
      <div className="rounded-lg bg-background p-4 dark:bg-surface-2">{children(passo)}</div>
      {controles && <div className="flex flex-col gap-2">{controles}</div>}

      <div className="flex flex-col gap-3">
        <p key={passo} className="anim-entrada min-h-12 text-[15px] leading-relaxed" aria-live="polite" data-testid="texto-passo">
          {passos[passo]}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPasso(passoAnterior)} disabled={passo === 0} aria-label="Passo anterior">
            <ArrowLeft /> Voltar
          </Button>
          <span className="num flex-1 text-center text-xs font-semibold text-muted-foreground">{rotuloPasso(passo, total)}</span>
          <Button size="sm" onClick={() => setPasso((p) => proximoPasso(p, total))} disabled={passo === total - 1} aria-label="Próximo passo" data-testid="avancar-passo">
            Avançar <ArrowRight />
          </Button>
        </div>
        <ol className="flex justify-center gap-1.5" aria-hidden>
          {passos.map((_, i) => (
            <li key={i} className={cn("h-1.5 w-6 rounded-full transition-colors duration-(--duration)", i <= passo ? "bg-accent" : "bg-border")} />
          ))}
        </ol>
      </div>

      <p className="flex items-start gap-2.5 rounded-lg bg-accent-soft px-3.5 py-3 text-sm font-medium text-foreground" data-testid="truque">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
        <span>
          <span className="font-bold">Truque do ENEM: </span>
          {truque}
        </span>
      </p>

      <MiniExercicio exercicio={exercicio} />
    </section>
  );
}

/** Uma pergunta, opções em chips, um clique: verde e "assenta" se acertou; shake e a explicação se errou. */
export function MiniExercicio({ exercicio }: { exercicio: Exercicio }) {
  const [escolha, setEscolha] = React.useState<number | null>(null);
  const acertou = escolha === exercicio.certa;
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4" data-testid="mini-exercicio">
      <p className="text-sm font-bold">Teste rápido</p>
      <p className="font-serif text-[15px] leading-relaxed">{exercicio.pergunta}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Opções do teste">
        {exercicio.opcoes.map((op, i) => {
          const marcada = escolha === i;
          return (
            <button
              key={`${i}-${marcada ? "m" : ""}`}
              type="button"
              role="radio"
              aria-checked={marcada}
              onClick={() => setEscolha(i)}
              className={cn(
                "num rounded-full border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-semibold",
                "transition-[background-color,border-color,color] duration-(--duration) ease-(--ease) hover:border-accent",
                marcada && acertou && "anim-assenta border-success bg-success-tint text-success-text hover:border-success",
                marcada && !acertou && "anim-shake border-danger bg-danger-tint text-danger-text hover:border-danger",
              )}
            >
              {op}
            </button>
          );
        })}
      </div>
      {escolha !== null && (
        <p role="status" className={cn("anim-entrada text-sm", acertou ? "text-success-text" : "text-danger-text")}>
          <span className="font-bold">{acertou ? "Isso. " : "Ainda não. "}</span>
          <span className="text-foreground">{acertou ? exercicio.explicacao : "Tente de novo: volte um passo no visual se precisar."}</span>
        </p>
      )}
    </div>
  );
}

/** Slider com rótulo e valor ao lado. */
export function Deslizador({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  aoMudar,
  sufixo = "",
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  aoMudar: (v: number) => void;
  sufixo?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-3 text-sm">
      <label htmlFor={id} className="w-36 shrink-0 font-medium text-muted-foreground">
        {rotulo}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="h-2 min-w-0 flex-1 cursor-pointer accent-[var(--accent)]"
      />
      <span className="num w-16 shrink-0 text-right font-bold">
        {fmt(valor)}
        {sufixo}
      </span>
    </div>
  );
}
