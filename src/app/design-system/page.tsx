import type { Metadata } from "next";
import { Check, Inbox, X } from "lucide-react";
import { ConteudoPagina, CabecalhoPagina } from "@/components/app/pagina";
import { Badge } from "@/components/ui/badge";
import { Bolha, type EstadoBolha, type TamanhoBolha } from "@/components/ui/bolha";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Esqueleto, EsqueletoTexto } from "@/components/ui/esqueleto";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmostraCor, DemoDialogo, DemoMovimento, DemoToast, DemoTooltip } from "@/components/design-system/demos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Design system", robots: { index: false, follow: false } };

const CORES: { grupo: string; itens: { token: string; classe: string; papel: string }[] }[] = [
  {
    grupo: "Base",
    itens: [
      { token: "--cor-fundo", classe: "bg-background", papel: "fundo" },
      { token: "--cor-superficie", classe: "bg-card", papel: "superfície" },
      { token: "--cor-muted", classe: "bg-muted", papel: "muted" },
      { token: "--cor-muted-forte", classe: "bg-muted-forte", papel: "muted forte" },
      { token: "--cor-linha", classe: "bg-border", papel: "linha" },
      { token: "--cor-borda-campo", classe: "bg-input", papel: "borda de campo" },
    ],
  },
  {
    grupo: "Texto",
    itens: [
      { token: "--cor-texto", classe: "bg-foreground", papel: "texto" },
      { token: "--cor-texto-2", classe: "bg-texto-2", papel: "texto 2" },
      { token: "--cor-texto-suave", classe: "bg-muted-foreground", papel: "texto suave" },
    ],
  },
  {
    grupo: "Destaque",
    itens: [
      { token: "--cor-primaria", classe: "bg-primary", papel: "primária" },
      { token: "--cor-primaria-hover", classe: "bg-primaria-hover", papel: "hover" },
      { token: "--cor-primaria-suave", classe: "bg-accent", papel: "suave" },
      { token: "--cor-primaria-texto", classe: "bg-primaria-texto", papel: "texto" },
    ],
  },
  {
    grupo: "Estados",
    itens: [
      { token: "--cor-sucesso", classe: "bg-sucesso", papel: "sucesso" },
      { token: "--cor-sucesso-suave", classe: "bg-sucesso-suave", papel: "sucesso suave" },
      { token: "--cor-aviso", classe: "bg-aviso", papel: "aviso" },
      { token: "--cor-aviso-suave", classe: "bg-aviso-suave", papel: "aviso suave" },
      { token: "--cor-erro", classe: "bg-erro", papel: "erro" },
      { token: "--cor-erro-suave", classe: "bg-erro-suave", papel: "erro suave" },
      { token: "--cor-espera", classe: "bg-espera", papel: "espera" },
      { token: "--cor-espera-suave", classe: "bg-espera-suave", papel: "espera suave" },
    ],
  },
];

/** Saída de `node design/scripts/contraste.mjs --tokens src/app/globals.css` (claro, escuro, mínimo). */
const CONTRASTE: [string, string, string, string][] = [
  ["texto / fundo", "17,72", "18,34", "4,5"],
  ["texto / muted", "16,12", "14,27", "4,5"],
  ["texto 2 / fundo", "10,44", "15,09", "4,5"],
  ["texto 2 / muted", "9,50", "11,74", "4,5"],
  ["texto suave / fundo", "5,95", "7,47", "4,5"],
  ["texto suave / superfície", "5,95", "6,91", "4,5"],
  ["texto suave / muted", "5,42", "5,81", "4,5"],
  ["texto do botão primário", "6,18", "7,80", "4,5"],
  ["texto do botão primário (hover)", "7,91", "9,98", "4,5"],
  ["primária como texto / fundo", "6,18", "9,25", "4,5"],
  ["primária como texto / superfície", "6,18", "8,56", "4,5"],
  ["primária como texto / muted", "5,62", "7,19", "4,5"],
  ["primária como texto / primária suave", "5,60", "7,15", "4,5"],
  ["texto / primária suave", "16,05", "14,18", "4,5"],
  ["primária como UI (bolha, barra, foco) / fundo", "6,18", "7,89", "3"],
  ["primária como UI / superfície", "6,18", "7,30", "3"],
  ["borda de campo / fundo", "3,42", "4,64", "3"],
  ["borda de campo / superfície", "3,42", "4,29", "3"],
  ["sucesso (texto) / fundo", "5,02", "10,99", "4,5"],
  ["sucesso (texto) / sucesso suave", "4,57", "5,23", "4,5"],
  ["aviso (texto) / fundo", "5,02", "11,47", "4,5"],
  ["aviso (texto) / aviso suave", "4,51", "8,73", "4,5"],
  ["erro (texto) / fundo", "6,29", "7,11", "4,5"],
  ["erro (texto) / erro suave", "5,24", "5,81", "4,5"],
  ["espera (texto) / fundo", "5,93", "11,48", "4,5"],
  ["espera (texto) / espera suave", "5,17", "5,67", "4,5"],
  ["texto sobre sucesso cheio", "5,02", "8,55", "4,5"],
  ["texto sobre erro cheio", "6,29", "5,81", "4,5"],
  ["texto / marca-texto", "14,23", "8,31", "4,5"],
];

