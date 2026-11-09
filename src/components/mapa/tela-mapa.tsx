"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, Timer } from "lucide-react";
import { useStore } from "@/lib/store/provider";
import { useQuestoes } from "@/data/use-questoes";
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
import { Bolha } from "@/components/ui/bolha";
import { Esqueleto } from "@/components/ui/esqueleto";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { cn } from "@/lib/utils";

/** Tela Mapa: calor H1–H30 por competência e por assunto, nota TRI estimada e os três níveis de "pronto". */
export function TelaMapa() {
  const { estado, erro: erroStore } = useStore();
  const { questoes, porId, erro: erroQuestoes } = useQuestoes();
  const agora = React.useMemo(() => (estado ? new Date() : null), [estado]);
  const [selecionada, setSelecionada] = React.useState<string>("H24");

  const celulas = React.useMemo(() => (estado && agora ? mapaHabilidades(estado, agora) : null), [estado, agora]);
  const grupos = React.useMemo(() => (celulas ? agruparPorCompetencia(celulas) : null), [celulas]);
  const assuntos = React.useMemo(
    () => (celulas && estado && porId ? dominioPorAssunto(celulas, estado, porId) : null),
    [celulas, estado, porId],
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

  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Mapa"
        descricao="Domínio por habilidade (H1 a H30), nota estimada pela TRI e o que ainda falta para estar pronto."
        acoes={
          <Button variant="outline" asChild data-testid="ir-simulado">
            <Link href="/simulado">
              <Timer /> Simulado de {TAMANHO_SIMULADO_FACEIS} fáceis
            </Link>
          </Button>
        }
      />

      {erro && (
        <div role="alert" className="rounded-md bg-erro-suave p-3 text-sm text-erro">
          <p className="font-medium">Não consegui carregar seus dados.</p>
          <p>{erro}</p>
        </div>
      )}

      {/* Faixa de cima: nota + simulado à esquerda; o que falta para "pronto" à direita */}
      <div className="grid items-start gap-8 border-t border-border pt-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-border">
        <div className="flex min-w-0 flex-col gap-4 lg:pr-8">
          <section className="flex flex-col gap-2" data-testid="card-nota">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              Nota estimada <Badge variant="outline">estimativa</Badge>
            </h2>
            {nota && nota.itens > 0 ? (
              <>
                <p className="num text-3xl font-medium">
                  {nota.nota}
                  <span className="num ml-2 text-base text-muted-foreground">
                    ({nota.inferior}–{nota.superior})
                  </span>
                </p>
                <p className="num text-xs text-muted-foreground">
                  θ = {formatarDecimal(nota.theta, 2)} ± {formatarDecimal(nota.erroPadrao, 2)} · {plural(nota.itens, "item oficial", "itens oficiais")} com TRI
                  {estado && ` · meta ${estado.perfil.metaNota}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda sem itens oficiais com TRI respondidos. A estimativa aparece depois da primeira questão oficial de um sprint.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              EAP com prior N(0, 1), só itens oficiais com parâmetros TRI do INEP. Escala 500 + 100·θ, intervalo de 95%. Não é a equalização oficial.
            </p>
          </section>
          <section className="flex flex-col gap-3 border-t border-border pt-4 text-sm" data-testid="card-simulado">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">Simulado de {TAMANHO_SIMULADO_FACEIS} fáceis inéditos</h2>
              <p className="text-sm text-muted-foreground">
                Itens oficiais do tercil fácil (pelo b do INEP) que você nunca fez, 3 minutos por item. Vale para o critério “pronto nos fáceis”.
              </p>
            </div>
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
                    <li key={s.id} className="num flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">
                        {s.acertos} de {s.total}
                      </span>
                      <span className="text-muted-foreground">
                        · maior tempo {Math.round(s.maiorTempoItem)} s · {new Date(s.terminadoEm).toLocaleDateString("pt-BR")}
                      </span>
                      {simuladoValeParaFaceis(s) ? <Badge variant="sucesso">vale</Badge> : <Badge variant="outline">não vale</Badge>}
                    </li>
                  ))}
              </ul>
            )}
            {melhorSimulado && <p className="font-medium text-sucesso">Critério do simulado cumprido.</p>}
            <div>
              <Button variant="secondary" asChild className="pointer-coarse:min-h-11">
                <Link href="/simulado">
                  Começar o simulado <ArrowRight />
                </Link>
              </Button>
            </div>
          </section>
        </div>
        <section className="flex min-w-0 flex-col gap-4 lg:pl-8" data-testid="card-pronto">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">O que falta para “pronto”</h2>
            <p className="text-sm text-muted-foreground">Três níveis: cada habilidade da semana, os fáceis da semana e a prova de matemática.</p>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <NivelPronto
              titulo="Habilidades da semana"
              dica="Clique numa habilidade para ver todos os critérios."
              pronto={!!celulas && celulas.filter((c) => c.daSemana).every((c) => c.pronto)}
              itens={
                celulas
                  ? celulas
                      .filter((c) => c.daSemana)
                      .map((c) => ({
                        chave: c.habilidade,
                        ok: c.pronto,
                        // Só o primeiro critério que falta; o detalhe da célula lista todos.
                        texto: c.pronto ? `${c.habilidade}: pronto` : `${c.habilidade}: ${c.faltas[0]}${c.faltas.length > 1 ? ` (+${c.faltas.length - 1})` : ""}`,
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
                    : faceis.faltas.filter((f) => !/^H\d+:/.test(f)).map((f, i) => ({ chave: `f${i}`, ok: false, texto: f }))
                  : []
              }
              extra={
                faceis && !faceis.pronto && faceis.faltas.some((f) => /^H\d+:/.test(f)) ? (
                  <p className="text-sm text-muted-foreground">
                    Mais {plural(faceis.faltas.filter((f) => /^H\d+:/.test(f)).length, "habilidade da semana que ainda não está pronta", "habilidades da semana que ainda não estão prontas")} (lista acima).
                  </p>
                ) : null
              }
            />
            <NivelPronto
              titulo="Prova de matemática"
              pronto={!!prova?.pronto}
              itens={prova ? (prova.pronto ? [{ chave: "ok", ok: true, texto: "Nota, erro nos fáceis e simulados completos dentro da meta." }] : prova.faltas.map((f, i) => ({ chave: `p${i}`, ok: false, texto: f }))) : []}
            />
          </div>
        </section>
      </div>

      {/* Calor por competência */}
      <section className="flex flex-col gap-4 border-t border-border pt-6" aria-labelledby="calor-titulo">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="calor-titulo" className="text-base font-semibold">
            Calor por habilidade
          </h2>
          <Legenda />
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex min-w-0 flex-col gap-4" data-testid="mapa-calor">
            {grupos
              ? grupos.map((g) => (
                  <div key={g.competencia.id} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0">
                        <span className="num font-medium">{g.competencia.id}</span>{" "}
                        <span className="text-muted-foreground">{g.competencia.nome}</span>
                      </span>
                      <span className="num text-muted-foreground">{g.media === null ? "—" : formatarDecimal(g.media, 2)}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={`Competência ${g.competencia.id}: ${g.competencia.nome}`}>
                      {g.celulas.map((c) => (
                        <CelulaCalor key={c.habilidade} celula={c} selecionada={c.habilidade === selecionada} aoSelecionar={() => setSelecionada(c.habilidade)} />
                      ))}
                    </div>
                  </div>
                ))
              : Array.from({ length: 7 }, (_, i) => <Esqueleto key={i} className="h-16 rounded-md" />)}
          </div>
          <DetalheCelula celula={celula} />
        </div>
      </section>

      {/* Por assunto de foco */}
      <section className="flex flex-col gap-3 border-t border-border pt-6" aria-labelledby="assuntos-titulo">
        <h2 id="assuntos-titulo" className="text-base font-semibold">
          Por assunto de foco
        </h2>
        <div className="flex flex-col" data-testid="mapa-assuntos">
          {assuntos
            ? assuntos.map((a) => (
                <div
                  key={a.assunto.id}
                  className="grid min-h-10 items-center gap-x-4 gap-y-1 border-b border-border py-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
                >
                  <div className="flex min-w-0 items-baseline gap-2">
                    <p className="truncate font-medium">{a.assunto.nome}</p>
                    <p className="num truncate text-xs text-muted-foreground">{a.assunto.habilidades.join(" · ")}</p>
                  </div>
                  <div className="flex min-w-0 items-center gap-3">
                    <Progress value={(a.media ?? 0) * 100} tom={a.media === null ? "neutral" : "destaque"} aria-label={`Domínio em ${a.assunto.nome}`} />
                    <span className="num w-10 shrink-0 text-right">{a.media === null ? "—" : formatarDecimal(a.media, 2)}</span>
                    <span className="num w-24 shrink-0 text-right text-xs text-muted-foreground sm:hidden">
                      {a.tentativas === 0 ? "sem itens" : `${a.acertos}/${a.tentativas} acertos`}
                    </span>
                  </div>
                  <span className="num hidden w-24 text-right text-xs text-muted-foreground sm:inline">
                    {a.tentativas === 0 ? "sem itens" : `${a.acertos}/${a.tentativas} acertos`}
                  </span>
                </div>
              ))
            : Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} className="my-2 h-6" />)}
        </div>
      </section>
    </ConteudoPagina>
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
    <div className="flex min-w-0 flex-col gap-2" data-testid="nivel-pronto">
      <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <Bolha tamanho="sm" estado={pronto ? "feita" : "vazia"}>{pronto && <Check strokeWidth={2} />}</Bolha>
        {titulo}
        <Badge variant={pronto ? "sucesso" : "outline"}>{pronto ? "pronto" : "falta"}</Badge>
      </h3>
      {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
      <ul className="flex flex-col gap-1.5 text-sm">
        {itens.map((it) => (
          <li key={it.chave} className={cn("flex min-w-0 gap-2", it.ok ? "text-muted-foreground" : "")}>
            <span aria-hidden className={cn("mt-2.5 h-px w-2 shrink-0", it.ok ? "bg-sucesso" : "bg-muted-forte")} />
            {aoClicar && /^H\d+$/.test(it.chave) ? (
              <button
                type="button"
                className="-mx-1 min-w-0 rounded-sm px-1 text-left transition-colors duration-(--duracao) ease-(--curva) hover:bg-muted pointer-coarse:min-h-11"
                onClick={() => aoClicar(it.chave)}
              >
                <span className="num">{it.texto.slice(0, it.texto.indexOf(":"))}</span>
                {it.texto.slice(it.texto.indexOf(":"))}
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

/** Níveis do calor: cinza (sem dados), erro, aviso e sucesso suaves; o nível máximo é sucesso cheio. */
const CLASSE_NIVEL: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted text-muted-foreground",
  1: "bg-erro-suave text-erro",
  2: "bg-aviso-suave text-aviso",
  3: "bg-sucesso-suave text-sucesso",
  4: "bg-sucesso-forte text-sucesso-contraste",
};

function CelulaCalor({ celula, selecionada, aoSelecionar }: { celula: CelulaMapa; selecionada: boolean; aoSelecionar: () => void }) {
  const nivel = nivelCalor(celula.semDados ? null : celula.dominioEfetivo);
  const rotulo = `${celula.habilidade}, ${celula.nome}, ${celula.semDados ? "sem dados" : `domínio efetivo ${formatarDecimal(celula.dominioEfetivo, 2)}`}${celula.pronto ? ", pronta" : ""}${celula.revisaoVencida ? ", revisão vencida" : ""}`;
  return (
    <button
      type="button"
      onClick={aoSelecionar}
      aria-pressed={selecionada}
      aria-label={rotulo}
      data-testid="celula-calor"
      data-nivel={nivel}
      className={cn(
        "num relative flex h-10 items-center justify-center rounded-md text-xs font-medium",
        "outline-offset-1 transition-colors duration-(--duracao) ease-(--curva) hover:ring-1 hover:ring-input",
        CLASSE_NIVEL[nivel],
        celula.daSemana && "ring-1 ring-primary ring-inset hover:ring-primary",
        selecionada && "outline-2 outline-foreground outline-solid",
      )}
    >
      {celula.habilidade}
      {celula.pronto && <Check aria-hidden className="absolute top-1 right-1 size-3" strokeWidth={1.5} />}
      {celula.revisaoVencida && <RotateCcw aria-hidden className="absolute right-1 bottom-1 size-3" strokeWidth={1.5} />}
    </button>
  );
}

function Legenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        {([0, 1, 2, 3, 4] as const).map((n) => (
          <span key={n} aria-hidden className={cn("size-3 rounded-[3px]", CLASSE_NIVEL[n])} />
        ))}
        <span className="ml-1">sem dados → 0,85+</span>
      </span>
      <span className="flex items-center gap-1">
        <span aria-hidden className="size-3 rounded-[3px] ring-1 ring-primary ring-inset" /> da semana
      </span>
      <span className="flex items-center gap-1">
        <Check className="size-3" strokeWidth={1.5} /> pronta
      </span>
      <span className="flex items-center gap-1">
        <RotateCcw className="size-3" strokeWidth={1.5} /> revisão vencida
      </span>
    </div>
  );
}

function DetalheCelula({ celula }: { celula: CelulaMapa | null }) {
  if (!celula) return <Card className="min-h-40 lg:sticky lg:top-6" aria-busy="true" />;
  return (
    <Card data-testid="detalhe-habilidade" aria-live="polite" className="lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span className="num">{celula.habilidade}</span>
          <span className="font-normal text-muted-foreground">{celula.nome}</span>
          {celula.daSemana && <Badge variant="destaque">da semana</Badge>}
          {celula.pronto && <Badge variant="sucesso">pronta</Badge>}
          {celula.revisaoVencida && (
            <Badge variant="aviso">
              <RotateCcw /> revisão vencida
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Competência {celula.competencia}.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Domínio</dt>
          <dd className="num text-right">{formatarDecimal(celula.dominio, 2)}</dd>
          <dt className="text-muted-foreground">Retenção prevista</dt>
          <dd className="num text-right">{Math.round(celula.retencao * 100)}%</dd>
          <dt className="text-muted-foreground">Domínio efetivo</dt>
          <dd className="num text-right">{formatarDecimal(celula.dominioEfetivo, 2)}</dd>
          <dt className="text-muted-foreground">Itens oficiais</dt>
          <dd className="num text-right">
            {celula.itensOficiais}
            {celula.itensGemeos > 0 ? ` (+${plural(celula.itensGemeos, "gêmea", "gêmeas")})` : ""}
          </dd>
          <dt className="text-muted-foreground">Acertos</dt>
          <dd className="num text-right">{celula.acertos}</dd>
        </dl>
        <Progress value={celula.dominioEfetivo * 100} aria-label="Domínio efetivo" />
        <div>
          <p className="font-medium">{celula.pronto ? "Pronta." : "O que falta:"}</p>
          {!celula.pronto && (
            <ul className="mt-2 flex flex-col gap-1 text-muted-foreground" data-testid="faltas-habilidade">
              {celula.faltas.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="mt-2.5 h-px w-2 shrink-0 bg-muted-forte" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
