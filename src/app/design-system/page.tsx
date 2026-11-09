import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, Calendar, CheckCircle2, CircleAlert, Inbox, Play, RotateCcw, Target, TriangleAlert, type LucideIcon } from "lucide-react";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Contador } from "@/components/ui/contador";
import { EsqueletoTexto, Esqueleto } from "@/components/ui/esqueleto";
import { Kbd } from "@/components/ui/kbd";
import { AmostrasCores, ChipsFiltro, DemoAlternativas, DemoInterativos, DemoMovimento } from "@/components/design-system/demos";
import { PARES_CONTRASTE } from "@/components/design-system/contraste-dados";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Design system", robots: { index: false, follow: false } };

const ESCALA = [
  { px: 12, classe: "text-xs", frase: "Texto pequeno: fonte da questão e detalhes." },
  { px: 14, classe: "text-sm", frase: "Interface: menus, botões e descrições." },
  { px: 16, classe: "text-base", frase: "Corpo: o texto de leitura do app." },
  { px: 19, classe: "text-lg font-bold", frase: "H2: título de card." },
  { px: 24, classe: "text-xl font-extrabold", frase: "Título de diálogo grande." },
  { px: 28, classe: "text-2xl font-extrabold tracking-[-0.4px]", frase: "H1 da tela." },
  { px: 40, classe: "num text-3xl font-extrabold", frase: "391" },
];

const VARIANTES_BOTAO = ["primary", "secondary", "ghost", "outline", "danger", "link"] as const;
const TAMANHOS_BOTAO = ["sm", "md", "lg"] as const;
const VARIANTES_BADGE = ["neutral", "accent", "success", "danger", "warning", "outline", "solid"] as const;

