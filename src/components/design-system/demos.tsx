"use client";

import * as React from "react";
import { Check, Info } from "lucide-react";
import type { Alternativa, Letra } from "@/data/tipos";
import { cn } from "@/lib/utils";
import { Alternativas } from "@/components/estudo/alternativas";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Esqueleto, EsqueletoTexto } from "@/components/ui/esqueleto";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { TUTOR_VISIVEL } from "@/lib/tutor/visivel";

/* ------------------------------ Cores ------------------------------ */

const CORES: { token: string; papel: string }[] = [
  { token: "--background", papel: "fundo da página, trilho das barras" },
  { token: "--surface", papel: TUTOR_VISIVEL ? "cards, sidebar, tutor" : "cards e sidebar" },
  { token: "--surface-2", papel: "hover sobre o card" },
  { token: "--foreground", papel: "texto" },
  { token: "--muted-foreground", papel: "texto suave, ícones do menu" },
  { token: "--border", papel: "linha (1,5px)" },
  { token: "--input", papel: "borda de campo" },
  { token: "--accent", papel: "azul: chip ativo, marca, foco" },
  { token: "--accent-solid", papel: "azul sólido: preenchimento com texto branco" },
  { token: "--accent-text", papel: "azul em texto" },
  { token: "--accent-soft", papel: "azul suave: menu ativo, tags" },
  { token: "--accent-deep", papel: "azul fundo: fim do hero, hover" },
  { token: "--success", papel: "sucesso: alternativa certa" },
  { token: "--success-text", papel: "texto de acerto" },
  { token: "--success-soft", papel: "tag de sucesso" },
  { token: "--success-tint", papel: "fundo da alternativa certa" },
  { token: "--danger", papel: "erro: alternativa errada" },
  { token: "--danger-text", papel: "texto de erro" },
  { token: "--danger-soft", papel: "caixa e tag de erro" },
  { token: "--danger-tint", papel: "fundo da alternativa errada" },
  { token: "--warning", papel: "aviso" },
  { token: "--warning-text", papel: "texto de aviso" },
  { token: "--warning-soft", papel: "caixa e tag de aviso" },
  { token: "--marca-texto", papel: "<mark>" },
];

