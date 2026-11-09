"use client";

import * as React from "react";
import { FlaskConical, Loader2, Play, RotateCcw, Square, WifiOff } from "lucide-react";
import { pyodideCliente, type StatusPyodide } from "@/lib/pyodide/cliente";
import { NOTA_MATHJS } from "@/lib/pyodide/fallback";
import { rodarPython } from "@/lib/pyodide/rodar";
import type { SaidaPython } from "@/lib/tutor/ferramentas";
import { EXEMPLOS_PYTHON, tokenizar } from "@/lib/laboratorio/realce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

function assinarStatus(cb: () => void) {
  return pyodideCliente().assinar(() => cb());
}
function lerStatus(): StatusPyodide {
  return pyodideCliente().obterStatus();
}
const STATUS_SERVIDOR: StatusPyodide = { estado: "parado", etapa: null, erro: null, versao: null };

export function useStatusPyodide(): StatusPyodide {
  return React.useSyncExternalStore(assinarStatus, lerStatus, () => STATUS_SERVIDOR);
}

/** Selo com o estado do Pyodide (parado, carregando, pronto, rodando, erro). */
export function StatusPyodideBadge() {
  const status = useStatusPyodide();
  const rotulo: Record<StatusPyodide["estado"], string> = {
    parado: "Pyodide não carregado (carrega ao rodar)",
    carregando: `Carregando${status.etapa ? `: ${status.etapa}` : "…"}`,
    pronto: `SymPy pronto (Pyodide ${status.versao ?? ""})`,
    rodando: "Rodando…",
    erro: "Pyodide não carregou",
  };
  return (
    <Badge variant={status.estado === "erro" ? "erro" : status.estado === "pronto" ? "sucesso" : "neutral"} data-testid="status-pyodide">
      {(status.estado === "carregando" || status.estado === "rodando") && <Loader2 className="animate-spin motion-reduce:animate-none" />}
      {rotulo[status.estado]}
    </Badge>
  );
}

/** O erro do worker vem com URL e nome de API; para o aluno basta a primeira frase curta. */
function resumirMotivo(erro: string): string {
  const semUrl = erro.replace(/https?:\/\/\S+/g, "CDN").replace(/\s+/g, " ").trim();
  const frase = semUrl.split(/(?<=[.!?])\s/)[0] ?? semUrl;
  return frase.length > 120 ? `${frase.slice(0, 117)}…` : frase;
}

const CLASSE_TOKEN: Record<string, string> = {
  comentario: "tok-comentario",
  string: "tok-string",
  numero: "tok-numero",
  palavra: "tok-palavra",
  builtin: "tok-builtin",
  nome: "",
  operador: "tok-operador",
  texto: "",
};

/**
 * Editor de Python com realce leve: um <pre> colorido por baixo e um <textarea>
 * transparente por cima (mesma fonte, mesmo padding), com rolagem sincronizada.
 */
export function CampoCodigo({
  valor,
  aoMudar,
  aoRodar,
  linhas = 8,
  id = "codigo-python",
}: {
  valor: string;
  aoMudar: (v: string) => void;
  aoRodar: () => void;
  linhas?: number;
  id?: string;
}) {
  const preRef = React.useRef<HTMLPreElement | null>(null);
  const tokens = React.useMemo(() => tokenizar(valor), [valor]);
  const sincronizar = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const pre = preRef.current;
    if (!pre) return;
    pre.scrollTop = e.currentTarget.scrollTop;
    pre.scrollLeft = e.currentTarget.scrollLeft;
  };
  return (
    <div className="editor-codigo relative rounded-md border border-input bg-background" style={{ minHeight: `calc(${linhas} * 1.6em + 1.25rem)` }}>
      <pre ref={preRef} aria-hidden className="editor-camada pointer-events-none m-0 overflow-hidden" data-testid="realce-python">
        {tokens.map((t, i) =>
          CLASSE_TOKEN[t.tipo] ? (
            <span key={i} className={CLASSE_TOKEN[t.tipo]}>
              {t.texto}
            </span>
          ) : (
            <React.Fragment key={i}>{t.texto}</React.Fragment>
          ),
        )}
        {"\n"}
      </pre>
      <label htmlFor={id} className="sr-only">
        Código Python
      </label>
      <textarea
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        onScroll={sincronizar}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            aoRodar();
          }
          if (e.key === "Tab") {
            e.preventDefault();
            const alvo = e.currentTarget;
            const { selectionStart, selectionEnd } = alvo;
            const novo = `${valor.slice(0, selectionStart)}    ${valor.slice(selectionEnd)}`;
            aoMudar(novo);
            requestAnimationFrame(() => alvo.setSelectionRange(selectionStart + 4, selectionStart + 4));
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={linhas}
        className="editor-camada absolute inset-0 h-full w-full resize-none bg-transparent text-transparent caret-foreground outline-none selection:bg-primary/30 focus-visible:outline-none"
      />
    </div>
  );
}

