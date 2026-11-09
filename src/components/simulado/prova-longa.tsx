"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LayoutGrid, Minus, X } from "lucide-react";
import { NOME_AREA, SIGLA_AREA, type Letra, type Questao } from "@/data/tipos";
import {
  CHAVE_ANDAMENTO,
  corrigirProva,
  encerrarSimulado,
  registrarTentativa,
  restanteSegundos,
  serializarAndamento,
  type Andamento,
  type CorrecaoArea,
} from "@/lib/dominio";
import { useStore } from "@/lib/store/provider";
import { useAtalho } from "@/lib/atalhos/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { CaixaTempo } from "@/components/estudo/barra-sprint";
import { QuestaoView } from "@/components/estudo/questao-view";
import { Resolucao } from "@/components/estudo/resolucao";
import { Logo } from "@/components/app/sidebar";
import { cn } from "@/lib/utils";

/** Grava o andamento (chamado a cada mudança e a cada 5 s do relógio). */
export function salvarAndamento(a: Andamento | null) {
  try {
    if (a) window.localStorage.setItem(CHAVE_ANDAMENTO, serializarAndamento(a));
    else window.localStorage.removeItem(CHAVE_ANDAMENTO);
  } catch {
    /* sem localStorage: o simulado segue, só não sobrevive ao recarregar */
  }
}

/** Formato longo (h:mm:ss) para o cronômetro geral. */
export function formatarRelogio(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
}

/**
 * Prova longa: folha de respostas livre (dá para voltar e trocar), cronômetro geral que só
 * corre com a tela aberta, progresso salvo em localStorage, correção no fim.
 */
