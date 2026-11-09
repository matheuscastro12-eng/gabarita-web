"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleDashed, RotateCcw, Timer } from "lucide-react";
import { useStore } from "@/lib/store/provider";
import { useQuestoes } from "@/data/use-questoes";
import { exibirHabilidade, NOME_AREA, rotuloHabilidade, SIGLA_AREA, type Area } from "@/data/tipos";
import { useEstadoArea, useVersao } from "@/components/app/versao";
import {
  agruparPorCompetencia,
  dominioPorAssunto,
  estimarTheta,
  formatarDecimal,
  limiarFacil,
  mapaHabilidades,
  montarSimuladoFaceis,
  nivelCalor,
  notaEstimada,
  plural,
  prontoFaceis,
  prontoProva,
  respostasTRI,
  simuladoValeParaFaceis,
  TAMANHO_SIMULADO_FACEIS,
  type CelulaMapa,
} from "@/lib/dominio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { cn } from "@/lib/utils";

/** Tela Mapa: um mapa por área da versão (no Geral, natureza e matemática, em seções). */
export function TelaMapa() {
  const { areas } = useVersao();
  const varias = areas.length > 1;
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Mapa"
        descricao={
          varias
            ? "Domínio por habilidade da matriz de cada área, nota estimada pela TRI (separada por área) e o que ainda falta para estar pronto."
            : "Domínio por habilidade (H1 a H30), nota estimada pela TRI e o que ainda falta para estar pronto."
        }
        acoes={
          <Button asChild data-testid="ir-simulado">
            <Link href="/simulado">
              <Timer /> Simulados
            </Link>
          </Button>
        }
      />
      {areas.map((a) => (
        <MapaDaArea key={a} area={a} comTitulo={varias} />
      ))}
    </ConteudoPagina>
  );
}

