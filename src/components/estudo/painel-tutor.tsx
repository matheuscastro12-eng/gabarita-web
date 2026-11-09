"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Lightbulb, Unlock, WifiOff, X } from "lucide-react";
import type { Questao, Letra } from "@/data/tipos";
import type { DegrauDica, Perfil } from "@/lib/dominio/tipos";
import type { EntradaEvento } from "@/lib/dominio/eventos";
import type { MensagemTutor } from "@/lib/tutor/ferramentas";
import { aberturaOffline, AVISO_OFFLINE, responderOffline, type EstadoOffline, type Sugestao } from "@/lib/tutor/offline";
import { calcularNoCliente } from "@/lib/tutor/mathjs-cliente";
import { marcarIADesligada, useStatusIA } from "@/lib/tutor/status-cliente";
import { rodarPython } from "@/lib/pyodide/rodar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { CabecalhoTutor, CampoPergunta, ChipsSugestao, ErroTutor, ListaConversa } from "./tutor-comum";
import type { RespostaGemea } from "./gemea-card";
import { Balao, contarVerificacoes, MensagemGuiadaView, MensagemTutorView, type MensagemGuiada } from "./mensagem-tutor";

/** Ações que a IDE dispara por atalho (H, ⌥R, /). */
export interface AcoesTutor {
  pedirDica: () => void;
  pedirResposta: () => void;
}

export interface ContextoAluno {
  resumo: string;
  perfil: Pick<Perfil, "nome" | "explicaDoMeuJeito">;
}

export interface PropsPainelTutor {
  questao: Questao;
  degrau: DegrauDica;
  aoDefinirDegrau: (d: DegrauDica) => void;
  marcada: Letra | null;
  confirmada: boolean;
  pediuResposta: boolean;
  aoPedirResposta: () => void;
  selecao: string | null;
  aoLimparSelecao: () => void;
  acoesRef: React.RefObject<AcoesTutor | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  contextoAluno: ContextoAluno;
  aoEvento: (e: EntradaEvento) => void;
  aoResponderGemea: (r: RespostaGemea) => void;
}

const NOMES_DEGRAU = ["pergunta", "conceito", "primeiro passo", "quase lá", "resolução"];
/** O aviso tem a chave no meio; aqui ela vira <code>. */
const AVISO_OFFLINE_PARTES = AVISO_OFFLINE.split("ANTHROPIC_API_KEY") as [string, string];
const ABERTURA = "Antes de calcular: o que a questão está pedindo, com as suas palavras?";

/** Painel do tutor: IA (useChat + ferramentas) ou modo guiado offline, com a mesma casca. */
export function PainelTutor(props: PropsPainelTutor) {
  const status = useStatusIA();
  if (status.ia === null) {
    return (
      <Casca modo="carregando" {...props}>
        <Balao>{ABERTURA}</Balao>
      </Casca>
    );
  }
  return status.ia ? <ChatIA key="ia" {...props} modelo={status.modelo} /> : <ChatGuiado key="guiado" {...props} />;
}

/* ----------------------------- casca comum ----------------------------- */

interface PropsCasca extends PropsPainelTutor {
  modo: "ia" | "guiado" | "carregando";
  modelo?: string | null;
  children: React.ReactNode;
  sugestoes?: Sugestao[];
  aoSugestao?: (s: Sugestao) => void;
  aoEnviar?: (texto: string) => void;
  ocupado?: boolean;
  aoParar?: () => void;
  aoPedirDica?: () => void;
  aoPedirRespostaDireta?: () => void;
}

