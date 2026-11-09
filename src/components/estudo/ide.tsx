"use client";

import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { Questao, Letra } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import type { DegrauDica } from "@/lib/dominio/tipos";
import { useAtalho } from "@/lib/atalhos/provider";
import { definirModoFoco } from "@/components/app/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarraSprint, type EstadoBolinha } from "./barra-sprint";
import { PainelTutor } from "./painel-tutor";
import { QuestaoView } from "./questao-view";

export interface RespostaQuestao {
  escolha: Letra | null;
  acertou: boolean;
  segundos: number;
  degrauMaximo: DegrauDica;
  pediuResposta: boolean;
}

interface Props {
  questoes: Questao[];
  indice: number;
  respostas: (RespostaQuestao | null)[];
  mostrarTimer: boolean;
  /** Chamado ao confirmar (ou pular) a questão atual. */
  aoResponder: (resposta: RespostaQuestao) => void;
  /** Chamado ao pedir a próxima questão (ou ao terminar o sprint). */
  aoAvancar: () => void;
  /** Rodapé com o domínio da habilidade atual. */
  rodape?: React.ReactNode;
}

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];
const CHAVE_LAYOUT = "gabarita:layout-ide";

// Leitura do layout salvo, com cache para o snapshot ser estável.
let layoutBruto: string | null | undefined;
let layoutCache: Record<string, number> | undefined;
function lerLayout(): Record<string, number> | undefined {
  let bruto: string | null = null;
  try {
    bruto = window.localStorage.getItem(CHAVE_LAYOUT);
  } catch {
    bruto = null;
  }
  if (bruto !== layoutBruto) {
    layoutBruto = bruto;
    try {
      layoutCache = bruto ? (JSON.parse(bruto) as Record<string, number>) : undefined;
    } catch {
      layoutCache = undefined;
    }
  }
  return layoutCache;
}
const semAssinatura = () => () => {};

/**
 * A IDE: questão à esquerda, tutor à direita, redimensionável; em telas estreitas vira abas.
 * Toda a interação dá para fazer pelo teclado.
 */
export function IDE({ questoes, indice, respostas, mostrarTimer, aoResponder, aoAvancar, rodape }: Props) {
  const questao = questoes[indice];
  const [foco, setFoco] = React.useState(false);
  const layoutInicial = React.useSyncExternalStore(semAssinatura, lerLayout, () => undefined);

  React.useEffect(() => {
    definirModoFoco(foco);
    return () => definirModoFoco(false);
  }, [foco]);

  useAtalho({ id: "foco", combinacao: "f", descricao: "Alternar o modo foco", grupo: "Geral", acao: () => setFoco((v) => !v) });

  if (!questao) return null;

  const bolinhas: EstadoBolinha[] = questoes.map((_, i) => {
    const r = respostas[i];
    if (r) return r.acertou ? "acertou" : "errou";
    return i === indice ? "atual" : "pendente";
  });

  return (
    <QuestaoDoSprint
      key={questao.id}
      questao={questao}
      resposta={respostas[indice] ?? null}
      ehUltima={indice === questoes.length - 1}
      bolinhas={bolinhas}
      indice={indice}
      mostrarTimer={mostrarTimer}
      foco={foco}
      aoAlternarFoco={() => setFoco((v) => !v)}
      layoutInicial={layoutInicial}
      aoResponder={aoResponder}
      aoAvancar={aoAvancar}
      rodape={rodape}
    />
  );
}

interface PropsQuestao {
  questao: Questao;
  resposta: RespostaQuestao | null;
  ehUltima: boolean;
  bolinhas: EstadoBolinha[];
  indice: number;
  mostrarTimer: boolean;
  foco: boolean;
  aoAlternarFoco: () => void;
  layoutInicial: Record<string, number> | undefined;
  aoResponder: (resposta: RespostaQuestao) => void;
  aoAvancar: () => void;
  rodape?: React.ReactNode;
}

