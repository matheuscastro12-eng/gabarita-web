"use client";

import * as React from "react";
import { FlaskConical, LineChart, Loader2, Play, Square } from "lucide-react";
import { pyodideCliente, type StatusPyodide } from "@/lib/pyodide/cliente";
import type { SaidaPython } from "@/lib/tutor/ferramentas";
import { extrairFuncao, normalizarPlot, type PlotSpec } from "@/lib/tutor/plot";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Grafico } from "@/components/estudo/grafico";

const EXEMPLO = `# Questão ENEM 2022-154: 28 900 vagas são 25% do valor de 2012.
V = symbols('V')
solve(Eq(Rational(25, 100) * V, 28900), V)`;

const EXEMPLOS = [
  { rotulo: "Equação", codigo: EXEMPLO },
  { rotulo: "Simplificar", codigo: "x = symbols('x')\nsimplify((x**2 - 1) / (x - 1))" },
  { rotulo: "Porcentagem", codigo: "preco = 480\ndesconto = Rational(25, 100)\nprint(preco * (1 - desconto))\nfloat(preco * (1 - desconto))" },
  { rotulo: "Raízes", codigo: "t = symbols('t')\nsolve(-5*t**2 + 40*t, t)" },
];

function assinarStatus(cb: () => void) {
  return pyodideCliente().assinar(() => cb());
}
function lerStatus(): StatusPyodide {
  return pyodideCliente().obterStatus();
}
const STATUS_SERVIDOR: StatusPyodide = { estado: "parado", etapa: null, erro: null, versao: null };

/** Laboratório: Python/SymPy no navegador (Web Worker + Pyodide) e gráficos com sliders. */
export function TelaLaboratorio() {
  const status = React.useSyncExternalStore(assinarStatus, lerStatus, () => STATUS_SERVIDOR);
  const [codigo, setCodigo] = React.useState(EXEMPLO);
  const [saida, setSaida] = React.useState<SaidaPython | null>(null);
  const [rodando, setRodando] = React.useState(false);
  const [expressao, setExpressao] = React.useState("a*x^2 + b");
  const [spec, setSpec] = React.useState<PlotSpec | null>(() => extrairFuncao("gráfico de a*x^2 + b"));
  const [erroGrafico, setErroGrafico] = React.useState<string | null>(null);

  const rodar = React.useCallback(async () => {
    if (rodando) return;
    setRodando(true);
    setSaida(null);
    try {
      setSaida(await pyodideCliente().rodar(codigo));
    } finally {
      setRodando(false);
    }
  }, [codigo, rodando]);

  const cancelar = () => {
    pyodideCliente().cancelar();
    setRodando(false);
  };

  const desenhar = (e: React.FormEvent) => {
    e.preventDefault();
    const s = extrairFuncao(`gráfico de ${expressao}`);
    if (!s) {
      setErroGrafico("Escreva uma função de x, por exemplo 2x + 3 ou a*x^2 + b (letras viram sliders).");
      return;
    }
    setErroGrafico(null);
    setSpec(normalizarPlot(s));
  };

  const rotuloStatus: Record<StatusPyodide["estado"], string> = {
    parado: "Pyodide não carregado (carrega ao rodar)",
    carregando: `Carregando${status.etapa ? `: ${status.etapa}` : "…"}`,
    pronto: `SymPy pronto (Pyodide ${status.versao ?? ""})`,
    rodando: "Rodando…",
    erro: `Erro: ${status.erro ?? "falha ao carregar"}`,
  };

  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Laboratório"
        descricao="Python com SymPy rodando no seu navegador (nada sai da máquina) e gráficos de função com sliders."
      />

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4 text-accent-text" /> Python + SymPy
            </CardTitle>
            <CardDescription>
              <code className="font-mono text-xs">from sympy import *</code> já está feito. A última linha, se for uma expressão, aparece como resultado.
            </CardDescription>
          </div>
          <Badge variant={status.estado === "erro" ? "danger" : status.estado === "pronto" ? "success" : "neutral"} data-testid="status-pyodide">
            {(status.estado === "carregando" || status.estado === "rodando") && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            {rotuloStatus[status.estado]}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {EXEMPLOS.map((ex) => (
              <Button key={ex.rotulo} variant="outline" size="sm" onClick={() => setCodigo(ex.codigo)}>
                {ex.rotulo}
              </Button>
            ))}
          </div>
          <label htmlFor="codigo-python" className="sr-only">
            Código Python
          </label>
          <textarea
            id="codigo-python"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void rodar();
              }
            }}
            spellCheck={false}
            rows={8}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 font-mono text-sm leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2">
            {rodando ? (
              <Button variant="secondary" onClick={cancelar} data-testid="cancelar-python">
                <Square /> Cancelar
              </Button>
            ) : (
              <Button onClick={() => void rodar()} data-testid="rodar-python">
                <Play /> Rodar <Kbd className="border-accent-foreground/30 bg-transparent text-accent-foreground">Ctrl+Enter</Kbd>
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Primeira execução baixa uns 15 MB do CDN jsdelivr (fica em cache). Limite de 30 s por execução.
            </span>
          </div>
          {saida && (
            <div className="flex flex-col gap-2" role="status" data-testid="saida-python">
              {saida.saida && <pre className="overflow-x-auto rounded-md bg-surface-2 px-3 py-2 font-mono text-sm whitespace-pre-wrap">{saida.saida}</pre>}
              {saida.resultado && (
                <pre className="overflow-x-auto rounded-md border border-success/40 bg-success-soft px-3 py-2 font-mono text-sm whitespace-pre-wrap">
                  {saida.resultado}
                </pre>
              )}
              {saida.erro && <pre className="overflow-x-auto rounded-md bg-danger-soft px-3 py-2 font-mono text-sm text-danger whitespace-pre-wrap">{saida.erro}</pre>}
              <p className="text-xs text-muted-foreground">{saida.ms} ms</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChart className="size-4 text-accent-text" /> Gráfico de função
          </CardTitle>
          <CardDescription>Escreva uma função de x. Letras como a, b, k viram sliders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-center gap-2" onSubmit={desenhar}>
            <label htmlFor="expressao-grafico" className="sr-only">
              Função de x
            </label>
            <span className="font-mono text-sm">y =</span>
            <input
              id="expressao-grafico"
              value={expressao}
              onChange={(e) => setExpressao(e.target.value)}
              className="min-w-48 flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              spellCheck={false}
            />
            <Button type="submit" variant="secondary" data-testid="desenhar">
              Desenhar
            </Button>
          </form>
          {erroGrafico && (
            <p className="text-sm text-danger" role="alert">
              {erroGrafico}
            </p>
          )}
          {spec && <Grafico key={JSON.stringify(spec.funcoes)} spec={spec} altura={320} />}
        </CardContent>
      </Card>
    </ConteudoPagina>
  );
}