function Casca({
  modo,
  modelo,
  children,
  sugestoes,
  aoSugestao,
  aoEnviar,
  ocupado,
  aoParar,
  aoPedirDica,
  aoPedirRespostaDireta,
  degrau,
  pediuResposta,
  selecao,
  aoLimparSelecao,
  inputRef,
}: PropsCasca) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-surface" aria-label="Tutor">
      <CabecalhoTutor titulo="Tutor" modo={modo} modelo={modelo} />

      <ListaConversa>
        {modo === "guiado" && (
          <p className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-[13px] leading-snug text-foreground" role="note">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
            <span>
              {AVISO_OFFLINE_PARTES[0]}
              <code className="font-mono text-[0.8em]">ANTHROPIC_API_KEY</code>
              {AVISO_OFFLINE_PARTES[1]}
            </span>
          </p>
        )}
        {children}
      </ListaConversa>

      <footer className="flex flex-col gap-2.5 border-t border-border px-4 py-3">
        {sugestoes && <ChipsSugestao sugestoes={sugestoes} aoSugestao={aoSugestao} ocupado={ocupado} />}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Dica</span>
            <EscadaDicas degrau={degrau} />
            <span className="sr-only">{NOMES_DEGRAU[degrau]}</span>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={aoPedirRespostaDireta}
              disabled={!aoPedirRespostaDireta || pediuResposta || ocupado}
              title={pediuResposta ? "Resposta pedida" : "Pede a resolução completa agora; o pedido fica registrado (⌥R)"}
              aria-label={pediuResposta ? "Resposta pedida" : "Resposta direta"}
              data-testid="resposta-direta"
            >
              <Unlock /> <span className="hidden sm:inline">{pediuResposta ? "Resposta pedida" : "Resposta direta"}</span>
              <Kbd className="hidden lg:inline-flex">⌥R</Kbd>
            </Button>
            <Button variant="secondary" size="sm" onClick={aoPedirDica} disabled={!aoPedirDica || degrau >= 4 || ocupado} data-testid="dica">
              <Lightbulb /> {degrau >= 4 ? "Resolução mostrada" : "Próximo degrau"} <Kbd className="hidden sm:inline-flex">H</Kbd>
            </Button>
          </div>
        </div>
        {selecao && (
          <div className="flex items-center gap-2 rounded-md bg-accent-soft px-3 py-1.5 text-sm text-accent-text" data-testid="chip-selecao">
            <span className="min-w-0 flex-1 truncate">
              Sobre: <q>{selecao}</q>
            </span>
            <button type="button" onClick={aoLimparSelecao} aria-label="Remover o trecho selecionado" className="rounded-full p-0.5 hover:bg-surface">
              <X className="size-4" />
            </button>
          </div>
        )}
        <CampoPergunta
          id="pergunta-tutor"
          inputRef={inputRef}
          aoEnviar={aoEnviar}
          ocupado={ocupado}
          aoParar={aoParar}
          desabilitado={modo === "carregando"}
          placeholder={modo === "guiado" ? "peça dica, resolução ou conta…" : "pergunte do seu jeito…"}
        />
      </footer>
    </section>
  );
}

/** ▮▮▯▯ dos degraus de dica usados. */
export function EscadaDicas({ degrau, className }: { degrau: DegrauDica; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`degrau ${degrau} de 4`} role="img">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          aria-hidden
          className={cn("h-3.5 w-2 rounded-[3px]", n <= degrau ? "bg-accent" : "border-[1.5px] border-border bg-background")}
        />
      ))}
    </span>
  );
}

/* ------------------------------- modo IA ------------------------------- */

interface ContextoRequisicao {
  questaoId: string;
  degrau: DegrauDica;
  escolha: Letra | null;
  confirmada: boolean;
  pedidoResposta: boolean;
  selecao: string | null;
  resumoAluno: string;
  perfil: Pick<Perfil, "nome" | "explicaDoMeuJeito">;
}

/**
 * Contexto da conversa por questão, fora do React: o transporte lê o valor
 * mais recente na hora de enviar, sem depender de refs durante a renderização.
 */
const contextos = new Map<string, ContextoRequisicao>();

