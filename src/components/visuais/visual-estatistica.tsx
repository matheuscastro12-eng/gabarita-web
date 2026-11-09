"use client";

import * as React from "react";
import { destinoAoOrdenar, indicesMediana, media, mediana, moda, ordenar } from "@/lib/visuais/estatistica";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmt, MolduraVisual } from "./moldura";

const CONJUNTOS = {
  impar: [7, 3, 9, 5, 5],
  par: [8, 2, 6, 4],
} as const;

/** Média, moda e mediana: os valores se ordenam, o do meio acende e a média aparece na reta. */
export function VisualEstatistica() {
  const [tipo, setTipo] = React.useState<keyof typeof CONJUNTOS>("impar");
  const xs = [...CONJUNTOS[tipo]];
  const destino = destinoAoOrdenar(xs);
  const meio = indicesMediana(xs.length);
  const med = mediana(xs);
  const m = media(xs);
  const mo = moda(xs);
  const soma = xs.reduce((s, x) => s + x, 0);

  return (
    <MolduraVisual
      key={tipo}
      id="estatistica"
      passos={[
        <>As notas como vieram: <b>{xs.join(", ")}</b>. Nessa ordem, o do meio não diz nada.</>,
        <>Primeiro, <b>ordene</b>: {ordenar(xs).join(", ")}. O ENEM quase nunca entrega a lista ordenada.</>,
        xs.length % 2 ? (
          <>Mediana é o do meio da lista ordenada: <b>{fmt(med)}</b>.</>
        ) : (
          <>Com quantidade par, a mediana é a média dos dois do meio: ({ordenar(xs)[meio[0]!]} + {ordenar(xs)[meio[1]!]}) ÷ 2 = <b>{fmt(med)}</b>.</>
        ),
        <>
          Média: soma ÷ quantidade = {soma} ÷ {xs.length} = <b>{fmt(m)}</b> (o tracinho na reta).{" "}
          {mo.length ? <>Moda: o que mais aparece = <b>{mo.join(" e ")}</b>.</> : <>Moda: nenhum valor se repete, então não há moda.</>}
        </>,
      ]}
      truque="Mediana só depois de ordenar. Com quantidade par, é a média dos dois do meio. A média sente valores extremos; a mediana, não."
      exercicio={{
        pergunta: "Qual é a mediana de 3, 10, 2 e 8?",
        opcoes: ["5,5", "5,75", "8", "3"],
        certa: 0,
        explicacao: "Ordenado: 2, 3, 8, 10. Os do meio são 3 e 8: (3 + 8) ÷ 2 = 5,5. O 5,75 é a média.",
      }}
      controles={
        <div className="flex gap-2">
          <Button size="sm" variant={tipo === "impar" ? "primary" : "outline"} onClick={() => setTipo("impar")} aria-pressed={tipo === "impar"}>
            5 notas (ímpar)
          </Button>
          <Button size="sm" variant={tipo === "par" ? "primary" : "outline"} onClick={() => setTipo("par")} aria-pressed={tipo === "par"}>
            4 notas (par)
          </Button>
        </div>
      }
    >
      {(passo) => (
        <div className="flex flex-col gap-5" role="img" aria-label={`Valores ${xs.join(", ")}; mediana ${fmt(med)}; média ${fmt(m)}`}>
          {/* Fichas: cada uma anda (translateX) da posição original para a ordenada. */}
          <div className="relative mx-auto h-12" style={{ width: `${xs.length * 56}px` }}>
            {xs.map((v, i) => {
              const pos = passo >= 1 ? destino[i]! : i;
              const ehMeio = passo >= 2 && meio.includes(destino[i]!);
              const ehModa = passo >= 3 && mo.includes(v);
              return (
                <span
                  key={i}
                  className={cn(
                    "num absolute top-0 left-0 inline-flex size-12 items-center justify-center rounded-full border-[1.5px] text-lg font-semibold",
                    "transition-[transform,background-color,border-color,color] duration-[240ms] ease-(--curva)",
                    ehMeio ? "border-primary bg-primary text-primary-foreground" : ehModa ? "border-sucesso bg-sucesso-suave text-sucesso" : "border-border bg-card",
                  )}
                  style={{ transform: `translateX(${pos * 56 + 4}px)` }}
                >
                  {v}
                </span>
              );
            })}
          </div>
          {/* Reta de 0 a 10 com os pontos e a média. */}
          <div className="relative mx-2 h-10">
            <div className="absolute inset-x-0 top-4 h-[2px] rounded-full bg-border" />
            {Array.from({ length: 11 }, (_, k) => (
              <span key={k} className="num absolute top-6 -translate-x-1/2 text-[10px] text-muted-foreground" style={{ left: `${k * 10}%` }}>
                {k}
              </span>
            ))}
            {xs.map((v, i) => {
              const repetidos = xs.slice(0, i).filter((x) => x === v).length;
              return (
                <span
                  key={i}
                  className="absolute size-2.5 -translate-x-1/2 rounded-full bg-primary"
                  style={{ left: `${v * 10}%`, top: `${11 - repetidos * 9}px` }}
                />
              );
            })}
            <span
              className={cn(
                "absolute top-0 h-9 w-[2px] -translate-x-1/2 rounded-full bg-aviso transition-opacity duration-(--duracao)",
                passo >= 3 ? "opacity-100" : "opacity-0",
              )}
              style={{ left: `${m * 10}%` }}
              aria-hidden
            />
          </div>
        </div>
      )}
    </MolduraVisual>
  );
}
