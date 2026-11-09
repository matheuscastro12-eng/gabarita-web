"use client";

import * as React from "react";
import Link from "next/link";
import { BookMarked, Copy, RotateCcw, Sparkles } from "lucide-react";
import type { Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import { useQuestoes } from "@/data/use-questoes";
import { useStore } from "@/lib/store/provider";
import { listarCaderno, plural, type EntradaCadernoDetalhada } from "@/lib/dominio";
import { ehNomeGerador, gemeaDaQuestao, gerarGemea, ROTULO_GERADOR, type Gemea, type NomeGerador } from "@/lib/gemeas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CabecalhoPagina, ConteudoPagina, EstadoVazio } from "@/components/app/pagina";
import { Esqueleto, EsqueletoTexto } from "@/components/ui/esqueleto";
import { GemeaCard } from "@/components/estudo/gemea-card";
import { Markdown } from "@/components/estudo/markdown";
import { useResponderGemea } from "@/components/estudo/use-responder-gemea";
import { cn } from "@/lib/utils";

type Filtro = "abertos" | "todos";

/** `gemea-<gerador>-<semente>` → gerador e semente (a mesma semente regenera a mesma gêmea). */
export function lerIdGemea(id: string): { gerador: NomeGerador; semente: number } | null {
  const m = /^gemea-(.+)-(\d+)$/.exec(id);
  if (!m || !ehNomeGerador(m[1]!)) return null;
  return { gerador: m[1], semente: Number(m[2]) };
}

/** Caderno de erros: cada erro com a questão, a alternativa marcada, o equívoco e as ações refazer / gêmea. */
export function TelaCaderno() {
  const { estado, erro: erroStore } = useStore();
  const { porId, erro: erroQuestoes } = useQuestoes();
  const agora = React.useMemo(() => (estado ? new Date() : null), [estado]);
  const [filtro, setFiltro] = React.useState<Filtro>("abertos");
  const [habilidade, setHabilidade] = React.useState<string>("todas");
  const [gemeaAberta, setGemeaAberta] = React.useState<{ rotulo: string; pai: Pick<Questao, "habilidade" | "competencia">; gemea: Gemea } | null>(null);
  const responderGemea = useResponderGemea(porId);

  const lista = React.useMemo(() => (estado && agora ? listarCaderno(estado, agora) : null), [estado, agora]);
  const habilidades = React.useMemo(
    () => (lista ? [...new Set(lista.map((e) => e.habilidade))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))) : []),
    [lista],
  );
  const visiveis = React.useMemo(
    () => lista?.filter((e) => (filtro === "todos" || e.resolvidaEm === null) && (habilidade === "todas" || e.habilidade === habilidade)) ?? null,
    [lista, filtro, habilidade],
  );
  const abertos = lista?.filter((e) => e.resolvidaEm === null).length ?? 0;
  const vencidas = lista?.filter((e) => e.resolvidaEm === null && e.revisaoVencida).length ?? 0;

  const totalGemeas = estado ? estado.tentativas.filter((t) => t.origem === "gemea").length : 0;

  /** Nova gêmea da questão oficial (semente muda com o total de gêmeas já feitas). */
  const abrirGemea = (questao: Questao) => {
    const gemea = gemeaDaQuestao(questao, totalGemeas);
    if (gemea) setGemeaAberta({ rotulo: `ENEM ${questao.ano} · Q${questao.numero}`, pai: questao, gemea });
  };

  /** Entrada que já é uma gêmea: refazer regenera a mesma (mesma semente); nova muda a semente. */
  const abrirGemeaDeEntrada = (entrada: EntradaCadernoDetalhada, nova: boolean) => {
    const lida = lerIdGemea(entrada.questaoId);
    if (!lida) return;
    const gemea = nova ? gerarGemea(lida.gerador, lida.semente + 1 + totalGemeas) : gerarGemea(lida.gerador, lida.semente);
    setGemeaAberta({ rotulo: `gêmea de ${ROTULO_GERADOR[lida.gerador].toLowerCase()}`, pai: { habilidade: entrada.habilidade, competencia: null }, gemea });
  };

  const erro = erroStore ?? erroQuestoes;

  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Caderno de erros"
        descricao="Todo erro entra aqui sozinho, com a alternativa marcada e o porquê. Refazer e acertar fecha a entrada."
        acoes={
          lista && lista.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={abertos > 0 ? "destaque" : "sucesso"}>{plural(abertos, "erro aberto", "erros abertos")}</Badge>
              {vencidas > 0 && (
                <Badge variant="aviso">
                  <RotateCcw /> {plural(vencidas, "revisão vencida", "revisões vencidas")}
                </Badge>
              )}
            </div>
          ) : null
        }
      />

      {erro && (
        <div role="alert" className="rounded-lg bg-erro-suave px-4 py-3 text-sm">
          <p className="font-semibold text-erro">Não consegui carregar seus dados.</p>
          <p className="text-muted-foreground">{erro}</p>
        </div>
      )}

      {lista === null && !erro && (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando o caderno">
          <Esqueleto className="h-9 w-56" />
          {[0, 1].map((i) => (
            <Card key={i} className="gap-3">
              <Esqueleto className="h-5 w-40" />
              <EsqueletoTexto linhas={2} />
              <Esqueleto className="h-10 w-full" />
            </Card>
          ))}
        </div>
      )}

      {lista && lista.length === 0 && (
        <EstadoVazio
          icone={<BookMarked />}
          titulo="Nenhum erro ainda"
          descricao="Quando você errar uma questão num sprint ou simulado, ela aparece aqui com a alternativa marcada e o equívoco diagnosticado."
          acao={
            <Button asChild>
              <Link href="/estudar">Começar um sprint</Link>
            </Button>
          }
        />
      )}

      {lista && lista.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Filtros do caderno">
            <div className="inline-flex gap-1.75" role="radiogroup" aria-label="Mostrar">
              {(["abertos", "todos"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={filtro === f}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    "h-9 rounded-full border-[1.5px] border-border bg-card px-3.5 text-[13px] font-semibold text-foreground transition-colors duration-(--duracao)",
                    filtro === f && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {f === "abertos" ? "Abertos" : "Todos"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Habilidade</span>
              <select value={habilidade} onChange={(e) => setHabilidade(e.target.value)} className="h-9 rounded-md border-[1.5px] border-input bg-card px-2.5 text-sm font-semibold">
                <option value="todas">todas</option>
                {habilidades.map((h) => (
                  <option key={h} value={h}>
                    {h} · {NOME_HABILIDADE[h]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visiveis && visiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro com esse filtro.</p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="lista-caderno">
              {visiveis?.map((e) => (
                <li key={e.id}>
                  <EntradaView entrada={e} questao={porId?.get(e.questaoId)} aoGemea={abrirGemea} aoGemeaDeEntrada={abrirGemeaDeEntrada} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog open={gemeaAberta !== null} onOpenChange={(aberta) => !aberta && setGemeaAberta(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Questão gêmea</DialogTitle>
            <DialogDescription>
              Mesma estrutura {gemeaAberta ? `de ${gemeaAberta.rotulo}` : "da questão"}, números novos. A resposta sai do código, e a tentativa conta com peso 0,6 no domínio.
            </DialogDescription>
          </DialogHeader>
          {gemeaAberta && (
            <div className="max-h-[65vh] overflow-y-auto">
              <GemeaCard key={gemeaAberta.gemea.id} gemea={gemeaAberta.gemea} aoResponder={(r) => responderGemea(gemeaAberta.pai, r)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ConteudoPagina>
  );
}

function EntradaView({
  entrada,
  questao,
  aoGemea,
  aoGemeaDeEntrada,
}: {
  entrada: EntradaCadernoDetalhada;
  questao: Questao | undefined;
  aoGemea: (q: Questao) => void;
  aoGemeaDeEntrada: (e: EntradaCadernoDetalhada, nova: boolean) => void;
}) {
  const resolvida = entrada.resolvidaEm !== null;
  const temGemea = !!questao && gemeaDaQuestao(questao) !== null;
  const idGemea = lerIdGemea(entrada.questaoId);
  const gemeaOriginal = React.useMemo(() => (idGemea ? gerarGemea(idGemea.gerador, idGemea.semente) : null), [idGemea]);
  const data = new Date(entrada.em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const alternativas = questao?.alternativas ?? gemeaOriginal?.alternativas;
  const marcada = entrada.escolha ? alternativas?.find((a) => a.letra === entrada.escolha) : undefined;
  const correta = alternativas?.find((a) => a.letra === entrada.gabarito);
  return (
    <Card className={cn("gap-3", resolvida && "opacity-70")} data-testid="entrada-caderno" data-resolvida={resolvida}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">
          {questao ? `ENEM ${questao.ano} · Q${questao.numero}` : idGemea ? `Gêmea · ${ROTULO_GERADOR[idGemea.gerador]}` : entrada.questaoId}
        </span>
        <Badge variant="destaque" title={NOME_HABILIDADE[entrada.habilidade]}>
          {entrada.habilidade}
        </Badge>
        {questao?.dificuldade_estimada && <Badge variant="outline">{questao.dificuldade_estimada === "facil" ? "fácil" : questao.dificuldade_estimada === "media" ? "média" : "difícil"}</Badge>}
        {entrada.vezes > 1 && <Badge variant="aviso">errada {entrada.vezes}×</Badge>}
        {entrada.revisaoVencida && !resolvida && (
          <Badge variant="aviso">
            <RotateCcw /> revisão vencida
          </Badge>
        )}
        {resolvida && <Badge variant="sucesso">resolvida</Badge>}
        <span className="ml-auto text-xs text-muted-foreground">{data}</span>
      </div>

      {(questao || gemeaOriginal) && (
        <div className="max-h-24 overflow-hidden text-sm text-muted-foreground [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
          <Markdown className="text-[15px] leading-relaxed [&_img]:hidden">{questao ? questao.enunciado : gemeaOriginal!.enunciado}</Markdown>
        </div>
      )}

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Marcou</dt>
          <dd className={cn("min-w-0 font-semibold", entrada.escolha ? "text-erro" : "text-muted-foreground")} data-testid="marcou">
            {entrada.escolha ? <>{entrada.escolha}{marcada?.texto ? <span className="font-normal text-foreground"> · <Markdown inline>{marcada.texto}</Markdown></span> : null}</> : "pulou"}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Gabarito</dt>
          <dd className="min-w-0 font-semibold text-sucesso">
            {entrada.gabarito}
            {correta?.texto ? <span className="font-normal text-foreground"> · <Markdown inline>{correta.texto}</Markdown></span> : null}
          </dd>
        </div>
      </dl>

      <div className="rounded-md bg-muted px-3 py-2 text-sm" data-testid="equivoco">
        <span className="font-semibold">Equívoco: </span>
        {entrada.porQue ? <span>{entrada.porQue}</span> : <span className="text-muted-foreground">sem diagnóstico ainda. Refaça com o tutor e peça “por que errei?”.</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {idGemea ? (
          <>
            <Button size="sm" onClick={() => aoGemeaDeEntrada(entrada, false)} data-testid="refazer">
              <RotateCcw /> Refazer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => aoGemeaDeEntrada(entrada, true)} data-testid="gemea-caderno">
              <Copy /> Nova gêmea
            </Button>
          </>
        ) : (
          <Button size="sm" asChild data-testid="refazer">
            <Link href={`/estudar?questao=${encodeURIComponent(entrada.questaoId)}`}>
              <RotateCcw /> Refazer
            </Link>
          </Button>
        )}
        {questao && (
          <Button size="sm" variant="secondary" disabled={!temGemea} title={temGemea ? undefined : "Ainda não há gerador de gêmea para este assunto"} onClick={() => aoGemea(questao)} data-testid="gemea-caderno">
            <Copy /> Gêmea
          </Button>
        )}
        {questao?.resolucao && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" /> resolução curada disponível no tutor
          </span>
        )}
      </div>
    </Card>
  );
}
