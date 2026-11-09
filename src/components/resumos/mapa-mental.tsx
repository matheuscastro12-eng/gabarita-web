"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { geometriaMapa, larguraRotulo, type NoMapa } from "@/lib/resumos/logica";
import { cn } from "@/lib/utils";

export interface MapaMentalProps {
  centro: string;
  ramos: { rotulo: string; itens: (string | NoMapa)[] }[];
  /** Nome acessível do mapa. */
  titulo: string;
  /** Ramo aberto no começo (null = todos fechados). */
  abertoInicial?: number | null;
  className?: string;
}

const ALTURA_RAMO = 34;
const ALTURA_FILHO = 26;

function no(item: string | NoMapa): NoMapa {
  return typeof item === "string" ? { rotulo: item } : item;
}

/**
 * Mapa mental em SVG: nó central, ramos numa elipse e filhos que se abrem ao clicar no ramo
 * (um por vez, para não sobrepor). No celular vira uma árvore em lista com o mesmo estado.
 * A entrada dos filhos usa `.anim-mapa` (opacity/transform, zerada por prefers-reduced-motion).
 */
export function MapaMental({ centro, ramos, titulo, abertoInicial = 0, className }: MapaMentalProps) {
  const [aberto, setAberto] = React.useState<number | null>(abertoInicial);
  const larguraCentro = larguraRotulo(centro, 16) + 10;
  const geo = React.useMemo(
    () => geometriaMapa(ramos.map((r) => ({ largura: larguraRotulo(r.rotulo, 14), filhos: r.itens.map((it) => larguraRotulo(no(it).rotulo, 12)) })), larguraCentro),
    [ramos, larguraCentro],
  );
  const alternar = (i: number) => setAberto((a) => (a === i ? null : i));
  const idBase = React.useId();
  const vb = geo.viewBox;

  return (
    <div className={cn("caderno-quadriculado rounded-[14px] p-2", className)} data-testid="mapa-mental">
      {/* Telas médias e grandes: radial */}
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.largura} ${vb.altura}`}
        role="group"
        aria-label={`Mapa mental: ${titulo}`}
        className="mx-auto hidden h-auto w-full max-w-[980px] select-none md:block"
      >
        {/* ligações centro → ramo */}
        {geo.ramos.map((g, i) => {
          const cx = g.caixa.x + g.caixa.largura / 2;
          const alvoX = g.ancora === "start" ? g.caixa.x : g.ancora === "end" ? g.caixa.x + g.caixa.largura : cx;
          return (
            <path
              key={`l${i}`}
              d={`M0 0 Q ${alvoX * 0.6} ${g.caixa.y * 0.15} ${alvoX} ${g.caixa.y}`}
              fill="none"
              stroke={aberto === i ? "var(--accent)" : "var(--border)"}
              strokeWidth={aberto === i ? 2.5 : 2}
              className="transition-[stroke] duration-(--duration) ease-(--ease)"
            />
          );
        })}

        {/* filhos do ramo aberto */}
        {aberto !== null &&
          ramos[aberto] &&
          (() => {
            const g = geo.ramos[aberto]!;
            return (
              <g key={`f${aberto}`} data-testid="mapa-filhos">
                {ramos[aberto].itens.map((bruto, j) => {
                  const item = no(bruto);
                  const f = g.filhos[j]!;
                  const xLiga = g.ancora === "start" ? f.x : g.ancora === "end" ? f.x + f.largura : f.x + f.largura / 2;
                  const yLiga = g.ancora === "middle" ? f.y + (f.y < g.caixa.y ? ALTURA_FILHO / 2 : -ALTURA_FILHO / 2) : f.y;
                  const corpo = (
                    <>
                      <rect x={f.x} y={f.y - ALTURA_FILHO / 2} width={f.largura} height={ALTURA_FILHO} rx={13} fill="var(--surface)" stroke={item.href ? "var(--accent)" : "var(--border)"} strokeWidth={1.5} />
                      <text x={f.x + f.largura / 2} y={f.y} dominantBaseline="central" textAnchor="middle" fontSize={12} fontWeight={item.href ? 600 : 500} fill={item.href ? "var(--accent-text)" : "var(--foreground)"}>
                        {item.rotulo}
                      </text>
                    </>
                  );
                  return (
                    <g key={j} className="anim-mapa" style={{ animationDelay: `${j * 40}ms` }}>
                      {(g.ancora !== "middle" || j === 0) && (
                        <path d={`M${g.saida.x} ${g.saida.y} L ${xLiga} ${yLiga}`} fill="none" stroke="var(--accent)" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 4" />
                      )}
                      {item.href ? (
                        <a href={item.href} className="mapa-link">
                          {corpo}
                        </a>
                      ) : (
                        corpo
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })()}

        {/* ramos */}
        {ramos.map((r, i) => {
          const g = geo.ramos[i]!;
          const ativo = aberto === i;
          return (
            <g
              key={`r${i}`}
              role="button"
              tabIndex={0}
              aria-expanded={ativo}
              aria-label={`${r.rotulo}: ${r.itens.length} ${r.itens.length === 1 ? "item" : "itens"}`}
              className="mapa-ramo cursor-pointer outline-none"
              onClick={() => alternar(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  alternar(i);
                }
              }}
              data-testid="mapa-ramo"
            >
              <rect
                x={g.caixa.x}
                y={g.caixa.y - ALTURA_RAMO / 2}
                width={g.caixa.largura}
                height={ALTURA_RAMO}
                rx={17}
                fill={ativo ? "var(--accent-soft)" : "var(--surface)"}
                stroke="var(--accent)"
                strokeWidth={1.5}
                className="transition-[fill] duration-(--duration) ease-(--ease)"
              />
              <text x={g.caixa.x + g.caixa.largura / 2} y={g.caixa.y} dominantBaseline="central" textAnchor="middle" fontSize={14} fontWeight={700} fill={ativo ? "var(--accent-text)" : "var(--foreground)"}>
                {r.rotulo}
              </text>
            </g>
          );
        })}

        {/* centro */}
        <g>
          <rect x={-larguraCentro / 2} y={-24} width={larguraCentro} height={48} rx={24} fill="var(--accent)" />
          <text x={0} y={0} dominantBaseline="central" textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">
            {centro}
          </text>
        </g>
      </svg>

      {/* Celular: árvore em lista */}
      <div className="md:hidden">
        <p className="mx-auto mb-3 w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-extrabold text-white">{centro}</p>
        <ul className="flex flex-col gap-1.5 border-l-2 border-accent-soft pl-3" aria-label={`Mapa mental: ${titulo}`}>
          {ramos.map((r, i) => {
            const ativo = aberto === i;
            const idLista = `${idBase}-${i}`;
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-expanded={ativo}
                  aria-controls={idLista}
                  onClick={() => alternar(i)}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-full border-[1.5px] border-accent bg-surface px-3 py-1.5 text-left text-sm font-bold",
                    "transition-colors duration-(--duration) ease-(--ease)",
                    ativo && "bg-accent-soft text-accent-text",
                  )}
                >
                  <ChevronRight className={cn("size-4 shrink-0 transition-transform duration-(--duration) ease-(--ease)", ativo && "rotate-90")} />
                  {r.rotulo}
                </button>
                {ativo && (
                  <ul id={idLista} className="mt-1.5 ml-4 flex flex-col gap-1 border-l border-dashed border-border pl-3">
                    {r.itens.map((bruto, j) => {
                      const item = no(bruto);
                      return (
                        <li key={j} className="anim-mapa text-[13px]" style={{ animationDelay: `${j * 40}ms` }}>
                          {item.href ? (
                            <Link href={item.href} className="font-semibold text-accent-text underline-offset-4 hover:underline">
                              {item.rotulo}
                            </Link>
                          ) : (
                            item.rotulo
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="sr-only md:not-sr-only md:mt-1 md:text-center md:text-xs md:text-muted-foreground">Clique num ramo para abrir.</p>
    </div>
  );
}
