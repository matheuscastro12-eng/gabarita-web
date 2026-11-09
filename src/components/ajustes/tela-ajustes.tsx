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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CabecalhoPagina, ConteudoPagina } from "@/components/app/pagina";
import { Esqueleto, EsqueletoTexto } from "@/components/ui/esqueleto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Tela Ajustes: perfil, prova, semana, tutor, aparência e dados (backup, zerar). */
export function TelaAjustes() {
  const { estado, erro } = useStore();
  if (erro) {
    return (
      <ConteudoPagina>
        <CabecalhoPagina titulo="Ajustes" />
        <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm">
          <p className="font-semibold text-danger-text">Não consegui carregar seus dados.</p>
          <p className="text-muted-foreground">{erro}</p>
        </div>
      </ConteudoPagina>
    );
  }
  if (!estado) {
    return (
      <ConteudoPagina aria-busy="true">
        <CabecalhoPagina titulo="Ajustes" descricao="Carregando…" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-40 flex-col gap-3 rounded-xl bg-surface p-6 shadow-card">
            <Esqueleto className="h-5 w-40" />
            <EsqueletoTexto linhas={2} />
            <Esqueleto className="h-11 w-full max-w-xs rounded-md" />
          </div>
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
    <ConteudoPagina className="max-w-[760px]">
      <CabecalhoPagina titulo="Ajustes" descricao="Como o tutor explica, quando é a prova, qual é a meta e onde ficam os seus dados." />
      <CardPerfil perfil={perfil} salvar={salvarPerfil} />
      <CardProva perfil={perfil} salvar={salvarPerfil} />
      <CardSemana perfil={perfil} salvar={salvarPerfil} />
      <CardTutor perfil={perfil} salvar={salvarPerfil} />
      <CardAparencia />
      <CardDados estado={estado} store={store} />
    </ConteudoPagina>
  );
}

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
    <Card>
      <CardHeader>
        <CardTitle>Explica do meu jeito</CardTitle>
        <CardDescription>Vai junto com cada mensagem para o tutor (em cache). Escolha presets, escreva do seu jeito, ou os dois.</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Como o tutor te chama</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => {
              const n = nome.trim() || "Matheus";
              setNome(n);
              if (n !== perfil.nome) salvar({ nome: n });
            }}
            className="h-11 max-w-xs rounded-md border-[1.5px] border-input bg-surface px-3.5 font-medium focus-visible:border-accent focus-visible:outline-none"
            data-testid="campo-nome"
          />
        </label>
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
                  "inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold",
                  "transition-[background-color,border-color,color] duration-(--duration) ease-(--ease)",
                  ativo ? "border-accent bg-accent-solid text-white" : "border-border bg-surface text-foreground hover:border-accent",
                )}
              >
                {ativo && <Check className="size-4" />}
                {p.rotulo}
              </button>
            );
          })}
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Texto livre</span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
              if (texto !== perfil.explicaDoMeuJeito) salvar({ explicaDoMeuJeito: texto });
            }}
            rows={4}
            placeholder="Ex.: prefiro exemplos com dinheiro; não gosto quando repetem o enunciado; me pergunte antes de dar a conta."
            className="w-full resize-y rounded-md border-[1.5px] border-input bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed focus-visible:border-accent focus-visible:outline-none"
            data-testid="campo-explica"
          />
          <span className="text-xs text-muted-foreground">{texto.length} caracteres · salva ao sair do campo</span>
        </label>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Prova ------------------------------ */

