"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Database, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store/provider";
import { useQuestoes } from "@/data/use-questoes";
import { origemDosDados } from "@/data/carregar";
import { NOME_HABILIDADE } from "@/data/tipos";
import {
  estimarTheta,
  formatarDecimal,
  limiarFacil,
  montarFila,
  notaEstimada,
  respostasTRI,
  resumoDoDia,
  plural,
} from "@/lib/dominio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Esqueleto } from "@/components/ui/esqueleto";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { useAtalho } from "@/lib/atalhos/provider";
import { cn } from "@/lib/utils";

function saudacao(agora: Date, nome: string): string {
  const h = agora.getHours();
  const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${periodo}, ${nome}.`;
}

/** Tela inicial: um card com "Começar" e o resumo do dia. */
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

  const origem = origemDosDados();
  const erro = erroStore ?? erroQuestoes;

  return (
    <ConteudoPagina className="max-w-3xl gap-6">
      <CabecalhoPagina
        titulo={estado && agora ? saudacao(agora, estado.perfil.nome) : "Hoje"}
        descricao="Um sprint tem 5 questões e dura uns 12 minutos. Fáceis primeiro, as suas revisões no meio."
      />

      {erro && (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm">
          <p className="font-medium text-danger">Não consegui carregar seus dados.</p>
          <p className="text-muted-foreground">{erro}</p>
        </div>
      )}

      <Card className="gap-5 p-6 md:p-8" data-testid="card-sprint">
        <CardHeader>
          <CardTitle className="text-xl">Sprint de 5 questões</CardTitle>
          <CardDescription>
            {fila === null ? (
              <span className="sr-only">Montando a fila…</span>
            ) : fila.length === 0 ? (
              "Nenhuma questão disponível agora. Volte amanhã ou importe o banco."
            ) : (
              `Próximas: ${plural(fila.length, "questão oficial", "questões oficiais")} em ${plural(new Set(fila.map((q) => q.habilidade)).size, "habilidade", "habilidades")}, fáceis primeiro.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {/* As 5 bolinhas do sprint, antes de começar: o ritmo já aparece aqui. */}
          <ol className="flex flex-wrap gap-2" aria-label="Fila do sprint">
            {(fila ?? Array.from({ length: 5 }, () => null)).slice(0, 5).map((q, i) => (
              <li
                key={q?.id ?? i}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
                title={q?.habilidade ? NOME_HABILIDADE[q.habilidade] : undefined}
              >
                <span aria-hidden className="size-2.5 rounded-full border border-border" />
                {q ? (
                  <>
                    <span className="font-semibold">{q.habilidade ?? "—"}</span>
                    {q.habilidade && <span className="hidden text-muted-foreground md:inline">{NOME_HABILIDADE[q.habilidade]}</span>}
                    <span
                      className={cn(
                        "text-xs",
                        q.dificuldade_estimada === "facil" ? "text-success" : q.dificuldade_estimada === "dificil" ? "text-danger" : "text-muted-foreground",
                      )}
                    >
                      {q.tri ? (q.dificuldade_estimada === "facil" ? "fácil" : q.dificuldade_estimada === "dificil" ? "difícil" : "média") : "sem TRI"}
                    </span>
                  </>
                ) : (
                  <Esqueleto className="h-4 w-16" />
                )}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild data-testid="comecar">
              <Link href="/estudar">
                Começar
                <Kbd className="border-accent-foreground/30 bg-transparent text-accent-foreground">Enter</Kbd>
              </Link>
            </Button>
            {resumo && resumo.sprintsHoje > 0 && (
              <span className="text-sm text-muted-foreground">
                Hoje: {plural(resumo.sprintsHoje, "sprint", "sprints")}, {resumo.acertosHoje}/{resumo.tentativasHoje}{" "}
                acertos.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nota estimada</CardTitle>
            <CardDescription>
              {nota && nota.itens > 0
                ? `Estimativa com ${plural(nota.itens, "item oficial", "itens oficiais")} com TRI.`
                : "Estimativa: aparece depois da primeira questão oficial com parâmetros TRI do INEP."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nota === null ? (
              <Esqueleto className="h-9 w-40" />
            ) : nota.itens > 0 ? (
              <p className="tabular text-3xl font-semibold">
                {nota.nota}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({nota.inferior}–{nota.superior}) · estimativa
                </span>
              </p>
            ) : (
              <p className="text-2xl font-semibold text-muted-foreground" aria-label="sem estimativa ainda">
                —
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisões</CardTitle>
            <CardDescription>Habilidades com retenção prevista abaixo de 90%.</CardDescription>
          </CardHeader>
          <CardContent>
            {resumo === null ? (
              <Esqueleto className="h-5 w-48" />
            ) : resumo.habilidadesVencidas.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {resumo.habilidadesVencidas.map((h) => (
                  <li key={h}>
                    <Badge variant="warning" title={NOME_HABILIDADE[h]}>
                      <RotateCcw /> {h}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nada vencido. Elas aparecem aqui quando a retenção cair.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {estado && Object.keys(estado.habilidades).length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Domínio por habilidade</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Object.values(estado.habilidades)
              .sort((a, b) => a.dominio - b.dominio)
              .slice(0, 6)
              .map((h) => (
                <li key={h.habilidade} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                  <span className="w-10 font-semibold">{h.habilidade}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{NOME_HABILIDADE[h.habilidade]}</span>
                  <span className="tabular">{formatarDecimal(h.dominio, 2)}</span>
                </li>
              ))}
          </ul>
          <Link href="/mapa" className="inline-flex items-center gap-1 text-sm text-accent-text hover:underline">
            Ver o mapa completo <ArrowRight className="size-4" />
          </Link>
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="size-3.5" />
        {origem.fixture
          ? `Dados de desenvolvimento (fixture): ${origem.total} questões reais do ENEM 2023, via enem.dev. Fonte: INEP.`
          : `${origem.total} questões oficiais do INEP (transcrição enem.dev), snapshot do repositório PROVAS.`}
      </p>
    </ConteudoPagina>
  );
}

