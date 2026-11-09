"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Timer, X } from "lucide-react";
import type { Letra, Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import { useQuestoes } from "@/data/use-questoes";
import { limiarFacilDoModo } from "@/data/modo";
import { useStore } from "@/lib/store/provider";
import { useAtalho } from "@/lib/atalhos/provider";
import {
  encerrarSimulado,
  montarSimuladoFaceis,
  plural,
  registrarTentativa,
  SEGUNDOS_POR_ITEM_SIMULADO,
  simuladoValeParaFaceis,
  TAMANHO_SIMULADO_FACEIS,
  type Simulado,
} from "@/lib/dominio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CabecalhoPagina, ConteudoPagina, EstadoErro } from "@/components/app/pagina";
import { useToast } from "@/components/ui/toast";
import { CaixaTempo, formatarTempo } from "@/components/estudo/barra-sprint";
import { QuestaoView } from "@/components/estudo/questao-view";
import { Logo } from "@/components/app/sidebar";
import { cn } from "@/lib/utils";

interface Resposta {
  escolha: Letra | null;
  acertou: boolean;
  segundos: number;
  tempoEsgotado: boolean;
}

type Fase =
  | { tipo: "intro" }
  | { tipo: "rodando"; iniciadoEm: string; questoes: Questao[]; indice: number; respostas: (Resposta | null)[] }
  | { tipo: "fim"; simulado: Simulado; questoes: Questao[]; respostas: (Resposta | null)[] };

/** Simulado de 15 fáceis inéditos: 3 min por item, sem tutor; conta para "pronto nos fáceis". */
export function TelaSimulado() {
  const { estado, atualizar, erro: erroStore } = useStore();
  const { questoes, porId, erro: erroQuestoes } = useQuestoes();
  const { notificar } = useToast();
  const [fase, setFase] = React.useState<Fase>({ tipo: "intro" });
  // Ids das tentativas gravadas, preenchidos dentro da fila serializada do store
  // (quando o encerramento rodar, todas as gravações anteriores já terminaram).
  const tentativaIdsRef = React.useRef<string[]>([]);

  const fila = React.useMemo(() => {
    if (!estado || !questoes) return null;
    const bs = questoes.flatMap((q) => (q.tri ? [q.tri.b] : []));
    return montarSimuladoFaceis({ questoes, estado, limiarFacil: limiarFacilDoModo(bs) });
  }, [estado, questoes]);

  const comecar = React.useCallback(() => {
    if (!fila || fila.length < TAMANHO_SIMULADO_FACEIS) return;
    tentativaIdsRef.current = [];
    setFase({ tipo: "rodando", iniciadoEm: new Date().toISOString(), questoes: fila, indice: 0, respostas: fila.map(() => null) });
  }, [fila]);

  const responder = React.useCallback(
    (r: Resposta) => {
      if (fase.tipo !== "rodando" || !porId) return;
      const questao = fase.questoes[fase.indice];
      if (!questao || fase.respostas[fase.indice]) return;
      const agora = new Date();
      const indice = fase.indice;
      const porQue = questao.resolucao?.erros_comuns.find((e) => e.alternativa === r.escolha)?.por_que ?? null;
      setFase((f) => (f.tipo === "rodando" ? { ...f, respostas: f.respostas.map((x, i) => (i === indice ? r : x)) } : f));
      atualizar((e) => {
        const res = registrarTentativa(
          e,
          { questao, escolha: r.escolha, segundos: r.segundos, degrauMaximo: 0, pediuResposta: false, origem: "oficial", sprintId: null, porQue, buscarQuestao: (id) => porId.get(id) },
          agora,
        );
        tentativaIdsRef.current = [...tentativaIdsRef.current, res.tentativa.id];
        return res.estado;
      }).catch((err: unknown) => {
        notificar({ tipo: "erro", titulo: "Não consegui salvar a resposta", descricao: err instanceof Error ? err.message : undefined });
      });
    },
    [fase, porId, atualizar, notificar],
  );

  const avancar = React.useCallback(() => {
    if (fase.tipo !== "rodando" || fase.respostas[fase.indice] === null) return;
    if (fase.indice + 1 < fase.questoes.length) {
      setFase((f) => (f.tipo === "rodando" ? { ...f, indice: f.indice + 1 } : f));
      return;
    }
    const agora = new Date();
    const { iniciadoEm, questoes: qs, respostas } = fase;
    const ref: { simulado: Simulado | null } = { simulado: null };
    atualizar((e) => {
      const r = encerrarSimulado(e, { tipo: "faceis-15", iniciadoEm, tentativaIds: tentativaIdsRef.current }, agora);
      ref.simulado = r.simulado;
      return r.estado;
    })
      .then(() => {
        if (ref.simulado) setFase({ tipo: "fim", simulado: ref.simulado, questoes: qs, respostas });
      })
      .catch((err: unknown) => {
      notificar({ tipo: "erro", titulo: "Não consegui encerrar o simulado", descricao: err instanceof Error ? err.message : undefined });
    });
  }, [fase, atualizar, notificar]);

  const erro = erroStore ?? erroQuestoes;
  if (erro) {
    return (
      <ConteudoPagina className="justify-center">
        <EstadoErro titulo="Não consegui carregar" descricao={erro} acao={<Button onClick={() => window.location.reload()}>Tentar de novo</Button>} />
      </ConteudoPagina>
    );
  }

  if (fase.tipo === "intro") {
    const n = fila?.length ?? null;
    const suficiente = n !== null && n >= TAMANHO_SIMULADO_FACEIS;
    return (
      <ConteudoPagina className="max-w-[760px]">
        <CabecalhoPagina titulo={`Simulado de ${TAMANHO_SIMULADO_FACEIS} fáceis`} descricao="Itens oficiais do tercil fácil que você nunca fez. Sem dicas: só você e o cronômetro." />
        <Card className="gap-5 md:p-6">
          <CardHeader>
            <CardTitle className="text-xl">Como funciona</CardTitle>
            <CardDescription>
              {TAMANHO_SIMULADO_FACEIS} questões fáceis pelo parâmetro b do INEP, todas inéditas para você. Até 3 minutos por item: quando o tempo acaba, a questão fecha sem resposta e a próxima entra.
              Para valer como “pronto nos fáceis” é preciso acertar pelo menos 90% (14 de 15) sem estourar o tempo em nenhum item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={comecar} disabled={!suficiente} data-testid="comecar-simulado">
                <Timer /> Começar
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="disponiveis-simulado">
                {n === null
                  ? "Montando a lista…"
                  : suficiente
                    ? `${TAMANHO_SIMULADO_FACEIS} questões prontas, ${estado ? resumirHabilidades(fila!) : ""}.`
                    : `Só ${plural(n, "questão fácil inédita", "questões fáceis inéditas")} restantes: não dá para montar o simulado. Sincronize mais questões ou aguarde novas.`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada resposta conta como tentativa oficial (domínio e nota TRI), como num sprint, mas sem dica e com peso normal.
            </p>
          </CardContent>
        </Card>
        <Button variant="outline" asChild className="self-start">
          <Link href="/mapa">
            <ArrowLeft /> Voltar para o Mapa
          </Link>
        </Button>
      </ConteudoPagina>
    );
  }

  if (fase.tipo === "fim") {
    return <FimSimulado simulado={fase.simulado} questoes={fase.questoes} respostas={fase.respostas} />;
  }

  const questao = fase.questoes[fase.indice]!;
  const resposta = fase.respostas[fase.indice] ?? null;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-surface px-4 text-sm">
        <span className="flex items-center gap-2 font-rounded text-base font-extrabold">
          <Logo className="size-5" />
          <span className="hidden sm:inline">Simulado</span>
        </span>
        <span className="num text-muted-foreground" data-testid="progresso-simulado">
          {fase.indice + 1}/{fase.questoes.length}
        </span>
        <Progress value={(fase.indice / fase.questoes.length) * 100} className="hidden max-w-48 sm:block" aria-label="Progresso do simulado" />
        <span className="hidden truncate text-muted-foreground md:inline">
          {questao.habilidade ? `${NOME_HABILIDADE[questao.habilidade]} · ${questao.habilidade}` : ""}
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="num text-muted-foreground">
            {fase.respostas.filter((r) => r?.acertou).length} acertos
          </span>
        </span>
      </header>
      <ItemSimulado key={questao.id} questao={questao} resposta={resposta} ehUltima={fase.indice === fase.questoes.length - 1} aoResponder={responder} aoAvancar={avancar} />
    </div>
  );
}

function resumirHabilidades(fila: Questao[]): string {
  const hs = [...new Set(fila.map((q) => q.habilidade).filter((h): h is string => !!h))];
  return `${plural(hs.length, "habilidade", "habilidades")} (${hs.join(", ")})`;
}

/** Um item do simulado: cronômetro regressivo de 3 min; ao zerar, fecha sem resposta. */
function ItemSimulado({
  questao,
  resposta,
  ehUltima,
  aoResponder,
  aoAvancar,
}: {
  questao: Questao;
  resposta: Resposta | null;
  ehUltima: boolean;
  aoResponder: (r: Resposta) => void;
  aoAvancar: () => void;
}) {
  const confirmada = resposta !== null;
  const [marcada, setMarcada] = React.useState<Letra | null>(null);
  const [restante, setRestante] = React.useState(SEGUNDOS_POR_ITEM_SIMULADO);
  const [inicio] = React.useState(() => Date.now());
  const aoResponderRef = React.useRef(aoResponder);
  React.useEffect(() => {
    aoResponderRef.current = aoResponder;
  });

  React.useEffect(() => {
    if (confirmada) return;
    const id = window.setInterval(() => {
      const passado = Math.round((Date.now() - inicio) / 1000);
      const r = SEGUNDOS_POR_ITEM_SIMULADO - passado;
      setRestante(Math.max(0, r));
      if (r <= 0) {
        window.clearInterval(id);
        aoResponderRef.current({ escolha: null, acertou: false, segundos: SEGUNDOS_POR_ITEM_SIMULADO, tempoEsgotado: true });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [confirmada, inicio]);

  const confirmar = React.useCallback(() => {
    if (confirmada || !marcada) return;
    aoResponder({ escolha: marcada, acertou: marcada === questao.gabarito, segundos: Math.round((Date.now() - inicio) / 1000), tempoEsgotado: false });
  }, [confirmada, marcada, questao.gabarito, inicio, aoResponder]);

  const pular = React.useCallback(() => {
    if (confirmada) return;
    aoResponder({ escolha: null, acertou: false, segundos: Math.round((Date.now() - inicio) / 1000), tempoEsgotado: false });
  }, [confirmada, inicio, aoResponder]);

  const letras = new Set(questao.alternativas.map((a) => a.letra));
  useAtalho({ id: "marcar-A", combinacao: "a", descricao: "Marcar a alternativa A", grupo: "Questão", ativo: !confirmada && letras.has("A"), acao: () => setMarcada("A") });
  useAtalho({ id: "marcar-B", combinacao: "b", descricao: "Marcar a alternativa B", grupo: "Questão", ativo: !confirmada && letras.has("B"), acao: () => setMarcada("B") });
  useAtalho({ id: "marcar-C", combinacao: "c", descricao: "Marcar a alternativa C", grupo: "Questão", ativo: !confirmada && letras.has("C"), acao: () => setMarcada("C") });
  useAtalho({ id: "marcar-D", combinacao: "d", descricao: "Marcar a alternativa D", grupo: "Questão", ativo: !confirmada && letras.has("D"), acao: () => setMarcada("D") });
  useAtalho({ id: "marcar-E", combinacao: "e", descricao: "Marcar a alternativa E", grupo: "Questão", ativo: !confirmada && letras.has("E"), acao: () => setMarcada("E") });
  useAtalho({ id: "confirmar", combinacao: "enter", descricao: "Confirmar a resposta", grupo: "Questão", ativo: !confirmada, acao: confirmar });
  useAtalho({ id: "proxima", combinacao: "n", descricao: "Próxima questão", grupo: "Simulado", ativo: confirmada, acao: aoAvancar });

  const pouco = restante <= 30;
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <QuestaoView
        canto={
          <CaixaTempo
            className={cn(pouco && !confirmada && "bg-warning-soft text-warning-text")}
            aria-label="tempo restante neste item"
            data-testid="cronometro"
          >
            {confirmada ? (resposta?.tempoEsgotado ? "tempo esgotado" : formatarTempo(resposta?.segundos ?? 0)) : formatarTempo(restante)}
          </CaixaTempo>
        }
        questao={questao}
        marcada={confirmada ? (resposta?.escolha ?? null) : marcada}
        confirmada={confirmada}
        aoMarcar={setMarcada}
        aoConfirmar={confirmar}
        aoPular={pular}
        aoProxima={aoAvancar}
        ehUltima={ehUltima}
      />
    </div>
  );
}

function FimSimulado({ simulado, questoes, respostas }: { simulado: Simulado; questoes: Questao[]; respostas: (Resposta | null)[] }) {
  const vale = simuladoValeParaFaceis(simulado);
  const taxa = simulado.total > 0 ? simulado.acertos / simulado.total : 0;
  return (
    <ConteudoPagina className="max-w-[760px] gap-4">
      <CabecalhoPagina
        titulo={`${simulado.acertos} de ${simulado.total}`}
        descricao={
          vale
            ? "Vale para o critério “pronto nos fáceis”: pelo menos 90% de acerto e nenhum item acima de 3 minutos."
            : taxa < 0.9
              ? `Faltou acerto: ${Math.round(taxa * 100)}% (meta 90%). Cada erro já está no caderno.`
              : "Acertos suficientes, mas um item passou de 3 minutos. O critério pede todos dentro do tempo."
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={vale ? "success" : "outline"} data-testid="simulado-vale">
          {vale ? "vale para pronto nos fáceis" : "não vale ainda"}
        </Badge>
        <Badge variant="outline">maior tempo por item: {formatarTempo(simulado.maiorTempoItem)}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Questões</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 divide-y divide-border">
          {questoes.map((q, i) => {
            const r = respostas[i];
            const acertou = !!r?.acertou;
            return (
              <div key={q.id} className="flex items-center gap-3 py-2.5 text-sm" data-testid="resultado-simulado">
                <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white", acertou ? "bg-success" : "bg-danger")} aria-label={acertou ? "acertou" : "errou"}>
                  {acertou ? <Check className="size-4" strokeWidth={2.5} /> : <X className="size-4" strokeWidth={2.5} />}
                </span>
                <span className="num w-5 text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  ENEM {q.ano} · Q{q.numero}
                  <span className="font-normal text-muted-foreground"> · {q.habilidade}</span>
                </span>
                <span className="num text-[13px] text-muted-foreground">
                  {r?.tempoEsgotado ? "tempo esgotado" : r?.escolha ? `marcou ${r.escolha}` : "pulou"}
                  {r && !r.tempoEsgotado ? ` · ${formatarTempo(r.segundos)}` : ""}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" asChild>
          <Link href="/mapa">
            Ver o Mapa <ArrowRight />
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/caderno">Caderno de erros</Link>
        </Button>
      </div>
    </ConteudoPagina>
  );
}
