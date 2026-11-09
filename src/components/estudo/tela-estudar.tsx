"use client";

import * as React from "react";
import Link from "next/link";
import type { Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import { useQuestoes } from "@/data/use-questoes";
import { MODO, limiarFacilDoModo } from "@/data/modo";
import { useStore } from "@/lib/store/provider";
import {
  encerrarSprint,
  iniciarSprint,
  montarFila,
  prontoHabilidade,
  registrarEventoTutor,
  registrarTentativa,
  resumoSprint,
  formatarDecimal,
} from "@/lib/dominio";
import type { EntradaEvento } from "@/lib/dominio/eventos";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { resumirAluno } from "@/lib/tutor/prompt";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck } from "lucide-react";
import { ConteudoPagina, EstadoErro, EstadoVazio } from "@/components/app/pagina";
import { useToast } from "@/components/ui/toast";
import { FimSprint } from "./fim-sprint";
import { IDE, type RespostaQuestao } from "./ide";
import { useResponderGemea } from "./use-responder-gemea";

type Fase =
  | { tipo: "carregando" }
  | { tipo: "vazio" }
  | { tipo: "sprint"; sprintId: string; questoes: Questao[]; indice: number; respostas: (RespostaQuestao | null)[] }
  | { tipo: "fim"; sprintId: string };