/** Rótulo pequeno dentro dos cards da página. */
function Rotulo({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold text-muted-foreground">{children}</p>;
}

/** Stat card do Hoje (mesma marcação de tela-hoje.tsx, sem a lógica). */
function Stat({ hero = false, titulo, Icone, valor, detalhe }: { hero?: boolean; titulo: string; Icone: LucideIcon; valor: string; detalhe: string }) {
  return (
    <div className={cn("flex min-h-[104px] flex-col rounded-xl p-4 md:min-h-32 md:p-4.5", hero ? "hero-azul" : "border border-card-borda bg-surface shadow-card")}>
      <div className={cn("flex items-center justify-between gap-2 text-[13px] font-semibold", hero ? "text-white/90" : "text-foreground")}>
        <span>{titulo}</span>
        <Icone className={cn("size-4 shrink-0", hero ? "text-white/85" : "text-muted-foreground")} strokeWidth={1.8} aria-hidden />
      </div>
      <p className={cn("num mt-auto text-[30px] leading-none font-extrabold md:text-3xl", hero ? "text-white" : "text-foreground")}>
        <Contador valor={valor} />
      </p>
      <p className={cn("mt-1.5 line-clamp-2 text-[11.5px] leading-snug", hero ? "text-white/85" : "text-muted-foreground")}>{detalhe}</p>
    </div>
  );
}

const CAMPO = "h-11 rounded-md border-[1.5px] border-input bg-surface px-3.5 font-medium focus-visible:border-accent focus-visible:outline-none";

export default function PaginaDesignSystem() {
  return (
    <ConteudoPagina>
      <CabecalhoPagina
        titulo="Design system"
        descricao="O design system original do Gabarita: cards brancos sobre cinza-azulado, azul de sistema, números arredondados e enunciado em serifa."
        acoes={<Badge variant="accent">dados de exemplo</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Cores</CardTitle>
          <CardDescription>Lidas dos tokens do CSS; mudam com o tema.</CardDescription>
        </CardHeader>
        <AmostrasCores />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
        </CardHeader>
        <CardContent className="gap-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Rotulo>Interface · fonte do sistema</Rotulo>
              <p className="text-base">Resolva 5 questões e veja o domínio subir.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Rotulo>.num / font-rounded · marca e números</Rotulo>
              <div className="flex items-end gap-4">
                <span className="num text-[40px] leading-none font-extrabold">391</span>
                <span className="num text-xl font-extrabold">Gabarita</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Rotulo>.qtext · enunciado em serifa</Rotulo>
              <p className="qtext">
                Uma loja oferece <mark>20% de desconto</mark> em uma camisa de R$ 78,00 e, depois, mais 10% sobre o novo preço. Qual é o valor final pago?
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Rotulo>Mono · cronômetro</Rotulo>
              <span className="w-fit rounded-sm bg-background px-2.25 py-0.75 font-mono text-sm font-semibold dark:bg-surface-2">02:41</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t-[1.5px] border-border pt-4">
            <Rotulo>Escala</Rotulo>
            {ESCALA.map((e) => (
              <div key={e.px} className="flex min-w-0 items-baseline gap-4">
                <span className="num w-8 shrink-0 text-xs text-muted-foreground">{e.px}</span>
                <span className={cn("min-w-0 break-words", e.classe)}>{e.frase}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Botões</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          {TAMANHOS_BOTAO.map((t) => (
            <div key={t} className="flex flex-col gap-2">
              <Rotulo>Tamanho {t}</Rotulo>
              <div className="flex flex-wrap items-center gap-2">
                {VARIANTES_BOTAO.map((v) => (
                  <Button key={v} variant={v} size={t}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Rotulo>Ícone, desabilitado e com atalho</Rotulo>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="icon" variant="outline" aria-label="Repetir">
                <RotateCcw />
              </Button>
              <Button size="icon-sm" variant="secondary" aria-label="Próxima">
                <ArrowRight />
              </Button>
              <Button disabled>Confirmar</Button>
              <Button size="lg">
                <Play /> Começar <Kbd className="border-white/30 bg-white/20 text-white">Enter</Kbd>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chips e tags</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <div className="flex flex-col gap-2">
            <Rotulo>Chips de filtro</Rotulo>
            <ChipsFiltro />
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Badge</Rotulo>
            <div className="flex flex-wrap gap-2">
              {VARIANTES_BADGE.map((v) => (
                <Badge key={v} variant={v}>
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stat cards</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <Stat hero titulo="Dias até a prova" Icone={Calendar} valor="18" detalhe="Faltam 18 dias · meta 750" />
          <Stat titulo="Resolvidas hoje" Icone={CheckCircle2} valor="10" detalhe="7 acertos · 2 sprints" />
          <Stat titulo="Nota estimada" Icone={Target} valor="642" detalhe="598–686 · estimativa" />
          <Stat titulo="Revisões vencidas" Icone={RotateCcw} valor="3" detalhe="H17, H21, H24" />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alternativas</CardTitle>
          <CardDescription>O componente Alternativas do estudo, com dados de exemplo.</CardDescription>
        </CardHeader>
        <DemoAlternativas />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos</CardTitle>
        </CardHeader>
        <CardContent className="sm:flex-row sm:flex-wrap sm:gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Como te chamamos</span>
            <input defaultValue="Matheus" className={cn(CAMPO, "max-w-xs")} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Área</span>
            <select defaultValue="mat" className={CAMPO}>
              <option value="mat">Matemática</option>
              <option value="nat">Ciências da Natureza</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Meta de nota (matemática)</span>
            <input
              defaultValue="1200"
              inputMode="numeric"
              aria-invalid
              className="num h-11 w-32 rounded-md border-[1.5px] border-danger bg-surface px-3.5 font-semibold focus-visible:border-accent focus-visible:outline-none"
            />
            <span className="text-xs font-medium text-danger-text">Use um número entre 300 e 1000.</span>
          </label>
          <label className="flex w-full flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Texto livre</span>
            <textarea
              rows={3}
              placeholder="Ex.: prefiro exemplos com dinheiro; me pergunte antes de dar a conta."
              className="w-full resize-y rounded-md border-[1.5px] border-input bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed focus-visible:border-accent focus-visible:outline-none"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Barras, abas, esqueleto, tooltip, diálogo, toast</CardTitle>
        </CardHeader>
        <DemoInterativos />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raios, sombras e movimento</CardTitle>
        </CardHeader>
        <CardContent className="gap-5">
          <div className="flex flex-col gap-2">
            <Rotulo>Raios</Rotulo>
            <div className="flex flex-wrap gap-3">
              {[
                { px: 8, c: "rounded-sm", uso: "tags" },
                { px: 12, c: "rounded-md", uso: "campos" },
                { px: 14, c: "rounded-lg", uso: "alternativas" },
                { px: 20, c: "rounded-xl", uso: "cards" },
              ].map((r) => (
                <div key={r.px} className="flex flex-col items-center gap-1.5">
                  <div className={cn("size-16 border-[1.5px] border-accent bg-accent-soft", r.c)} />
                  <span className="num text-xs font-semibold">{r.px}px</span>
                  <span className="text-xs text-muted-foreground">{r.uso}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Sombras</Rotulo>
            <div className="grid grid-cols-1 gap-4 bg-background p-4 sm:grid-cols-2 rounded-lg dark:bg-transparent">
              <div className="flex h-20 items-center justify-center rounded-xl border border-card-borda bg-surface text-sm font-semibold shadow-card">card</div>
              <div className="flex h-20 items-center justify-center rounded-xl border border-card-borda bg-surface text-sm font-semibold shadow-flutuante">flutuante</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Movimento</Rotulo>
            <DemoMovimento />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estados</CardTitle>
          <CardDescription>Os seis estados obrigatórios do DESIGN.md §5.</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Rotulo>Loading</Rotulo>
            <div className="flex flex-col gap-3 rounded-xl border-[1.5px] border-border bg-surface p-4">
              <Esqueleto className="h-5 w-1/2" />
              <EsqueletoTexto linhas={3} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Empty</Rotulo>
            <div className="flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface p-4 text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-accent-soft text-accent">
                <Inbox className="size-5" />
              </span>
              <p className="font-bold">Caderno vazio</p>
              <p className="text-sm text-muted-foreground">As questões que você errar aparecem aqui.</p>
              <Button size="sm">Começar um sprint</Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Error</Rotulo>
            <div role="alert" className="rounded-lg border-[1.5px] border-danger/30 bg-danger-soft px-4 py-3 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-danger-text">
                <CircleAlert className="size-4" /> Não consegui carregar seus dados.
              </p>
              <p className="text-muted-foreground">Recarregue a página; se continuar, exporte o backup nos Ajustes.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Partial</Rotulo>
            <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-border bg-surface p-4 text-sm">
              <p>Nota estimada: <span className="num font-bold">642</span> (9 de 10 questões)</p>
              <p className="flex items-center gap-1.5 rounded-md bg-warning-soft px-3 py-2 font-medium text-warning-text">
                <TriangleAlert className="size-4 shrink-0" /> 1 questão sem parâmetro TRI ficou de fora.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Success</Rotulo>
            <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-border bg-surface p-4 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-success-text">
                <CheckCircle2 className="size-4" /> Acertou.
              </p>
              <p className="text-muted-foreground">Próxima: H21, proporção. Aperte N.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Rotulo>Permission</Rotulo>
            <div className="flex flex-col gap-2 rounded-xl border-[1.5px] border-dashed border-border p-4 text-sm text-muted-foreground">
              não se aplica: um usuário, sem login
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraste</CardTitle>
          <CardDescription>WCAG 2.x, calculado com design/scripts/contraste.mjs sobre os tokens do globals.css.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b-[1.5px] border-border text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Par</th>
                <th className="py-2 pr-3 font-semibold">Mín.</th>
                <th className="py-2 pr-3 font-semibold">Claro</th>
                <th className="py-2 font-semibold">Escuro</th>
              </tr>
            </thead>
            <tbody>
              {PARES_CONTRASTE.map((p) => (
                <tr key={p.par} className="border-b-[1.5px] border-border last:border-b-0">
                  <td className="py-2 pr-3">{p.par}</td>
                  <td className="num py-2 pr-3 text-muted-foreground">{String(p.min).replace(".", ",")}</td>
                  {[p.claro, p.escuro].map((r, i) => (
                    <td key={i} className={cn("py-2", i === 0 && "pr-3")}>
                      <span className="inline-flex items-center gap-2">
                        <span className="num font-semibold">{r.razao}:1</span>
                        <Badge variant={r.passa ? "success" : "danger"}>{r.passa ? "passa" : "falha"}</Badge>
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </ConteudoPagina>
  );
}
