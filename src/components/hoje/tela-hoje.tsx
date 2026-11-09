"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store/provider";
import { useQuestoes } from "@/data/use-questoes";
import { NOME_HABILIDADE } from "@/data/tipos";
import type { EstadoAluno, Tentativa } from "@/lib/dominio/tipos";
import {
  dataLocal,
  descreverPrazo,
  diasAteProva,
  estimarTheta,
  formatarDecimal,
  limiarFacil,
  montarFila,
  MS_POR_DIA,
  notaEstimada,
  respostasTRI,
  resumoDoDia,
  simuladoValeParaFaceis,
  plural,
} from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Bolha } from "@/components/ui/bolha";
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

/** Hoje, "uma coisa por vez": o sprint na primeira dobra, números em faixa, plano ao lado; gráfico e domínio abaixo. */
export function TelaHoje() {
  const { estado, erro: erroStore } = useStore();
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
    const bs = questoes.flatMap((q) => (q.tri ? [q.tri.b] : []));
    return montarFila({ questoes, estado, agora, limiarFacil: limiarFacil(bs), theta: null });
  }, [estado, questoes, agora]);

  const nota = React.useMemo(() => {
    if (!estado || !questoes) return null;
    const porId = new Map(questoes.map((q) => [q.id, q]));
    const respostas = respostasTRI(estado.tentativas, porId);
    const { theta, erroPadrao, itens } = estimarTheta(respostas);
    return notaEstimada(theta, erroPadrao, itens);
  }, [estado, questoes]);

  const porDia = React.useMemo(() => (estado && agora ? contarPorDia(estado.tentativas, agora) : null), [estado, agora]);
  const dias = estado && agora ? diasAteProva(estado.perfil.dataProva, agora) : null;
  const erro = erroStore ?? erroQuestoes;

  return (
    <ConteudoPagina className="gap-0">
      <CabecalhoPagina titulo={estado && agora ? saudacao(agora, estado.perfil.nome) : "Hoje"} className="mb-4" />

      {erro && (
        <div role="alert" className="mb-6 rounded-md bg-erro-suave p-3 text-sm text-erro">
          <p className="font-medium">Não consegui carregar seus dados.</p>
          <p>{erro}</p>
        </div>
      )}

      <div className="entrada-stagger grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-0 lg:divide-x lg:divide-border">
        <div className="min-w-0 lg:pr-8">
          <section className="flex flex-col gap-5" data-testid="card-sprint">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">Sprint de 5 questões</h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {fila === null ? (
                  <span className="sr-only">Montando a fila…</span>
                ) : fila.length === 0 ? (
                  "Nenhuma questão disponível agora. Volte amanhã ou importe o banco."
                ) : (
                  `Próximas: ${plural(fila.length, "questão oficial", "questões oficiais")} em ${plural(new Set(fila.map((q) => q.habilidade)).size, "habilidade", "habilidades")}, fáceis primeiro. Uns 12 minutos, com as suas revisões no meio.`
                )}
              </p>
            </div>

            {/* A fila como fileira de bolhas numeradas ligadas por uma linha. */}
            {(fila === null || fila.length > 0) && (
              <div className="relative">
                <span aria-hidden className="absolute inset-x-[10%] top-4 h-px bg-border sm:top-5" />
                <ol className="relative grid grid-cols-5" aria-label="Fila do sprint">
                  {(fila ?? Array.from({ length: 5 }, () => null)).slice(0, 5).map((q, i) => (
                    <li
                      key={q?.id ?? i}
                      className="flex min-w-0 flex-col items-center gap-1 px-1 text-center"
                      title={q?.habilidade ? NOME_HABILIDADE[q.habilidade] : undefined}
                    >
                      <Bolha tamanho="md" className="size-8 text-sm sm:size-10">
                        {i + 1}
                      </Bolha>
                      {q ? (
                        <>
                          <span className="num mt-1 text-xs">{q.habilidade ?? "—"}</span>
                          {q.habilidade && (
                            <span className="hidden text-xs text-muted-foreground sm:block">
                              <span className="line-clamp-2">{NOME_HABILIDADE[q.habilidade]}</span>
                            </span>
                          )}
                          <span className={cn("text-xs", corDificuldade(q))}>{rotuloDificuldade(q)}</span>
                        </>
                      ) : (
                        <>
                          <Esqueleto className="mt-1 h-4 w-8" />
                          <Esqueleto className="h-4 w-10" />
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button size="lg" asChild data-testid="comecar" className="w-full sm:w-auto">
                <Link href="/estudar">
                  Começar
                  <Kbd className="border-primary-foreground/40 bg-transparent text-primary-foreground">Enter</Kbd>
                </Link>
              </Button>
              {resumo && resumo.sprintsHoje > 0 && (
                <span className="text-sm text-muted-foreground">
                  Hoje: {plural(resumo.sprintsHoje, "sprint", "sprints")}, {resumo.acertosHoje}/{resumo.tentativasHoje} acertos.
                </span>
              )}
            </div>
          </section>

          {/* Os quatro números: uma faixa só, sem caixa. */}
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-4" data-testid="stat-cards">
            <Stat
              titulo="Dias até a prova"
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
              valor={resumo ? String(resumo.tentativasHoje) : null}
              detalhe={resumo ? (resumo.tentativasHoje > 0 ? `${resumo.acertosHoje} acertos · ${plural(resumo.sprintsHoje, "sprint", "sprints")}` : "meta: 1 sprint de 5") : ""}
            />
            <Stat
              titulo="Nota estimada"
              valor={nota ? (nota.itens > 0 ? String(nota.nota) : "—") : null}
              detalhe={nota ? (nota.itens > 0 ? `${nota.inferior}–${nota.superior} · estimativa` : "aparece após a 1ª questão com TRI") : ""}
            />
            <Stat
              titulo="Revisões vencidas"
              valor={resumo ? String(resumo.habilidadesVencidas.length) : null}
              detalhe={resumo ? (resumo.habilidadesVencidas.length > 0 ? resumo.habilidadesVencidas.join(", ") : "retenção prevista acima de 90%") : ""}
            />
          </div>
        </div>

        <div className="min-w-0 border-t border-border pt-6 lg:border-t-0 lg:pt-0 lg:pl-8">
          <PlanoDeHoje estado={estado} resumo={resumo} dias={dias} />
        </div>
      </div>

      <div className="entrada-stagger mt-8 grid gap-8 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-0 lg:divide-x lg:divide-border">
        <section className="flex min-w-0 flex-col gap-4 lg:pr-8">
          <h2 className="text-base font-semibold">Questões por dia</h2>
          <GraficoSemana dados={porDia} />
        </section>

        <section className="flex min-w-0 flex-col gap-3 border-t border-border pt-6 lg:border-t-0 lg:pt-0 lg:pl-8" data-testid="card-dominio">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Domínio por habilidade</h2>
            <p className="text-sm text-muted-foreground">As que mais precisam de atenção (de 0 a 1).</p>
          </div>
          {estado === null ? (
            <div className="flex flex-col">
              {Array.from({ length: 4 }, (_, i) => (
                <Esqueleto key={i} className="my-1.5 h-4 w-full" />
              ))}
            </div>
          ) : Object.keys(estado.habilidades).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aparece depois do primeiro sprint.</p>
          ) : (
            <ul className="flex flex-col">
              {Object.values(estado.habilidades)
                .sort((a, b) => a.dominio - b.dominio)
                .slice(0, 6)
                .map((h) => (
                  <li key={h.habilidade} className="flex h-7 items-center gap-3 text-sm" title={NOME_HABILIDADE[h.habilidade]}>
                    <span className="num w-10 shrink-0">{h.habilidade}</span>
                    <Progress value={h.dominio * 100} aria-label={`Domínio em ${h.habilidade}`} />
                    <span className="num w-10 shrink-0 text-right">{formatarDecimal(h.dominio, 2)}</span>
                  </li>
                ))}
            </ul>
          )}
          <Link href="/mapa" className="inline-flex items-center gap-1 self-start text-sm font-medium text-primaria-texto hover:underline">
            Ver o mapa completo <ArrowRight className="size-4" strokeWidth={1.5} />
          </Link>
        </section>
      </div>
    </ConteudoPagina>
  );
}

type ItemFila = NonNullable<ReturnType<typeof montarFila>>[number];

function rotuloDificuldade(q: ItemFila): string {
  return q.tri ? (q.dificuldade_estimada === "facil" ? "fácil" : q.dificuldade_estimada === "dificil" ? "difícil" : "média") : "sem TRI";
}

function corDificuldade(q: ItemFila): string {
  return q.tri ? (q.dificuldade_estimada === "facil" ? "text-sucesso" : q.dificuldade_estimada === "dificil" ? "text-erro" : "text-aviso") : "text-muted-foreground";
}

/** Um dos quatro números: rótulo, valor em mono, detalhe. Sem caixa. */
function Stat({ titulo, valor, detalhe }: { titulo: string; valor: string | null; detalhe: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1" data-testid="stat">
      <span className="text-xs text-muted-foreground">{titulo}</span>
      {valor === null ? (
        <Esqueleto className="h-8 w-16" />
      ) : (
        <p className="num text-2xl leading-8 font-medium">
          <Contador valor={valor} />
        </p>
      )}
      <p className="line-clamp-2 text-xs text-muted-foreground" title={detalhe}>
        {detalhe || " "}
      </p>
    </div>
  );
}

/** Gráfico de barras dos últimos 7 dias (sem biblioteca; só divs). Meta tracejada em 5. */
function GraficoSemana({ dados }: { dados: { rotulo: string; chave: string; n: number }[] | null }) {
  const max = Math.max(5, ...(dados ?? []).map((d) => d.n));
  const vazio = dados !== null && dados.every((d) => d.n === 0);
  const ALTURA = 88; // px úteis da barra dentro dos 120px do gráfico
  const alturaMeta = (5 / max) * ALTURA;
  const ultimo = (dados?.length ?? 7) - 1;
  return (
    <div className="relative">
      {vazio && (
        <p className="absolute inset-x-0 top-4 z-10 text-center text-sm text-muted-foreground">Nenhuma questão nos últimos 7 dias. O primeiro sprint aparece aqui.</p>
      )}
      <div className="relative h-[120px]">
        <div aria-hidden className="absolute inset-x-0 border-t border-dashed border-input" style={{ bottom: `${alturaMeta + 20}px` }}>
          <span className="absolute -top-5 left-0 text-xs text-muted-foreground">meta 5/dia (um sprint)</span>
        </div>
        <div className="flex h-full items-end justify-around gap-2" role="img" aria-label={dados ? `Questões por dia: ${dados.map((d) => d.n).join(", ")}` : "Carregando"}>
          {(dados ?? Array.from({ length: 7 }, (_, i) => ({ rotulo: "", chave: String(i), n: 0 }))).map((d, i) => (
            <div key={d.chave} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              {d.n > 0 && <span className="num text-xs text-muted-foreground">{d.n}</span>}
              <div
                className={cn("w-4 origin-bottom rounded-[3px]", i === ultimo && d.n > 0 ? "bg-primary" : "bg-muted-forte", d.n > 0 && "anim-barra")}
                style={{ height: d.n > 0 ? `${Math.max(4, (d.n / max) * ALTURA)}px` : "4px" }}
              />
              <span className={cn("h-4 text-xs leading-4", i === ultimo ? "font-medium text-primaria-texto" : "text-muted-foreground")}>{d.rotulo || " "}</span>
            </div>
          ))}
        </div>
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
    <section className="flex flex-col gap-3" data-testid="plano-hoje">
      <h2 className="text-base font-semibold">Plano de hoje</h2>
      {itens === null ? (
        <ul className="flex flex-col" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex min-h-11 items-center gap-3 border-b border-border">
              <Esqueleto className="size-5 rounded-full" />
              <Esqueleto className="h-4 w-44" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col">
          {itens.map((it) =>
            it.feito ? (
              <li key={it.chave} className="flex min-h-11 items-center gap-3 border-b border-border text-sm text-muted-foreground">
                <Bolha tamanho="sm" estado="feita">
                  <Check strokeWidth={2} />
                </Bolha>
                <span className="min-w-0">{it.texto}</span>
              </li>
            ) : (
              <li key={it.chave} className="border-b border-border">
                <Link href={it.href} className="flex min-h-11 items-center gap-3 text-sm transition-colors hover:bg-muted">
                  <Bolha tamanho="sm" estado="vazia" />
                  <span className="min-w-0 flex-1">{it.texto}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
      {estado && (
        <p className={cn("text-sm", dias !== null && dias >= 0 && dias <= 30 ? "text-aviso" : "text-muted-foreground")}>
          {dias === null ? (
            <>
              Sem data da prova.{" "}
              <Link href="/ajustes" className="text-primaria-texto underline-offset-4 hover:underline">
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
    </section>
  );
}
