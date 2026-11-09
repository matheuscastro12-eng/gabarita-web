"use client";

/**
 * "Tirar dúvida" na página de um resumo: o mesmo tutor de IA da IDE, com o contexto do resumo
 * (`{ tipo: "resumo", resumoId }` em /api/tutor). Sem escada de dicas nem resposta direta: não há
 * questão nem gabarito. Sem IA, mostra um estado vazio dizendo como ligar o tutor.
 */
import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MessageCircleQuestion, PlugZap, X } from "lucide-react";
import type { Resumo } from "@/lib/resumos/conteudo";
import type { MensagemTutor } from "@/lib/tutor/ferramentas";
import type { Sugestao } from "@/lib/tutor/offline";
import { marcarIADesligada, useStatusIA } from "@/lib/tutor/status-cliente";
import { useStore } from "@/lib/store/provider";
import { Balao, MensagemTutorView } from "@/components/estudo/mensagem-tutor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CabecalhoTutor, CampoPergunta, ChipsSugestao, ErroTutor, ListaConversa, type ModoTutor } from "@/components/estudo/tutor-comum";

export const SUGESTOES_RESUMO: Sugestao[] = [
  { rotulo: "Explica de outro jeito", mensagem: "Explica esse assunto de outro jeito, mais simples." },
  { rotulo: "Me dá outro exemplo", mensagem: "Me dá outro exemplo, com números diferentes, e resolve passo a passo." },
  { rotulo: "O que significa cada letra?", mensagem: "O que significa cada letra das fórmulas deste resumo?" },
  { rotulo: "Como isso cai no ENEM?", mensagem: "Como isso cai no ENEM? Me mostra o jeito típico de cobrar." },
];

function abertura(resumo: Resumo) {
  return `Ficou alguma dúvida em ${resumo.titulo.toLowerCase()}? Pergunte do seu jeito ou toque numa sugestão.`;
}

function Casca({ modo, modelo, children, rodape }: { modo: ModoTutor; modelo?: string | null; children: React.ReactNode; rodape?: React.ReactNode }) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-surface" aria-label="Tirar dúvida" data-testid="painel-duvida">
      <CabecalhoTutor titulo="Tirar dúvida" modo={modo} modelo={modelo} />
      <ListaConversa>{children}</ListaConversa>
      {rodape && <footer className="flex flex-col gap-2.5 border-t border-border px-4 py-3">{rodape}</footer>}
    </section>
  );
}

/** Painel do chat: escolhe o modo pelo /api/status. */
export function PainelDuvida({ resumo }: { resumo: Resumo }) {
  const status = useStatusIA();
  if (status.ia === null) {
    return (
      <Casca modo="carregando" rodape={<CampoPergunta id="pergunta-duvida" desabilitado placeholder="pergunte do seu jeito…" />}>
        <Balao>{abertura(resumo)}</Balao>
      </Casca>
    );
  }
  if (!status.ia) return <TutorDesligado />;
  return <ChatResumo key={resumo.id} resumo={resumo} modelo={status.modelo} />;
}

/** Estado vazio honesto: o chat precisa da IA (o modo guiado offline só sabe dar dica de questão). */
function TutorDesligado() {
  return (
    <Casca modo="desligado">
      <div className="flex flex-col items-center gap-3 px-2 py-8 text-center" data-testid="duvida-desligada">
        <div className="inline-flex size-12 items-center justify-center rounded-[12px] bg-accent-soft text-accent [&_svg]:size-6">
          <PlugZap />
        </div>
        <h3 className="text-[15px] font-bold">O tutor de IA está desligado</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Tirar dúvida sobre o resumo precisa da IA, e este servidor está sem nenhuma configurada. O resumo e o treino com questões continuam funcionando.
        </p>
        <div className="w-full max-w-xs rounded-md bg-warning-soft px-3 py-2 text-left text-[13px] leading-snug">
          <p className="font-bold text-warning-text">Como ligar</p>
          <p>
            Defina <code className="font-mono text-[0.85em]">ANTHROPIC_API_KEY</code> (ou <code className="font-mono text-[0.85em]">AI_GATEWAY_API_KEY</code>) no{" "}
            <code className="font-mono text-[0.85em]">.env.local</code>, ou rode com <code className="font-mono text-[0.85em]">TUTOR_PROVIDER=claude-local</code> no Mac
            com o Claude Code logado. Depois reinicie o servidor.
          </p>
        </div>
      </div>
    </Casca>
  );
}

