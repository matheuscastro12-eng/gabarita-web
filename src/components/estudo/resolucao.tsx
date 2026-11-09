"use client";

import * as React from "react";
import { AlertTriangle, BookOpenCheck, ChevronDown } from "lucide-react";
import type { Questao } from "@/data/tipos";
import { ehAposta } from "@/data/tipos";
import { carregarExplicacao, type ExplicacaoIA } from "@/data/explicacoes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

export const AVISO_DIVERGENTE = "A explicação pode divergir do gabarito oficial, que vale.";

type EstadoIA = { tipo: "carregando" } | { tipo: "pronta"; explicacao: ExplicacaoIA | undefined } | { tipo: "erro" };

/** Busca a explicação de IA de uma questão oficial (só quando `ativo`). */
function useExplicacaoIA(id: string, ativo: boolean): EstadoIA {
  const [estado, setEstado] = React.useState<EstadoIA>({ tipo: "carregando" });
  React.useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    carregarExplicacao(id)
      .then((explicacao) => vivo && setEstado({ tipo: "pronta", explicacao }))
      .catch(() => vivo && setEstado({ tipo: "erro" }));
    return () => {
      vivo = false;
    };
  }, [id, ativo]);
  return estado;
}

function Secao({ titulo, selo, children }: { titulo: string; selo?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold">
        {titulo}
        {selo}
      </h3>
      <Markdown className="text-[15px] leading-relaxed [&_table]:text-sm">{children as string}</Markdown>
    </section>
  );
}

function Aviso({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div role="note" data-testid={testId} className="flex gap-2 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-text">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/** Conteúdo da resolução: apostas (autor + explicação detalhada) ou oficial (IA). */
export function ConteudoResolucao({ questao }: { questao: Questao }) {
  const aposta = ehAposta(questao);
  const ia = useExplicacaoIA(questao.id, !aposta);

  if (aposta) {
    return (
      <div className="flex flex-col gap-4" data-testid="resolucao-conteudo">
        {questao.flags?.length ? (
          <Aviso testId="aviso-flag">
            <strong>Aviso da curadoria (o gabarito continua sendo o do autor):</strong>
            <ul className="list-disc pl-5">
              {questao.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Aviso>
        ) : null}
        {questao.resolucao_autor && (
          <Secao titulo="Resolução do autor" selo={<Badge variant="accent">{questao.resolucao_autor.topico}</Badge>}>
            {questao.resolucao_autor.texto}
          </Secao>
        )}
        {questao.explicacao_detalhada && (
          <Secao titulo="Explicação detalhada" selo={<Badge>passo a passo · conferida na curadoria</Badge>}>
            {questao.explicacao_detalhada}
          </Secao>
        )}
      </div>
    );
  }

  if (ia.tipo === "carregando") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando a resolução">
        <div className="h-4 w-full rounded-sm bg-background dark:bg-surface-2" />
        <div className="h-4 w-11/12 rounded-sm bg-background dark:bg-surface-2" />
        <div className="h-4 w-2/3 rounded-sm bg-background dark:bg-surface-2" />
      </div>
    );
  }
  if (ia.tipo === "erro") {
    return <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text">Não consegui carregar a resolução. Recarregue a página e tente de novo.</p>;
  }
  if (!ia.explicacao) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="resolucao-ausente">
        Esta questão ainda não tem explicação. Peça ao tutor a resolução completa (⌥R).
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3" data-testid="resolucao-conteudo">
      {ia.explicacao.divergente && <Aviso testId="aviso-divergente">{AVISO_DIVERGENTE}</Aviso>}
      <Secao titulo="Explicação gerada por IA" selo={<Badge>pode conter erros · gabarito oficial: {questao.gabarito}</Badge>}>
        {ia.explicacao.texto}
      </Secao>
    </div>
  );
}

/**
 * Resolução recolhida por padrão ("Ver resolução"), para não atrapalhar o tutor.
 * Aparece depois de confirmar (treino/sprint) e na correção do simulado.
 */
export function Resolucao({ questao, className, inicialAberta = false }: { questao: Questao; className?: string; inicialAberta?: boolean }) {
  const [aberta, setAberta] = React.useState(inicialAberta);
  const id = React.useId();
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        aria-expanded={aberta}
        aria-controls={id}
        onClick={() => setAberta((v) => !v)}
        data-testid="ver-resolucao"
      >
        <BookOpenCheck strokeWidth={1.8} /> {aberta ? "Esconder resolução" : "Ver resolução"}
        <ChevronDown className={cn("transition-transform duration-200", aberta && "rotate-180")} strokeWidth={1.8} />
      </Button>
      {aberta && (
        <div id={id} className="anim-entrada rounded-lg border-[1.5px] border-border bg-surface p-4">
          <ConteudoResolucao questao={questao} />
        </div>
      )}
    </div>
  );
}
