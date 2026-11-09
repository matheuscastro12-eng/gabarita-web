# Spec 04 — Estudar (IDE, tutor, fim do sprint)

Leia `design/specs/00-regras-telas.md` inteiro primeiro. Arquivos seus: `src/components/estudo/*.tsx` (todos). Inventário: §1.2 inteiro, §3.3, §3.4. Telas para capturar: `estudar,estudar-marcada,estudar-confirmada,estudar-escuro`; e, para o fim do sprint, escreva um script temporário em `/tmp` que responda as 5 questões (clicar numa alternativa, Enter, `n`) e capture o fim em 375 e 1440.

É a tela mais usada e a mais cheia de função. **Nada some**: painéis redimensionáveis com layout salvo, abas Questão/Tutor no celular, modo foco (F), Laboratório (L), cronômetro, A–E/Enter/N/H/⌥R/"/", seleção → "Perguntar sobre isto", escada de 4 degraus, resposta direta, sugestões, gêmeas, gráfico, selos, partes de ferramenta, erro do tutor, "Ver visualmente", imagem quebrada, fonte da questão. Referência: `composicao-2.png`, Telas 2 e 4.

## Barra do sprint (`barra-sprint.tsx`), 48px, `border-b border-border bg-background`
- Tire o logo e o nome "Gabarita" da barra (a barra lateral já tem; no modo foco a barra mostra só "Sprint"). "Sprint" `text-sm font-semibold` (em `sm`+).
- Progresso = `Bolha tamanho="xs"`: pendente `vazia`, atual `meia`, acertou `certa`, errou `errada`; mantenha o `role="img"`, o `aria-label="questão {i} de {n}"` e o `anim-pop`. "{i}/{n}" em `.num text-sm`.
- Habilidade `text-sm text-muted-foreground` com o código em `.num` (`md`+). À direita: cronômetro (`CaixaTempo`: `.num text-sm`, ícone Clock 14px, sem fundo; no estado de alerta do simulado `rounded-sm bg-aviso-suave text-aviso px-1.5`), botões-ícone Laboratório e Modo foco (`variant="outline" size="icon-sm"`).

## Layout (`ide.tsx`, `tela-estudar.tsx`)
- Painéis iguais (58/42 padrão, mínimos, `localStorage`), fundo `bg-background` nos dois; o separador é a linha de 1px com área de arraste (mantenha `aria-label` e role). Celular: `Tabs` no estilo sublinhado (duas abas de largura igual, 44px).
- Rodapé de domínio: `h-9 border-t border-border px-4 text-xs`: "domínio" + código `.num`, `Progress` (máx. 160px), valor `.num`, e o texto do que falta (`data-testid="falta"`).
- `EsqueletoIDE` e `EstadoVazio` no padrão das regras.

## Questão (`questao-view.tsx`, `alternativas.tsx`, `imagem-questao.tsx`, `markdown.tsx`)
- Sem card: coluna de leitura `mx-auto w-full max-w-[720px] px-4 py-5 md:px-8 md:py-6` direto no papel; mantém `anim-questao`.
- Linha de etiquetas: h2 "ENEM {ano} · Q{n}" como `Badge` neutra com `.num`; dificuldade (`sucesso`/`aviso`/`erro`) e habilidade (`destaque`) como `Badge`; "Ver visualmente" à direita (`outline`, `sm`). No celular a linha quebra sem empurrar o botão para fora.
- Enunciado `.qtext`. Imagens: `rounded-md border border-border` (a imagem em si não muda, nem no escuro). Imagem quebrada: bloco tracejado `border-dashed border-input rounded-md`.
- **Alternativas** (composição 2): caixas separadas, `gap-2`; cada uma `min-h-12 rounded-md border border-border px-3 py-2.5 text-left` com `Bolha tamanho="md"` (letra) + texto `text-base` (o da `.qtext`, 16–17px); hover `border-input bg-muted`; **marcada** = `border-primary bg-accent` + bolha `marcada` (borda com `ring-1 ring-primary` para dar 1,5–2px sem mexer no layout); **certa** = `border-sucesso bg-sucesso-suave` + bolha `certa` com o check desenhado (`anim-desenha`, `anim-assenta`); **errada** = `border-erro bg-erro-suave` + bolha `errada` com X (`anim-pop`, `anim-shake`); depois de confirmar as outras ficam com `opacity-60`. O `Kbd` da letra no hover/foco continua (à direita). Mantém `role="radiogroup"`/`radio`, `aria-checked`, `data-letra`.
- Status depois de confirmar: `text-sm font-medium`, "Acertou." em `text-sucesso`, erro em `text-erro` (mesmos textos e `role="status"`).
- `<details>` e fonte (`data-testid="fonte"`): `text-xs text-muted-foreground`, links em `text-primaria-texto`, separados por `border-t border-border pt-3`.
- Rodapé do painel: `border-t border-border bg-background px-4 py-3` (md: `px-8`), "Pular" (`ghost`) à esquerda e "Confirmar"/"Próxima"/"Ver resultado" (`primary`, `lg` no celular com largura que cresce) à direita, com `Kbd`.
- Botão flutuante "Perguntar sobre isto": `rounded-md bg-foreground text-background text-xs font-medium px-2.5 h-8 shadow-flutua`.

