"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Bolha } from "@/components/ui/bolha";
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
      <div className="rounded-lg border border-border bg-muted p-4">{children(passo)}</div>
      {controles && <div className="flex flex-col gap-2">{controles}</div>}

      <div className="flex flex-col gap-3">
        <p key={passo} className="anim-entrada min-h-12 text-base leading-relaxed" aria-live="polite" data-testid="texto-passo">
          {passos[passo]}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPasso(passoAnterior)} disabled={passo === 0} aria-label="Passo anterior">
            <ArrowLeft /> Voltar
          </Button>
          <span className="num flex-1 text-center text-xs text-muted-foreground">{rotuloPasso(passo, total)}</span>
          <Button size="sm" onClick={() => setPasso((p) => proximoPasso(p, total))} disabled={passo === total - 1} aria-label="Próximo passo" data-testid="avancar-passo">
            Avançar <ArrowRight />
          </Button>
        </div>
        <ol className="flex justify-center gap-2" aria-hidden>
          {passos.map((_, i) => (
            <li key={i} className="flex">
              <Bolha tamanho="xs" estado={i < passo ? "marcada" : i === passo ? "meia" : "vazia"} />
            </li>
          ))}
        </ol>
      </div>

      <p className="border-l-2 border-primary pl-3 text-sm" data-testid="truque">
        <span className="font-semibold">Truque do ENEM: </span>
        {truque}
      </p>

      <MiniExercicio exercicio={exercicio} />
    </section>
  );
}

/** Uma pergunta, opções em linhas com bolha, um clique: verde e "assenta" se acertou; shake e a explicação se errou. */
export function MiniExercicio({ exercicio }: { exercicio: Exercicio }) {
  const [escolha, setEscolha] = React.useState<number | null>(null);
  const acertou = escolha === exercicio.certa;
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4" data-testid="mini-exercicio">
      <p className="text-base font-semibold">Teste rápido</p>
      <p className="qtext">{exercicio.pergunta}</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opções do teste">
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
                "flex min-h-11 w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left text-sm",
                "transition-colors duration-(--duracao) ease-(--curva) hover:border-input",
                marcada && acertou && "anim-assenta border-sucesso bg-sucesso-suave hover:border-sucesso",
                marcada && !acertou && "anim-shake border-erro bg-erro-suave hover:border-erro",
              )}
            >
              <Bolha tamanho="md" estado={marcada ? (acertou ? "certa" : "errada") : "vazia"}>
                {LETRAS[i] ?? i + 1}
              </Bolha>
              <span className="num">{op}</span>
            </button>
          );
        })}
      </div>
      {escolha !== null && (
        <p role="status" className={cn("anim-entrada text-sm", acertou ? "text-sucesso" : "text-erro")}>
          <span className="font-medium">{acertou ? "Isso. " : "Ainda não. "}</span>
          <span className="text-foreground">{acertou ? exercicio.explicacao : "Tente de novo: volte um passo no visual se precisar."}</span>
        </p>
      )}
    </div>
  );
}

const LETRAS = ["A", "B", "C", "D", "E", "F"];

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
        className="h-2 min-w-0 flex-1 cursor-pointer accent-[var(--cor-primaria)]"
      />
      <span className="num w-16 shrink-0 text-right font-medium">
        {fmt(valor)}
        {sufixo}
      </span>
    </div>
  );
}
