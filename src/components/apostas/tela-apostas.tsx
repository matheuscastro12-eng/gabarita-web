"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, GraduationCap, Minus, Timer, X } from "lucide-react";
import type { Area, Letra, Questao } from "@/data/tipos";
import { AREAS, CREDITO_APOSTAS } from "@/data/tipos";
import { carregarApostas, contarPorArea, filtrarPorArea, NOME_AREA } from "@/data/apostas";
import { useStore } from "@/lib/store/provider";
import { useAtalho } from "@/lib/atalhos/provider";
import { resumirAluno } from "@/lib/tutor/prompt";
import { plural } from "@/lib/dominio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";
import { CaixaTempo, formatarTempo } from "@/components/estudo/barra-sprint";
import { IDE, type RespostaQuestao } from "@/components/estudo/ide";
import { QuestaoView } from "@/components/estudo/questao-view";
import { Resolucao } from "@/components/estudo/resolucao";
import { Logo } from "@/components/app/sidebar";
import { cn } from "@/lib/utils";
import { corrigirSimulado, SEGUNDOS_POR_QUESTAO_APOSTAS } from "./logica";

type Filtro = Area | "todas";

type Fase =
  | { tipo: "intro" }
  | { tipo: "treino"; questoes: Questao[]; indice: number; respostas: (RespostaQuestao | null)[] }
  | { tipo: "simulado"; questoes: Questao[]; indice: number; escolhas: (Letra | null)[]; inicio: number }
  | { tipo: "fim"; modo: "treino" | "simulado"; questoes: Questao[]; escolhas: (Letra | null)[]; segundos: number | null };

/** Rótulo obrigatório da coleção, com crédito ao autor. */
export function SeloApostas({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-text", className)} data-testid="credito-apostas">
      <GraduationCap className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong>{CREDITO_APOSTAS}.</strong> Material de Edcley Teixeira, com gabarito e resolução do autor. Não são questões do INEP: ficam fora da nota TRI, do domínio e do mapa.
      </span>
    </p>
  );
}

