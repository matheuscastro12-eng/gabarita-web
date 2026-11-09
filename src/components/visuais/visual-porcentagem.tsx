"use client";

import * as React from "react";
import { aplicarVariacoes, fator, porcentagemDe, quadradosPintados } from "@/lib/visuais/porcentagem";
import { cn } from "@/lib/utils";
import { Deslizador, fmt, MolduraVisual, reais } from "./moldura";

const PRECO = 80;

/** Porcentagem como 100 quadradinhos: o todo, a parte que sai e a que fica. */
export function VisualPorcentagem() {
  const [p, setP] = React.useState(25);
  const desconto = porcentagemDe(p, PRECO);
  const fica = aplicarVariacoes(PRECO, [-p]);
  const pintados = quadradosPintados(p);

  return (
    <MolduraVisual
      id="porcentagem"
      passos={[
        <>Uma camiseta custa <b>R$ {reais(PRECO)}</b>. Os 100 quadradinhos são o preço inteiro: cada um vale R$ {reais(PRECO / 100)}.</>,
        <>Desconto de <b>{p}%</b> = {pintados} quadradinhos. {pintados} × R$ {reais(PRECO / 100)} = <b>R$ {reais(desconto)}</b> a menos.</>,
        <>Sobram {100 - pintados} quadradinhos: você paga <b>R$ {reais(fica)}</b>. Atalho: {fmt(PRECO)} × {fmt(fator(-p))} = {fmt(fica)}.</>,
      ]}
      truque={`Desconto de p% é multiplicar por (1 − p/100); aumento é multiplicar por (1 + p/100). Subir 10% e depois cair 10% dá −1%, não volta ao preço.`}
      exercicio={{
        pergunta: "Um produto de R$ 200 sobe 10% e, no mês seguinte, cai 10%. Quanto passa a custar?",
        opcoes: ["R$ 200", "R$ 198", "R$ 202", "R$ 180"],
        certa: 1,
        explicacao: "200 × 1,1 × 0,9 = 198. Os 10% de queda são sobre 220, não sobre 200.",
      }}
      controles={<Deslizador rotulo="Porcentagem" valor={p} min={0} max={100} aoMudar={setP} sufixo="%" />}
    >
      {(passo) => (
        <div className="flex flex-col items-center gap-3">
          <div className="grid w-full max-w-[280px] grid-cols-10 gap-[3px]" role="img" aria-label={`${pintados} de 100 quadradinhos pintados`}>
            {Array.from({ length: 100 }, (_, i) => {
              const parte = i < pintados;
              return (
                <span
                  key={i}
                  className={cn(
                    "aspect-square rounded-[3px] transition-colors duration-200 ease-(--curva)",
                    passo === 0 ? "bg-primary/25" : parte ? (passo === 1 ? "bg-erro-forte" : "bg-erro-forte/20") : passo === 2 ? "bg-primary" : "bg-primary/25",
                  )}
                  style={{ transitionDelay: `${Math.min(i, 60) * 3}ms` }}
                />
              );
            })}
          </div>
          <div className="num flex gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-erro-forte" aria-hidden /> desconto {p}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-primary" aria-hidden /> você paga {100 - p}%
            </span>
          </div>
        </div>
      )}
    </MolduraVisual>
  );
}