function ChatIA(props: PropsPainelTutor & { modelo: string | null }) {
  const {
    questao,
    degrau,
    aoDefinirDegrau,
    marcada,
    confirmada,
    pediuResposta,
    aoPedirResposta,
    selecao,
    aoLimparSelecao,
    contextoAluno,
    aoEvento,
    aoResponderGemea,
    acoesRef,
  } = props;
  const [erro, setErro] = React.useState<string | null>(null);
  const chatId = `tutor-${questao.id}`;

  const contexto: ContextoRequisicao = {
    questaoId: questao.id,
    degrau,
    escolha: marcada,
    confirmada,
    pedidoResposta: pediuResposta,
    selecao,
    resumoAluno: contextoAluno.resumo,
    perfil: contextoAluno.perfil,
  };
  React.useEffect(() => {
    contextos.set(chatId, contexto);
  });
  React.useEffect(() => {
    return () => {
      contextos.delete(chatId);
    };
  }, [chatId]);

  const transport = React.useMemo(
    () => new DefaultChatTransport<MensagemTutor>({ api: "/api/tutor", body: () => ({ contexto: contextos.get(chatId) }) }),
    [chatId],
  );

  const chat = useChat<MensagemTutor>({
    id: chatId,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (e) => {
      if (/missing_key/.test(e.message)) {
        marcarIADesligada();
        return;
      }
      setErro(e.message || "O tutor não conseguiu responder agora.");
    },
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      if (toolCall.toolName === "run_python") {
        const saida = await rodarPython(toolCall.input.codigo);
        void chat.addToolOutput({ tool: "run_python", toolCallId: toolCall.toolCallId, output: saida });
      } else if (toolCall.toolName === "record_event") {
        const { tipo, detalhe, degrau: d } = toolCall.input;
        aoEvento({ tipo, questaoId: questao.id, detalhe, degrau: d });
        const atual = contextos.get(chatId)?.degrau ?? 0;
        if (tipo === "dica" && typeof d === "number" && d > atual) aoDefinirDegrau(Math.min(4, d) as DegrauDica);
        if (tipo === "pedido_resposta" && !(contextos.get(chatId)?.pedidoResposta ?? false)) aoPedirResposta();
        void chat.addToolOutput({ tool: "record_event", toolCallId: toolCall.toolCallId, output: { ok: true } });
      }
    },
  });

  const ocupado = chat.status === "submitted" || chat.status === "streaming";

  const enviar = React.useCallback(
    (texto: string, ajuste?: Partial<ContextoRequisicao>) => {
      setErro(null);
      const atual = contextos.get(chatId);
      if (atual && ajuste) contextos.set(chatId, { ...atual, ...ajuste });
      const sel = atual?.selecao ?? null;
      const comSelecao = sel ? `Sobre este trecho do enunciado: «${sel}»\n\n${texto}` : texto;
      void chat.sendMessage({ text: comSelecao });
      if (sel) aoLimparSelecao();
    },
    [chat, chatId, aoLimparSelecao],
  );

  const pedirDica = React.useCallback(() => {
    const atual = contextos.get(chatId)?.degrau ?? 0;
    if (atual >= 4 || ocupado) return;
    const n = (atual + 1) as DegrauDica;
    aoDefinirDegrau(n);
    enviar(`Me dá o degrau ${n} da escada de dicas (${NOMES_DEGRAU[n]}).`, { degrau: n });
  }, [chatId, aoDefinirDegrau, enviar, ocupado]);

  const pedirRespostaDireta = React.useCallback(() => {
    if ((contextos.get(chatId)?.pedidoResposta ?? false) || ocupado) return;
    aoPedirResposta();
    aoEvento({ tipo: "pedido_resposta", questaoId: questao.id, detalhe: "pediu a resposta direta (⌥R)", degrau: 4 });
    enviar("Quero a resposta direta: resolva tudo, confira e me diga a alternativa.", { degrau: 4, pedidoResposta: true });
  }, [chatId, aoEvento, aoPedirResposta, enviar, ocupado, questao.id]);

  React.useEffect(() => {
    acoesRef.current = { pedirDica, pedirResposta: pedirRespostaDireta };
    return () => {
      acoesRef.current = null;
    };
  }, [acoesRef, pedirDica, pedirRespostaDireta]);

  const sugestoes: Sugestao[] = [];
  if (confirmada && marcada && marcada !== questao.gabarito) sugestoes.push({ rotulo: "Por que errei?", mensagem: "Por que errei?" });
  if (confirmada || degrau >= 4) sugestoes.push({ rotulo: "Questão gêmea", mensagem: "Me dá uma questão gêmea para treinar." });
  sugestoes.push({ rotulo: "Gráfico", mensagem: "Mostre o gráfico que ajuda a entender esta questão." });
  sugestoes.push({ rotulo: "Laboratório", mensagem: "" });

  // Divergências acumuladas antes de cada mensagem (selo "não conferido" após 2).
  const divergenciasAntes: number[] = [];
  let acumulado = 0;
  for (const m of chat.messages) {
    divergenciasAntes.push(acumulado);
    acumulado += contarVerificacoes(m).divergiram;
  }
  const ultima = chat.messages[chat.messages.length - 1];

  return (
    <Casca
      {...props}
      modo="ia"
      sugestoes={sugestoes}
      aoSugestao={(s) => enviar(s.mensagem)}
      aoEnviar={(t) => enviar(t)}
      ocupado={ocupado}
      aoParar={() => void chat.stop()}
      aoPedirDica={pedirDica}
      aoPedirRespostaDireta={pedirRespostaDireta}
    >
      {chat.messages.length === 0 && <Balao rotulo="Degrau 0 · pergunta">{ABERTURA}</Balao>}
      {chat.messages.map((m, i) => (
        <MensagemTutorView
          key={m.id}
          mensagem={m}
          divergenciasAntes={divergenciasAntes[i] ?? 0}
          aoResponderGemea={aoResponderGemea}
          transmitindo={m === ultima && ocupado && m.role === "assistant"}
        />
      ))}
      {ocupado && ultima?.role === "user" && (
        <Balao>
          <span className="text-sm text-muted-foreground">pensando…</span>
        </Balao>
      )}
      {erro && <ErroTutor mensagem={erro} aoTentar={() => void chat.regenerate()} />}
    </Casca>
  );
}