function CardProva({ perfil, salvar }: { perfil: Perfil; salvar: (p: Partial<Perfil>, msg?: string) => void }) {
  const [meta, setMeta] = React.useState(String(perfil.metaNota));
  const metaValida = normalizarMeta(Number(meta));
  const agora = React.useMemo(() => new Date(), []);
  const dias = diasAteProva(perfil.dataProva, agora);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prova e meta</CardTitle>
        <CardDescription>A meta entra no critério “pronto para a prova”: o limite inferior da nota estimada precisa passar dela.</CardDescription>
      </CardHeader>
      <CardContent className="sm:flex-row sm:flex-wrap sm:gap-6">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Data da prova de matemática</span>
          <input
            type="date"
            value={perfil.dataProva ?? ""}
            min={dataLocal(agora)}
            onChange={(e) => salvar({ dataProva: e.target.value || null }, e.target.value ? "Data da prova salva." : "Data da prova removida.")}
            className="h-11 rounded-md border-[1.5px] border-input bg-surface px-3.5 font-medium focus-visible:border-accent focus-visible:outline-none"
            data-testid="campo-data-prova"
          />
          <span className="text-xs text-muted-foreground" data-testid="prazo-prova">
            {dias === null ? "Sem data: o Gabarita não conta os dias." : `A prova ${descreverPrazo(dias)}.`}
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Meta de nota (matemática)</span>
          <input
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
            className={cn("num h-11 w-32 rounded-md border-[1.5px] bg-surface px-3.5 font-semibold focus-visible:border-accent focus-visible:outline-none", metaValida === null ? "border-danger" : "border-input")}
            data-testid="campo-meta"
          />
          <span className={cn("text-xs", metaValida === null ? "font-medium text-danger-text" : "text-muted-foreground")}>
            {metaValida === null ? `Use um número entre ${META_NOTA_MIN} e ${META_NOTA_MAX}.` : "Escala do ENEM (500 é a média de referência)."}
          </span>
        </label>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Habilidades da semana</CardTitle>
        <CardDescription>
          Meta “pronto nos fáceis”: todas estas prontas e um simulado de 15 fáceis. Hoje: {plural(perfil.habilidadesDaSemana.length, "habilidade", "habilidades")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {COMPETENCIAS.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-1.5">
            <span className="w-full shrink-0 text-xs text-muted-foreground sm:w-40">
              {c.id} · {c.nome}
            </span>
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
                    "num h-8 rounded-full border-[1.5px] px-2.5 text-[13px] font-bold transition-colors duration-(--duration)",
                    ativa ? "border-accent bg-accent-solid text-white" : "border-border bg-surface text-muted-foreground hover:border-accent hover:text-accent-text",
                  )}
                >
                  {h}
                </button>
              );
            })}
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{HABILIDADES.length} habilidades da Matriz de Referência do INEP; passe o mouse para ver o nome.</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Tutor ------------------------------ */

function CardTutor({ perfil, salvar }: { perfil: Perfil; salvar: (p: Partial<Perfil>, msg?: string) => void }) {
  const status = useStatusIA();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4 text-accent" strokeWidth={1.8} /> Tutor
        </CardTitle>
        <CardDescription>O estado vem de /api/status. A chave nunca sai do servidor nem aparece aqui.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="estado-tutor">
          <span className="text-muted-foreground">IA configurada:</span>
          {status.ia === null ? (
            <Badge variant="outline">verificando…</Badge>
          ) : status.ia ? (
            <>
              <Badge variant="success">sim</Badge>
              <span className="text-muted-foreground">
                {status.provedor === "gateway" ? "AI Gateway" : status.provedor === "claude-local" ? "Claude local (assinatura)" : "Anthropic"} · {status.modelo}
              </span>
            </>
          ) : (
            <>
              <Badge variant="warning">não</Badge>
              <span className="text-muted-foreground">
                Modo guiado offline com dicas verificadas. Para ligar a IA, defina <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> (ou{" "}
                <code className="font-mono text-xs">AI_GATEWAY_API_KEY</code>) no <code className="font-mono text-xs">.env.local</code> e reinicie o servidor.
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
      </CardContent>
    </Card>
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
        className={cn("relative mt-0.5 h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-(--duration)", ligado ? "bg-success" : "bg-border dark:bg-surface-2")}
      >
        <span aria-hidden className={cn("absolute top-[3px] left-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-(--duration)", ligado && "translate-x-5")} />
      </button>
      <label htmlFor={id} className="flex flex-col text-sm">
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
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>Claro por padrão, como o Gabarita original; o escuro usa o mesmo azul de sistema. Fica salvo neste navegador.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex gap-1.75" role="radiogroup" aria-label="Tema">
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
              className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-border bg-surface px-3.5 text-[13px] font-semibold text-foreground transition-colors duration-(--duration)", atual === v && "border-accent bg-accent-solid text-white")}
            >
              <Icone className="size-4" /> {rotulo}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
        <CardDescription>
          Tudo fica neste navegador (IndexedDB), sem conta e sem servidor. Hoje: {plural(estado.tentativas.length, "tentativa", "tentativas")},{" "}
          {plural(estado.sprints.length, "sprint", "sprints")}, {plural(estado.simulados.length, "simulado", "simulados")}, {plural(estado.caderno.length, "erro no caderno", "erros no caderno")}; desde{" "}
          {new Date(estado.criadoEm).toLocaleDateString("pt-BR")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={exportar} data-testid="exportar-backup">
            <Download /> Exportar backup (JSON)
          </Button>
          <Button variant="secondary" onClick={() => arquivoRef.current?.click()} data-testid="importar-backup">
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
          <Button variant="danger" onClick={() => setZerando(true)} data-testid="zerar-progresso">
            <Trash2 /> Zerar progresso
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Importar substitui tudo o que está aqui pelo conteúdo do arquivo. Exporte antes, por garantia.</p>
      </CardContent>

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
            <Button variant="danger" onClick={() => void zerar()} data-testid="confirmar-zerar">
              <Trash2 /> Zerar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
