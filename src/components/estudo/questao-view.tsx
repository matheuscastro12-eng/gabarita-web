"use client";

import * as React from "react";
import { MessageSquareQuote } from "lucide-react";
import type { Questao, Letra } from "@/data/tipos";
import { fonteDetalhada, NOME_HABILIDADE } from "@/data/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { Alternativas } from "./alternativas";
import { Markdown } from "./markdown";

interface Props {
  questao: Questao;
  marcada: Letra | null;
  confirmada: boolean;
  aoMarcar: (letra: Letra) => void;
  aoConfirmar: () => void;
  aoPular: () => void;
  aoProxima: () => void;
  ehUltima: boolean;
  /** Um trecho do enunciado selecionado vira contexto do chat ("perguntar sobre isto"). */
  aoPerguntarSobre?: (texto: string) => void;
  /** Conteúdo extra no canto direito da linha de tags (ex.: cronômetro do simulado). */
  canto?: React.ReactNode;
}

function rotuloDificuldade(q: Questao): { texto: string; variant: "success" | "warning" | "danger" | "neutral" } {
  if (q.tri) {
    const d = q.dificuldade_estimada ?? "media";
    return d === "facil"
      ? { texto: `fácil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "success" }
      : d === "media"
        ? { texto: `média · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "warning" }
        : { texto: `difícil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "danger" };
  }
  return { texto: "sem parâmetro TRI", variant: "neutral" };
}

/** Atribuição obrigatória: INEP, transcrição enem.dev, origem do gabarito e do TRI. */
export function FonteQuestao({ questao, className }: { questao: Questao; className?: string }) {
  const f = fonteDetalhada(questao);
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)} data-testid="fonte">
      {f.citacao}
      {f.urlOficial && (
        <>
          {" "}
          (
          <a href={f.urlOficial} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
            provas e gabaritos
          </a>
          )
        </>
      )}
      {" · "}
      <a href={f.transcricaoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
        transcrição enem.dev
      </a>
      {" · "}
      {f.gabarito}
      {" · "}
      {f.tri}
    </p>
  );
}

interface Selecao {
  texto: string;
  x: number;
  y: number;
  /** Perto do topo da área rolável, o botão vai para baixo da seleção. */
  abaixo: boolean;
}

/**
 * Painel da questão no estilo Resolver do original: um card branco com a linha de tags
 * (ENEM ano · Questão n · dificuldade · Hn), enunciado serifado, alternativas em cartões
 * e o botão Confirmar em pílula azul à direita.
 */
export function QuestaoView({ questao, marcada, confirmada, aoMarcar, aoConfirmar, aoPular, aoProxima, ehUltima, aoPerguntarSobre, canto }: Props) {
  const dif = rotuloDificuldade(questao);
  const acertou = confirmada && marcada === questao.gabarito;
  const statusRef = React.useRef<HTMLParagraphElement | null>(null);
  const enunciadoRef = React.useRef<HTMLDivElement | null>(null);
  const areaRef = React.useRef<HTMLDivElement | null>(null);
  const [selecao, setSelecao] = React.useState<Selecao | null>(null);

  // Ao confirmar, traz o resultado para a vista (as alternativas podem estar abaixo da dobra).
  React.useEffect(() => {
    if (confirmada) statusRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [confirmada]);

  // Seleção de texto dentro do enunciado → botão flutuante.
  React.useEffect(() => {
    if (!aoPerguntarSobre) return;
    const aoSelecionar = () => {
      const sel = document.getSelection();
      const area = areaRef.current;
      const enunciado = enunciadoRef.current;
      if (!sel || sel.isCollapsed || !area || !enunciado || sel.rangeCount === 0) {
        setSelecao(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!enunciado.contains(range.commonAncestorContainer)) {
        setSelecao(null);
        return;
      }
      const texto = sel.toString().trim().replace(/\s+/g, " ");
      if (texto.length < 3) {
        setSelecao(null);
        return;
      }
      const caixa = range.getBoundingClientRect();
      const base = area.getBoundingClientRect();
      const abaixo = caixa.top - base.top < 56;
      setSelecao({
        texto: texto.slice(0, 400),
        x: Math.min(Math.max(caixa.left - base.left + caixa.width / 2 + area.scrollLeft, 110), base.width - 110),
        y: (abaixo ? caixa.bottom : caixa.top) - base.top + area.scrollTop,
        abaixo,
      });
    };
    document.addEventListener("selectionchange", aoSelecionar);
    return () => document.removeEventListener("selectionchange", aoSelecionar);
  }, [aoPerguntarSobre]);

  return (
    <article className="flex h-full min-h-0 flex-col bg-background" aria-labelledby="titulo-questao">
      <div ref={areaRef} className="relative min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4 md:px-5 md:pt-4">
        {selecao && aoPerguntarSobre && (
          <div className={selecao.abaixo ? "selecao-flutuante selecao-flutuante-abaixo" : "selecao-flutuante"} style={{ left: selecao.x, top: selecao.y }}>
            <Button
              size="sm"
              variant="primary"
              className="shadow-flutuante"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                aoPerguntarSobre(selecao.texto);
                document.getSelection()?.removeAllRanges();
                setSelecao(null);
              }}
              data-testid="perguntar-sobre"
            >
              <MessageSquareQuote /> Perguntar sobre isto
            </Button>
          </div>
        )}
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 rounded-xl border border-card-borda bg-surface p-4 shadow-card md:p-5">
          <header className="flex flex-wrap items-center gap-1.5 text-sm">
            <h2 id="titulo-questao" className="inline-flex items-center rounded-sm bg-background px-2.25 py-0.75 text-xs font-bold text-muted-foreground dark:bg-surface-2">
              ENEM {questao.ano} · Q{questao.numero}
            </h2>
            <Badge variant={dif.variant}>{dif.texto}</Badge>
            {questao.habilidade && (
              <Badge variant="accent" title={NOME_HABILIDADE[questao.habilidade]}>
                {questao.habilidade}
                {questao.habilidade_origem && questao.habilidade_origem !== "inep" ? " (estimada)" : ""}
              </Badge>
            )}
            {questao.anulada && <Badge variant="danger">anulada</Badge>}
            {canto && <span className="ml-auto">{canto}</span>}
          </header>

          <div ref={enunciadoRef} data-testid="enunciado">
            <Markdown className="qtext [&>p]:my-2.75 [&_strong]:font-bold">{questao.enunciado}</Markdown>
          </div>
          <Alternativas
            alternativas={questao.alternativas}
            marcada={marcada}
            gabarito={questao.gabarito}
            confirmada={confirmada}
            aoMarcar={aoMarcar}
          />
          {confirmada && (
            <p ref={statusRef} role="status" className={cn("text-base font-extrabold", acertou ? "text-success-text" : "text-danger-text")}>
              {acertou ? "Acertou." : `Não foi dessa vez. O gabarito é ${questao.gabarito}.`}
            </p>
          )}
          {questao.resolucao?.dados_da_imagem && (
            <details className="rounded-md bg-background px-3 py-2 text-sm dark:bg-surface-2">
              <summary className="cursor-pointer font-medium text-muted-foreground">Dados da imagem em texto</summary>
              <p className="pt-2">{questao.resolucao.dados_da_imagem}</p>
            </details>
          )}
          <FonteQuestao questao={questao} className="border-t border-border pt-3" />
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-2.5 md:px-5">
        {!confirmada ? (
          <>
            <Button variant="ghost" onClick={aoPular} className="text-muted-foreground">
              Pular
            </Button>
            <Button onClick={aoConfirmar} disabled={!marcada} data-testid="confirmar" className="ml-auto px-6">
              Confirmar <Kbd className="ml-0.5 border-white/40 bg-transparent text-white">Enter</Kbd>
            </Button>
          </>
        ) : (
          <Button onClick={aoProxima} data-testid="proxima" className="ml-auto px-6">
            {ehUltima ? "Ver resultado" : "Próxima"} <Kbd className="ml-0.5 border-white/40 bg-transparent text-white">N</Kbd>
          </Button>
        )}
      </footer>
    </article>
  );
}
