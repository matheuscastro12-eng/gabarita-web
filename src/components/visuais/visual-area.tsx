"use client";

import * as React from "react";
import { areaRetangulo, celulasPreenchidas, perimetroRetangulo } from "@/lib/visuais/geometria";
import { cn } from "@/lib/utils";
import { Deslizador, MolduraVisual } from "./moldura";

/** Área como quadradinhos que preenchem a grade; perímetro como a borda que acende. */
export function VisualArea() {
  const [base, setBase] = React.useState(6);
  const [altura, setAltura] = React.useState(4);
  const area = areaRetangulo(base, altura);
  const perimetro = perimetroRetangulo(base, altura);

  return (
    <MolduraVisual
      id="area"
      passos={[
        <>Um terreno de <b>{base} m × {altura} m</b>. Cada quadradinho da grade tem 1 m de lado: 1 m².</>,
        <>Preencha: {base} quadradinhos por linha, {altura} linhas. Área = {base} × {altura} = <b>{area} m²</b>.</>,
        <>Perímetro é a cerca em volta: {base} + {altura} + {base} + {altura} = <b>{perimetro} m</b>. Área conta quadradinhos; perímetro mede a borda.</>,
      ]}
      truque="Área em m² (conta quadradinhos), perímetro em m (mede a borda). Dobrar os lados multiplica o perímetro por 2 e a área por 4."
      exercicio={{
        pergunta: "Um quadrado de lado 5 m tem o lado dobrado. O que acontece com a área?",
        opcoes: ["Fica 2 vezes maior", "Fica 4 vezes maior", "Não muda", "Fica 8 vezes maior"],
        certa: 1,
        explicacao: "Antes 5 × 5 = 25 m²; depois 10 × 10 = 100 m², que é 4 vezes 25.",
      }}
      controles={
        <>
          <Deslizador rotulo="Base" valor={base} min={1} max={10} aoMudar={setBase} sufixo=" m" />
          <Deslizador rotulo="Altura" valor={altura} min={1} max={6} aoMudar={setAltura} sufixo=" m" />
        </>
      }
    >
      {(passo) => {
        const cheias = celulasPreenchidas(base, altura, passo >= 1 ? area : 0);
        return (
          <div className="flex justify-center">
            <div
              className={cn(
                "grid gap-[3px] rounded-[8px] p-[3px] ring-2 transition-[box-shadow] duration-(--duracao)",
                passo === 2 ? "ring-primary" : "ring-transparent",
              )}
              style={{ gridTemplateColumns: `repeat(${base}, 28px)` }}
              role="img"
              aria-label={`Grade de ${base} por ${altura}: área ${area} metros quadrados, perímetro ${perimetro} metros`}
            >
              {Array.from({ length: area }, (_, i) => (
                <span
                  key={`${base}-${altura}-${i}`}
                  className={cn(
                    "size-7 rounded-[4px] transition-[background-color,transform] duration-200 ease-(--curva)",
                    i < cheias ? (passo === 2 ? "bg-primary/35" : "bg-primary") : "bg-card ring-1 ring-border ring-inset",
                  )}
                  style={{ transitionDelay: passo === 1 ? `${i * 12}ms` : "0ms" }}
                />
              ))}
            </div>
          </div>
        );
      }}
    </MolduraVisual>
  );
}
