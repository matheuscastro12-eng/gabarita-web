"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import { NOME_AREA, type Area, type Questao } from "@/data/tipos";
import { ASSUNTOS, COMPETENCIAS_CN } from "@/data/taxonomia";
import {
  ANOS_PROVA,
  montarBloco45,
  montarBlocoAssunto,
  montarProvaDia2,
  novoAndamento,
  plural,
  questoesJaTentadas,
  SEGUNDOS_BLOCO_45,
  SEGUNDOS_DIA2,
  SEGUNDOS_POR_ITEM_ASSUNTO,
  type Andamento,
} from "@/lib/dominio";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarRelogio } from "./prova-longa";

const classeSelect = "h-10 rounded-full border-[1.5px] border-border bg-surface px-3.5 text-sm font-semibold";

/** Cartões para montar os simulados longos (prova do 2º dia, bloco de 45, bloco por assunto). */
export function OpcoesSimulado({
  questoes,
  estado,
  areas,
  geral,
  bloqueado,
  aoIniciar,
}: {
  questoes: Questao[];
  estado: EstadoAluno;
  areas: Area[];
  geral: boolean;
  /** Já há um simulado em andamento: continue ou descarte antes. */
  bloqueado: boolean;
  aoIniciar: (a: Andamento, questoes: Questao[]) => void;
}) {
  const [anoProva, setAnoProva] = React.useState(2023);
  const [areaBloco, setAreaBloco] = React.useState<Area>(areas[0]!);
  const [anoBloco, setAnoBloco] = React.useState<string>("misturado");
  const [areaAssunto, setAreaAssunto] = React.useState<Area>(areas[0]!);
  const [assunto, setAssunto] = React.useState<string>("");
  const tentadas = React.useMemo(() => questoesJaTentadas(estado), [estado]);

  const prova = React.useMemo(() => (geral ? montarProvaDia2(questoes, anoProva) : []), [geral, questoes, anoProva]);
  const bloco = React.useMemo(
    () => montarBloco45({ questoes, area: areaBloco, ano: anoBloco === "misturado" ? null : Number(anoBloco), tentadas, semente: `${estado.tentativas.length}` }),
    [questoes, areaBloco, anoBloco, tentadas, estado.tentativas.length],
  );
  const opcoesAssunto = React.useMemo(() => {
    const daArea = questoes.filter((q) => q.area === areaAssunto && !q.anulada);
    const base =
      areaAssunto === "natureza"
        ? COMPETENCIAS_CN.map((c) => ({ chave: c.id, nome: `${c.id} · ${c.nome}`, total: daArea.filter((q) => q.competencia === c.id).length }))
        : ASSUNTOS.map((a) => ({ chave: a.id, nome: a.nome, total: daArea.filter((q) => q.assuntos.includes(a.id)).length }));
    return base.filter((o) => o.total >= 3);
  }, [questoes, areaAssunto]);
  const chaveAssunto = opcoesAssunto.some((o) => o.chave === assunto) ? assunto : (opcoesAssunto[0]?.chave ?? "");
  const blocoAssunto = React.useMemo(
    () => (chaveAssunto ? montarBlocoAssunto({ questoes, area: areaAssunto, chave: chaveAssunto, tentadas, semente: `${estado.tentativas.length}` }) : []),
    [questoes, areaAssunto, chaveAssunto, tentadas, estado.tentativas.length],
  );

  const iniciar = (tipo: Andamento["tipo"], titulo: string, qs: Questao[], ano: number | null, duracao: number) => {
    if (qs.length === 0) return;
    aoIniciar(novoAndamento({ tipo, titulo, questoes: qs, ano, duracaoSegundos: duracao, agora: new Date() }), qs);
  };

  const nCn = prova.filter((q) => q.area === "natureza").length;
  const nMt = prova.length - nCn;
  const nomeAssunto = opcoesAssunto.find((o) => o.chave === chaveAssunto)?.nome ?? "";

  return (
    <>
      {geral && (
        <Card className="gap-5 md:p-6" data-testid="card-prova-dia2">
          <CardHeader>
            <CardTitle className="text-xl">Prova completa do 2º dia</CardTitle>
            <CardDescription>
              Ciências da Natureza e Matemática do ano escolhido, na ordem oficial (caderno azul), 5 horas. Folha de respostas para ir e voltar; a correção sai no fim, com a nota estimada de cada área.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                Ano
                <select value={anoProva} onChange={(e) => setAnoProva(Number(e.target.value))} className={classeSelect} data-testid="ano-prova">
                  {ANOS_PROVA.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="lg" disabled={bloqueado || prova.length === 0} onClick={() => iniciar("prova-dia2", `ENEM ${anoProva} · 2º dia`, prova, anoProva, SEGUNDOS_DIA2)} data-testid="comecar-prova-dia2">
                <Timer /> Começar
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="contagem-prova-dia2">
                {prova.length} questões ({nCn} de natureza e {nMt} de matemática){prova.length < 90 ? ": faltam questões na fonte" : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="gap-5 md:p-6" data-testid="card-bloco-45">
        <CardHeader>
          <CardTitle className="text-xl">Bloco de 45</CardTitle>
          <CardDescription>
            Uma área inteira, como na prova: 45 questões em {formatarRelogio(SEGUNDOS_BLOCO_45)}. Com um ano escolhido, vem na ordem oficial; com anos misturados, as inéditas entram primeiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {areas.length > 1 && (
              <label className="flex items-center gap-2 text-sm font-medium">
                Área
                <select value={areaBloco} onChange={(e) => setAreaBloco(e.target.value as Area)} className={classeSelect} data-testid="area-bloco">
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {NOME_AREA[a]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm font-medium">
              Anos
              <select value={anoBloco} onChange={(e) => setAnoBloco(e.target.value)} className={classeSelect} data-testid="ano-bloco">
                <option value="misturado">misturados</option>
                {ANOS_PROVA.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="lg"
              disabled={bloqueado || bloco.length === 0}
              onClick={() =>
                iniciar(
                  "completo-45",
                  `${NOME_AREA[areaBloco]} · ${anoBloco === "misturado" ? "anos misturados" : `ENEM ${anoBloco}`}`,
                  bloco,
                  anoBloco === "misturado" ? null : Number(anoBloco),
                  SEGUNDOS_BLOCO_45,
                )
              }
              data-testid="comecar-bloco-45"
            >
              <Timer /> Começar
            </Button>
            <span className="text-sm text-muted-foreground" data-testid="contagem-bloco-45">
              {plural(bloco.length, "questão", "questões")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-5 md:p-6" data-testid="card-bloco-assunto">
        <CardHeader>
          <CardTitle className="text-xl">Bloco curto por {areaAssunto === "natureza" ? "competência" : "assunto"}</CardTitle>
          <CardDescription>
            Até 10 questões de um tema, 3 minutos cada. Em natureza, as competências da matriz do INEP (C6 física, C7 química, C8 biologia).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {areas.length > 1 && (
              <label className="flex items-center gap-2 text-sm font-medium">
                Área
                <select value={areaAssunto} onChange={(e) => setAreaAssunto(e.target.value as Area)} className={classeSelect}>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {NOME_AREA[a]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
              Tema
              <select value={chaveAssunto} onChange={(e) => setAssunto(e.target.value)} className={`${classeSelect} max-w-72 truncate`} data-testid="tema-bloco">
                {opcoesAssunto.map((o) => (
                  <option key={o.chave} value={o.chave}>
                    {o.nome} ({o.total})
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="lg"
              disabled={bloqueado || blocoAssunto.length === 0}
              onClick={() => iniciar("assunto", `${NOME_AREA[areaAssunto]} · ${nomeAssunto}`, blocoAssunto, null, blocoAssunto.length * SEGUNDOS_POR_ITEM_ASSUNTO)}
              data-testid="comecar-bloco-assunto"
            >
              <Timer /> Começar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
