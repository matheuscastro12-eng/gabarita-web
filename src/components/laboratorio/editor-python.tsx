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
import { cn } from "@/lib/utils";

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
    <div className="editor-codigo relative rounded-md border-[1.5px] border-input bg-muted" style={{ minHeight: `calc(${linhas} * 1.6em + 1.25rem)` }}>
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
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <FlaskConical className="size-4 text-primary" strokeWidth={1.8} /> Python + SymPy
        </span>
        <span className="ml-auto">
          <StatusPyodideBadge />
        </span>
      </div>
      {!compacto && (
        <p className="text-sm text-muted-foreground">
          <code className="font-mono text-xs">from sympy import *</code> já está feito. A última linha, se for uma expressão, aparece como resultado.
        </p>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Exemplos prontos">
        {EXEMPLOS_PYTHON.map((ex) => (
          <Button key={ex.id} variant="outline" size="sm" title={ex.descricao} onClick={() => setCodigo(ex.codigo)} data-testid={`exemplo-${ex.id}`}>
            {ex.rotulo}
          </Button>
        ))}
      </div>
      {status.estado === "erro" && (
        <div role="alert" className="flex flex-col gap-2 rounded-md bg-aviso-suave px-3 py-2.5 text-sm" data-testid="erro-pyodide">
          <p className="flex items-start gap-2 font-semibold">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-aviso" aria-hidden />
            <span>O Pyodide não carregou do CDN (jsdelivr). Sem ele, o SymPy não roda aqui.</span>
          </p>
          <p className="text-muted-foreground">
{status.erro ? `Motivo: ${resumirMotivo(status.erro)}. ` : ""}Confira a conexão e tente de novo. Enquanto isso, contas simples na última linha (ex.: <code className="font-mono text-xs">28900 / Rational(25, 100)</code>) saem pelo mathjs, dentro do app.
          </p>
          <div>
            <Button size="sm" variant="secondary" onClick={() => void pyodideCliente().carregar().catch(() => {})} data-testid="recarregar-pyodide">
              <RotateCcw /> Tentar carregar de novo
            </Button>
          </div>
        </div>
      )}
      <CampoCodigo valor={codigo} aoMudar={setCodigo} aoRodar={() => void rodar()} linhas={compacto ? 7 : 9} id={compacto ? "codigo-python-gaveta" : "codigo-python"} />
      <div className="flex flex-wrap items-center gap-2">
        {rodando ? (
          <Button variant="secondary" onClick={cancelar} data-testid="cancelar-python">
            <Square /> Cancelar
          </Button>
        ) : (
          <Button onClick={() => void rodar()} data-testid="rodar-python">
            <Play /> Rodar <Kbd className="border-primary-foreground/40 bg-transparent text-primary-foreground">Ctrl+Enter</Kbd>
          </Button>
        )}
        <span className={cn("text-muted-foreground", compacto ? "text-xs" : "text-sm")}>
          Primeira execução baixa uns 15 MB do CDN jsdelivr (fica em cache). Limite de 30 s por execução.
        </span>
      </div>
      {saida && (
        <div className="flex flex-col gap-2" role="status" data-testid="saida-python">
          {viaMathjs ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="aviso">mathjs</Badge> {NOTA_MATHJS}
            </p>
          ) : (
            saida.saida && <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-sm whitespace-pre-wrap">{saida.saida}</pre>
          )}
          {saida.resultado && (
            <pre className="overflow-x-auto rounded-md bg-sucesso-suave px-3 py-2 font-mono text-sm font-semibold text-sucesso whitespace-pre-wrap">{saida.resultado}</pre>
          )}
          {saida.erro && <pre className="overflow-x-auto rounded-md bg-erro-suave px-3 py-2 font-mono text-sm text-erro whitespace-pre-wrap">{saida.erro}</pre>}
          <p className="text-xs text-muted-foreground">{saida.ms} ms</p>
        </div>
      )}
    </div>
  );
}
