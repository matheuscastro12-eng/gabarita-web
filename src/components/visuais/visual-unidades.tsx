"use client";

import * as React from "react";
import { converter, ESCADA_METRO, escalaParaKm, type UnidadeMetro } from "@/lib/visuais/unidades";
import { Deslizador, fmt, MolduraVisual } from "./moldura";
import { cn } from "@/lib/utils";

const ESCALA = 50_000;

/** Escala do mapa e a escada do metro: o marcador sobe degrau a degrau, dividindo por 10. */
export function VisualUnidades() {
  const [mapa, setMapa] = React.useState(4);
  const real = mapa * ESCALA;
  const km = escalaParaKm(mapa, ESCALA);
  const unidades: UnidadeMetro[] = ["cm", "m", "km"];

  return (
    <MolduraVisual
      id="unidades"
      passos={[
        <>Escala <b>1 : {fmt(ESCALA)}</b>: 1 cm no mapa são {fmt(ESCALA)} cm reais. {mapa} cm no mapa × {fmt(ESCALA)} = <b>{fmt(real)} cm</b>.</>,
        <>Suba a escada de cm para m: 2 degraus, divide por 100. {fmt(real)} ÷ 100 = <b>{fmt(converter(real, "cm", "m"))} m</b>.</>,
        <>De m para km: mais 3 degraus, divide por 1 000. Distância real: <b>{fmt(km)} km</b>.</>,
      ]}
      truque="Cada degrau da escada km, hm, dam, m, dm, cm, mm vale ×10 para baixo e ÷10 para cima. Em área cada degrau vale 100; em volume, 1 000."
      exercicio={{
        pergunta: "Numa planta na escala 1:100, uma parede mede 3,5 cm. Quanto ela mede de verdade?",
        opcoes: ["35 cm", "3,5 m", "35 m", "350 m"],
        certa: 1,
        explicacao: "3,5 × 100 = 350 cm. Subindo 2 degraus (cm para m): 3,5 m.",
      }}
      controles={<Deslizador rotulo="Medida no mapa" valor={mapa} min={1} max={12} aoMudar={setMapa} sufixo=" cm" />}
    >
      {(passo) => {
        const atual = unidades[passo]!;
        const indice = ESCADA_METRO.indexOf(atual);
        const valor = converter(real, "cm", atual);
        return (
          <div className="flex flex-col gap-4" role="img" aria-label={`${fmt(valor)} ${atual}`}>
            <p className="num text-center text-3xl font-extrabold">
              <span key={atual} className="anim-entrada inline-block">
                {fmt(valor)} {atual}
              </span>
            </p>
            <div className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded-[10px] bg-accent-solid transition-transform duration-[240ms] ease-(--ease)"
                style={{ width: `${100 / ESCADA_METRO.length}%`, transform: `translateX(${indice * 100}%)` }}
                aria-hidden
              />
              <ol className="relative grid grid-cols-7">
                {ESCADA_METRO.map((u) => (
                  <li
                    key={u}
                    className={cn(
                      "num py-2.5 text-center text-sm font-bold transition-colors duration-(--duration)",
                      u === atual ? "text-white" : u === "m" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {u}
                  </li>
                ))}
              </ol>
            </div>
            <p className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>÷10 a cada degrau para cima</span>
              <span>×10 a cada degrau para baixo</span>
            </p>
          </div>
        );
      }}
    </MolduraVisual>
  );
}
