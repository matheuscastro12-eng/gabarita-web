"use client";

import * as React from "react";
import { probabilidade } from "@/lib/visuais/probabilidade";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmt, MolduraVisual } from "./moldura";

const URNA = [
  { cor: "azul", n: 3, classe: "bg-primary" },
  { cor: "verde", n: 4, classe: "bg-sucesso-forte" },
  { cor: "cinza", n: 5, classe: "bg-muted-foreground/60" },
] as const;
type Cor = (typeof URNA)[number]["cor"];
const TOTAL = URNA.reduce((s, c) => s + c.n, 0);

/** Probabilidade numa urna: tudo que pode sair, depois só o que eu quero. */
export function VisualProbabilidade() {
  const [cor, setCor] = React.useState<Cor>("azul");
  const fav = URNA.find((c) => c.cor === cor)!.n;
  const p = probabilidade(fav, TOTAL);
  const bolas = URNA.flatMap((c) => Array.from({ length: c.n }, () => c));

  return (
    <MolduraVisual
      id="probabilidade"
      passos={[
        <>Uma urna com <b>{TOTAL} bolas</b>: 3 azuis, 4 verdes e 5 cinzas. Sorteia uma.</>,
        <>Casos possíveis: <b>todas as {TOTAL}</b>. Qualquer bola pode sair.</>,
        <>Casos favoráveis (bola {cor}): <b>{fav}</b>. P = {fav}/{TOTAL} = <b>{p.n}/{p.d}</b> = {fmt(p.porcento, 1)}%.</>,
      ]}
      truque="Probabilidade = o que eu quero ÷ tudo que pode sair. Conte os dois antes de pensar em fórmula, e simplifique a fração no fim."
      exercicio={{
        pergunta: "Num dado comum de 6 faces, qual é a probabilidade de sair um número par?",
        opcoes: ["1/6", "1/3", "1/2", "2/3"],
        certa: 2,
        explicacao: "Pares: 2, 4 e 6, são 3 favoráveis em 6 possíveis. 3/6 = 1/2.",
      }}
      controles={
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">Quero tirar</span>
          {URNA.map((c) => (
            <Button key={c.cor} size="sm" variant={cor === c.cor ? "primary" : "outline"} onClick={() => setCor(c.cor)} aria-pressed={cor === c.cor}>
              {c.cor}
            </Button>
          ))}
        </div>
      }
    >
      {(passo) => (
        <div className="flex flex-col items-center gap-3" role="img" aria-label={`${fav} favoráveis de ${TOTAL} possíveis`}>
          <div className="grid grid-cols-6 gap-2.5 rounded-[28px] border-[1.5px] border-border bg-card p-4">
            {bolas.map((b, i) => {
              const apagada = passo === 2 && b.cor !== cor;
              const contorno = passo === 1 || (passo === 2 && b.cor === cor);
              return (
                <span
                  key={i}
                  className={cn(
                    "size-7 rounded-full transition-[opacity,transform] duration-[220ms] ease-(--curva)",
                    b.classe,
                    apagada ? "scale-90 opacity-20" : "opacity-100",
                    contorno && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-card",
                  )}
                  style={{ transitionDelay: `${i * 15}ms` }}
                />
              );
            })}
          </div>
          <p className="num text-2xl font-semibold">
            {passo < 2 ? `? / ${TOTAL}` : `${fav}/${TOTAL} = ${p.n}/${p.d}`}
          </p>
        </div>
      )}
    </MolduraVisual>
  );
}
