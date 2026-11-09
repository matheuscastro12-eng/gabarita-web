"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Bot, Check, Download, Moon, Sun, Trash2, Upload } from "lucide-react";
import { HABILIDADES, NOME_HABILIDADE } from "@/data/tipos";
import { COMPETENCIAS } from "@/data/taxonomia";
import { useStore } from "@/lib/store/provider";
import { exportarBackup, importarBackup } from "@/lib/store/backup";
import { useStatusIA } from "@/lib/tutor/status-cliente";
import { useMontado } from "@/lib/use-cliente";
import {
  aplicarPreset,
  dataLocal,
  descreverPrazo,
  diasAteProva,
  META_NOTA_MAX,
  META_NOTA_MIN,
  normalizarMeta,
  plural,
  PRESETS_EXPLICACAO,
  presetAtivo,
  removerPreset,
} from "@/lib/dominio";
import type { EstadoAluno, Habilidade, Perfil } from "@/lib/dominio/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Esqueleto } from "@/components/ui/esqueleto";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Tela Ajustes: perfil, prova, semana, tutor, aparência e dados (backup, zerar). */
export function TelaAjustes() {
  const { estado, erro } = useStore();
  if (erro) {
    return (
      <ConteudoPagina>
        <CabecalhoPagina titulo="Ajustes" />
        <div role="alert" className="max-w-[960px] rounded-md bg-erro-suave p-3 text-sm text-erro">
          <p className="font-medium">Não consegui carregar seus dados.</p>
          <p>{erro}</p>
        </div>
      </ConteudoPagina>
    );
  }
  if (!estado) {
    return (
      <ConteudoPagina aria-busy="true" className="mx-0 max-w-[960px]">
        <CabecalhoPagina titulo="Ajustes" descricao="Carregando…" />
        {[0, 1, 2].map((i) => (
          <Esqueleto key={i} className="h-40 w-full" />
        ))}
      </ConteudoPagina>
    );
  }
  // `key` pelo atualizadoEm de importação/zerar: os formulários recomeçam do estado novo.
  return <Formularios key={estado.criadoEm} estado={estado} />;
}

function Formularios({ estado }: { estado: EstadoAluno }) {
  const { atualizar, store } = useStore();
  const { notificar } = useToast();
  const perfil = estado.perfil;

  const salvarPerfil = React.useCallback(
    (parcial: Partial<Perfil>, mensagem = "Salvo.") => {
      atualizar((e) => ({ ...e, perfil: { ...e.perfil, ...parcial } }))
        .then(() => notificar({ tipo: "sucesso", titulo: mensagem, duracao: 1800 }))
        .catch((err: unknown) => notificar({ tipo: "erro", titulo: "Não consegui salvar", descricao: err instanceof Error ? err.message : undefined }));
    },
    [atualizar, notificar],
  );

  return (
    <ConteudoPagina className="mx-0 max-w-[720px] lg:max-w-[960px]">
      <CabecalhoPagina titulo="Ajustes" descricao="Como o tutor explica, quando é a prova, qual é a meta e onde ficam os seus dados." />
      <div className="flex flex-col">
      <CardPerfil perfil={perfil} salvar={salvarPerfil} />
      <CardProva perfil={perfil} salvar={salvarPerfil} />
      <CardSemana perfil={perfil} salvar={salvarPerfil} />
      <CardTutor perfil={perfil} salvar={salvarPerfil} />
      <CardAparencia />
      <CardDados estado={estado} store={store} />
      </div>
    </ConteudoPagina>
  );
}

