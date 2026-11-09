"use client";

import * as React from "react";
import { MessageSquareQuote, Shapes } from "lucide-react";
import { infoVisual, visualParaAssuntos } from "@/lib/visuais/catalogo";
import { COMPONENTE_VISUAL } from "@/components/visuais";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Questao, Letra } from "@/data/tipos";
import { fonteDetalhada, NOME_HABILIDADE } from "@/data/tipos";
import { Badge, badgeVariants } from "@/components/ui/badge";
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
  /** Mostra "Ver visualmente" quando a questão é de um tema de Aprender o básico (fora do simulado). */
  comVisual?: boolean;
}

function rotuloDificuldade(q: Questao): { texto: string; variant: "sucesso" | "aviso" | "erro" | "neutral" } {
  if (q.tri) {
    const d = q.dificuldade_estimada ?? "media";
    return d === "facil"
      ? { texto: `fácil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "sucesso" }
      : d === "media"
        ? { texto: `média · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "aviso" }
        : { texto: `difícil · b ${q.tri.b.toFixed(2).replace(".", ",")}`, variant: "erro" };
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
          <a href={f.urlOficial} target="_blank" rel="noreferrer" className="text-primaria-texto underline underline-offset-2">
            provas e gabaritos
          </a>
          )
        </>
      )}
      {" · "}
      <a href={f.transcricaoUrl} target="_blank" rel="noreferrer" className="text-primaria-texto underline underline-offset-2">
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
 * Painel da questão (Cartão-resposta): coluna de leitura direto no papel, linha de etiquetas,
 * enunciado `.qtext`, alternativas em caixas com a bolha da letra e rodapé Pular | Confirmar.
 */
export function QuestaoView({ questao, marcada, confirmada, aoMarcar, aoConfirmar, aoPular, aoProxima, ehUltima, aoPerguntarSobre, canto, comVisual = false }: Props) {
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
      <div ref={areaRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {selecao && aoPerguntarSobre && (
          <div className={selecao.abaixo ? "selecao-flutuante selecao-flutuante-abaixo" : "selecao-flutuante"} style={{ left: selecao.x, top: selecao.y }}>
            <Button
              variant="ghost"
              className="h-8 rounded-md bg-foreground px-2.5 text-xs font-medium text-background shadow-flutua hover:bg-foreground"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                aoPerguntarSobre(selecao.texto);
                document.getSelection()?.removeAllRanges();
                setSelecao(null);
              }}
              data-testid="perguntar-sobre"
            >
              <MessageSquareQuote className="size-3.5" strokeWidth={1.5} /> Perguntar sobre isto
            </Button>
          </div>
        )}
        <div className="anim-questao mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-5 md:px-8 md:py-6">
          <header className="flex flex-wrap items-center gap-1.5 text-sm">
            <h2 id="titulo-questao" className={cn(badgeVariants({ variant: "neutral" }), "num")}>
              ENEM {questao.ano} · Q{questao.numero}
            </h2>
            <Badge variant={dif.variant} className="num">{dif.texto}</Badge>
            {questao.habilidade && (
              <Badge variant="destaque" className="num" title={NOME_HABILIDADE[questao.habilidade]}>
                {questao.habilidade}
                {questao.habilidade_origem && questao.habilidade_origem !== "inep" ? " (estimada)" : ""}
              </Badge>
            )}
            {questao.anulada && <Badge variant="erro">anulada</Badge>}
            {canto && <span className="ml-auto">{canto}</span>}
            {comVisual && <BotaoVisual assuntos={questao.assuntos} />}
          </header>

          <div ref={enunciadoRef} data-testid="enunciado">
            <Markdown className="qtext [&>p]:my-3 [&_strong]:font-semibold">{questao.enunciado}</Markdown>
          </div>
          <Alternativas
            alternativas={questao.alternativas}
            marcada={marcada}
            gabarito={questao.gabarito}
            confirmada={confirmada}
            aoMarcar={aoMarcar}
          />
          {confirmada && (
            <p ref={statusRef} role="status" className={cn("text-sm font-medium", acertou ? "text-sucesso" : "text-erro")}>
              {acertou ? "Acertou." : `Não foi dessa vez. O gabarito é ${questao.gabarito}.`}
            </p>
          )}
          {questao.resolucao?.dados_da_imagem && (
            <details className="border-t border-border pt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">Dados da imagem em texto</summary>
              <p className="pt-2">{questao.resolucao.dados_da_imagem}</p>
            </details>
          )}
          <FonteQuestao questao={questao} className="border-t border-border pt-3" />
        </div>
      </div>

      <footer className="flex shrink-0 items-center gap-3 border-t border-border bg-background px-4 py-3 md:px-8">
        {!confirmada ? (
          <>
            <Button variant="ghost" onClick={aoPular} className="text-muted-foreground">
              Pular
            </Button>
            <Button onClick={aoConfirmar} disabled={!marcada} data-testid="confirmar" className="ml-auto h-11 flex-1 px-5 text-base sm:h-9 sm:flex-none sm:px-6 sm:text-sm">
              Confirmar <Kbd className="ml-0.5">Enter</Kbd>
            </Button>
          </>
        ) : (
          <Button onClick={aoProxima} data-testid="proxima" className="ml-auto h-11 flex-1 px-5 text-base sm:h-9 sm:flex-none sm:px-6 sm:text-sm">
            {ehUltima ? "Ver resultado" : "Próxima"} <Kbd className="ml-0.5">N</Kbd>
          </Button>
        )}
      </footer>
    </article>
  );
}

/** Abre, num diálogo, o visual de "Aprender o básico" do assunto da questão. */
function BotaoVisual({ assuntos }: { assuntos: readonly string[] }) {
  const id = visualParaAssuntos(assuntos);
  if (!id) return null;
  const info = infoVisual(id);
  const Visual = COMPONENTE_VISUAL[id];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto" data-testid="ver-visualmente">
          <Shapes className="size-4" strokeWidth={1.5} /> Ver visualmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{info.titulo}</DialogTitle>
          <DialogDescription>O básico por trás desta questão, com outros números. Depois volte e resolva.</DialogDescription>
        </DialogHeader>
        <Visual />
      </DialogContent>
    </Dialog>
  );
}