/** Amostras lidas dos tokens do CSS (mudam com o tema). Tokens ausentes no CSS não aparecem. */
export function AmostrasCores() {
  const [valores, setValores] = React.useState<Record<string, string> | null>(null);

  React.useEffect(() => {
    const ler = () => {
      const estilo = getComputedStyle(document.documentElement);
      setValores(Object.fromEntries(CORES.map((c) => [c.token, estilo.getPropertyValue(c.token).trim()])));
    };
    ler();
    const obs = new MutationObserver(ler);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => obs.disconnect();
  }, []);

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {CORES.filter((c) => !valores || valores[c.token]).map((c) => (
        <li key={c.token} className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="size-11 shrink-0 rounded-md border-[1.5px] border-border" style={{ background: `var(${c.token})` }} />
          <span className="flex min-w-0 flex-col">
            <code className="truncate font-mono text-xs font-semibold">{c.token}</code>
            <span className="text-xs text-muted-foreground">{c.papel}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{valores?.[c.token] ?? " "}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Chips ------------------------------ */

const FILTROS = ["Todas", "H17", "H21", "H24", "Erradas"];

export function ChipsFiltro() {
  const [ativo, setAtivo] = React.useState("H21");
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de exemplo">
      {FILTROS.map((f) => {
        const on = f === ativo;
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            onClick={() => setAtivo(f)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold",
              "transition-[background-color,border-color,color] duration-(--duration) ease-(--ease)",
              on ? "border-accent bg-accent text-white" : "border-border bg-surface text-foreground hover:border-accent",
            )}
          >
            {on && <Check className="size-4" />}
            {f}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Alternativas ------------------------------ */

const ALTERNATIVAS: Alternativa[] = [
  { letra: "A", texto: "R$ 12,00" },
  { letra: "B", texto: "R$ 15,60" },
  { letra: "C", texto: "R$ 18,00" },
  { letra: "D", texto: "R$ 20,40" },
  { letra: "E", texto: "R$ 24,00" },
];

export function DemoAlternativas() {
  const [marcada, setMarcada] = React.useState<Letra | null>("C");
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-muted-foreground">Marcada (clique para trocar)</p>
        <Alternativas alternativas={ALTERNATIVAS} marcada={marcada} confirmada={false} aoMarcar={setMarcada} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-muted-foreground">Confirmada: certa</p>
        <Alternativas alternativas={ALTERNATIVAS} marcada="B" gabarito="B" confirmada aoMarcar={() => {}} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-muted-foreground">Confirmada: errada</p>
        <Alternativas alternativas={ALTERNATIVAS} marcada="D" gabarito="B" confirmada aoMarcar={() => {}} />
      </div>
    </div>
  );
}

/* ------------------------------ Componentes interativos ------------------------------ */

export function DemoInterativos() {
  const { notificar } = useToast();
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-muted-foreground">Progress</p>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="num w-10 shrink-0 font-semibold">22%</span>
          <Progress value={22} aria-label="Exemplo 22%" />
        </div>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="num w-10 shrink-0 font-semibold">85%</span>
          <Progress value={85} tom="success" aria-label="Exemplo 85%" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-muted-foreground">Tabs</p>
        <Tabs defaultValue="questao">
          <TabsList>
            <TabsTrigger value="questao">Questão</TabsTrigger>
            {TUTOR_VISIVEL && <TabsTrigger value="tutor">Tutor</TabsTrigger>}
            <TabsTrigger value="lab">Laboratório</TabsTrigger>
          </TabsList>
          <TabsContent value="questao" className="text-sm text-muted-foreground">O enunciado e as alternativas.</TabsContent>
          {TUTOR_VISIVEL && <TabsContent value="tutor" className="text-sm text-muted-foreground">A conversa com o tutor.</TabsContent>}
          <TabsContent value="lab" className="text-sm text-muted-foreground">Python e o plotador.</TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-muted-foreground">Esqueleto</p>
        <div className="flex items-center gap-3">
          <Esqueleto className="size-11 shrink-0 rounded-md" />
          <EsqueletoTexto linhas={2} className="flex-1" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-muted-foreground">Tooltip, diálogo e toasts</p>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Info /> Passe o mouse
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Abrir a paleta <Kbd>Ctrl K</Kbd>
            </TooltipContent>
          </Tooltip>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                Abrir diálogo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Encerrar o sprint?</DialogTitle>
                <DialogDescription>As 3 questões respondidas ficam salvas. As outras 2 voltam para a fila.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Continuar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Encerrar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => notificar({ tipo: "sucesso", titulo: "Meta 750 salva.", descricao: "Entra no critério “pronto para a prova”." })}>
            Toast sucesso
          </Button>
          <Button variant="outline" size="sm" onClick={() => notificar({ tipo: "erro", titulo: "Não consegui salvar.", descricao: "Confira o espaço do navegador e tente de novo." })}>
            Toast erro
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              notificar(
                TUTOR_VISIVEL
                  ? { tipo: "aviso", titulo: "Tutor em modo guiado.", descricao: "Sem chave da API: só dicas prontas." }
                  : { tipo: "aviso", titulo: "Cronômetro escondido.", descricao: "O tempo da questão continua sendo medido." },
              )
            }
          >
            Toast aviso
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Movimento ------------------------------ */

const ANIMACOES = ["anim-entrada", "anim-pop", "anim-assenta", "anim-shake"];

export function DemoMovimento() {
  const [rodada, setRodada] = React.useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ANIMACOES.map((a) => (
          <div
            key={`${a}-${rodada}`}
            className={cn("flex h-20 items-center justify-center rounded-lg bg-accent-soft font-mono text-xs font-semibold text-accent-text", a)}
          >
            .{a}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => setRodada((r) => r + 1)}>
          Repetir
        </Button>
        <p className="text-xs text-muted-foreground">180–240ms, cubic-bezier(.2,0,0,1); só transform e opacity; desliga com prefers-reduced-motion.</p>
      </div>
    </div>
  );
}
