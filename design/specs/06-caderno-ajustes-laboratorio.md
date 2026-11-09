# Spec 06 — Caderno, Ajustes e Laboratório (+ gaveta) · porta 3114

Leia `design/specs/00-regras-telas.md` inteiro primeiro. Arquivos seus: `src/components/caderno/tela-caderno.tsx`, `src/components/ajustes/tela-ajustes.tsx`, `src/components/laboratorio/*.tsx`. Inventário: §1.5, §1.6, §1.8, §1.2.5, §3.5, §3.7, §3.9. `GemeaCard`, `Markdown` e `Grafico` vêm de `src/components/estudo/` (outro worker está editando: **não edite**). Telas para capturar: `caderno,laboratorio,ajustes` (com `--semear` o caderno já tem erros); para a gaveta, um script temporário em `/tmp` que abra `/estudar`, aperte `l` e capture em 375 e 1440; para o caderno vazio, capture sem `--semear`.

## Caderno
- Cabeçalho com as duas etiquetas de contagem.
- Filtros (`role="toolbar"`): numa linha `flex flex-wrap items-center gap-3 border-b border-border pb-4`: o rádio "Abertos | Todos" como controle segmentado (`inline-flex rounded-md border border-input p-0.5`, cada opção `h-8 px-3 rounded-[6px] text-sm font-medium`, ativa `bg-muted text-foreground`, inativa `text-muted-foreground`; mantém `role="radiogroup"`/`radio`) e o `Select` "Habilidade" com `Label` ao lado (o teste usa `getByLabel("Habilidade")`: mantenha o label envolvendo/ligado ao select).
- Lista (`data-testid="lista-caderno"`): em `xl`, duas colunas (`xl:grid-cols-2 gap-4`); abaixo, uma. Cada entrada é um `Card` (`data-testid="entrada-caderno"`, `data-resolvida`), `p-4 gap-3`:
  - linha de etiquetas (código `.num`), data à direita em `.num text-xs text-muted-foreground`;
  - prévia do enunciado em `text-sm text-texto-2 line-clamp-3` (sem máscara de degradê, sem serifa);
  - **Marcou × Gabarito como cartão-resposta**: duas linhas (`<dl>` mantido): `Bolha tamanho="sm"` `errada` com a letra marcada + texto (`data-testid="marcou"`; "pulou" = bolha `vazia` com traço) e `Bolha` `certa` com a letra do gabarito + texto;
  - "Equívoco:" (`data-testid="equivoco"`) como bloco `border-l-2 border-erro pl-3 text-sm`;
  - ações no pé (`border-t border-border pt-3`): "Refazer" (`outline`, sm) e "Gêmea"/"Nova gêmea" (`ghost`, sm) + a nota de resolução em `text-xs`.
  - Resolvida: `opacity-70` e etiqueta `sucesso`.
- Vazio, carregando, filtro vazio: padrão das regras. Diálogo da gêmea: padrão do `Dialog`.

## Ajustes
Coluna `max-w-[720px]` à esquerda; **sem cards**: seis seções separadas por `border-t border-border py-6`, cada uma com `h2 text-base font-semibold` + descrição `text-sm text-muted-foreground`, e em `lg` um layout de duas colunas por seção (`lg:grid-cols-[200px_minmax(0,1fr)] gap-6`: título/descrição à esquerda, controles à direita) — nesse caso a largura máxima sobe para 960px.
- Campos com `Label` + `Input`/`Textarea` do `ui/input` (mantendo `data-testid`, `id`, `aria-invalid`, eventos). Ajuda `text-xs text-muted-foreground`; erro `text-xs text-erro`.
- Presets: chips das regras (`aria-pressed`; ativo com Check 14px). Habilidades da semana: por competência, rótulo `text-xs text-muted-foreground` ("C1" em `.num`) e chips `role="switch"` `h-8 min-w-11 px-2 .num text-xs rounded-md border`; ativo `border-primary bg-accent text-primaria-texto font-medium`.
- Tutor: estado em `text-sm` com `<code>` em `.num`; **Interruptor**: 44×24px, trilho `rounded-full bg-muted-forte`, ligado `bg-primary` (não verde), polegar `size-5 rounded-full bg-background shadow-suave`.
- Aparência: rádio Claro/Escuro como controle segmentado (igual ao do caderno), com os ícones.
- Seus dados: resumo como `<dl>` em linha com valores `.num`; botões "Exportar backup (JSON)" (`outline`), "Importar backup" (`outline`), e "Zerar progresso" (`erro`) separado à direita / em linha própria no celular. Diálogos no padrão.

## Laboratório (página e gaveta)
- Página: duas seções separadas por `border-t` (sem cards externos): "Python + SymPy" e "Gráfico de função"; em `xl`, lado a lado (`xl:grid-cols-2 xl:divide-x`, a segunda com `xl:pl-8`).
- `editor-python.tsx`: título `text-base font-semibold` com a etiqueta de status à direita; exemplos como chips das regras (`flex-wrap`); **o editor é o objeto**: `rounded-md border border-input bg-background` com `.editor-camada` (mono); barra de ação embaixo do editor: "Rodar" (`primary`, sm, `Kbd`) ou "Cancelar" (`outline`) + o aviso em `text-xs`; saída (`role="status"`): `rounded-md bg-muted p-3 .num text-sm`, resultado em `text-sucesso`, erro em `text-erro`; erro do Pyodide (`role="alert"`) como aviso das regras com o botão.
- `plotador.tsx`: exemplos como chips; formulário "y =" (`.num`) + `Input` + "Desenhar" (`secondary`); erro no padrão; o `Grafico`.
- `gaveta-laboratorio.tsx`: painel à direita `bg-popover border-l border-border shadow-flutua` de altura total (sem margem de 12px e sem raio grande em `md`+; no celular, tela cheia), véu `bg-veu`; cabeçalho de 48px com título, a dica "L abre e Esc fecha" com `Kbd`, e o X; `Tabs` sublinhadas; conteúdo com `p-4`.
