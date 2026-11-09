"use client";

import * as React from "react";
import { Coordinates, Mafs, Plot, Point, Text, Theme } from "mafs";
import "mafs/core.css";
import type { PlotSpec } from "@/lib/tutor/plot";
import { compiladorNoCliente, type Compilador } from "@/lib/tutor/mathjs-cliente";
import { cn } from "@/lib/utils";

const CORES = [Theme.yellow, Theme.blue, Theme.green, Theme.pink];

interface Props {
  spec: PlotSpec;
  className?: string;
  altura?: number;
}

/** Gráfico interativo (Mafs) da spec devolvida por `plot_function`, com sliders para os parâmetros. */
export function Grafico({ spec, className, altura = 280 }: Props) {
  const [compilar, setCompilar] = React.useState<Compilador | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [valores, setValores] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(spec.parametros.map((p) => [p.nome, p.valor])),
  );

  React.useEffect(() => {
    let ativo = true;
    compiladorNoCliente()
      .then((c) => {
        if (ativo) setCompilar(() => c);
      })
      .catch(() => {
        if (ativo) setErro("Não consegui carregar o motor de gráficos.");
      });
    return () => {
      ativo = false;
    };
  }, []);

  const funcoes = React.useMemo(() => {
    if (!compilar) return [];
    return spec.funcoes.map((f, i) => {
      try {
        const fn = compilar(f.expressao);
        return { rotulo: f.rotulo ?? `y = ${f.expressao}`, cor: CORES[i % CORES.length] as string, fn, erro: null as string | null };
      } catch (e) {
        return { rotulo: f.rotulo ?? f.expressao, cor: CORES[i % CORES.length] as string, fn: null, erro: e instanceof Error ? e.message : "inválida" };
      }
    });
  }, [compilar, spec.funcoes]);

  const yAuto = React.useMemo((): [number, number] => {
    if (spec.yMin !== undefined && spec.yMax !== undefined) return [spec.yMin, spec.yMax];
    let min = Infinity;
    let max = -Infinity;
    for (const f of funcoes) {
      if (!f.fn) continue;
      for (let i = 0; i <= 40; i++) {
        const x = spec.xMin + ((spec.xMax - spec.xMin) * i) / 40;
        const y = f.fn({ x, ...valores });
        if (Number.isFinite(y)) {
          min = Math.min(min, y);
          max = Math.max(max, y);
        }
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [-10, 10];
    if (max - min < 1e-9) return [min - 5, max + 5];
    const folga = (max - min) * 0.15;
    return [Math.min(min - folga, 0), Math.max(max + folga, 0)];
  }, [funcoes, spec, valores]);

  return (
    <figure className={cn("flex flex-col gap-3 rounded-lg border border-border bg-surface p-3", className)} data-testid="grafico">
      {spec.titulo && <figcaption className="text-sm font-semibold">{spec.titulo}</figcaption>}
      {erro ? (
        <p className="text-sm text-danger">{erro}</p>
      ) : !compilar ? (
        <div className="animate-pulse rounded-md bg-surface-2" style={{ height: altura }} aria-busy="true" aria-label="Carregando o gráfico" />
      ) : (
        <div className="mafs-tema overflow-hidden rounded-md" style={{ height: altura }}>
          <Mafs height={altura} viewBox={{ x: [spec.xMin, spec.xMax], y: yAuto }} preserveAspectRatio={false} pan zoom>
            <Coordinates.Cartesian />
            {funcoes.map((f) => (f.fn ? <Plot.OfX key={f.rotulo} y={(x) => f.fn!({ x, ...valores })} color={f.cor} /> : null))}
            {spec.pontos.map((p, i) => (
              <React.Fragment key={`${p.x}-${p.y}-${i}`}>
                <Point x={p.x} y={p.y} color={Theme.foreground} />
                {p.rotulo && (
                  <Text x={p.x} y={p.y} attach="ne" size={13}>
                    {p.rotulo}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </Mafs>
        </div>
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {funcoes.map((f) => (
          <li key={f.rotulo} className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-0.5 w-5 rounded" style={{ background: f.cor }} />
            <span className={cn("font-mono text-xs", f.erro && "text-danger")}>{f.erro ? `${f.rotulo}: ${f.erro}` : f.rotulo}</span>
          </li>
        ))}
      </ul>
      {spec.parametros.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {spec.parametros.map((p) => (
            <label key={p.nome} className="flex items-center gap-3 text-sm">
              <span className="w-10 font-mono">
                {p.nome} = <span className="tabular">{formatar(valores[p.nome] ?? p.valor)}</span>
              </span>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.passo ?? (p.max - p.min) / 20}
                value={valores[p.nome] ?? p.valor}
                onChange={(e) => setValores((v) => ({ ...v, [p.nome]: Number(e.target.value) }))}
                aria-label={`parâmetro ${p.nome}`}
                className="flex-1 accent-(--accent)"
              />
            </label>
          ))}
        </div>
      )}
    </figure>
  );
}

function formatar(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}