export function ProvaLonga({ inicial, questoes, aoSair }: { inicial: Andamento; questoes: Questao[]; aoSair: () => void }) {
  const { atualizar } = useStore();
  const { notificar } = useToast();
  const [andamento, setAndamento] = React.useState(inicial);
  const [folhaAberta, setFolhaAberta] = React.useState(false);
  const [fim, setFim] = React.useState<{ correcao: CorrecaoArea[]; escolhas: (Letra | null)[]; segundos: number } | null>(null);
  const encerrandoRef = React.useRef(false);
  const andamentoRef = React.useRef(andamento);
  React.useEffect(() => {
    andamentoRef.current = andamento;
  });

  const restante = restanteSegundos(andamento);

  const entregar = React.useCallback(async () => {
    if (encerrandoRef.current) return;
    encerrandoRef.current = true;
    const a = andamentoRef.current;
    const agora = new Date();
    const porId = new Map(questoes.map((q) => [q.id, q]));
    const validas = questoes.filter((q) => !q.anulada);
    const medio = validas.length > 0 ? Math.round(a.usadosSegundos / validas.length) : 0;
    try {
      await atualizar((e) => {
        let estado = e;
        const ids: string[] = [];
        questoes.forEach((questao, i) => {
          if (questao.anulada) return;
          const r = registrarTentativa(
            estado,
            {
              questao,
              escolha: a.escolhas[i] ?? null,
              segundos: medio,
              degrauMaximo: 0,
              pediuResposta: false,
              origem: "oficial",
              sprintId: null,
              porQue: null,
              buscarQuestao: (id) => porId.get(id),
            },
            agora,
          );
          estado = r.estado;
          ids.push(r.tentativa.id);
        });
        return encerrarSimulado(
          estado,
          { tipo: a.tipo, iniciadoEm: a.iniciadoEm, tentativaIds: ids, areas: a.areas, ano: a.ano },
          agora,
        ).estado;
      });
      salvarAndamento(null);
      setFim({ correcao: corrigirProva(questoes, a.escolhas), escolhas: a.escolhas, segundos: a.usadosSegundos });
    } catch (err) {
      encerrandoRef.current = false;
      notificar({ tipo: "erro", titulo: "Não consegui corrigir o simulado", descricao: err instanceof Error ? err.message : undefined });
    }
  }, [atualizar, notificar, questoes]);

  // Relógio: soma o tempo com a aba aberta; salva a cada 5 s; no zero, entrega.
  React.useEffect(() => {
    if (fim) return;
    let ultimo = Date.now();
    const id = window.setInterval(() => {
      const agora = Date.now();
      const delta = (agora - ultimo) / 1000;
      ultimo = agora;
      setAndamento((a) => ({ ...a, usadosSegundos: Math.min(a.duracaoSegundos, a.usadosSegundos + delta) }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [fim]);

  React.useEffect(() => {
    if (fim) return;
    if (restante <= 0) {
      void entregar();
      return;
    }
    if (Math.round(andamento.usadosSegundos) % 5 === 0) salvarAndamento(andamento);
  }, [andamento, restante, fim, entregar]);

  const mudar = React.useCallback((fn: (a: Andamento) => Andamento) => {
    setAndamento((a) => {
      const novo = fn(a);
      salvarAndamento(novo);
      return novo;
    });
  }, []);

  const n = questoes.length;
  const i = andamento.indice;
  const questao = questoes[i];
  const marcar = (letra: Letra) => mudar((a) => ({ ...a, escolhas: a.escolhas.map((x, k) => (k === a.indice ? letra : x)) }));
  const ir = (k: number) => mudar((a) => ({ ...a, indice: Math.max(0, Math.min(n - 1, k)) }));

  const letras = new Set(questao?.alternativas.map((a) => a.letra) ?? []);
  const ativo = !fim;
  useAtalho({ id: "marcar-A", combinacao: "a", descricao: "Marcar a alternativa A", grupo: "Questão", ativo: ativo && letras.has("A"), acao: () => marcar("A") });
  useAtalho({ id: "marcar-B", combinacao: "b", descricao: "Marcar a alternativa B", grupo: "Questão", ativo: ativo && letras.has("B"), acao: () => marcar("B") });
  useAtalho({ id: "marcar-C", combinacao: "c", descricao: "Marcar a alternativa C", grupo: "Questão", ativo: ativo && letras.has("C"), acao: () => marcar("C") });
  useAtalho({ id: "marcar-D", combinacao: "d", descricao: "Marcar a alternativa D", grupo: "Questão", ativo: ativo && letras.has("D"), acao: () => marcar("D") });
  useAtalho({ id: "marcar-E", combinacao: "e", descricao: "Marcar a alternativa E", grupo: "Questão", ativo: ativo && letras.has("E"), acao: () => marcar("E") });
  useAtalho({ id: "proxima", combinacao: "n", descricao: "Próxima questão", grupo: "Simulado", ativo, acao: () => ir(i + 1) });
  useAtalho({ id: "anterior", combinacao: "p", descricao: "Questão anterior", grupo: "Simulado", ativo, acao: () => ir(i - 1) });

  if (fim) {
    return <CorrecaoProva titulo={andamento.titulo} questoes={questoes} escolhas={fim.escolhas} correcao={fim.correcao} segundos={fim.segundos} aoSair={aoSair} />;
  }
  if (!questao) return null;

  const respondidas = andamento.escolhas.filter(Boolean).length;
  const pouco = restante <= 10 * 60;
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="prova-longa">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-rounded text-base font-extrabold">
          <Logo className="size-5" />
          <span className="hidden truncate sm:inline">{andamento.titulo}</span>
        </span>
        <span className="num shrink-0 text-muted-foreground" data-testid="progresso-simulado">
          {i + 1}/{n}
        </span>
        <Progress value={(respondidas / n) * 100} className="hidden max-w-40 md:block" aria-label={`${respondidas} de ${n} respondidas`} />
        <span className="hidden text-muted-foreground lg:inline">{SIGLA_AREA[questao.area]}</span>
        <span className="ml-auto flex items-center gap-2">
          <CaixaTempo className={cn(pouco && "bg-warning-soft text-warning-text")} aria-label="tempo restante da prova" data-testid="cronometro-prova">
            {formatarRelogio(restante)}
          </CaixaTempo>
          <Button variant="outline" size="sm" onClick={() => setFolhaAberta((v) => !v)} aria-expanded={folhaAberta} data-testid="abrir-folha">
            <LayoutGrid /> <span className="hidden sm:inline">Folha</span>
          </Button>
        </span>
      </header>
      {folhaAberta && (
        <FolhaRespostas
          questoes={questoes}
          escolhas={andamento.escolhas}
          atual={i}
          aoIr={(k) => {
            ir(k);
            setFolhaAberta(false);
          }}
        />
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <QuestaoView
          key={questao.id}
          questao={questao}
          marcada={andamento.escolhas[i] ?? null}
          confirmada={false}
          aoMarcar={marcar}
          aoConfirmar={() => ir(i + 1)}
          aoPular={() => ir(i + 1)}
          aoProxima={() => ir(i + 1)}
          ehUltima={i === n - 1}
          comResolucao={false}
          rodape={
            <>
              <Button variant="ghost" onClick={() => ir(i - 1)} disabled={i === 0} data-testid="anterior">
                <ArrowLeft /> Anterior
              </Button>
              <span className="num text-[13px] text-muted-foreground">
                {respondidas} de {n} marcadas
              </span>
              <span className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (respondidas < n && !window.confirm(`Ainda faltam ${n - respondidas} em branco (contam como erro). Entregar mesmo assim?`)) return;
                    void entregar();
                  }}
                  data-testid="entregar"
                >
                  Entregar
                </Button>
                {i < n - 1 && (
                  <Button onClick={() => ir(i + 1)} data-testid="proxima" className="px-6">
                    Próxima <ArrowRight />
                  </Button>
                )}
              </span>
            </>
          }
        />
      </div>
    </div>
  );
}

/** Folha de respostas: um quadradinho por questão, agrupado por área; clique para ir. */
function FolhaRespostas({ questoes, escolhas, atual, aoIr }: { questoes: Questao[]; escolhas: (Letra | null)[]; atual: number; aoIr: (k: number) => void }) {
  const areas = [...new Set(questoes.map((q) => q.area))];
  return (
    <div className="max-h-[45vh] shrink-0 overflow-y-auto border-b border-border bg-surface px-4 py-3" data-testid="folha-respostas">
      {areas.map((area) => (
        <div key={area} className="flex flex-col gap-1.5 pb-2">
          <p className="text-xs font-semibold text-muted-foreground">{NOME_AREA[area]}</p>
          <div className="flex flex-wrap gap-1">
            {questoes.map((q, k) =>
              q.area !== area ? null : (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => aoIr(k)}
                  aria-label={`Questão ${q.numero}${escolhas[k] ? `, marcada ${escolhas[k]}` : ", em branco"}`}
                  aria-current={k === atual ? "true" : undefined}
                  className={cn(
                    "num flex h-8 w-11 flex-col items-center justify-center rounded-sm border-[1.5px] text-[11px] leading-none font-bold",
                    escolhas[k] ? "border-accent bg-accent-soft text-accent-text" : "border-border text-muted-foreground",
                    k === atual && "ring-2 ring-ring ring-offset-1 ring-offset-surface",
                  )}
                >
                  <span>{q.numero}</span>
                  <span className="text-[10px]">{escolhas[k] ?? "·"}</span>
                </button>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Correção: acertos e nota TRI estimada por área, e a resolução de IA de cada questão (recolhida). */
export function CorrecaoProva({
  titulo,
  questoes,
  escolhas,
  correcao,
  segundos,
  aoSair,
}: {
  titulo: string;
  questoes: Questao[];
  escolhas: (Letra | null)[];
  correcao: CorrecaoArea[];
  segundos: number;
  aoSair: () => void;
}) {
  const total = correcao.reduce((s, c) => s + c.acertos, 0);
  return (
    <ConteudoPagina className="max-w-[860px] gap-4" data-testid="correcao-prova">
      <CabecalhoPagina
        titulo={`${total} de ${questoes.length}`}
        descricao={`${titulo} · tempo usado ${formatarRelogio(segundos)}. Questões em branco contam como erro, como no ENEM. Cada resposta já entrou no domínio da área.`}
      />
      <div className="grid gap-3.5 sm:grid-cols-2">
        {correcao.map((c) => (
          <Card key={c.area} data-testid={`correcao-${c.area}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {NOME_AREA[c.area]} <Badge variant="outline">estimativa</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-1">
              <p className="num text-3xl font-extrabold">
                {c.nota ? c.nota.nota : "—"}
                {c.nota && (
                  <span className="ml-2 text-base font-semibold text-muted-foreground">
                    ({c.nota.inferior}–{c.nota.superior})
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {c.acertos} de {c.total} acertos · {c.respondidas} respondidas{c.nota ? ` · ${c.nota.itens} itens com TRI` : " · sem itens com TRI"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Questões</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 divide-y divide-border">
          {questoes.map((q, i) => {
            const e = escolhas[i] ?? null;
            const acertou = !q.anulada && e === q.gabarito;
            return (
              <div key={q.id} className="flex flex-col gap-2 py-2.5" data-testid="resultado-simulado">
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white",
                      q.anulada ? "bg-muted-foreground" : acertou ? "bg-success" : "bg-danger",
                    )}
                    aria-label={q.anulada ? "anulada" : acertou ? "acertou" : "errou"}
                  >
                    {q.anulada ? <Minus className="size-4" /> : acertou ? <Check className="size-4" strokeWidth={2.5} /> : <X className="size-4" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    ENEM {q.ano} · Q{q.numero}
                    <span className="font-normal text-muted-foreground"> · {SIGLA_AREA[q.area]}</span>
                  </span>
                  <span className="num text-[13px] text-muted-foreground">
                    {e ? `marcou ${e}` : "em branco"} · gabarito {q.gabarito}
                  </span>
                </div>
                <Resolucao questao={q} className="pl-10" />
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
        <Button variant="ghost" onClick={aoSair}>
          Outro simulado
        </Button>
      </div>
    </ConteudoPagina>
  );
}
