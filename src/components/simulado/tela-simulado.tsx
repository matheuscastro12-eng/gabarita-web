"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Timer, X } from "lucide-react";
import type { Letra, Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import { useQuestoes } from "@/data/use-questoes";
import { useStore } from "@/lib/store/provider";
import { useAtalho } from "@/lib/atalhos/provider";
import {
  encerrarSimulado,
  limiarFacil,
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
import { Progress } from "@/components/ui/progress";
import { Bolha } from "@/components/ui/bolha";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";
import { useToast } from "@/components/ui/toast";
import { CaixaTempo, formatarTempo } from "@/components/estudo/barra-sprint";
import { QuestaoView } from "@/components/estudo/questao-view";
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
    return montarSimuladoFaceis({ questoes, estado, limiarFacil: limiarFacil(bs) });
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
        <EstadoVazio titulo="Não consegui carregar" descricao={erro} acao={<Button onClick={() => window.location.reload()}>Tentar de novo</Button>} />
      </ConteudoPagina>
    );
  }

  if (fase.tipo === "intro") {
    const n = fila?.length ?? null;
    const suficiente = n !== null && n >= TAMANHO_SIMULADO_FACEIS;
    return (
      <ConteudoPagina className="mx-0 max-w-[720px] gap-6">
        <CabecalhoPagina titulo={`Simulado de ${TAMANHO_SIMULADO_FACEIS} fáceis`} descricao="Itens oficiais do tercil fácil que você nunca fez. Sem tutor, sem dicas: só você e o cronômetro." />
        <section className="flex flex-col gap-3 border-t border-border pt-6" aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="text-base font-semibold">
            Como funciona
          </h2>
          <ol className="flex flex-col gap-3 text-sm text-texto-2">
            {[
              `${TAMANHO_SIMULADO_FACEIS} questões fáceis pelo parâmetro b do INEP, todas inéditas para você.`,
              "Até 3 minutos por item: quando o tempo acaba, a questão fecha sem resposta e a próxima entra.",
              "Para valer como “pronto nos fáceis” é preciso acertar pelo menos 90% (14 de 15) sem estourar o tempo em nenhum item.",
            ].map((regra, i) => (
              <li key={i} className="flex items-start gap-3">
                <Bolha tamanho="sm" className="num mt-px text-xs">
                  {i + 1}
                </Bolha>
                <span>{regra}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={comecar} disabled={!suficiente} data-testid="comecar-simulado">
              <Timer /> Começar
            </Button>
            <span className="min-w-0 text-sm text-muted-foreground" data-testid="disponiveis-simulado">
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
        </section>
        <Button variant="ghost" asChild className="self-start pointer-coarse:min-h-11">
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
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-background px-4 text-sm">
        <span className="hidden text-sm font-semibold sm:inline">Simulado</span>
        <span className="num text-texto-2" data-testid="progresso-simulado">
          {fase.indice + 1}/{fase.questoes.length}
        </span>
        <Progress value={(fase.indice / fase.questoes.length) * 100} className="hidden max-w-[200px] sm:block" aria-label="Progresso do simulado" />
        <span className="hidden min-w-0 truncate text-muted-foreground md:inline">
          {questao.habilidade ? `${NOME_HABILIDADE[questao.habilidade]} · ${questao.habilidade}` : ""}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <span className="num text-texto-2">
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
            className={cn(pouco && !confirmada && "bg-aviso-suave text-aviso")}
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
    <ConteudoPagina className="mx-0 max-w-[720px] gap-6">
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
        <Badge variant={vale ? "sucesso" : "outline"} data-testid="simulado-vale">
          {vale ? "vale para pronto nos fáceis" : "não vale ainda"}
        </Badge>
        <Badge variant="outline">maior tempo por item: {formatarTempo(simulado.maiorTempoItem)}</Badge>
      </div>
      <ol className="flex flex-wrap gap-2" aria-label="Resumo do simulado">
        {questoes.map((q, i) => {
          const acertou = !!respostas[i]?.acertou;
          return (
            <li key={q.id}>
              <Bolha tamanho="md" estado={acertou ? "certa" : "errada"}>
                {i + 1}
              </Bolha>
            </li>
          );
        })}
      </ol>
      <section className="flex flex-col gap-2 border-t border-border pt-6" aria-labelledby="questoes-simulado">
        <h2 id="questoes-simulado" className="text-base font-semibold">
          Questões
        </h2>
        <div className="flex flex-col">
          {questoes.map((q, i) => {
            const r = respostas[i];
            const acertou = !!r?.acertou;
            return (
              <div key={q.id} className="flex min-h-10 items-center gap-3 border-b border-border py-2 text-sm" data-testid="resultado-simulado">
                <Bolha tamanho="sm" estado={acertou ? "certa" : "errada"} aria-hidden={false} aria-label={acertou ? "acertou" : "errou"}>
                  {acertou ? <Check strokeWidth={2} /> : <X strokeWidth={2} />}
                </Bolha>
                <span className="num w-6 shrink-0 text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 font-medium">
                  ENEM {q.ano} · Q{q.numero}
                  <span className="font-normal text-muted-foreground"> · {q.habilidade}</span>
                </span>
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {r?.tempoEsgotado ? "tempo esgotado" : r?.escolha ? `marcou ${r.escolha}` : "pulou"}
                  {r && !r.tempoEsgotado ? ` · ${formatarTempo(r.segundos)}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </section>
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