/** Calor H1–H30 por competência (e por assunto, em matemática), nota TRI estimada e os três níveis de "pronto". */
function MapaDaArea({ area, comTitulo }: { area: Area; comTitulo: boolean }) {
  const { erro: erroStore } = useStore();
  const estado = useEstadoArea([area]);
  const { questoes, porId, erro: erroQuestoes } = useQuestoes([area]);
  const agora = React.useMemo(() => (estado ? new Date() : null), [estado]);
  const [selecionada, setSelecionada] = React.useState<string>(area === "natureza" ? "CN-H17" : "H24");

  const celulas = React.useMemo(() => (estado && agora ? mapaHabilidades(estado, agora, area) : null), [estado, agora, area]);
  const grupos = React.useMemo(() => (celulas ? agruparPorCompetencia(celulas, area) : null), [celulas, area]);
  const assuntos = React.useMemo(
    () => (area === "matematica" && celulas && estado && porId ? dominioPorAssunto(celulas, estado, porId) : null),
    [celulas, estado, porId, area],
  );

  const nota = React.useMemo(() => {
    if (!estado || !porId) return null;
    const { theta, erroPadrao, itens } = estimarTheta(respostasTRI(estado.tentativas, porId));
    return notaEstimada(theta, erroPadrao, itens);
  }, [estado, porId]);

  const faceis = React.useMemo(
    () =>
      estado && agora
        ? prontoFaceis({ habilidadesDaSemana: estado.perfil.habilidadesDaSemana, estados: estado.habilidades, tentativas: estado.tentativas, simulados: estado.simulados, agora })
        : null,
    [estado, agora],
  );
  const prova = React.useMemo(
    () =>
      estado && agora && nota && porId
        ? prontoProva({ nota, metaNota: estado.perfil.metaNota, tentativas: estado.tentativas, questoes: (id) => porId.get(id), simulados: estado.simulados, agora })
        : null,
    [estado, agora, nota, porId],
  );

  const disponiveisSimulado = React.useMemo(() => {
    if (!estado || !questoes) return null;
    const bs = questoes.flatMap((q) => (q.tri ? [q.tri.b] : []));
    return montarSimuladoFaceis({ questoes, estado, limiarFacil: limiarFacil(bs) }).length;
  }, [estado, questoes]);

  const erro = erroStore ?? erroQuestoes;
  const celula = celulas?.find((c) => c.habilidade === selecionada) ?? null;
  const simuladosFaceis = estado?.simulados.filter((s) => s.tipo === "faceis-15") ?? [];
  const melhorSimulado = simuladosFaceis.find(simuladoValeParaFaceis) ?? null;

  const nomeArea = NOME_AREA[area].toLowerCase();
  return (
    <section className="flex flex-col gap-5" data-testid={`mapa-area-${area}`} aria-label={`Mapa de ${nomeArea}`}>
      {comTitulo && <h2 className="border-b border-border pb-2 text-xl font-extrabold">{area === "natureza" ? "Ciências da Natureza" : "Matemática"}</h2>}

      {erro && (
        <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm">
          <p className="font-semibold text-danger-text">Não consegui carregar seus dados.</p>
          <p className="text-muted-foreground">{erro}</p>
        </div>
      )}

      {/* Nota + simulado à esquerda; o que falta para "pronto" à direita */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-4">
          <Card data-testid="card-nota">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Nota estimada de {nomeArea} <Badge variant="outline">estimativa</Badge>
              </CardTitle>
              <CardDescription>
                EAP com prior N(0, 1), só itens oficiais com parâmetros TRI do INEP. Escala 500 + 100·θ, intervalo de 95%. Não é a equalização oficial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nota && nota.itens > 0 ? (
                <>
                  <p className="num text-3xl font-extrabold">
                    {nota.nota}
                    <span className="ml-2 text-base font-semibold text-muted-foreground">
                      ({nota.inferior}–{nota.superior})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    θ = {formatarDecimal(nota.theta, 2)} ± {formatarDecimal(nota.erroPadrao, 2)} · {plural(nota.itens, "item oficial", "itens oficiais")} com TRI
                    {estado && ` · meta ${estado.perfil.metaNota}`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ainda sem itens oficiais com TRI respondidos. A estimativa aparece depois da primeira questão oficial de um sprint.
                </p>
              )}
            </CardContent>
          </Card>
          <Card data-testid="card-simulado">
            <CardHeader>
              <CardTitle>Simulado de {TAMANHO_SIMULADO_FACEIS} fáceis inéditos</CardTitle>
              <CardDescription>
                Itens oficiais do tercil fácil (pelo b do INEP) que você nunca fez, 3 minutos por item. Vale para o critério “pronto nos fáceis”.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                {disponiveisSimulado === null
                  ? "Contando as questões inéditas…"
                  : disponiveisSimulado >= TAMANHO_SIMULADO_FACEIS
                    ? `${disponiveisSimulado}+ questões fáceis inéditas disponíveis.`
                    : `Só ${plural(disponiveisSimulado, "questão fácil inédita", "questões fáceis inéditas")} disponíveis: não dá para montar um simulado completo.`}
              </p>
              {simuladosFaceis.length > 0 && (
                <ul className="flex flex-col gap-1" data-testid="historico-simulados">
                  {simuladosFaceis
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center gap-2">
                        <span className="num font-bold">
                          {s.acertos} de {s.total}
                        </span>
                        <span className="text-muted-foreground">
                          · maior tempo {Math.round(s.maiorTempoItem)} s · {new Date(s.terminadoEm).toLocaleDateString("pt-BR")}
                        </span>
                        {simuladoValeParaFaceis(s) ? <Badge variant="success">vale</Badge> : <Badge variant="outline">não vale</Badge>}
                      </li>
                    ))}
                </ul>
              )}
              {melhorSimulado && <p className="font-semibold text-success-text">Critério do simulado cumprido.</p>}
              <div className="pt-1">
                <Button variant="secondary" asChild>
                  <Link href="/simulado">
                    Começar o simulado <ArrowRight />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card data-testid="card-pronto">
          <CardHeader>
            <CardTitle>O que falta para “pronto”</CardTitle>
            <CardDescription>Três níveis: cada habilidade da semana, os fáceis da semana e a prova de {nomeArea}.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <NivelPronto
              titulo="Habilidades da semana"
              dica={celulas && !celulas.some((c) => c.daSemana) ? `Nenhuma habilidade de ${nomeArea} na semana: escolha nos Ajustes.` : "Clique numa habilidade para ver todos os critérios."}
              pronto={!!celulas && celulas.some((c) => c.daSemana) && celulas.filter((c) => c.daSemana).every((c) => c.pronto)}
              itens={
                celulas
                  ? celulas
                      .filter((c) => c.daSemana)
                      .map((c) => ({
                        chave: c.habilidade,
                        ok: c.pronto,
                        // Só o primeiro critério que falta; o detalhe da célula lista todos.
                        texto: c.pronto ? `${rotuloHabilidade(c.habilidade)}: pronto` : `${rotuloHabilidade(c.habilidade)}: ${c.faltas[0]}${c.faltas.length > 1 ? ` (+${c.faltas.length - 1})` : ""}`,
                      }))
                  : []
              }
              aoClicar={(chave) => setSelecionada(chave)}
            />
            <NivelPronto
              titulo="Fáceis da semana"
              pronto={!!faceis?.pronto}
              itens={
                faceis
                  ? faceis.pronto
                    ? [{ chave: "ok", ok: true, texto: "Todas as habilidades da semana prontas e um simulado de 15 fáceis com ≥ 90% em até 3 min por item." }]
                    : faceis.faltas.filter((f) => !/^(CN-)?H\d+:/.test(f)).map((f, i) => ({ chave: `f${i}`, ok: false, texto: f }))
                  : []
              }
              extra={
                faceis && !faceis.pronto && faceis.faltas.some((f) => /^(CN-)?H\d+:/.test(f)) ? (
                  <p className="text-sm text-muted-foreground">
                    Mais {plural(faceis.faltas.filter((f) => /^(CN-)?H\d+:/.test(f)).length, "habilidade da semana que ainda não está pronta", "habilidades da semana que ainda não estão prontas")} (lista acima).
                  </p>
                ) : null
              }
            />
            <NivelPronto
              titulo={`Prova de ${nomeArea}`}
              pronto={!!prova?.pronto}
              itens={prova ? (prova.pronto ? [{ chave: "ok", ok: true, texto: "Nota, erro nos fáceis e simulados completos dentro da meta." }] : prova.faltas.map((f, i) => ({ chave: `p${i}`, ok: false, texto: f }))) : []}
            />
          </CardContent>
        </Card>
      </div>

      {/* Calor por competência */}
      <section className="flex flex-col gap-3" aria-label={`Calor por habilidade de ${nomeArea}`}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold">
            Calor por habilidade{comTitulo ? ` · ${SIGLA_AREA[area]}` : ""}
          </h2>
          <Legenda />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="gap-3" data-testid="mapa-calor">
            {grupos
              ? grupos.map((g) => (
                  <div key={g.competencia.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>
                        <span className="font-semibold">{g.competencia.id}</span>{" "}
                        <span className="text-muted-foreground">{g.competencia.nome}</span>
                      </span>
                      <span className="num font-bold text-muted-foreground">{g.media === null ? "—" : formatarDecimal(g.media, 2)}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={`Competência ${g.competencia.id}: ${g.competencia.nome}`}>
                      {g.celulas.map((c) => (
                        <CelulaCalor key={c.habilidade} celula={c} selecionada={c.habilidade === selecionada} aoSelecionar={() => setSelecionada(c.habilidade)} />
                      ))}
                    </div>
                  </div>
                ))
              : Array.from({ length: 7 }, (_, i) => <div key={i} className="h-16 rounded-md bg-background dark:bg-surface-2" />)}
          </Card>
          <DetalheCelula celula={celula} />
        </div>
      </section>

      {/* Por assunto de foco (só matemática tem assuntos na taxonomia) */}
      {area === "matematica" && (
      <section className="flex flex-col gap-3" aria-labelledby="assuntos-titulo">
        <h2 id="assuntos-titulo" className="text-lg font-bold">
          Por assunto de foco
        </h2>
        <Card className="gap-0 divide-y divide-border py-2" data-testid="mapa-assuntos">
          {assuntos
            ? assuntos.map((a) => (
                <div key={a.assunto.id} className="grid items-center gap-x-4 gap-y-1 py-2.5 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.assunto.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.assunto.habilidades.join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(a.media ?? 0) * 100} tom={a.media === null ? "neutral" : "accent"} aria-label={`Domínio em ${a.assunto.nome}`} />
                    <span className="num w-10 text-right font-bold">{a.media === null ? "—" : formatarDecimal(a.media, 2)}</span>
                  </div>
                  <span className="num text-xs text-muted-foreground">
                    {a.tentativas === 0 ? "sem itens" : `${a.acertos}/${a.tentativas} acertos`}
                  </span>
                </div>
              ))
            : null}
        </Card>
      </section>
      )}
    </section>
  );
}

