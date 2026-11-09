"use client";

/**
 * Peças comuns aos painéis de chat do tutor (IDE e "Tirar dúvida" dos resumos):
 * cabeçalho com o selo do modo, lista com rolagem automática, chips de sugestão,
 * campo de pergunta e caixa de erro.
 */
import * as React from "react";
import Link from "next/link";
import { SendHorizontal, Sparkles, Square } from "lucide-react";
import type { Sugestao } from "@/lib/tutor/offline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ModoTutor = "ia" | "guiado" | "carregando" | "desligado";

export function CabecalhoTutor({ titulo, modo, modelo }: { titulo: string; modo: ModoTutor; modelo?: string | null }) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Sparkles className="size-4 text-accent" strokeWidth={1.8} />
      <h2 className="text-sm font-bold">{titulo}</h2>
      {modo === "ia" ? (
        <Badge variant="accent" className="ml-auto" title={modelo ? `Modelo: ${modelo}` : undefined}>
          IA
        </Badge>
      ) : modo === "guiado" ? (
        <Badge variant="warning" className="ml-auto">
          modo guiado
        </Badge>
      ) : modo === "desligado" ? (
        <Badge variant="warning" className="ml-auto">
          desligado
        </Badge>
      ) : (
        <Badge variant="outline" className="ml-auto">
          conectando…
        </Badge>
      )}
    </header>
  );
}

/** Lista rolável que desce sozinha quando chega conteúdo novo. */
export function ListaConversa({ children }: { children: React.ReactNode }) {
  const fimRef = React.useRef<HTMLDivElement | null>(null);
  const listaRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const obs = new MutationObserver(() => fimRef.current?.scrollIntoView({ block: "end" }));
    obs.observe(lista, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={listaRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" data-testid="conversa">
      <div className="flex flex-col gap-3">
        {children}
        <div ref={fimRef} />
      </div>
    </div>
  );
}

export function ChipsSugestao({ sugestoes, aoSugestao, ocupado }: { sugestoes: Sugestao[]; aoSugestao?: (s: Sugestao) => void; ocupado?: boolean }) {
  if (sugestoes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Sugestões">
      {sugestoes.map((s) =>
        s.rotulo === "Laboratório" ? (
          <Button key={s.rotulo} variant="outline" size="sm" asChild>
            <Link href="/laboratorio">{s.rotulo}</Link>
          </Button>
        ) : (
          <Button key={s.rotulo} variant="outline" size="sm" onClick={() => aoSugestao?.(s)} disabled={ocupado}>
            {s.rotulo}
          </Button>
        ),
      )}
    </div>
  );
}

export interface PropsCampoPergunta {
  id: string;
  aoEnviar?: (texto: string) => void;
  ocupado?: boolean;
  aoParar?: () => void;
  desabilitado?: boolean;
  placeholder: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

/** Textarea com Enter para enviar (Shift+Enter quebra a linha) e botão Enviar/Parar. */
export function CampoPergunta({ id, aoEnviar, ocupado, aoParar, desabilitado, placeholder, inputRef }: PropsCampoPergunta) {
  const [texto, setTexto] = React.useState("");
  const enviar = () => {
    const t = texto.trim();
    if (!t || !aoEnviar || ocupado) return;
    aoEnviar(t);
    setTexto("");
  };
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Pergunte do seu jeito
      </label>
      <textarea
        id={id}
        ref={inputRef}
        rows={1}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            enviar();
          }
        }}
        placeholder={placeholder}
        disabled={desabilitado}
        className="min-h-11 max-h-40 flex-1 resize-none rounded-lg border-[1.5px] border-input bg-surface px-3.5 py-2.5 text-[15px] placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none disabled:opacity-40"
      />
      {ocupado && aoParar ? (
        <Button type="button" size="icon" variant="secondary" aria-label="Parar" onClick={aoParar}>
          <Square />
        </Button>
      ) : (
        <Button type="submit" size="icon" aria-label="Enviar" disabled={!texto.trim() || !aoEnviar || desabilitado}>
          <SendHorizontal />
        </Button>
      )}
    </form>
  );
}

export function ErroTutor({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm">
      <p className="font-semibold text-danger-text">O tutor não respondeu.</p>
      <p className="text-muted-foreground">{mensagem}</p>
      <div>
        <Button size="sm" variant="secondary" onClick={aoTentar}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