/** Editor + exemplos + rodar/cancelar + saída. `compacto` para a gaveta dentro da IDE. */
export function EditorPython({ compacto = false, codigoInicial }: { compacto?: boolean; codigoInicial?: string }) {
  const [codigo, setCodigo] = React.useState(codigoInicial ?? EXEMPLOS_PYTHON[0]!.codigo);
  const [saida, setSaida] = React.useState<SaidaPython | null>(null);
  const [rodando, setRodando] = React.useState(false);
  const status = useStatusPyodide();
  const viaMathjs = saida?.ok === true && saida.saida === NOTA_MATHJS;

  const rodar = React.useCallback(async () => {
    if (rodando) return;
    setRodando(true);
    setSaida(null);
    try {
      setSaida(await rodarPython(codigo));
    } finally {
      setRodando(false);
    }
  }, [codigo, rodando]);

  const cancelar = () => {
    pyodideCliente().cancelar();
    setRodando(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FlaskConical className="size-4" strokeWidth={1.5} /> Python + SymPy
        </h2>
        <span className="ml-auto">
          <StatusPyodideBadge />
        </span>
      </div>
      {!compacto && (
        <p className="text-sm text-muted-foreground">
          <code className="num text-xs">from sympy import *</code> já está feito. A última linha, se for uma expressão, aparece como resultado.
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Exemplos prontos">
        {EXEMPLOS_PYTHON.map((ex) => (
          <Button key={ex.id} variant="outline" size="sm" title={ex.descricao} onClick={() => setCodigo(ex.codigo)} data-testid={`exemplo-${ex.id}`}>
            {ex.rotulo}
          </Button>
        ))}
      </div>
      {status.estado === "erro" && (
        <div role="alert" className="flex flex-col gap-2 rounded-md bg-aviso-suave p-3 text-sm text-aviso" data-testid="erro-pyodide">
          <p className="flex items-start gap-2 font-medium">
            <WifiOff className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span>O Pyodide não carregou do CDN (jsdelivr). Sem ele, o SymPy não roda aqui.</span>
          </p>
          <p>
{status.erro ? `Motivo: ${resumirMotivo(status.erro)}. ` : ""}Confira a conexão e tente de novo. Enquanto isso, contas simples na última linha (ex.: <code className="num text-xs">28900 / Rational(25, 100)</code>) saem pelo mathjs, dentro do app.
          </p>
          <div>
            <Button size="sm" variant="outline" onClick={() => void pyodideCliente().carregar().catch(() => {})} data-testid="recarregar-pyodide">
              <RotateCcw /> Tentar carregar de novo
            </Button>
          </div>
        </div>
      )}
      <CampoCodigo valor={codigo} aoMudar={setCodigo} aoRodar={() => void rodar()} linhas={compacto ? 7 : 9} id={compacto ? "codigo-python-gaveta" : "codigo-python"} />
      <div className="flex flex-wrap items-center gap-2">
        {rodando ? (
          <Button size="sm" variant="outline" onClick={cancelar} data-testid="cancelar-python">
            <Square /> Cancelar
          </Button>
        ) : (
          <Button size="sm" onClick={() => void rodar()} data-testid="rodar-python">
            <Play /> Rodar <Kbd>Ctrl+Enter</Kbd>
          </Button>
        )}
        <span className="min-w-0 flex-1 basis-60 text-xs text-muted-foreground">
          Primeira execução baixa uns 15 MB do CDN jsdelivr (fica em cache). Limite de 30 s por execução.
        </span>
      </div>
      {saida && (
        <div className="num flex flex-col gap-2 rounded-md bg-muted p-3 text-sm" role="status" data-testid="saida-python">
          {viaMathjs ? (
            <p className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
              <Badge variant="aviso">mathjs</Badge> {NOTA_MATHJS}
            </p>
          ) : (
            saida.saida && <pre className="m-0 overflow-x-auto font-mono text-sm whitespace-pre-wrap">{saida.saida}</pre>
          )}
          {saida.resultado && (
            <pre className="m-0 overflow-x-auto font-mono text-sm font-medium text-sucesso whitespace-pre-wrap">{saida.resultado}</pre>
          )}
          {saida.erro && <pre className="m-0 overflow-x-auto font-mono text-sm text-erro whitespace-pre-wrap">{saida.erro}</pre>}
          <p className="text-xs text-muted-foreground">{saida.ms} ms</p>
        </div>
      )}
    </div>
  );
}