function NivelPronto({
  titulo,
  dica,
  pronto,
  itens,
  extra,
  aoClicar,
}: {
  titulo: string;
  dica?: string;
  pronto: boolean;
  itens: { chave: string; ok: boolean; texto: string }[];
  extra?: React.ReactNode;
  aoClicar?: (chave: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-testid="nivel-pronto">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        {pronto ? <Check className="size-4 text-success" /> : <CircleDashed className="size-4 text-muted-foreground" />}
        {titulo}
        <Badge variant={pronto ? "success" : "outline"}>{pronto ? "pronto" : "falta"}</Badge>
      </h3>
      {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
      <ul className="flex flex-col gap-1 text-sm">
        {itens.map((it) => (
          <li key={it.chave} className={cn("flex gap-2", it.ok ? "text-muted-foreground" : "")}>
            <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", it.ok ? "bg-success" : "bg-accent")} />
            {aoClicar && /^(CN-)?H\d+$/.test(it.chave) ? (
              <button type="button" className="text-left hover:underline" onClick={() => aoClicar(it.chave)}>
                {it.texto}
              </button>
            ) : (
              <span>{it.texto}</span>
            )}
          </li>
        ))}
      </ul>
      {extra}
    </div>
  );
}

/** Cores do mapa de calor do original: cinza (sem dados), vermelho, âmbar e verde suaves; o nível máximo é verde cheio. */
const CLASSE_NIVEL: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-black/5 text-muted-foreground dark:bg-white/5",
  1: "bg-danger-soft text-danger-text",
  2: "bg-warning-soft text-warning-text",
  3: "bg-success-soft text-success-text",
  4: "bg-success text-white",
};

function CelulaCalor({ celula, selecionada, aoSelecionar }: { celula: CelulaMapa; selecionada: boolean; aoSelecionar: () => void }) {
  const nivel = nivelCalor(celula.semDados ? null : celula.dominioEfetivo);
  const rotulo = `${exibirHabilidade(celula.habilidade)}, ${celula.nome}, ${celula.semDados ? "sem dados" : `domínio efetivo ${formatarDecimal(celula.dominioEfetivo, 2)}`}${celula.pronto ? ", pronta" : ""}${celula.revisaoVencida ? ", revisão vencida" : ""}`;
  return (
    <button
      type="button"
      onClick={aoSelecionar}
      aria-pressed={selecionada}
      aria-label={rotulo}
      data-testid="celula-calor"
      data-nivel={nivel}
      className={cn(
        "num relative flex h-[38px] items-center justify-center rounded-sm text-[13px] font-bold",
        "transition-[box-shadow,filter] duration-(--duration) ease-(--ease) hover:brightness-95 dark:hover:brightness-125",
        CLASSE_NIVEL[nivel],
        selecionada && "ring-2 ring-ring ring-offset-2 ring-offset-surface",
        celula.daSemana && !selecionada && "shadow-[inset_0_0_0_1.5px_var(--accent)]",
      )}
    >
      {rotuloHabilidade(celula.habilidade)}
      {celula.pronto && <Check aria-hidden className="absolute top-1 right-1 size-3" />}
      {celula.revisaoVencida && <RotateCcw aria-hidden className="absolute bottom-1 right-1 size-3" />}
    </button>
  );
}

function Legenda() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        {([0, 1, 2, 3, 4] as const).map((n) => (
          <span key={n} aria-hidden className={cn("size-3.5 rounded-[4px]", CLASSE_NIVEL[n])} />
        ))}
        <span className="ml-1">sem dados → 0,85+</span>
      </span>
      <span className="flex items-center gap-1">
        <span aria-hidden className="size-3.5 rounded-[4px] shadow-[inset_0_0_0_1.5px_var(--accent)]" /> da semana
      </span>
      <span className="flex items-center gap-1">
        <Check className="size-3" /> pronta
      </span>
      <span className="flex items-center gap-1">
        <RotateCcw className="size-3" /> revisão vencida
      </span>
    </div>
  );
}

