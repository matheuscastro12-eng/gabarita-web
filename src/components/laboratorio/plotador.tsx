"use client";

import * as React from "react";
import { LineChart } from "lucide-react";
import { extrairFuncao, normalizarPlot, type PlotSpec } from "@/lib/tutor/plot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Grafico } from "@/components/estudo/grafico";

const EXEMPLOS_GRAFICO = ["2x + 3", "a*x + b", "a*x^2 + b", "-5x^2 + 40x", "1000*(1 + k)^x"];

/** Plotador de funções com sliders (Mafs): letras além de x viram parâmetros. */
export function Plotador({ compacto = false }: { compacto?: boolean }) {
  const [expressao, setExpressao] = React.useState("a*x^2 + b");
  const [spec, setSpec] = React.useState<PlotSpec | null>(() => extrairFuncao("gráfico de a*x^2 + b"));
  const [erro, setErro] = React.useState<string | null>(null);

  const desenhar = (texto: string) => {
    const s = extrairFuncao(`gráfico de ${texto}`);
    if (!s) {
      setErro("Escreva uma função de x, por exemplo 2x + 3 ou a*x^2 + b (letras viram sliders).");
      return;
    }
    setErro(null);
    setSpec(normalizarPlot(s));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <LineChart className="size-4" strokeWidth={1.5} /> Gráfico de função
        </h2>
        {!compacto && <p className="text-sm text-muted-foreground">Escreva uma função de x. Letras como a, b, k viram sliders.</p>}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Exemplos de função">
        {EXEMPLOS_GRAFICO.map((ex) => (
          <Button
            key={ex}
            variant="outline"
            size="sm"
            className="num"
            onClick={() => {
              setExpressao(ex);
              desenhar(ex);
            }}
          >
            {ex}
          </Button>
        ))}
      </div>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          desenhar(expressao);
        }}
      >
        <label htmlFor={compacto ? "expressao-grafico-gaveta" : "expressao-grafico"} className="sr-only">
          Função de x
        </label>
        <span className="num text-sm text-texto-2">y =</span>
        <Input
          id={compacto ? "expressao-grafico-gaveta" : "expressao-grafico"}
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          className="num h-9 w-auto min-w-0 flex-1 basis-40"
          spellCheck={false}
          autoCapitalize="off"
        />
        <Button type="submit" variant="secondary" data-testid="desenhar">
          Desenhar
        </Button>
      </form>
      {erro && (
        <p className="rounded-md bg-erro-suave p-3 text-sm text-erro" role="alert">
          {erro}
        </p>
      )}
      {spec && <Grafico key={JSON.stringify(spec.funcoes)} spec={spec} altura={compacto ? 240 : 320} />}
    </div>
  );
}
