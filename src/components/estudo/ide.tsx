"use client";

import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { Questao, Letra } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import type { DegrauDica } from "@/lib/dominio/tipos";
import type { EntradaEvento } from "@/lib/dominio/eventos";
import { useAtalho } from "@/lib/atalhos/provider";
import { definirModoFoco } from "@/components/app/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarraSprint, type EstadoBolinha } from "./barra-sprint";
import type { RespostaGemea } from "./gemea-card";
import { PainelTutor, type AcoesTutor, type ContextoAluno } from "./painel-tutor";
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
  /** Resumo e perfil do aluno para o tutor. */
  contextoAluno: ContextoAluno;
  /** Eventos do tutor (dica, erro, equívoco…) para o StudentStore. */
  aoEvento: (e: EntradaEvento) => void;
  /** Resposta a uma questão gêmea dentro do chat. */
  aoResponderGemea: (questaoPai: Questao, r: RespostaGemea) => void;
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
export function IDE({ questoes, indice, respostas, mostrarTimer, aoResponder, aoAvancar, rodape, contextoAluno, aoEvento, aoResponderGemea }: Props) {
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
      contextoAluno={contextoAluno}
      aoEvento={aoEvento}
      aoResponderGemea={(r) => aoResponderGemea(questao, r)}
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
  contextoAluno: ContextoAluno;
  aoEvento: (e: EntradaEvento) => void;
  aoResponderGemea: (r: RespostaGemea) => void;
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
  contextoAluno,
  aoEvento,
  aoResponderGemea,
}: PropsQuestao) {
  const confirmada = resposta !== null;
  const [marcada, setMarcada] = React.useState<Letra | null>(null);
  const [degrau, setDegrau] = React.useState<DegrauDica>(0);
  const [pediuResposta, setPediuResposta] = React.useState(false);
  const [selecao, setSelecao] = React.useState<string | null>(null);
  const [segundos, setSegundos] = React.useState(0);
  const [aba, setAba] = React.useState<"questao" | "tutor">("questao");
  const [inicio] = React.useState(() => Date.now());
  const inputTutorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const acoesRef = React.useRef<AcoesTutor | null>(null);

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
      pediuResposta: pediuResposta || degrau >= 4,
    });
  }, [questao, confirmada, marcada, degrau, pediuResposta, inicio, aoResponder]);

  const pular = React.useCallback(() => {
    if (confirmada) return;
    aoResponder({
      escolha: null,
      acertou: false,
      segundos: Math.round((Date.now() - inicio) / 1000),
      degrauMaximo: degrau,
      pediuResposta,
    });
  }, [confirmada, degrau, pediuResposta, inicio, aoResponder]);

  const definirDegrau = React.useCallback((d: DegrauDica) => {
    setDegrau((atual) => (d > atual ? d : atual));
  }, []);

  const pedirDica = React.useCallback(() => {
    setAba("tutor");
    acoesRef.current?.pedirDica();
  }, []);

  const pedirResposta = React.useCallback(() => {
    setPediuResposta(true);
    setDegrau(4);
  }, []);

  const pedirRespostaDireta = React.useCallback(() => {
    setAba("tutor");
    acoesRef.current?.pedirResposta();
  }, []);

  const perguntarSobre = React.useCallback((texto: string) => {
    setSelecao(texto);
    setAba("tutor");
    requestAnimationFrame(() => inputTutorRef.current?.focus());
  }, []);

  // Atalhos. A–E marcam; Enter confirma; N avança; H dica; ⌥R resposta direta; / foca o chat.
  const letrasDisponiveis = new Set(questao.alternativas.map((a) => a.letra));
  useAtalho({ id: "marcar-A", combinacao: "a", descricao: "Marcar a alternativa A", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("A"), acao: () => setMarcada("A") });
  useAtalho({ id: "marcar-B", combinacao: "b", descricao: "Marcar a alternativa B", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("B"), acao: () => setMarcada("B") });
  useAtalho({ id: "marcar-C", combinacao: "c", descricao: "Marcar a alternativa C", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("C"), acao: () => setMarcada("C") });
  useAtalho({ id: "marcar-D", combinacao: "d", descricao: "Marcar a alternativa D", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("D"), acao: () => setMarcada("D") });
  useAtalho({ id: "marcar-E", combinacao: "e", descricao: "Marcar a alternativa E", grupo: "Questão", ativo: !confirmada && letrasDisponiveis.has("E"), acao: () => setMarcada("E") });
  useAtalho({ id: "confirmar", combinacao: "enter", descricao: "Confirmar a resposta", grupo: "Questão", ativo: !confirmada, acao: confirmar });
  useAtalho({ id: "proxima", combinacao: "n", descricao: "Próxima questão", grupo: "Sprint", ativo: confirmada, acao: aoAvancar });
  useAtalho({ id: "dica", combinacao: "h", descricao: "Pedir o próximo degrau de dica", grupo: "Tutor", ativo: degrau < 4, acao: pedirDica });
  useAtalho({ id: "resposta-direta", combinacao: "alt+r", descricao: "Pedir a resposta direta (fica registrado)", grupo: "Tutor", emCampos: true, ativo: !pediuResposta, acao: pedirRespostaDireta });
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

  // No Mac, ⌥R chega como "®": trata fora do registro para não duplicar na ajuda.
  React.useEffect(() => {
    const aoTecla = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "®" && !pediuResposta) {
        e.preventDefault();
        pedirRespostaDireta();
      }
    };
    window.addEventListener("keydown", aoTecla);
    return () => window.removeEventListener("keydown", aoTecla);
  }, [pediuResposta, pedirRespostaDireta]);

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
      aoPerguntarSobre={perguntarSobre}
    />
  );
  const painelTutor = (
    <PainelTutor
      questao={questao}
      degrau={degrau}
      aoDefinirDegrau={definirDegrau}
      marcada={marcada}
      confirmada={confirmada}
      pediuResposta={pediuResposta}
      aoPedirResposta={pedirResposta}
      selecao={selecao}
      aoLimparSelecao={() => setSelecao(null)}
      acoesRef={acoesRef}
      inputRef={inputTutorRef}
      contextoAluno={contextoAluno}
      aoEvento={aoEvento}
      aoResponderGemea={aoResponderGemea}
    />
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