/** Seção da página: linha fina em cima, título + descrição; em `lg`, título à esquerda e controles à direita. */
function Secao({ titulo, descricao, children }: { titulo: React.ReactNode; descricao: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border py-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

/** Controle segmentado (rádio): ativa em cinza, sem tinta azul. */
const segmento = (ativo: boolean) =>
  cn(
    "inline-flex h-8 items-center gap-1.5 rounded-[6px] px-3 text-sm font-medium transition-colors duration-(--duracao) ease-(--curva) pointer-coarse:min-h-11",
    ativo ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
  );

/* ------------------------------ Perfil ------------------------------ */

function CardPerfil({ perfil, salvar }: { perfil: Perfil; salvar: (p: Partial<Perfil>, msg?: string) => void }) {
  const [nome, setNome] = React.useState(perfil.nome);
  const [texto, setTexto] = React.useState(perfil.explicaDoMeuJeito);

  const alternarPreset = (preset: (typeof PRESETS_EXPLICACAO)[number]) => {
    const novo = presetAtivo(texto, preset) ? removerPreset(texto, preset) : aplicarPreset(texto, preset);
    setTexto(novo);
    salvar({ explicaDoMeuJeito: novo });
  };

  return (
    <Secao titulo={<>Explica do meu jeito</>} descricao={<>Vai junto com cada mensagem para o tutor (em cache). Escolha presets, escreva do seu jeito, ou os dois.</>}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="campo-nome">Como o tutor te chama</Label>
          <Input
            id="campo-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => {
              const n = nome.trim() || "Matheus";
              setNome(n);
              if (n !== perfil.nome) salvar({ nome: n });
            }}
            className="max-w-xs"
            data-testid="campo-nome"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Presets de explicação">
          {PRESETS_EXPLICACAO.map((p) => {
            const ativo = presetAtivo(texto, p);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => alternarPreset(p)}
                data-testid={`preset-${p.id}`}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium pointer-coarse:min-h-11",
                  "transition-colors duration-(--duracao) ease-(--curva)",
                  ativo ? "border-primary bg-accent text-primaria-texto" : "border-input bg-background text-foreground hover:bg-muted",
                )}
              >
                {ativo && <Check className="size-3.5" strokeWidth={1.5} />}
                {p.rotulo}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="campo-explica">Texto livre</Label>
          <Textarea
            id="campo-explica"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
              if (texto !== perfil.explicaDoMeuJeito) salvar({ explicaDoMeuJeito: texto });
            }}
            rows={4}
            placeholder="Ex.: prefiro exemplos com dinheiro; não gosto quando repetem o enunciado; me pergunte antes de dar a conta."
            className="resize-y leading-relaxed"
            data-testid="campo-explica"
          />
          <span className="text-xs text-muted-foreground"><span className="num">{texto.length}</span> caracteres · salva ao sair do campo</span>
        </div>
    </Secao>
  );
}

/* ------------------------------ Prova ------------------------------ */

function CardProva({ perfil, salvar }: { perfil: Perfil; salvar: (p: Partial<Perfil>, msg?: string) => void }) {
  const [meta, setMeta] = React.useState(String(perfil.metaNota));
  const metaValida = normalizarMeta(Number(meta));
  const agora = React.useMemo(() => new Date(), []);
  const dias = diasAteProva(perfil.dataProva, agora);

  return (
    <Secao titulo={<>Prova e meta</>} descricao={<>A meta entra no critério “pronto para a prova”: o limite inferior da nota estimada precisa passar dela.</>}>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="campo-data-prova">Data da prova de matemática</Label>
          <Input
            id="campo-data-prova"
            type="date"
            value={perfil.dataProva ?? ""}
            min={dataLocal(agora)}
            onChange={(e) => salvar({ dataProva: e.target.value || null }, e.target.value ? "Data da prova salva." : "Data da prova removida.")}
            className="num max-w-56"
            data-testid="campo-data-prova"
          />
          <span className="text-xs text-muted-foreground" data-testid="prazo-prova">
            {dias === null ? "Sem data: o Gabarita não conta os dias." : `A prova ${descreverPrazo(dias)}.`}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="campo-meta">Meta de nota (matemática)</Label>
          <Input
            id="campo-meta"
            type="number"
            inputMode="numeric"
            min={META_NOTA_MIN}
            max={META_NOTA_MAX}
            step={10}
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            onBlur={() => {
              if (metaValida === null) return;
              if (metaValida !== perfil.metaNota) salvar({ metaNota: metaValida }, `Meta ${metaValida} salva.`);
              setMeta(String(metaValida));
            }}
            aria-invalid={metaValida === null}
            className="num w-32"
            data-testid="campo-meta"
          />
          <span className={cn("text-xs", metaValida === null ? "text-erro" : "text-muted-foreground")}>
            {metaValida === null ? `Use um número entre ${META_NOTA_MIN} e ${META_NOTA_MAX}.` : "Escala do ENEM (500 é a média de referência)."}
          </span>
        </div>
        </div>
    </Secao>
  );
}

/* ------------------------------ Semana ------------------------------ */

