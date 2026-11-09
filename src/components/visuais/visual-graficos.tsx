"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fmt, MolduraVisual } from "./moldura";

const DADOS = [
  { mes: "Jan", v: 12 },
  { mes: "Fev", v: 18 },
  { mes: "Mar", v: 9 },
  { mes: "Abr", v: 15 },
];
const MAX = 20;
// Geometria do SVG (unidades do viewBox).
const L = 36;
const B = 150;
const T = 14;
const ALT = B - T;
const LARG_BARRA = 34;
const VAO = 62;

const y = (v: number) => B - (v / MAX) * ALT;

/** Leitura de gráfico de barras: escolher a barra, subir até o topo e seguir reto até o eixo. */
export function VisualGraficos() {
  const [sel, setSel] = React.useState(1);
  const barra = DADOS[sel]!;
  const outra = DADOS[2]!;

  return (
    <MolduraVisual
      id="graficos"
      passos={[
        <>Antes dos números, leia o <b>título</b> e o <b>eixo vertical</b>: vendas em <b>mil unidades</b>, de 0 a {MAX}, de 5 em 5.</>,
        <>Escolha a barra de <b>{barra.mes}</b> (clique em outra se quiser) e suba até o topo dela.</>,
        <>Do topo, siga reto até o eixo: <b>{barra.v} mil</b> unidades. Não é {barra.v}, é {fmt(barra.v * 1000)}.</>,
        <>Compare com março: {barra.v} − {outra.v} = <b>{barra.v - outra.v} mil</b> de diferença.</>,
      ]}
      truque="Antes de calcular, leia título, eixo e unidade. Boa parte dos erros nas fáceis é unidade lida errado: mil, milhões, % ou pontos percentuais."
      exercicio={{
        pergunta: "No gráfico, qual mês vendeu o dobro de março?",
        opcoes: ["Jan", "Fev", "Abr"],
        certa: 1,
        explicacao: "Março vendeu 9 mil; o dobro é 18 mil, que é a barra de fevereiro.",
      }}
    >
      {(passo) => (
        <svg viewBox="0 0 300 180" className="mx-auto w-full max-w-[420px]" role="img" aria-label={`Vendas por mês, em mil unidades. ${DADOS.map((d) => `${d.mes} ${d.v}`).join(", ")}`}>
          <text x={L} y={10} className="fill-muted-foreground text-[9px] font-semibold">
            Vendas por mês (mil unidades)
          </text>
          {[0, 5, 10, 15, 20].map((v) => (
            <g key={v}>
              <line x1={L} x2={290} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
              <text
                x={L - 6}
                y={y(v) + 3}
                textAnchor="end"
                className={cn("text-[9px] transition-colors duration-(--duracao)", passo >= 2 && v === barra.v ? "fill-primary font-semibold" : "fill-muted-foreground")}
              >
                {v}
              </text>
            </g>
          ))}
          <line x1={L} x2={L} y1={T} y2={B} strokeWidth={1.5} className={cn("transition-colors duration-(--duracao)", passo === 0 ? "stroke-primary" : "stroke-muted-foreground")} />
          {DADOS.map((d, i) => {
            const x = L + 18 + i * VAO;
            const ativo = i === sel && passo >= 1;
            const comparada = passo === 3 && i === 2;
            return (
              <g key={d.mes} onClick={() => setSel(i)} className="cursor-pointer">
                <rect
                  x={x}
                  y={y(d.v)}
                  width={LARG_BARRA}
                  height={B - y(d.v)}
                  rx={5}
                  className={cn("transition-[fill,opacity] duration-(--duracao)", ativo ? "fill-primary" : comparada ? "fill-aviso" : "fill-primary/30")}
                />
                <text x={x + LARG_BARRA / 2} y={B + 13} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                  {d.mes}
                </text>
              </g>
            );
          })}
          {passo >= 2 && barra.v % 5 !== 0 && (
            <text key={`valor-${sel}`} x={L - 6} y={y(barra.v) + 3} textAnchor="end" className="anim-entrada fill-primary text-[9px] font-semibold">
              {barra.v}
            </text>
          )}
          {/* Leitura: linha tracejada do topo da barra até o eixo, desenhada (scaleX a partir da barra). */}
          {passo >= 2 && (
            <line
              key={`leitura-${sel}`}
              x1={L}
              x2={L + 18 + sel * VAO}
              y1={y(barra.v)}
              y2={y(barra.v)}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              className="anim-traco-eixo stroke-primary"
              style={{ transformOrigin: `${L + 18 + sel * VAO}px ${y(barra.v)}px` }}
            />
          )}
        </svg>
      )}
    </MolduraVisual>
  );
}