## Tutor (`painel-tutor.tsx`, `mensagem-tutor.tsx`, `gemea-card.tsx`, `grafico.tsx`)
- Painel `bg-background` (a linha do separador divide). Cabeçalho `h-12 border-b border-border px-4`: "Tutor" `text-sm font-semibold` (tire o ícone de brilhos/Sparkles; se algum ícone for necessário, use `MessageSquare`) + a `Badge` de modo.
- Aviso do modo guiado (`role="note"`): `rounded-md border border-border p-3 text-xs text-texto-2` com o ícone em `text-aviso` (não um bloco âmbar cheio); `<code>` em `.num`.
- Balões: tutor `rounded-lg bg-muted px-3 py-2.5 text-sm` alinhado à esquerda (máx. 88%); aluno `rounded-lg bg-accent px-3 py-2.5 text-sm` à direita. Rótulo do degrau ("Degrau 0 · pergunta") em `.num text-xs text-muted-foreground`, **sem caixa alta**. Selos e partes de ferramenta: linhas `text-xs` com ícone 14px na cor do estado; blocos de código `rounded-md border border-border bg-background .num text-xs`.
- Rodapé do tutor `border-t border-border p-3` com: sugestões (chips das regras, `flex-wrap`); linha da escada: "Dica" + 4 × `Bolha tamanho="xs"` (usados = `marcada`; mantém `role="img"` e `aria-label="degrau {n} de 4"` no grupo) + "Resposta direta" (`ghost`, sm) + "Próximo degrau" (`outline`, sm), cada um com seu `Kbd`; chip da seleção; formulário: `Textarea` (do `ui/input`, 1 linha que cresce, mantém `id` e label) + botão enviar/parar (`primary`, `icon`).
- `gemea-card.tsx`: `Card` com `border-primary/40`; etiquetas; `.qtext`; as mesmas alternativas; botão e status no padrão.
- `grafico.tsx`: figura `rounded-md border border-border`; legenda `.num text-xs`; sliders com `accent-(--cor-primaria)`.

## Fim do sprint (`fim-sprint.tsx`)
Coluna `max-w-[720px]` à esquerda. h1 "{a} de {n}" e a descrição. **Resultado como cartão-resposta**: fileira de `Bolha tamanho="md"` com o número de cada questão (`certa`/`errada`), acima da lista. Três números em faixa (sem card, sem azul): "Acertos", "Dicas usadas", "Tempo total" (`.num text-2xl font-medium`). "Questões": linhas de 40px com `Bolha tamanho="sm"` (`certa`/`errada`, mantendo o `aria-label` "acertou"/"errou" e `data-testid="resultado-questao"`), texto e detalhe à direita em `text-xs`. "Domínio": por habilidade, código `.num` + nome, "antes → depois (delta)" em `.num` com `text-sucesso`/`text-erro`, `Progress`. Botões "Novo sprint" (`primary`, lg, `Kbd N`) e "Voltar para Hoje" (`ghost`).