const ESCALA: [string, string][] = [
  ["text-xs", "12"],
  ["text-sm", "14"],
  ["text-base", "16"],
  ["text-lg", "18"],
  ["text-xl", "20"],
  ["text-2xl", "24"],
  ["text-3xl", "30"],
];

const ESTADOS_BOLHA: EstadoBolha[] = ["vazia", "marcada", "meia", "certa", "errada", "feita"];
const TAMANHOS_BOLHA: TamanhoBolha[] = ["xs", "sm", "md"];
const ALTERNATIVAS: [string, string][] = [
  ["A", "Março e abril."],
  ["B", "Março e agosto."],
  ["C", "Agosto e setembro."],
  ["D", "Junho e setembro."],
  ["E", "Junho e agosto."],
];

function Secao({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 border-t border-border pt-6", className)}>
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Sub({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">{titulo}</h3>
      {children}
    </div>
  );
}

function FileiraAlternativas({ confirmada }: { confirmada: boolean }) {
  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {ALTERNATIVAS.map(([letra, texto]) => {
        let estado: EstadoBolha = "vazia";
        if (letra === "B") estado = confirmada ? "errada" : "marcada";
        if (confirmada && letra === "E") estado = "certa";
        return (
          <li
            key={letra}
            className={cn(
              "qtext flex items-center gap-3 px-3 py-2",
              !confirmada && letra === "B" && "bg-accent",
              confirmada && letra === "B" && "bg-erro-suave",
              confirmada && letra === "E" && "bg-sucesso-suave",
            )}
          >
            <Bolha estado={estado} tamanho="md">
              {confirmada && letra === "B" ? <X className="size-3.5" /> : confirmada && letra === "E" ? <Check className="size-3.5" /> : letra}
            </Bolha>
            <span className="min-w-0 flex-1">{texto}</span>
            {confirmada && letra === "B" && <span className="text-xs font-medium text-erro">sua marcação</span>}
            {confirmada && letra === "E" && <span className="text-xs font-medium text-sucesso">gabarito</span>}
          </li>
        );
      })}
    </ul>
  );
}

export default function PaginaDesignSystem() {
  return (
    <ConteudoPagina className="gap-8">
      <div className="flex flex-col gap-3">
        <CabecalhoPagina
          titulo="Design system"
          descricao="Cartão-resposta: papel branco, linha fina e tinta azul só onde você marca"
        />
        <Badge variant="aviso" className="w-fit">
          Dados de exemplo
        </Badge>
      </div>

      <Secao titulo="Cores">
        {CORES.map((g) => (
          <Sub key={g.grupo} titulo={g.grupo}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.itens.map((c) => (
                <AmostraCor key={c.token} {...c} />
              ))}
            </div>
          </Sub>
        ))}
      </Secao>

      <Secao titulo="Contraste">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium">Par</th>
                <th className="py-2 pr-4 font-medium">Claro</th>
                <th className="py-2 pr-4 font-medium">Escuro</th>
                <th className="py-2 font-medium">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {CONTRASTE.map(([par, claro, escuro, minimo]) => (
                <tr key={par} className="border-b border-border">
                  <td className="py-2 pr-4">{par}</td>
                  <td className="num py-2 pr-4">{claro}:1</td>
                  <td className="num py-2 pr-4">{escuro}:1</td>
                  <td className="num py-2 text-muted-foreground">{minimo}:1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Todos os pares passam nos dois temas.</p>
      </Secao>

      <Secao titulo="Tipografia">
        <div className="grid gap-6 lg:grid-cols-2">
          <Sub titulo="IBM Plex Sans">
            <p className="text-lg font-normal">400 · Quanto vale a nota estimada hoje?</p>
            <p className="text-lg font-medium">500 · Quanto vale a nota estimada hoje?</p>
            <p className="text-lg font-semibold">600 · Quanto vale a nota estimada hoje?</p>
          </Sub>
          <Sub titulo="IBM Plex Mono">
            <p className="font-mono text-lg font-normal">400 · H20 0,22 00:41</p>
            <p className="font-mono text-lg font-medium">500 · H20 0,22 00:41</p>
          </Sub>
        </div>
        <Sub titulo="Escala">
          <ul className="flex flex-col divide-y divide-border">
            {ESCALA.map(([classe, px]) => (
              <li key={classe} className="flex items-baseline gap-4 py-2">
                <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                  {classe} {px}
                </span>
                <span className={cn("min-w-0 leading-snug", classe)}>Sprint de 5 questões, fáceis primeiro</span>
              </li>
            ))}
          </ul>
        </Sub>
        <div className="grid gap-6 lg:grid-cols-2">
          <Sub titulo="Enunciado (.qtext)">
            <p className="qtext max-w-prose">
              Um reservatório tem volume V = a · b · c, com a = 2 m, b = 3 m e c = 1,5 m. Qual é o volume, em metros cúbicos?
            </p>
          </Sub>
          <Sub titulo="Dado (.num)">
            <p className="num text-3xl">391</p>
            <p className="num text-sm text-muted-foreground">262–520 · domínio 0,22</p>
          </Sub>
        </div>
      </Secao>

      <Secao titulo="Bolhas">
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-6 text-left font-medium">Estado</th>
                {TAMANHOS_BOLHA.map((t) => (
                  <th key={t} className="px-4 py-2 font-medium">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ESTADOS_BOLHA.map((e) => (
                <tr key={e}>
                  <td className="py-2 pr-6 font-mono text-xs">{e}</td>
                  {TAMANHOS_BOLHA.map((t) => (
                    <td key={t} className="px-4 py-2 text-center">
                      <Bolha estado={e} tamanho={t}>
                        {t === "md" ? (e === "meia" ? null : "B") : e === "certa" || e === "feita" ? <Check /> : e === "errada" ? <X /> : null}
                      </Bolha>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Sub titulo="Alternativas (B marcada)">
            <FileiraAlternativas confirmada={false} />
          </Sub>
          <Sub titulo="Confirmada (B errada, E certa)">
            <FileiraAlternativas confirmada />
          </Sub>
        </div>
        <Sub titulo="Progresso do sprint">
          <div className="flex items-center gap-2" role="img" aria-label="Sprint: 2 de 5 feitas, a terceira em andamento">
            <Bolha estado="marcada" tamanho="xs" />
            <Bolha estado="marcada" tamanho="xs" />
            <Bolha estado="meia" tamanho="xs" />
            <Bolha estado="vazia" tamanho="xs" />
            <Bolha estado="vazia" tamanho="xs" />
            <span className="num ml-2 text-sm">3/5</span>
          </div>
        </Sub>
      </Secao>

      <Secao titulo="Botões">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="erro">Perigo</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
          <Button size="icon" variant="outline" aria-label="Exemplo de ícone">
            <Check />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Exemplo de ícone pequeno">
            <Check />
          </Button>
          <Button disabled>Desabilitado</Button>
          <Button>
            Começar <Kbd>Enter</Kbd>
          </Button>
        </div>
      </Secao>

      <Secao titulo="Campos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-nome">Seu nome</Label>
            <Input id="ds-nome" defaultValue="Matheus" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-meta">Meta diária</Label>
            <Input id="ds-meta" defaultValue="0" aria-invalid aria-describedby="ds-meta-erro" />
            <p id="ds-meta-erro" className="text-xs text-erro">
              A meta precisa ser pelo menos 1.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-off">Desabilitado</Label>
            <Input id="ds-off" disabled placeholder="Indisponível" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-nota">Anotação</Label>
            <Textarea id="ds-nota" placeholder="O que eu errei nesta questão…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-hab">Habilidade</Label>
            <Select id="ds-hab" defaultValue="H20">
              <option value="H20">H20 · Gráfico cartesiano</option>
              <option value="H7">H7 · Planificações e sólidos</option>
              <option value="H26">H26 · Gráficos e argumentação</option>
            </Select>
          </div>
        </div>
      </Secao>

      <Secao titulo="Etiquetas">
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">neutra</Badge>
          <Badge variant="destaque">destaque</Badge>
          <Badge variant="sucesso">sucesso</Badge>
          <Badge variant="erro">erro</Badge>
          <Badge variant="aviso">aviso</Badge>
          <Badge variant="outline">contorno</Badge>
          <Badge variant="solid">sólida</Badge>
        </div>
      </Secao>

      <Secao titulo="Card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sprint de 5 questões</CardTitle>
            <CardDescription>Exemplo: 5 questões oficiais em 4 habilidades, fáceis primeiro.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-fit">Começar</Button>
          </CardContent>
        </Card>
      </Secao>

      <Secao titulo="Abas">
        <Tabs defaultValue="todas">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="abertas">Abertas</TabsTrigger>
            <TabsTrigger value="resolvidas">Resolvidas</TabsTrigger>
          </TabsList>
          <TabsContent value="todas" className="text-sm text-muted-foreground">
            12 erros no caderno (exemplo).
          </TabsContent>
          <TabsContent value="abertas" className="text-sm text-muted-foreground">
            4 erros abertos (exemplo).
          </TabsContent>
          <TabsContent value="resolvidas" className="text-sm text-muted-foreground">
            8 resolvidos (exemplo).
          </TabsContent>
        </Tabs>
      </Secao>

      <Secao titulo="Progresso">
        <div className="flex max-w-md flex-col gap-4">
          <div className="flex items-center gap-3">
            <Progress value={22} aria-label="Domínio de exemplo" />
            <span className="num w-10 text-right text-sm">22%</span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={85} aria-label="Meta de exemplo" />
            <span className="num w-10 text-right text-sm">85%</span>
          </div>
        </div>
      </Secao>

      <Secao titulo="Esqueleto">
        <div className="flex max-w-md flex-col gap-3">
          <Esqueleto className="h-6 w-1/2" />
          <EsqueletoTexto linhas={3} />
        </div>
      </Secao>

      <div className="grid gap-8 md:grid-cols-3">
        <Secao titulo="Diálogo">
          <DemoDialogo />
        </Secao>
        <Secao titulo="Toast">
          <DemoToast />
        </Secao>
        <Secao titulo="Tooltip">
          <DemoTooltip />
        </Secao>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Secao titulo="Raios">
          <div className="flex flex-wrap gap-4">
            {[
              ["rounded-sm", "6"],
              ["rounded-md", "8"],
              ["rounded-lg", "10"],
              ["rounded-xl", "14"],
            ].map(([classe, px]) => (
              <div key={classe} className="flex flex-col items-center gap-2">
                <div className={cn("size-14 border border-input bg-muted", classe)} aria-hidden />
                <span className="font-mono text-xs text-muted-foreground">{px}px</span>
              </div>
            ))}
          </div>
        </Secao>
        <Secao titulo="Sombras">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="size-14 rounded-lg bg-card shadow-suave" aria-hidden />
              <span className="font-mono text-xs text-muted-foreground">suave</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="size-14 rounded-lg bg-card shadow-flutua" aria-hidden />
              <span className="font-mono text-xs text-muted-foreground">flutua</span>
            </div>
          </div>
        </Secao>
      </div>

      <Secao titulo="Movimento">
        <DemoMovimento />
      </Secao>

      <Secao titulo="Estados">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardTitle>Carregando</CardTitle>
            <div className="flex flex-col gap-2">
              <Esqueleto className="h-8 w-24" />
              <EsqueletoTexto linhas={2} />
            </div>
          </Card>
          <Card className="items-start">
            <CardTitle>Vazio</CardTitle>
            <div className="inline-flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Inbox className="size-6" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum erro no caderno ainda: você só errou depois de confirmar uma questão.</p>
            <Button size="sm">Fazer um sprint</Button>
          </Card>
          <Card>
            <CardTitle>Erro</CardTitle>
            <div className="rounded-md bg-erro-suave px-3 py-2 text-sm text-erro">
              Não consegui salvar a tentativa. Recarregue a página; se continuar, exporte o backup em Ajustes.
            </div>
          </Card>
          <Card>
            <CardTitle>Parcial</CardTitle>
            <div className="rounded-md bg-aviso-suave px-3 py-2 text-sm text-aviso">
              Mapa com 3 de 30 habilidades: faça mais sprints para estimar as outras.
            </div>
          </Card>
          <Card>
            <CardTitle>Sucesso</CardTitle>
            <p className="flex items-center gap-2 text-sm font-medium text-sucesso">
              <Check className="size-4" /> Sprint feito: 4 de 5 acertos.
            </p>
            <p className="text-sm text-muted-foreground">Próximo passo: refazer o erro de H7 no caderno.</p>
          </Card>
          <Card>
            <CardTitle>Permissão</CardTitle>
            <p className="text-sm text-muted-foreground">Não se aplica: app de um usuário, sem login.</p>
          </Card>
        </div>
      </Secao>
    </ConteudoPagina>
  );
}
