"use client";

import * as React from "react";
import { BadgeCheck, Code2, Lightbulb, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import type { ToolUIPart } from "ai";
import type { Letra } from "@/data/tipos";
import type { MensagemTutor as Mensagem, UIToolsTutor } from "@/lib/tutor/ferramentas";
import type { PlotSpec } from "@/lib/tutor/plot";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Grafico } from "./grafico";
import { GemeaCard, type RespostaGemea } from "./gemea-card";
import { Markdown } from "./markdown";

/** Balão do chat (tutor ou aluno). */
export function Balao({
  children,
  rotulo,
  papel = "tutor",
  selo,
  className,
}: {
  children: React.ReactNode;
  rotulo?: string;
  papel?: "tutor" | "aluno";
  selo?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-[95%] flex-col gap-1.5 rounded-lg px-3.5 py-3 text-[15px] leading-relaxed",
        papel === "tutor" ? "self-start rounded-tl-[4px] bg-muted" : "self-end rounded-tr-[4px] bg-accent text-foreground",
        className,
      )}
      data-papel={papel}
    >
      {(rotulo || selo) && (
        <div className="flex flex-wrap items-center gap-2">
          {rotulo && <span className="text-[11px] font-semibold tracking-[0.5px] text-muted-foreground uppercase">{rotulo}</span>}
          {selo}
        </div>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function SeloConferido() {
  return (
    <Badge variant="sucesso" title="A verificação bateu com o gabarito oficial" data-testid="selo-conferido">
      <BadgeCheck /> conferido
    </Badge>
  );
}

export function SeloNaoConferido() {
  return (
    <Badge variant="aviso" title="A verificação divergiu do gabarito duas vezes; o gabarito oficial manda">
      <TriangleAlert /> não conferido
    </Badge>
  );
}

type Parte = Mensagem["parts"][number];
type ParteFerramenta = ToolUIPart<UIToolsTutor>;

function ehFerramenta(p: Parte): p is ParteFerramenta {
  return typeof p.type === "string" && p.type.startsWith("tool-");
}

/** Conta as verificações (verify_answer) que bateram e que divergiram numa mensagem. */
export function contarVerificacoes(m: Mensagem): { bateram: number; divergiram: number } {
  let bateram = 0;
  let divergiram = 0;
  for (const p of m.parts) {
    if (p.type === "tool-verify_answer" && p.state === "output-available") {
      if (p.output.bateu) bateram++;
      else divergiram++;
    }
  }
  return { bateram, divergiram };
}

interface PropsMensagem {
  mensagem: Mensagem;
  /** Divergências acumuladas nas mensagens anteriores (para o selo "não conferido"). */
  divergenciasAntes: number;
  aoResponderGemea?: (r: RespostaGemea) => void;
  transmitindo?: boolean;
}

/** Uma mensagem do AI SDK (texto + partes de ferramenta) renderizada no painel. */
export function MensagemTutorView({ mensagem, divergenciasAntes, aoResponderGemea, transmitindo }: PropsMensagem) {
  if (mensagem.role === "user") {
    const texto = mensagem.parts
      .filter((p): p is Extract<Parte, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    return (
      <Balao papel="aluno">
        <Markdown>{texto}</Markdown>
      </Balao>
    );
  }

  const { bateram, divergiram } = contarVerificacoes(mensagem);
  const selo = bateram > 0 ? <SeloConferido /> : divergiram + divergenciasAntes >= 2 ? <SeloNaoConferido /> : null;
  const textos = mensagem.parts.filter((p): p is Extract<Parte, { type: "text" }> => p.type === "text" && p.text.trim().length > 0);
  const ferramentas = mensagem.parts.filter(ehFerramenta);
  const visiveis = ferramentas.filter((f) => f.type !== "tool-record_event" && f.type !== "tool-get_hint");
  const dicas = ferramentas.filter((f): f is Extract<ParteFerramenta, { type: "tool-get_hint" }> => f.type === "tool-get_hint");

  if (textos.length === 0 && visiveis.length === 0 && !transmitindo) return null;

  return (
    <Balao selo={selo} rotulo={dicas.length > 0 ? rotuloDica(dicas[dicas.length - 1]) : undefined}>
      {visiveis.map((f) => (
        <ParteFerramentaView key={f.toolCallId} parte={f} aoResponderGemea={aoResponderGemea} />
      ))}
      {textos.map((t, i) => (
        <Markdown key={i}>{t.text}</Markdown>
      ))}
      {transmitindo && textos.length === 0 && visiveis.length === 0 && (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> pensando…
        </span>
      )}
    </Balao>
  );
}

function rotuloDica(p: Extract<ParteFerramenta, { type: "tool-get_hint" }> | undefined): string | undefined {
  if (!p) return undefined;
  const nivel = p.state === "output-available" ? p.output.nivel : (p.input as { nivel?: number } | undefined)?.nivel;
  if (!nivel) return undefined;
  const nomes = ["", "conceito", "primeiro passo", "quase lá", "resolução"];
  return `Degrau ${nivel} · ${nomes[nivel] ?? ""}`;
}

function ParteFerramentaView({ parte, aoResponderGemea }: { parte: ParteFerramenta; aoResponderGemea?: (r: RespostaGemea) => void }) {
  switch (parte.type) {
    case "tool-run_python":
      return <RunPythonView parte={parte} />;
    case "tool-verify_answer":
      if (parte.state !== "output-available") return <Rodando texto="conferindo o valor…" />;
      return (
        <p className={cn("flex items-start gap-1.5 text-sm", parte.output.bateu ? "text-sucesso" : "text-aviso")}>
          {parte.output.bateu ? <BadgeCheck className="mt-0.5 size-4 shrink-0" /> : <ShieldAlert className="mt-0.5 size-4 shrink-0" />}
          <span>{parte.output.observacao}</span>
        </p>
      );
    case "tool-calc":
      if (parte.state !== "output-available") return <Rodando texto="calculando…" />;
      return (
        <p className="font-mono text-sm text-muted-foreground">
          {parte.output.expressao} = {parte.output.ok ? parte.output.resultado : `erro (${parte.output.erro})`}
        </p>
      );
    case "tool-plot_function":
      if (parte.state !== "output-available") return <Rodando texto="desenhando o gráfico…" />;
      if ("erro" in parte.output) return <p className="text-sm text-erro">Gráfico inválido: {parte.output.erro}</p>;
      return <Grafico spec={parte.output as PlotSpec} />;
    case "tool-make_twin":
      if (parte.state !== "output-available") return <Rodando texto="gerando a gêmea…" />;
      if (!parte.output.ok) return <p className="text-sm text-muted-foreground">{parte.output.motivo}</p>;
      return <GemeaCard gemea={parte.output.gemea} aoResponder={aoResponderGemea} />;
    default:
      return null;
  }
}

function Rodando({ texto }: { texto: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> {texto}
    </span>
  );
}

function RunPythonView({ parte }: { parte: Extract<ParteFerramenta, { type: "tool-run_python" }> }) {
  const [aberto, setAberto] = React.useState(false);
  const codigo = (parte.input as { codigo?: string } | undefined)?.codigo ?? "";
  const objetivo = (parte.input as { objetivo?: string } | undefined)?.objetivo;
  const saida = parte.state === "output-available" ? parte.output : null;
  const erro = parte.state === "output-error" ? parte.errorText : saida && !saida.ok ? saida.erro : null;
  return (
    <div className="rounded-md border-[1.5px] border-border bg-card text-sm">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:text-foreground"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        <Code2 className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{objetivo ?? "Conferindo no SymPy"}</span>
        {parte.state === "input-streaming" || parte.state === "input-available" ? (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
        ) : erro ? (
          <Badge variant="erro">erro</Badge>
        ) : (
          <Badge variant="neutral">SymPy</Badge>
        )}
      </button>
      {aberto && (
        <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">{codigo}</pre>
          {saida && (saida.saida || saida.resultado) && (
            <pre className="overflow-x-auto rounded-sm bg-muted px-2 py-1 font-mono text-xs whitespace-pre-wrap">
              {[saida.saida, saida.resultado].filter(Boolean).join("\n")}
            </pre>
          )}
          {erro && <p className="font-mono text-xs text-erro whitespace-pre-wrap">{erro}</p>}
        </div>
      )}
      {!aberto && saida?.resultado && <p className="truncate px-3 pb-2 font-mono text-xs text-muted-foreground">= {saida.resultado}</p>}
    </div>
  );
}

/** Mensagem do modo guiado (sem IA). */
export interface MensagemGuiada {
  id: string;
  papel: "tutor" | "aluno";
  texto: string;
  rotulo?: string;
  conferido?: boolean;
  grafico?: PlotSpec;
  gemea?: Parameters<typeof GemeaCard>[0]["gemea"];
  letraMarcada?: Letra | null;
}

export function MensagemGuiadaView({ mensagem, aoResponderGemea }: { mensagem: MensagemGuiada; aoResponderGemea?: (r: RespostaGemea) => void }) {
  return (
    <Balao papel={mensagem.papel} rotulo={mensagem.rotulo} selo={mensagem.conferido ? <SeloConferido /> : undefined}>
      {mensagem.rotulo?.startsWith("Degrau") && <Lightbulb className="hidden" aria-hidden />}
      <Markdown>{mensagem.texto}</Markdown>
      {mensagem.grafico && <Grafico spec={mensagem.grafico} />}
      {mensagem.gemea && <GemeaCard gemea={mensagem.gemea} aoResponder={aoResponderGemea} />}
    </Balao>
  );
}