/** Perfil mais recente, fora do React: o transporte lê na hora de enviar (como em painel-tutor). */
let perfilAtual = { nome: "Matheus", explicaDoMeuJeito: "" };

function ChatResumo({ resumo, modelo }: { resumo: Resumo; modelo: string | null }) {
  const { estado } = useStore();
  const [erro, setErro] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (estado) perfilAtual = { nome: estado.perfil.nome, explicaDoMeuJeito: estado.perfil.explicaDoMeuJeito };
  }, [estado]);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport<MensagemTutor>({
        api: "/api/tutor",
        body: () => ({ contexto: { tipo: "resumo", resumoId: resumo.id, perfil: perfilAtual } }),
      }),
    [resumo.id],
  );
  const chat = useChat<MensagemTutor>({
    id: `duvida-${resumo.id}`,
    transport,
    onError: (e) => {
      if (/missing_key/.test(e.message)) {
        marcarIADesligada();
        return;
      }
      setErro(e.message || "O tutor não conseguiu responder agora.");
    },
  });
  const ocupado = chat.status === "submitted" || chat.status === "streaming";
  const enviar = (texto: string) => {
    setErro(null);
    void chat.sendMessage({ text: texto });
  };
  const ultima = chat.messages[chat.messages.length - 1];

  return (
    <Casca
      modo="ia"
      modelo={modelo}
      rodape={
        <>
          <ChipsSugestao sugestoes={SUGESTOES_RESUMO} aoSugestao={(s) => enviar(s.mensagem)} ocupado={ocupado} />
          <CampoPergunta id="pergunta-duvida" aoEnviar={enviar} ocupado={ocupado} aoParar={() => void chat.stop()} placeholder="pergunte do seu jeito…" />
        </>
      }
    >
      {chat.messages.length === 0 && <Balao>{abertura(resumo)}</Balao>}
      {chat.messages.map((m) => (
        <MensagemTutorView key={m.id} mensagem={m} divergenciasAntes={0} transmitindo={m === ultima && ocupado && m.role === "assistant"} />
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

/* ------------------------- desktop x celular ------------------------- */

const CONSULTA_DESKTOP = "(min-width: 1024px)";

function assinarMidia(cb: () => void) {
  const m = window.matchMedia(CONSULTA_DESKTOP);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/** true no desktop (≥ 1024px, o `lg` do Tailwind); null no servidor. */
export function useDesktop(): boolean | null {
  return React.useSyncExternalStore(
    assinarMidia,
    () => window.matchMedia(CONSULTA_DESKTOP).matches,
    () => null,
  );
}

/**
 * Celular: pílula "Tirar dúvida" fixa no canto que abre o chat numa gaveta de baixo.
 * A gaveta fica montada depois da primeira abertura, para a conversa não sumir ao fechar.
 */
export function GavetaDuvida({ resumo }: { resumo: Resumo }) {
  const [aberta, setAberta] = React.useState(false);
  const [jaAbriu, setJaAbriu] = React.useState(false);
  return (
    <DialogPrimitive.Root
      open={aberta}
      onOpenChange={(a) => {
        setAberta(a);
        if (a) setJaAbriu(true);
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <Button className="fixed right-4 bottom-4 z-40 shadow-flutuante" data-testid="abrir-duvida">
          <MessageCircleQuestion /> Tirar dúvida
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal forceMount={jaAbriu ? true : undefined}>
        <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-[rgba(29,29,31,0.35)] data-[state=open]:anim-fade-in dark:bg-black/60", !aberta && "hidden")} />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid="gaveta-duvida"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-xl bg-surface text-foreground shadow-flutuante data-[state=open]:anim-slide-in-up",
            !aberta && "hidden",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Tirar dúvida sobre {resumo.titulo}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute top-2 right-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-surface-2 hover:text-foreground dark:bg-surface-2"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
          <div className="min-h-0 flex-1 [&_header]:pr-14">
            <PainelDuvida resumo={resumo} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
