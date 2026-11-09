"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { fatias, fracaoDe, simplificar } from "@/lib/visuais/fracoes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmt, MolduraVisual } from "./moldura";

const TOTAL = 80;

/** Fração como uma barra dividida em partes iguais, com a equivalente embaixo. */
export function VisualFracoes() {
  const [n, setN] = React.useState(3);
  const [d, setD] = React.useState(4);
  const parte = TOTAL / d;
  const s = simplificar(n, d);

  return (
    <MolduraVisual
      id="fracoes"
      passos={[
        <>Uma turma de <b>{TOTAL} alunos</b> é a barra inteira. Divida em <b>{d} partes iguais</b>: cada uma tem {fmt(parte)} alunos.</>,
        <>Pinte {n} partes: <b>{n}/{d} de {TOTAL}</b> = {n} × {fmt(parte)} = <b>{fmt(fracaoDe(n, d, TOTAL))} alunos</b>.</>,
        <>A barra de baixo tem o dobro de partes e o dobro pintado: <b>{2 * n}/{2 * d}</b> cobre o mesmo pedaço. Simplificada, a fração é {s.n}/{s.d}.</>,
      ]}
      truque="Fração de um total: divide pelo de baixo, multiplica pelo de cima. Multiplicar em cima e embaixo pelo mesmo número não muda a fração."
      exercicio={{
        pergunta: "Um tanque tem 150 litros. Quanto são 2/5 desse tanque?",
        opcoes: ["30 L", "60 L", "75 L", "100 L"],
        certa: 1,
        explicacao: "150 ÷ 5 = 30 litros por parte; 2 partes = 60 litros.",
      }}
      controles={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Contador rotulo="Partes pintadas" valor={n} min={0} max={d} aoMudar={setN} />
          <Contador
            rotulo="Partes no total"
            valor={d}
            min={2}
            max={10}
            aoMudar={(v) => {
              setD(v);
              setN((x) => Math.min(x, v));
            }}
          />
        </div>
      }
    >
      {(passo) => (
        <div className="flex flex-col gap-3" role="img" aria-label={`${n} de ${d} partes pintadas`}>
          <Barra pintadas={passo === 0 ? fatias(0, d) : fatias(n, d)} />
          <div className={cn("transition-opacity duration-(--duration)", passo === 2 ? "opacity-100" : "opacity-0")} aria-hidden={passo !== 2}>
            <Barra pintadas={fatias(2 * n, 2 * d)} />
          </div>
          <p className="num text-center text-2xl font-extrabold">
            {passo === 0 ? `? / ${d}` : passo === 1 ? `${n} / ${d}` : `${n}/${d} = ${2 * n}/${2 * d}`}
          </p>
        </div>
      )}
    </MolduraVisual>
  );
}

function Barra({ pintadas }: { pintadas: boolean[] }) {
  return (
    <div className="flex h-10 gap-[3px]">
      {pintadas.map((p, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-[6px] transition-colors duration-200 ease-(--ease)", p ? "bg-accent" : "bg-surface ring-1 ring-border ring-inset")}
          style={{ transitionDelay: `${i * 25}ms` }}
        />
      ))}
    </div>
  );
}

function Contador({ rotulo, valor, min, max, aoMudar }: { rotulo: string; valor: number; min: number; max: number; aoMudar: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-muted-foreground">{rotulo}</span>
      <Button variant="outline" size="icon-sm" className="size-8" onClick={() => aoMudar(Math.max(min, valor - 1))} disabled={valor <= min} aria-label={`Diminuir ${rotulo.toLowerCase()}`}>
        <Minus />
      </Button>
      <span className="num w-6 text-center font-bold">{valor}</span>
      <Button variant="outline" size="icon-sm" className="size-8" onClick={() => aoMudar(Math.min(max, valor + 1))} disabled={valor >= max} aria-label={`Aumentar ${rotulo.toLowerCase()}`}>
        <Plus />
      </Button>
    </div>
  );
}