/** Uma questão do sprint. Montado com `key` por questão: o estado local recomeça sozinho. */
function QuestaoDoSprint({
  questao,
  resposta,
  ehUltima,
  bolinhas,
  indice,
  mostrarTimer,
  foco,
  aoAlternarFoco,
  layoutInicial,
  aoResponder,
  aoAvancar,
  rodape,
}: PropsQuestao) {
  const confirmada = resposta !== null;
  const [marcada, setMarcada] = React.useState<Letra | null>(null);
  const [degrau, setDegrau] = React.useState<DegrauDica>(0);
  const [segundos, setSegundos] = React.useState(0);
  const [aba, setAba] = React.useState<"questao" | "tutor">("questao");
  const [inicio] = React.useState(() => Date.now());
  const inputTutorRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Timer (1 s); para quando confirma.
  React.useEffect(() => {
    if (confirmada) return;
    const id = window.setInterval(() => setSegundos(Math.round((Date.now() - inicio) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [confirmada, inicio]);

  const confirmar = React.useCallback(() => {
    if (confirmada || !marcada) return;
    aoResponder({
      escolha: marcada,
      acertou: marcada === questao.gabarito,
      segundos: Math.round((Date.now() - inicio) / 1000),
      degrauMaximo: degrau,
      pediuResposta: degrau >= 4,
    });
  }, [questao, confirmada, marcada, degrau, inicio, aoResponder]);

  const pular = React.useCallback(() => {
    if (confirmada) return;
    aoResponder({
      escolha: null,
      acertou: false,
      segundos: Math.round((Date.now() - inicio) / 1000),
      degrauMaximo: degrau,
      pediuResposta: false,
    });
  }, [confirmada, degrau, inicio, aoResponder]);

  const pedirDica = React.useCallback(() => {
    setDegrau((d) => (d >= 4 ? d : ((d + 1) as DegrauDica)));
    setAba("tutor");
  }, []);

  // Atalhos. A–E marcam; Enter confirma; N avança; H dica; / foca o chat.
  const letrasDisponiveis = new Set(questao.alternativas.map((a) => a.letra));
  useAtalho({ id: "marcar-A", combinacao: "a", descricao: "Marcar a alternativa A", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("A"), acao: () => setMarcada("A") });
  useAtalho({ id: "marcar-B", combinacao: "b", descricao: "Marcar a alternativa B", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("B"), acao: () => setMarcada("B") });
  useAtalho({ id: "marcar-C", combinacao: "c", descricao: "Marcar a alternativa C", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("C"), acao: () => setMarcada("C") });
  useAtalho({ id: "marcar-D", combinacao: "d", descricao: "Marcar a alternativa D", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("D"), acao: () => setMarcada("D") });
  useAtalho({ id: "marcar-E", combinacao: "e", descricao: "Marcar a alternativa E", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("E"), acao: () => setMarcada("E") });
  useAtalho({ id: "confirmar", combinacao: "enter", descricao: "Confirmar a resposta", grupo: "Questão", ativo: !confirmada, acao: confirmar });
  useAtalho({ id: "proxima", combinacao: "n", descricao: "Próxima questão", grupo: "Sprint", ativo: confirmada, acao: aoAvancar });
  useAtalho({ id: "dica", combinacao: "h", descricao: "Pedir o próximo degrau de dica", grupo: "Tutor", ativo: degrau < 4, acao: pedirDica });
  useAtalho({
    id: "chat",
    combinacao: "/",
    descricao: "Perguntar ao tutor",
    grupo: "Tutor",
    acao: () => {
      setAba("tutor");
      requestAnimationFrame(() => inputTutorRef.current?.focus());
    },
  });

  const rotuloHabilidade = questao.habilidade
    ? `${NOME_HABILIDADE[questao.habilidade] ?? "Habilidade"} · ${questao.habilidade}`
    : null;

  const painelQuestao = (
    <QuestaoView
      questao={questao}
      marcada={marcada}
      confirmada={confirmada}
      aoMarcar={setMarcada}
      aoConfirmar={confirmar}
      aoPular={pular}
      aoProxima={aoAvancar}
      ehUltima={ehUltima}
    />
  );
  const painelTutor = (
    <PainelTutor questao={questao} degrau={degrau} aoPedirDica={pedirDica} confirmada={confirmada} inputRef={inputTutorRef} />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BarraSprint
        bolinhas={bolinhas}
        indice={indice}
        rotuloHabilidade={rotuloHabilidade}
        segundos={segundos}
        mostrarTimer={mostrarTimer}
        foco={foco}
        aoAlternarFoco={aoAlternarFoco}
      />

      {/* Desktop: painéis lado a lado. */}
      <div className="hidden min-h-0 flex-1 md:block">
        <Group
          orientation="horizontal"
          defaultLayout={layoutInicial}
          onLayoutChanged={(layout, meta) => {
            if (!meta.isUserInteraction) return;
            try {
              window.localStorage.setItem(CHAVE_LAYOUT, JSON.stringify(meta.requestedLayout ?? layout));
            } catch {
              /* sem armazenamento: ignora */
            }
          }}
          className="h-full"
        >
          <Panel id="questao" defaultSize="58%" minSize="35%" className="min-w-0">
            {painelQuestao}
          </Panel>
          <Separator className="w-1.5 cursor-col-resize" aria-label="Redimensionar painéis" />
          <Panel id="tutor" defaultSize="42%" minSize="28%" className="min-w-0 bg-background">
            {painelTutor}
          </Panel>
        </Group>
      </div>

      {/* Celular: abas. */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <Tabs value={aba} onValueChange={(v) => setAba(v as "questao" | "tutor")} className="min-h-0 flex-1 gap-0">
          <TabsList className="mx-4 mt-3 w-[calc(100%-2rem)]">
            <TabsTrigger value="questao" className="flex-1">
              Questão
            </TabsTrigger>
            <TabsTrigger value="tutor" className="flex-1">
              Tutor
            </TabsTrigger>
          </TabsList>
          <TabsContent value="questao" className="min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
            {painelQuestao}
          </TabsContent>
          <TabsContent value="tutor" className="min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
            {painelTutor}
          </TabsContent>
        </Tabs>
      </div>

      {rodape && <footer className="shrink-0 border-t border-border px-4 py-2 text-sm">{rodape}</footer>}
    </div>
  );
}

export { LETRAS };