/* ----------------------------- modo guiado ----------------------------- */

function ChatGuiado(props: PropsPainelTutor) {
  const { questao, degrau, aoDefinirDegrau, marcada, confirmada, pediuResposta, aoPedirResposta, selecao, aoLimparSelecao, aoEvento, aoResponderGemea, acoesRef } =
    props;
  const [gemeasGeradas, setGemeasGeradas] = React.useState(0);
  const estado: EstadoOffline = { questao, degrau, escolha: marcada, confirmada, pedidoResposta: pediuResposta, gemeasGeradas };

  const [mensagens, setMensagens] = React.useState<MensagemGuiada[]>(() => {
    const a = aberturaOffline({ questao, degrau, escolha: marcada, confirmada, pedidoResposta: pediuResposta, gemeasGeradas: 0 });
    return [{ id: "abertura", papel: "tutor", texto: a.texto, rotulo: a.rotulo }];
  });
  const [sugestoes, setSugestoes] = React.useState<Sugestao[]>(
    () => aberturaOffline({ questao, degrau, escolha: marcada, confirmada, pedidoResposta: pediuResposta, gemeasGeradas: 0 }).sugestoes,
  );
  const [ocupado, setOcupado] = React.useState(false);
  const [contador, setContador] = React.useState(0);

  const enviar = React.useCallback(
    async (texto: string) => {
      const id = `g-${contador + 1}`;
      setContador((c) => c + 1);
      const textoAluno = selecao ? `Sobre «${selecao}»: ${texto}` : texto;
      if (selecao) aoLimparSelecao();
      setMensagens((m) => [...m, { id: `${id}-a`, papel: "aluno", texto: textoAluno }]);
      setOcupado(true);
      try {
        const r = await responderOffline(texto, estado, { calcular: calcularNoCliente });
        if (r.novoDegrau !== undefined && r.novoDegrau > estado.degrau) aoDefinirDegrau(r.novoDegrau);
        if (r.pedidoResposta) aoPedirResposta();
        if (r.gemea) setGemeasGeradas((n) => n + 1);
        for (const e of r.eventos) aoEvento(e);
        setMensagens((m) => [
          ...m,
          { id: `${id}-t`, papel: "tutor", texto: r.texto, rotulo: r.rotulo, conferido: r.conferido, grafico: r.grafico, gemea: r.gemea },
        ]);
        setSugestoes(r.sugestoes);
      } finally {
        setOcupado(false);
      }
    },
    // `estado` muda quando os props mudam; é isso que queremos (lê sempre o atual).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contador, selecao, aoLimparSelecao, aoDefinirDegrau, aoPedirResposta, aoEvento, questao, degrau, marcada, confirmada, pediuResposta, gemeasGeradas],
  );

  const pedirDica = React.useCallback(() => {
    if (degrau >= 4) return;
    void enviar("Me dá uma dica.");
  }, [degrau, enviar]);
  const pedirRespostaDireta = React.useCallback(() => {
    if (pediuResposta) return;
    void enviar("Quero a resposta direta.");
  }, [pediuResposta, enviar]);

  React.useEffect(() => {
    acoesRef.current = { pedirDica, pedirResposta: pedirRespostaDireta };
    return () => {
      acoesRef.current = null;
    };
  }, [acoesRef, pedirDica, pedirRespostaDireta]);

  return (
    <Casca
      {...props}
      modo="guiado"
      sugestoes={sugestoes}
      aoSugestao={(s) => void enviar(s.mensagem)}
      aoEnviar={(t) => void enviar(t)}
      ocupado={ocupado}
      aoPedirDica={pedirDica}
      aoPedirRespostaDireta={pedirRespostaDireta}
    >
      {mensagens.map((m) => (
        <MensagemGuiadaView key={m.id} mensagem={m} aoResponderGemea={aoResponderGemea} />
      ))}
    </Casca>
  );
}
