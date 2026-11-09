"use client";

import * as React from "react";
import { MessageSquareQuote } from "lucide-react";
import type { Questao, Letra } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
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
}

function rotuloDificuldade(q: Questao): { texto: string; variant: "success" | "warning" | "danger" | "outline" } {
  if (q.tri) {
    const d = q.dificuldade_estimada ?? "media";
    return d === "facil"
      ? { texto: `fácil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "success" }
      : d === "media"
        ? { texto: `média · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "warning" }
        : { texto: `difícil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "danger" };
  }
  return { texto: "sem parâmetro TRI", variant: "outline" };
}

interface Selecao {
  texto: string;
  x: number;
  y: number;
  /** Perto do topo da área rolável, o botão vai para baixo da seleção. */
  abaixo: boolean;
}

/** Painel da questão: cabeçalho com fonte, enunciado em Markdown/KaTeX, alternativas e ações. */
export function QuestaoView({ questao, marcada, confirmada, aoMarcar, aoConfirmar, aoPular, aoProxima, ehUltima, aoPerguntarSobre }: Props) {
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
    <article className="flex h-full min-h-0 flex-col" aria-labelledby="titulo-questao">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3 text-sm">
        <h2 id="titulo-questao" className="font-semibold">
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
      </header>

      <div ref={areaRef} className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {selecao && aoPerguntarSobre && (
          <div className={selecao.abaixo ? "selecao-flutuante selecao-flutuante-abaixo" : "selecao-flutuante"} style={{ left: selecao.x, top: selecao.y }}>
            <Button
              size="sm"
              variant="secondary"
              className="shadow-md"
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
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <div ref={enunciadoRef} data-testid="enunciado">
            <Markdown className="text-[1.03em] leading-relaxed">{questao.enunciado}</Markdown>
          </div>
          <Alternativas
            alternativas={questao.alternativas}
            marcada={marcada}
            gabarito={questao.gabarito}
            confirmada={confirmada}
            aoMarcar={aoMarcar}
          />
          {confirmada && (
            <p
              ref={statusRef}
              role="status"
              className={acertou ? "font-medium text-success" : "font-medium text-danger"}
            >
              {acertou ? "Acertou." : `Não foi dessa vez. O gabarito é ${questao.gabarito}.`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Fonte: INEP, {questao.fonte.prova}. Transcrição: enem.dev.
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        {!confirmada ? (
          <>
            <Button onClick={aoConfirmar} disabled={!marcada} data-testid="confirmar">
              Confirmar <Kbd className="ml-1 border-accent-foreground/30 bg-transparent text-accent-foreground">Enter</Kbd>
            </Button>
            <Button variant="ghost" onClick={aoPular}>
              Pular
            </Button>
          </>
        ) : (
          <Button onClick={aoProxima} data-testid="proxima">
            {ehUltima ? "Ver resultado" : "Próxima"}{" "}
            <Kbd className="ml-1 border-accent-foreground/30 bg-transparent text-accent-foreground">N</Kbd>
          </Button>
        )}
      </footer>
    </article>
  );
}