function CardSemana({ perfil, salvar }: { perfil: Perfil; salvar: (p: Partial<Perfil>, msg?: string) => void }) {
  const semana = new Set<string>(perfil.habilidadesDaSemana);
  const alternar = (h: Habilidade) => {
    const nova = semana.has(h) ? perfil.habilidadesDaSemana.filter((x) => x !== h) : [...perfil.habilidadesDaSemana, h];
    nova.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    salvar({ habilidadesDaSemana: nova }, semana.has(h) ? `${h} saiu da semana.` : `${h} entrou na semana.`);
  };
  return (
    <Secao titulo={<>Habilidades da semana</>} descricao={<>Meta “pronto nos fáceis”: todas estas prontas e um simulado de 15 fáceis. Hoje: {plural(perfil.habilidadesDaSemana.length, "habilidade", "habilidades")}.</>}>
        {COMPETENCIAS.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              <span className="num">{c.id}</span> · {c.nome}
            </span>
            <div className="flex flex-wrap gap-2">
            {c.habilidades.map((h) => {
              const ativa = semana.has(h);
              return (
                <button
                  key={h}
                  type="button"
                  role="switch"
                  aria-checked={ativa}
                  title={NOME_HABILIDADE[h]}
                  onClick={() => alternar(h)}
                  data-testid={`semana-${h}`}
                  className={cn(
                    "num h-8 min-w-11 rounded-md border px-2 text-xs transition-colors duration-(--duracao) ease-(--curva) pointer-coarse:min-h-11",
                    ativa ? "border-primary bg-accent font-medium text-primaria-texto" : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {h}
                </button>
              );
            })}
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{HABILIDADES.length} habilidades da Matriz de Referência do INEP; passe o mouse para ver o nome.</p>
    </Secao>
  );
}

/* ------------------------------ Tutor ------------------------------ */

function CardTutor({ perfil, salvar }: { perfil: Perfil; salvar: (p: Partial<Perfil>, msg?: string) => void }) {
  const status = useStatusIA();
  return (
    <Secao titulo={<><Bot className="size-4" strokeWidth={1.5} /> Tutor</>} descricao={<>O estado vem de /api/status. A chave nunca sai do servidor nem aparece aqui.</>}>
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="estado-tutor">
          <span className="text-muted-foreground">IA configurada:</span>
          {status.ia === null ? (
            <Badge variant="outline">verificando…</Badge>
          ) : status.ia ? (
            <>
              <Badge variant="sucesso">sim</Badge>
              <span className="text-muted-foreground">
                {status.provedor === "gateway" ? "AI Gateway" : status.provedor === "claude-local" ? "Claude local (assinatura)" : "Anthropic"} · {status.modelo}
              </span>
            </>
          ) : (
            <>
              <Badge variant="aviso">não</Badge>
              <span className="text-muted-foreground">
                Modo guiado offline com dicas verificadas. Para ligar a IA, defina <code className="num text-xs">ANTHROPIC_API_KEY</code> (ou{" "}
                <code className="num text-xs">AI_GATEWAY_API_KEY</code>) no <code className="num text-xs">.env.local</code> e reinicie o servidor.
              </span>
            </>
          )}
        </div>
        <Interruptor
          id="mostrar-timer"
          rotulo="Mostrar o cronômetro discreto durante o sprint"
          descricao="O tempo é medido de qualquer jeito (serve ao detector de chute); isto só controla se aparece."
          ligado={perfil.mostrarTimer}
          aoMudar={(v) => salvar({ mostrarTimer: v }, v ? "Cronômetro visível." : "Cronômetro escondido.")}
        />
    </Secao>
  );
}

function Interruptor({ id, rotulo, descricao, ligado, aoMudar }: { id: string; rotulo: string; descricao?: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ligado}
        onClick={() => aoMudar(!ligado)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-(--duracao) ease-(--curva)", ligado ? "bg-primary" : "bg-muted-forte")}
      >
        <span aria-hidden className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-suave transition-transform duration-(--duracao) ease-(--curva)", ligado && "translate-x-5")} />
      </button>
      <label htmlFor={id} className="flex flex-col gap-0.5 text-sm">
        <span>{rotulo}</span>
        {descricao && <span className="text-xs text-muted-foreground">{descricao}</span>}
      </label>
    </div>
  );
}

/* ------------------------------ Aparência ------------------------------ */

function CardAparencia() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const atual = montado ? (resolvedTheme === "dark" ? "dark" : "light") : "light";
  return (
    <Secao titulo={<>Aparência</>} descricao={<>Claro por padrão, como o Gabarita original; o escuro usa o mesmo azul de sistema. Fica salvo neste navegador.</>}>
        <div className="inline-flex self-start rounded-md border border-input p-0.5" role="radiogroup" aria-label="Tema">
          {(
            [
              { v: "light", rotulo: "Claro", Icone: Sun },
              { v: "dark", rotulo: "Escuro", Icone: Moon },
            ] as const
          ).map(({ v, rotulo, Icone }) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={atual === v}
              onClick={() => setTheme(v)}
              data-testid={`tema-${v}`}
              className={segmento(atual === v)}
            >
              <Icone className="size-4" strokeWidth={1.5} /> {rotulo}
            </button>
          ))}
        </div>
    </Secao>
  );
}

/* ------------------------------ Dados ------------------------------ */

function CardDados({ estado, store }: { estado: EstadoAluno; store: ReturnType<typeof useStore>["store"] }) {
  const { notificar } = useToast();
  const [importando, setImportando] = React.useState<EstadoAluno | null>(null);
  const [zerando, setZerando] = React.useState(false);
  const arquivoRef = React.useRef<HTMLInputElement | null>(null);

  const exportar = () => {
    const json = exportarBackup(estado);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gabarita-backup-${dataLocal(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notificar({ tipo: "sucesso", titulo: "Backup exportado.", descricao: a.download });
  };

  const lerArquivo = async (arquivo: File) => {
    try {
      setImportando(importarBackup(await arquivo.text()));
    } catch (e) {
      notificar({ tipo: "erro", titulo: "Não consegui ler o backup", descricao: e instanceof Error ? e.message : undefined, duracao: 6000 });
    } finally {
      if (arquivoRef.current) arquivoRef.current.value = "";
    }
  };

  const confirmarImportacao = async () => {
    if (!importando) return;
    try {
      await store.gravar(importando);
      notificar({ tipo: "sucesso", titulo: "Backup importado.", descricao: `${plural(importando.tentativas.length, "tentativa", "tentativas")} restauradas.` });
    } catch (e) {
      notificar({ tipo: "erro", titulo: "Não consegui importar", descricao: e instanceof Error ? e.message : undefined });
    } finally {
      setImportando(null);
    }
  };

  const zerar = async () => {
    try {
      await store.limpar();
      notificar({ tipo: "sucesso", titulo: "Progresso zerado.", descricao: "Tudo voltou ao começo. O backup exportado continua valendo." });
    } catch (e) {
      notificar({ tipo: "erro", titulo: "Não consegui zerar", descricao: e instanceof Error ? e.message : undefined });
    } finally {
      setZerando(false);
    }
  };

  return (
    <Secao titulo={<>Seus dados</>} descricao={<>Tudo fica neste navegador (IndexedDB), sem conta e sem servidor.</>}>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(
            [
              ["tentativas", estado.tentativas.length],
              ["sprints", estado.sprints.length],
              ["simulados", estado.simulados.length],
              ["erros no caderno", estado.caderno.length],
              ["desde", new Date(estado.criadoEm).toLocaleDateString("pt-BR")],
            ] as const
          ).map(([rotulo, valor]) => (
            <div key={rotulo} className="flex items-baseline gap-1.5">
              <dt className="text-muted-foreground">{rotulo}</dt>
              <dd className="num font-medium">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportar} data-testid="exportar-backup">
            <Download /> Exportar backup (JSON)
          </Button>
          <Button variant="outline" onClick={() => arquivoRef.current?.click()} data-testid="importar-backup">
            <Upload /> Importar backup
          </Button>
          <input
            ref={arquivoRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Arquivo de backup"
            data-testid="arquivo-backup"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void lerArquivo(f);
            }}
          />
          <Button variant="erro" className="max-sm:basis-full sm:ml-auto" onClick={() => setZerando(true)} data-testid="zerar-progresso">
            <Trash2 /> Zerar progresso
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Importar substitui tudo o que está aqui pelo conteúdo do arquivo. Exporte antes, por garantia.</p>

      <Dialog open={importando !== null} onOpenChange={(a) => !a && setImportando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar este backup?</DialogTitle>
            <DialogDescription>
              {importando && (
                <>
                  Backup de {importando.perfil.nome}, {plural(importando.tentativas.length, "tentativa", "tentativas")}, {plural(importando.caderno.length, "erro", "erros")}, atualizado em{" "}
                  {new Date(importando.atualizadoEm).toLocaleString("pt-BR")}. O que está neste navegador será substituído.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmarImportacao()} data-testid="confirmar-importacao">
              Substituir e importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={zerando} onOpenChange={setZerando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zerar todo o progresso?</DialogTitle>
            <DialogDescription>
              Apaga tentativas, domínio, caderno, sprints, simulados e perfil deste navegador. Não tem desfazer: se quiser guardar, exporte o backup antes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setZerando(false)}>
              Cancelar
            </Button>
            <Button variant="erro" onClick={() => void zerar()} data-testid="confirmar-zerar">
              <Trash2 /> Zerar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Secao>
  );
}