function useApostas() {
  const [questoes, setQuestoes] = React.useState<Questao[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  React.useEffect(() => {
    let vivo = true;
    carregarApostas()
      .then((q) => vivo && setQuestoes(q))
      .catch((e: unknown) => vivo && setErro(e instanceof Error ? e.message : "Não consegui carregar as apostas."));
    return () => {
      vivo = false;
    };
  }, []);
  return { questoes, erro };
}

/** Tela "Apostas 2026": escolha de matéria e modo (simulado ou treino). */
export function TelaApostas() {
  const { questoes, erro } = useApostas();
  const { estado } = useStore();
  const [filtro, setFiltro] = React.useState<Filtro>("todas");
  const [fase, setFase] = React.useState<Fase>({ tipo: "intro" });

  if (erro) {
    return (
      <ConteudoPagina className="justify-center">
        <EstadoVazio titulo="Não consegui carregar as apostas" descricao={erro} acao={<Button onClick={() => window.location.reload()}>Tentar de novo</Button>} />
      </ConteudoPagina>
    );
  }

  if (fase.tipo === "treino") {
    const contextoAluno = {
      resumo: estado ? resumirAluno(estado, null) : "",
      perfil: { nome: estado?.perfil.nome ?? "Matheus", explicaDoMeuJeito: estado?.perfil.explicaDoMeuJeito ?? "" },
    };
    return (
      <IDE
        questoes={fase.questoes}
        indice={fase.indice}
        respostas={fase.respostas}
        mostrarTimer={estado?.perfil.mostrarTimer ?? true}
        // Treino das apostas não grava tentativa nem evento: nada entra nas estatísticas oficiais.
        aoResponder={(r) => setFase((f) => (f.tipo === "treino" ? { ...f, respostas: f.respostas.map((x, i) => (i === f.indice ? r : x)) } : f))}
        aoAvancar={() =>
          setFase((f) => {
            if (f.tipo !== "treino") return f;
            if (f.indice + 1 < f.questoes.length) return { ...f, indice: f.indice + 1 };
            return { tipo: "fim", modo: "treino", questoes: f.questoes, escolhas: f.respostas.map((r) => r?.escolha ?? null), segundos: null };
          })
        }
        contextoAluno={contextoAluno}
        aoEvento={() => {}}
        aoResponderGemea={() => {}}
        rodape={<span className="text-[13px] text-muted-foreground">Apostas 2026 · treino (não conta no domínio nem na nota TRI)</span>}
      />
    );
  }

  if (fase.tipo === "simulado") {
    return (
      <SimuladoApostas
        fase={fase}
        aoMudar={(f) => setFase(f)}
        aoEncerrar={(escolhas) =>
          setFase({ tipo: "fim", modo: "simulado", questoes: fase.questoes, escolhas, segundos: Math.round((Date.now() - fase.inicio) / 1000) })
        }
      />
    );
  }

  if (fase.tipo === "fim") {
    return <FimApostas fase={fase} aoVoltar={() => setFase({ tipo: "intro" })} />;
  }

  const contagem = questoes ? contarPorArea(questoes) : null;
  const selecionadas = questoes ? filtrarPorArea(questoes, filtro) : [];
  const n = selecionadas.length;
  return (
    <ConteudoPagina className="max-w-[860px]">
      <CabecalhoPagina titulo="Apostas 2026" descricao="As 50 questões inéditas de Edcley Teixeira para o ENEM 2026, de todas as áreas." />
      <SeloApostas />
      <Card className="gap-5 md:p-6">
        <CardHeader>
          <CardTitle className="text-xl">Matéria</CardTitle>
          <CardDescription>Escolha tudo ou uma área. A ordem segue o material.</CardDescription>
        </CardHeader>
        <CardContent className="gap-5">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filtrar por matéria">
            {(["todas", ...AREAS] as const).map((a) => {
              const ativo = filtro === a;
              const qtd = contagem ? (a === "todas" ? questoes!.length : contagem[a]) : null;
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setFiltro(a)}
                  data-testid={`filtro-${a}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200",
                    ativo ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface hover:border-accent hover:text-accent-text",
                  )}
                >
                  {a === "todas" ? "Todas" : NOME_AREA[a]}
                  {qtd !== null && <span className={cn("num", ativo ? "text-white/85" : "text-muted-foreground")}>{qtd}</span>}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3.5 md:grid-cols-2">
            <ModoCard
              titulo="Simulado"
              descricao={`${plural(n, "questão", "questões")} seguidas, cronômetro de ${formatarTempo(n * SEGUNDOS_POR_QUESTAO_APOSTAS)} (3 min por questão) e correção só no fim, com a resolução de cada uma.`}
              acao={
                <Button
                  size="lg"
                  disabled={!questoes || n === 0}
                  onClick={() => setFase({ tipo: "simulado", questoes: selecionadas, indice: 0, escolhas: selecionadas.map(() => null), inicio: Date.now() })}
                  data-testid="apostas-simulado"
                >
                  <Timer /> Começar simulado
                </Button>
              }
            />
            <ModoCard
              titulo="Treino"
              descricao="Questão por questão, com o tutor ao lado. Ao confirmar você vê a correção e pode abrir a resolução do autor."
              acao={
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={!questoes || n === 0}
                  onClick={() => setFase({ tipo: "treino", questoes: selecionadas, indice: 0, respostas: selecionadas.map(() => null) })}
                  data-testid="apostas-treino"
                >
                  Começar treino
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
      <Button variant="outline" asChild className="self-start">
        <Link href="/">
          <ArrowLeft /> Voltar para Hoje
        </Link>
      </Button>
    </ConteudoPagina>
  );
}

function ModoCard({ titulo, descricao, acao }: { titulo: string; descricao: string; acao: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border-[1.5px] border-border p-4">
      <h3 className="text-base font-bold">{titulo}</h3>
      <p className="flex-1 text-sm text-muted-foreground">{descricao}</p>
      <div>{acao}</div>
    </div>
  );
}

/** Simulado: marca e confirma (vai para a próxima, sem correção); cronômetro total. */
function SimuladoApostas({
  fase,
  aoMudar,
  aoEncerrar,
}: {
  fase: Extract<Fase, { tipo: "simulado" }>;
  aoMudar: (f: Fase) => void;
  aoEncerrar: (escolhas: (Letra | null)[]) => void;
}) {
  const total = fase.questoes.length * SEGUNDOS_POR_QUESTAO_APOSTAS;
  const [agora, setAgora] = React.useState(() => Date.now());
  const [marcada, setMarcada] = React.useState<Letra | null>(fase.escolhas[fase.indice] ?? null);
  React.useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const passado = Math.round((agora - fase.inicio) / 1000);
  const restante = total - passado;

  const encerrarRef = React.useRef(aoEncerrar);
  React.useEffect(() => {
    encerrarRef.current = aoEncerrar;
  });
  React.useEffect(() => {
    if (restante <= 0) encerrarRef.current(fase.escolhas);
  }, [restante, fase.escolhas]);

  const questao = fase.questoes[fase.indice]!;
  const ehUltima = fase.indice === fase.questoes.length - 1;

  const ir = React.useCallback(
    (escolha: Letra | null) => {
      const escolhas = fase.escolhas.map((x, i) => (i === fase.indice ? escolha : x));
      if (ehUltima) {
        aoEncerrar(escolhas);
        return;
      }
      aoMudar({ ...fase, escolhas, indice: fase.indice + 1 });
      setMarcada(escolhas[fase.indice + 1] ?? null);
    },
    [fase, ehUltima, aoEncerrar, aoMudar],
  );

  const letras = new Set(questao.alternativas.map((a) => a.letra));
  useAtalho({ id: "marcar-A", combinacao: "a", descricao: "Marcar a alternativa A", grupo: "Questão", ativo: letras.has("A"), acao: () => setMarcada("A") });
  useAtalho({ id: "marcar-B", combinacao: "b", descricao: "Marcar a alternativa B", grupo: "Questão", ativo: letras.has("B"), acao: () => setMarcada("B") });
  useAtalho({ id: "marcar-C", combinacao: "c", descricao: "Marcar a alternativa C", grupo: "Questão", ativo: letras.has("C"), acao: () => setMarcada("C") });
  useAtalho({ id: "marcar-D", combinacao: "d", descricao: "Marcar a alternativa D", grupo: "Questão", ativo: letras.has("D"), acao: () => setMarcada("D") });
  useAtalho({ id: "marcar-E", combinacao: "e", descricao: "Marcar a alternativa E", grupo: "Questão", ativo: letras.has("E"), acao: () => setMarcada("E") });
  useAtalho({ id: "confirmar", combinacao: "enter", descricao: "Confirmar e ir para a próxima", grupo: "Questão", ativo: !!marcada, acao: () => ir(marcada) });

  const respondidas = fase.escolhas.filter(Boolean).length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-surface px-4 text-sm">
        <span className="flex items-center gap-2 font-rounded text-base font-extrabold">
          <Logo className="size-5" />
          <span className="hidden sm:inline">Apostas 2026</span>
        </span>
        <span className="num text-muted-foreground" data-testid="progresso-apostas">
          {fase.indice + 1}/{fase.questoes.length}
        </span>
        <Progress value={(respondidas / fase.questoes.length) * 100} className="hidden max-w-48 sm:block" aria-label="Respondidas" />
        <span className="ml-auto flex items-center gap-2">
          <CaixaTempo className={cn(restante <= 300 && "bg-warning-soft text-warning-text")} aria-label="tempo restante do simulado" data-testid="cronometro-apostas">
            {formatarTempo(Math.max(0, restante))}
          </CaixaTempo>
          <Button variant="ghost" size="sm" onClick={() => aoEncerrar(fase.escolhas.map((x, i) => (i === fase.indice ? (marcada ?? x) : x)))} data-testid="encerrar-apostas">
            Encerrar
          </Button>
        </span>
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <QuestaoView
          key={questao.id}
          questao={questao}
          marcada={marcada}
          confirmada={false}
          aoMarcar={setMarcada}
          aoConfirmar={() => ir(marcada)}
          aoPular={() => ir(null)}
          aoProxima={() => {}}
          ehUltima={ehUltima}
        />
      </div>
    </div>
  );
}

/** Correção no fim (simulado) ou resumo do treino, com a resolução de cada questão. */
function FimApostas({ fase, aoVoltar }: { fase: Extract<Fase, { tipo: "fim" }>; aoVoltar: () => void }) {
  const c = corrigirSimulado(fase.questoes, fase.escolhas);
  return (
    <ConteudoPagina className="max-w-[860px] gap-4">
      <CabecalhoPagina
        titulo={`${c.acertos} de ${c.total}`}
        descricao={fase.modo === "simulado" ? `Simulado das apostas${fase.segundos !== null ? ` em ${formatarTempo(fase.segundos)}` : ""}. Abra a resolução de cada questão abaixo.` : "Treino das apostas concluído."}
      />
      <SeloApostas />
      <div className="flex flex-wrap gap-2">
        {AREAS.filter((a) => c.porArea[a].total > 0).map((a) => (
          <Badge key={a} variant="outline">
            {NOME_AREA[a]}: <span className="num">{c.porArea[a].acertos}/{c.porArea[a].total}</span>
          </Badge>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Correção</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 divide-y divide-border">
          {fase.questoes.map((q, i) => {
            const escolha = fase.escolhas[i] ?? null;
            const acertou = escolha === q.gabarito;
            return (
              <div key={q.id} className="flex flex-col gap-2 py-3" data-testid="correcao-aposta">
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white", acertou ? "bg-success" : escolha ? "bg-danger" : "bg-muted-foreground")}
                    aria-label={acertou ? "acertou" : escolha ? "errou" : "em branco"}
                  >
                    {acertou ? <Check className="size-4" strokeWidth={2.5} /> : escolha ? <X className="size-4" strokeWidth={2.5} /> : <Minus className="size-4" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    Q{String(q.numero).padStart(2, "0")} <span className="font-normal text-muted-foreground">· {NOME_AREA[q.area]} · {q.resolucao_autor?.topico}</span>
                  </span>
                  <span className="num text-[13px] text-muted-foreground">
                    {escolha ? `marcou ${escolha}` : "em branco"} · gabarito {q.gabarito}
                  </span>
                </div>
                <Resolucao questao={q} className="pl-10" />
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={aoVoltar}>
          Voltar às apostas
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Hoje</Link>
        </Button>
      </div>
    </ConteudoPagina>
  );
}
