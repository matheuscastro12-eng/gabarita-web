"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, ChevronRight, Circle, RotateCcw, Target, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store/provider";
import { useQuestoes } from "@/data/use-questoes";
import { NOME_AREA, NOME_HABILIDADE, rotuloHabilidade, SIGLA_AREA } from "@/data/tipos";
import { useEstadoArea, useVersao } from "@/components/app/versao";
import type { EstadoAluno, Tentativa } from "@/lib/dominio/tipos";
import {
  dataLocal,
  descreverPrazo,
  diasAteProva,
  formatarDecimal,
  montarFilaDasAreas,
  MS_POR_DIA,
  notaDaArea,
  resumoDoDia,
  simuladoValeParaFaceis,
  plural,
} from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { Esqueleto } from "@/components/ui/esqueleto";
import { Contador } from "@/components/ui/contador";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { useAtalho } from "@/lib/atalhos/provider";
import { cn } from "@/lib/utils";

function saudacao(agora: Date, nome: string): string {
  const h = agora.getHours();
  const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${periodo}, ${nome}.`;
}

const INICIAIS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Tentativas por dia nos últimos 7 dias (hoje por último). */
function contarPorDia(tentativas: Tentativa[], agora: Date): { rotulo: string; chave: string; n: number }[] {
  const dias = Array.from({ length: 7 }, (_, i) => new Date(agora.getTime() - (6 - i) * MS_POR_DIA));
  const porChave = new Map<string, number>();
  for (const t of tentativas) {
    const chave = dataLocal(new Date(t.em));
    porChave.set(chave, (porChave.get(chave) ?? 0) + 1);
  }
  return dias.map((d) => {
    const chave = dataLocal(d);
    return { rotulo: INICIAIS_SEMANA[d.getDay()] ?? "", chave, n: porChave.get(chave) ?? 0 };
  });
}

/** Tela inicial no estilo do Dashboard original: stat cards, sprint, plano de hoje, questões por dia e domínio. */
export function TelaHoje() {
  const { erro: erroStore } = useStore();
  const estado = useEstadoArea();
  const { versao, areas } = useVersao();
  const comArea = areas.length > 1;
  const { questoes, erro: erroQuestoes } = useQuestoes();
  const router = useRouter();
  // Só existe depois que o estado chega do IndexedDB (nunca durante o prerender).
  const agora = React.useMemo(() => (estado ? new Date() : null), [estado]);

  useAtalho({
    id: "comecar",
    combinacao: "enter",
    descricao: "Começar um sprint",
    grupo: "Sprint",
    acao: () => router.push("/estudar"),
  });

  const resumo = estado && agora ? resumoDoDia(estado, agora) : null;

  const fila = React.useMemo(() => {
    if (!estado || !questoes || !agora) return null;
    return montarFilaDasAreas({ questoes, estado, agora, areas });
  }, [estado, questoes, agora, areas]);

  const nota = React.useMemo(() => {
    if (!estado || !questoes) return null;
    const porId = new Map(questoes.map((q) => [q.id, q]));
    return areas.map((a) => ({ area: a, nota: notaDaArea(estado, porId, a) }));
  }, [estado, questoes, areas]);

  const porDia = React.useMemo(() => (estado && agora ? contarPorDia(estado.tentativas, agora) : null), [estado, agora]);
  const dias = estado && agora ? diasAteProva(estado.perfil.dataProva, agora) : null;
  const erro = erroStore ?? erroQuestoes;

  return (
    <ConteudoPagina className="gap-3.5">
      <CabecalhoPagina titulo={estado && agora ? saudacao(agora, estado.perfil.nome) : "Hoje"} className="mb-1" />

      {erro && (
        <div role="alert" className="rounded-lg border-[1.5px] border-danger/30 bg-danger-soft px-4 py-3 text-sm">
          <p className="font-semibold text-danger-text">Não consegui carregar seus dados.</p>
          <p className="text-muted-foreground">{erro}</p>
        </div>
      )}

      {/* Linha de stat cards: o primeiro é o hero em gradiente azul. */}
      <div className="entrada-stagger grid grid-cols-2 gap-3.5 lg:grid-cols-4" data-testid="stat-cards">
        <Stat
          hero
          titulo="Dias até a prova"
          Icone={Calendar}
          valor={estado ? (dias === null ? "—" : dias < 0 ? "0" : String(dias)) : null}
          detalhe={
            estado
              ? dias === null
                ? "Defina a data da prova nos Ajustes"
                : `${dias > 1 ? `Faltam ${dias} dias` : dias >= 0 ? `A prova ${descreverPrazo(dias)}` : `A prova ${descreverPrazo(dias)}`} · meta ${estado.perfil.metaNota}`
              : ""
          }
        />
        <Stat
          titulo="Resolvidas hoje"
          Icone={CheckCircle2}
          valor={resumo ? String(resumo.tentativasHoje) : null}
          detalhe={resumo ? (resumo.tentativasHoje > 0 ? `${resumo.acertosHoje} acertos · ${plural(resumo.sprintsHoje, "sprint", "sprints")}` : "meta: 1 sprint de 5") : ""}
        />
        <Stat
          titulo={comArea ? "Nota estimada · CN e MT" : `Nota estimada · ${SIGLA_AREA[areas[0]!]}`}
          Icone={Target}
          valor={nota ? (comArea ? nota.map((n) => (n.nota.itens > 0 ? String(n.nota.nota) : "—")).join(" · ") : nota[0]!.nota.itens > 0 ? String(nota[0]!.nota.nota) : "—") : null}
          detalhe={
            nota
              ? comArea
                ? nota.map((n) => `${SIGLA_AREA[n.area]} ${n.nota.itens > 0 ? `${n.nota.inferior}–${n.nota.superior}` : "sem dados"}`).join(" · ") + " · estimativa"
                : nota[0]!.nota.itens > 0
                  ? `${nota[0]!.nota.inferior}–${nota[0]!.nota.superior} · estimativa`
                  : "aparece após a 1ª questão com TRI"
              : ""
          }
        />
        <Stat
          titulo="Revisões vencidas"
          Icone={RotateCcw}
          valor={resumo ? String(resumo.habilidadesVencidas.length) : null}
          detalhe={resumo ? (resumo.habilidadesVencidas.length > 0 ? resumo.habilidadesVencidas.map((h) => rotuloHabilidade(h, comArea)).join(", ") : "retenção prevista acima de 90%") : ""}
        />
      </div>

      <div className="entrada-stagger grid gap-3.5 lg:grid-cols-4">
        <Card className="gap-4 lg:col-span-2" data-testid="card-sprint">
          <CardHeader>
            <CardTitle>{versao === "geral" ? "Treino misto de 5 questões" : `Sprint de 5 questões de ${NOME_AREA[areas[0]!].toLowerCase()}`}</CardTitle>
            <CardDescription>
              {fila === null ? (
                <span className="sr-only">Montando a fila…</span>
              ) : fila.length === 0 ? (
                "Nenhuma questão disponível agora. Volte amanhã ou importe o banco."
              ) : (
                `Próximas: ${plural(fila.length, "questão oficial", "questões oficiais")} em ${plural(new Set(fila.map((q) => q.habilidade)).size, "habilidade", "habilidades")}, fáceis primeiro. Uns 12 minutos, com as suas revisões no meio.`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {/* As 5 próximas como chips: o ritmo do sprint já aparece aqui. */}
            <ol className="flex flex-wrap gap-2" aria-label="Fila do sprint">
              {(fila ?? Array.from({ length: 5 }, () => null)).slice(0, 5).map((q, i) => (
                <li
                  key={q?.id ?? i}
                  className="flex items-center gap-2 rounded-full border-[1.5px] border-border bg-surface py-1.5 pr-2 pl-3 text-[13px] font-semibold"
                  title={q?.habilidade ? NOME_HABILIDADE[q.habilidade] : undefined}
                >
                  {q ? (
                    <>
                      <span className="num">{q.habilidade ? rotuloHabilidade(q.habilidade, comArea) : `${SIGLA_AREA[q.area]} —`}</span>
                      {q.habilidade && <span className="hidden max-w-28 truncate font-medium text-muted-foreground md:inline">{NOME_HABILIDADE[q.habilidade]}</span>}
                      <Badge
                        variant={q.tri ? (q.dificuldade_estimada === "facil" ? "success" : q.dificuldade_estimada === "dificil" ? "danger" : "warning") : "neutral"}
                        className="rounded-full px-2 py-0 text-[11px]"
                      >
                        {q.tri ? (q.dificuldade_estimada === "facil" ? "fácil" : q.dificuldade_estimada === "dificil" ? "difícil" : "média") : "sem TRI"}
                      </Badge>
                    </>
                  ) : (
                    <Esqueleto className="h-4 w-20" />
                  )}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild data-testid="comecar">
                <Link href="/estudar">
                  Começar
                  <Kbd className="border-white/40 bg-transparent text-white">Enter</Kbd>
                </Link>
              </Button>
              {resumo && resumo.sprintsHoje > 0 && (
                <span className="text-sm text-muted-foreground">
                  Hoje: {plural(resumo.sprintsHoje, "sprint", "sprints")}, {resumo.acertosHoje}/{resumo.tentativasHoje} acertos.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <PlanoDeHoje estado={estado} resumo={resumo} dias={dias} />
      </div>

      <Card data-testid="card-apostas">
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[19px] font-bold">Apostas 2026</h2>
              <Badge variant="warning">não oficial</Badge>
              <Badge>50 questões · 4 áreas</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Apostas do curso Edcley Teixeira (questões inéditas, não oficiais), com a resolução do autor. Simulado com cronômetro ou treino com o tutor; não contam na nota TRI nem no domínio.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/apostas" data-testid="abrir-apostas">
              Abrir apostas <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="entrada-stagger grid gap-3.5 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Questões por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoSemana dados={porDia} />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="inline-block size-1.5 rounded-full bg-accent" /> meta 5/dia (um sprint)
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-dominio">
          <CardHeader>
            <CardTitle>Domínio por habilidade</CardTitle>
            <CardDescription>As que mais precisam de atenção (de 0 a 1).</CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            {estado === null ? (
              <Esqueleto className="h-24 w-full" />
            ) : Object.keys(estado.habilidades).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aparece depois do primeiro sprint.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {Object.values(estado.habilidades)
                  .sort((a, b) => a.dominio - b.dominio)
                  .slice(0, 6)
                  .map((h) => (
                    <li key={h.habilidade} className="flex items-center gap-2.5 text-[13px]" title={NOME_HABILIDADE[h.habilidade]}>
                      <span className={cn("num shrink-0 font-semibold", comArea ? "w-14" : "w-9")}>{rotuloHabilidade(h.habilidade, comArea)}</span>
                      <Progress value={h.dominio * 100} aria-label={`Domínio em ${rotuloHabilidade(h.habilidade, true)}`} />
                      <span className="num w-9 shrink-0 text-right font-bold">{formatarDecimal(h.dominio, 2)}</span>
                    </li>
                  ))}
              </ul>
            )}
            <Link href="/mapa" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-text hover:underline">
              Ver o mapa completo <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </ConteudoPagina>
  );
}

/** Stat card do original: título pequeno com ícone, número grande em fonte arredondada, detalhe. */
function Stat({ hero = false, titulo, Icone, valor, detalhe }: { hero?: boolean; titulo: string; Icone: LucideIcon; valor: string | null; detalhe: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[104px] flex-col rounded-xl p-4 md:min-h-32 md:p-4.5",
        hero ? "hero-azul" : "border border-card-borda bg-surface shadow-card",
      )}
      data-testid="stat"
    >
      <div className={cn("flex items-center justify-between gap-2 text-[13px] font-semibold", hero ? "text-white/90" : "text-foreground")}>
        <span>{titulo}</span>
        <Icone className={cn("size-4 shrink-0", hero ? "text-white/85" : "text-muted-foreground")} strokeWidth={1.8} aria-hidden />
      </div>
      {valor === null ? (
        <Esqueleto className={cn("mt-auto h-9 w-16", hero && "bg-white/25")} />
      ) : (
        <p className={cn("num mt-auto text-[30px] leading-none font-extrabold md:text-3xl", hero ? "text-white" : "text-foreground")}>
          <Contador valor={valor} />
        </p>
      )}
      <p className={cn("mt-1.5 line-clamp-2 text-[11.5px] leading-snug", hero ? "text-white/85" : "text-muted-foreground")} title={detalhe}>
        {detalhe || " "}
      </p>
    </div>
  );
}

/** Gráfico de barras dos últimos 7 dias (sem biblioteca; só divs). */
function GraficoSemana({ dados }: { dados: { rotulo: string; chave: string; n: number }[] | null }) {
  const max = Math.max(5, ...(dados ?? []).map((d) => d.n));
  const vazio = dados !== null && dados.every((d) => d.n === 0);
  return (
    <div className="relative">
    {vazio && (
      <p className="absolute inset-x-0 top-6 text-center text-sm text-muted-foreground">Nenhuma questão nos últimos 7 dias. O primeiro sprint aparece aqui.</p>
    )}
    <div className="flex h-[150px] items-end gap-2.5" role="img" aria-label={dados ? `Questões por dia: ${dados.map((d) => d.n).join(", ")}` : "Carregando"}>
      {(dados ?? Array.from({ length: 7 }, (_, i) => ({ rotulo: "", chave: String(i), n: 0 }))).map((d) => (
        <div key={d.chave} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          {d.n > 0 && <span className="num text-[10px] font-semibold text-muted-foreground">{d.n}</span>}
          <div
            className={cn("w-full origin-bottom rounded-[7px]", d.n > 0 ? "anim-barra bg-accent" : "bg-accent-soft dark:bg-surface-2")}
            style={{ height: d.n > 0 ? `${Math.max(6, (d.n / max) * 110)}px` : "6px" }}
          />
          <span className="text-[10px] text-muted-foreground">{d.rotulo || " "}</span>
        </div>
      ))}
    </div>
    </div>
  );
}

interface ItemPlano {
  chave: string;
  feito: boolean;
  texto: string;
  href: string;
}

/** Checklist "Plano de hoje" do original: feito riscado em verde, pendente com seta. */
function PlanoDeHoje({
  estado,
  resumo,
  dias,
}: {
  estado: EstadoAluno | null;
  resumo: ReturnType<typeof resumoDoDia> | null;
  dias: number | null;
}) {
  const itens: ItemPlano[] | null =
    estado && resumo
      ? (() => {
          const abertos = estado.caderno.filter((e) => e.resolvidaEm === null).length;
          const simuladoOk = estado.simulados.some(simuladoValeParaFaceis);
          return [
            {
              chave: "sprint",
              feito: resumo.sprintsHoje > 0,
              texto: resumo.sprintsHoje > 0 ? `${plural(resumo.sprintsHoje, "sprint feito", "sprints feitos")} hoje` : "Fazer um sprint de 5 questões",
              href: "/estudar",
            },
            {
              chave: "revisoes",
              feito: resumo.habilidadesVencidas.length === 0,
              texto: resumo.habilidadesVencidas.length === 0 ? "Revisões em dia" : `Revisar ${plural(resumo.habilidadesVencidas.length, "habilidade vencida", "habilidades vencidas")}`,
              href: "/estudar",
            },
            {
              chave: "caderno",
              feito: abertos === 0,
              texto: abertos === 0 ? "Caderno sem erros abertos" : `Refazer ${plural(abertos, "erro aberto", "erros abertos")} do caderno`,
              href: "/caderno",
            },
            {
              chave: "simulado",
              feito: simuladoOk,
              texto: simuladoOk ? "Simulado de 15 fáceis cumprido" : "Simulado de 15 fáceis inéditos",
              href: "/simulado",
            },
          ];
        })()
      : null;

  return (
    <Card className="gap-3 lg:col-span-2" data-testid="plano-hoje">
      <CardHeader>
        <CardTitle>Plano de hoje</CardTitle>
      </CardHeader>
      <CardContent className="gap-0">
        {itens === null ? (
          <div className="flex flex-col gap-2 py-1">
            <Esqueleto className="h-4 w-40" />
            <Esqueleto className="h-4 w-48" />
            <Esqueleto className="h-4 w-36" />
          </div>
        ) : (
          <ul className="flex flex-col">
            {itens.map((it) =>
              it.feito ? (
                <li key={it.chave} className="flex items-center gap-2.5 px-1 py-1.75 text-[13px] font-medium text-muted-foreground line-through">
                  <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={1.8} aria-hidden />
                  <span>{it.texto}</span>
                </li>
              ) : (
                <li key={it.chave}>
                  <Link href={it.href} className="flex items-center gap-2.5 rounded-[10px] px-1 py-1.75 text-[13px] font-medium hover:bg-background dark:hover:bg-surface-2">
                    <Circle className="size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                    <span className="min-w-0 flex-1">{it.texto}</span>
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ),
            )}
          </ul>
        )}
        {estado && (
          <p className={cn("pt-3 text-[13px] font-semibold", dias !== null && dias >= 0 && dias <= 30 ? "text-warning-text" : "text-muted-foreground")}>
            {dias === null ? (
              <>
                Sem data da prova.{" "}
                <Link href="/ajustes" className="text-accent-text underline-offset-4 hover:underline">
                  Definir nos Ajustes
                </Link>
                .
              </>
            ) : dias < 0 ? (
              `A prova ${descreverPrazo(dias)}.`
            ) : dias <= 30 ? (
              `Reta final: ${descreverPrazo(dias)} para a prova`
            ) : (
              `A prova ${descreverPrazo(dias)}.`
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