/** Tela Estudar: monta a fila, inicia o sprint, registra cada tentativa e mostra o fim. */
export function TelaEstudar() {
  const { estado, atualizar, erro: erroStore } = useStore();
  const { questoes, porId, erro: erroQuestoes } = useQuestoes();
  const { notificar } = useToast();
  const [fase, setFase] = React.useState<Fase>({ tipo: "carregando" });
  const iniciandoRef = React.useRef(false);

  const iniciar = React.useCallback(async () => {
    if (!estado || !questoes || iniciandoRef.current) return;
    iniciandoRef.current = true;
    try {
      const agora = new Date();
      const bs = questoes.flatMap((q) => (q.tri ? [q.tri.b] : []));
      let fila = montarFila({ questoes, estado, agora, limiarFacil: limiarFacilDoModo(bs), theta: null, repetirRevisoesSeVazia: MODO.soFaceis });
      // ?questao=enem-2022-154 põe uma questão específica na frente (refazer do caderno, e2e).
      const pedida = new URLSearchParams(window.location.search).get("questao");
      const questaoPedida = pedida ? questoes.find((q) => q.id === pedida) : undefined;
      if (questaoPedida) fila = [questaoPedida, ...fila.filter((q) => q.id !== questaoPedida.id)].slice(0, Math.max(fila.length, 1));
      if (fila.length === 0) {
        setFase({ tipo: "vazio" });
        return;
      }
      let sprintId = "";
      await atualizar((e) => {
        const r = iniciarSprint(e, fila.map((q) => q.id), agora);
        sprintId = r.sprint.id;
        return r.estado;
      });
      setFase({ tipo: "sprint", sprintId, questoes: fila, indice: 0, respostas: fila.map(() => null) });
    } catch (e) {
      notificar({ tipo: "erro", titulo: "Não consegui iniciar o sprint", descricao: e instanceof Error ? e.message : undefined });
    } finally {
      iniciandoRef.current = false;
    }
  }, [estado, questoes, atualizar, notificar]);

  // Inicia assim que estado e questões estiverem prontos (uma vez).
  const jaIniciou = React.useRef(false);
  React.useEffect(() => {
    if (jaIniciou.current || !estado || !questoes) return;
    jaIniciou.current = true;
    void iniciar();
  }, [estado, questoes, iniciar]);

  const responder = React.useCallback(
    (resposta: RespostaQuestao) => {
      if (fase.tipo !== "sprint" || !porId) return;
      const questao = fase.questoes[fase.indice];
      if (!questao) return;
      const agora = new Date();
      const porQue = questao.resolucao?.erros_comuns.find((e) => e.alternativa === resposta.escolha)?.por_que ?? null;
      setFase({ ...fase, respostas: fase.respostas.map((r, i) => (i === fase.indice ? resposta : r)) });
      atualizar((e: EstadoAluno) =>
        registrarTentativa(
          e,
          {
            questao,
            escolha: resposta.escolha,
            segundos: resposta.segundos,
            degrauMaximo: resposta.degrauMaximo,
            pediuResposta: resposta.pediuResposta,
            origem: "oficial",
            sprintId: fase.sprintId,
            porQue,
            buscarQuestao: (id) => porId.get(id),
          },
          agora,
        ).estado,
      ).catch((err: unknown) => {
        notificar({ tipo: "erro", titulo: "Não consegui salvar a tentativa", descricao: err instanceof Error ? err.message : undefined });
      });
    },
    [fase, porId, atualizar, notificar],
  );

  const avancar = React.useCallback(() => {
    if (fase.tipo !== "sprint") return;
    if (fase.respostas[fase.indice] === null) return;
    if (fase.indice + 1 < fase.questoes.length) {
      setFase({ ...fase, indice: fase.indice + 1 });
      return;
    }
    const agora = new Date();
    void atualizar((e) => encerrarSprint(e, fase.sprintId, agora));
    setFase({ tipo: "fim", sprintId: fase.sprintId });
  }, [fase, atualizar]);

  const registrarEvento = React.useCallback(
    (evento: EntradaEvento) => {
      atualizar((e) => registrarEventoTutor(e, evento, new Date()).estado).catch(() => {
        /* evento do tutor é auxiliar: não interrompe o estudo */
      });
    },
    [atualizar],
  );

  const responderGemea = useResponderGemea(porId);

  const novoSprint = React.useCallback(() => {
    setFase({ tipo: "carregando" });
    jaIniciou.current = false;
  }, []);

  const erro = erroStore ?? erroQuestoes;
  if (erro) {
    return (
      <ConteudoPagina className="justify-center">
        <EstadoErro titulo="Não consegui carregar" descricao={erro} acao={<Button onClick={() => window.location.reload()}>Tentar de novo</Button>} />
      </ConteudoPagina>
    );
  }

  if (fase.tipo === "carregando" || !estado || !porId) {
    return <EsqueletoIDE />;
  }

  if (fase.tipo === "vazio") {
    return (
      <ConteudoPagina className="justify-center">
        <EstadoVazio
          icone={<CalendarCheck />}
          titulo="Nada para estudar agora"
          descricao="Todas as questões disponíveis foram acertadas nos últimos 7 dias. Volte amanhã ou sincronize mais questões com pnpm sync-provas."
          acao={
            <Button asChild>
              <Link href="/">Voltar para Hoje</Link>
            </Button>
          }
        />
      </ConteudoPagina>
    );
  }

  if (fase.tipo === "fim") {
    const r = resumoSprint(estado, fase.sprintId);
    return (
      <FimSprint
        tentativas={r.tentativas}
        acertos={r.acertos}
        deltaPorHabilidade={r.deltaPorHabilidade}
        porId={porId}
        aoNovoSprint={novoSprint}
      />
    );
  }

  const questaoAtual = fase.questoes[fase.indice];
  const hab = questaoAtual?.habilidade ? estado.habilidades[questaoAtual.habilidade] : undefined;
  const pronto = hab ? prontoHabilidade({ estado: hab, tentativas: estado.tentativas, agora: new Date() }) : null;
  const contextoAluno = {
    resumo: resumirAluno(estado, questaoAtual?.habilidade ?? null),
    perfil: { nome: estado.perfil.nome, explicaDoMeuJeito: estado.perfil.explicaDoMeuJeito },
  };

  return (
    <IDE
      questoes={fase.questoes}
      indice={fase.indice}
      respostas={fase.respostas}
      mostrarTimer={estado.perfil.mostrarTimer}
      aoResponder={responder}
      aoAvancar={avancar}
      contextoAluno={contextoAluno}
      aoEvento={registrarEvento}
      aoResponderGemea={responderGemea}
      rodape={
        questaoAtual?.habilidade ? (
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
              domínio <span className="num">{questaoAtual.habilidade}</span>
              <span className="sr-only"> {NOME_HABILIDADE[questaoAtual.habilidade]}</span>
            </span>
            <Progress value={(hab?.dominio ?? 0.3) * 100} className="max-w-48" />
            <span className="num text-[13px] font-bold">{formatarDecimal(hab?.dominio ?? 0.3, 2)}</span>
            <span className="hidden min-w-0 truncate text-[13px] text-muted-foreground sm:inline" data-testid="falta">
              {pronto ? (pronto.pronto ? "pronto nesta habilidade" : pronto.faltas[0]) : "primeiro item desta habilidade"}
            </span>
          </div>
        ) : null
      }
    />
  );
}

function EsqueletoIDE() {
  return (
    <div className="flex h-full flex-col bg-background" aria-busy="true" aria-label="Carregando o sprint">
      <div className="h-12 border-b border-border bg-surface" />
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[58%_1fr]">
        <div className="p-4">
          <div className="mx-auto flex max-w-[760px] flex-col gap-4 rounded-xl bg-surface p-5 shadow-card">
            <div className="h-5 w-40 rounded-sm bg-background" />
            <div className="h-4 w-full rounded-sm bg-background" />
            <div className="h-4 w-11/12 rounded-sm bg-background" />
            <div className="h-4 w-3/4 rounded-sm bg-background" />
            <div className="mt-2 flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-13 rounded-lg border-[1.5px] border-border" />
              ))}
            </div>
          </div>
        </div>
        <div className="hidden border-l border-border bg-surface p-6 md:block">
          <div className="h-5 w-24 rounded-sm bg-background" />
        </div>
      </div>
    </div>
  );
}