function DetalheCelula({ celula }: { celula: CelulaMapa | null }) {
  if (!celula) return <Card className="min-h-40" aria-busy="true" />;
  return (
    <Card data-testid="detalhe-habilidade" aria-live="polite">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span className="num">{exibirHabilidade(celula.habilidade)}</span>
          <span className="font-normal text-muted-foreground">{celula.nome}</span>
          {celula.daSemana && <Badge variant="accent">da semana</Badge>}
          {celula.pronto && <Badge variant="success">pronta</Badge>}
          {celula.revisaoVencida && (
            <Badge variant="warning">
              <RotateCcw /> revisão vencida
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Competência {celula.competencia}.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Domínio</dt>
          <dd className="num font-semibold">{formatarDecimal(celula.dominio, 2)}</dd>
          <dt className="text-muted-foreground">Retenção prevista</dt>
          <dd className="num font-semibold">{Math.round(celula.retencao * 100)}%</dd>
          <dt className="text-muted-foreground">Domínio efetivo</dt>
          <dd className="num font-semibold">{formatarDecimal(celula.dominioEfetivo, 2)}</dd>
          <dt className="text-muted-foreground">Itens oficiais</dt>
          <dd className="num font-semibold">
            {celula.itensOficiais}
            {celula.itensGemeos > 0 ? ` (+${plural(celula.itensGemeos, "gêmea", "gêmeas")})` : ""}
          </dd>
          <dt className="text-muted-foreground">Acertos</dt>
          <dd className="num font-semibold">{celula.acertos}</dd>
        </dl>
        <Progress value={celula.dominioEfetivo * 100} aria-label="Domínio efetivo" />
        <div>
          <p className="font-semibold">{celula.pronto ? "Pronta." : "O que falta:"}</p>
          {!celula.pronto && (
            <ul className="mt-1 list-disc pl-5 text-muted-foreground" data-testid="faltas-habilidade">
              {celula.faltas.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
