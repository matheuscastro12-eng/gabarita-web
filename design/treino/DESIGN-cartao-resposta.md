# DESIGN.md: Cartão-resposta

Sistema visual do Gabarita desde 2026-11-09 (proposta do treino das skills de design; substitui o original de `docs/DESIGN.md`, que fica como histórico). Tokens em `src/app/globals.css`; componentes em `src/components/ui`. Registro de cada tela em `design/DESIGN-LOG.md`. Preview em `/design-system`.

## Direção

1. **Propósito:** ferramenta diária para resolver questões oficiais de matemática do ENEM com um tutor ao lado e ver o domínio subir até "pronto".
2. **Público:** uma pessoa (Matheus, TDAH), várias sessões curtas por dia, no notebook e no celular. Vê primeiro "Começar" e onde está no sprint.
3. **Tom:** exato e calmo, com cara de folha de prova: papel branco, linha fina, e a tinta azul da caneta só onde você marca.
4. **Detalhe memorável:** a **bolha do cartão-resposta**. Um círculo com a letra dentro, vazio enquanto não marcado e preenchido de tinta quando marcado. A mesma bolha conta o progresso do sprint, numera a fila, marca o item feito do plano e os degraus da dica. Só existe nesses lugares.
5. **Restrições:** Next 16 + Tailwind v4 + Radix; sem CDN (fontes locais); AA conferido por script; pt-BR; `prefers-reduced-motion`; tema escuro mantido; todos os atalhos e funções do app mantidos.

Referências usadas (padrão, nunca marca): cartão-resposta do ENEM (bolhas e linhas); Lucian #015 (rádio em cartão: o marcador entra com pop), #042 (passos que viram check), #151 (grade de calor), #046 (paleta de comandos); motion-prompt #068 (passo em 300ms) e #049 (diálogo em 320ms).

## Tokens

Resumo (valores canônicos no CSS; claro / escuro):

| Papel | Token | Claro | Escuro |
|---|---|---|---|
| Fundo | `--background` / `--cor-fundo` | `#ffffff` | `#0f0f11` |
| Superfície (diálogo, popover, caixa) | `--card` / `--cor-superficie` | `#ffffff` | `#18181b` |
| Preenchimento cinza | `--muted` / `--cor-muted` | `#f4f4f5` | `#27272a` |
| Cinza forte (trilho de barra) | `--cor-muted-forte` | `#e4e4e7` | `#3f3f46` |
| Linha | `--border` / `--cor-linha` | `#e4e4e7` | `#2e2e33` |
| Borda de campo e de bolha vazia | `--input` / `--cor-borda-campo` | `#8a8a93` | `#7c7c86` |
| Texto | `--foreground` / `--cor-texto` | `#18181b` | `#fafafa` |
| Texto 2 | `--cor-texto-2` | `#3f3f46` | `#e4e4e7` |
| Texto suave | `--muted-foreground` / `--cor-texto-suave` | `#63636b` | `#a1a1aa` |
| Primária (azul-caneta) | `--primary` / `--cor-primaria` | `#1a56db` | `#7aa5ff` |
| Primária hover | `--cor-primaria-hover` | `#1648b8` | `#9dbcff` |
| Primária suave | `--accent` / `--cor-primaria-suave` | `#eef4ff` | `#16264d` |
| Texto sobre a primária | `--primary-foreground` | `#ffffff` | `#0b1020` |
| Primária como texto | `--cor-primaria-texto` | `#1a56db` | `#8fb4ff` |
| Sucesso / suave | `--cor-sucesso` / `-suave` | `#15803d` / `#dcfce7` | `#4ade80` / `#14532d` |
| Aviso / suave | `--cor-aviso` / `-suave` | `#b45309` / `#fef3c7` | `#fbbf24` / `#422006` |
| Erro / suave | `--cor-erro` / `-suave` | `#be123c` / `#ffe4e6` | `#fb7185` / `#4c0519` |
| Espera / suave | `--cor-espera` / `-suave` | `#0369a1` / `#e0f2fe` | `#7dd3fc` / `#0c4a6e` |
| Bolha certa / errada (cheia) | `--cor-sucesso-forte`, `--cor-erro-forte` (+ `-contraste`) | `#15803d`, `#be123c` + `#ffffff` | `#4ade80` + `#052e16`, `#fb7185` + `#4c0519` |
| Marca-texto (`<mark>`) | `--cor-marca-texto` | `#fde68a` | `#713f12` |

Classes: as do shadcn (`bg-background`, `bg-card`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-accent`, `border-border`, `border-input`) mais as de estado em pt (`text-sucesso`, `bg-sucesso-suave`, `text-aviso`, `bg-aviso-suave`, `text-erro`, `bg-erro-suave`, `text-espera`) e `text-primaria-texto`, `bg-primaria-hover`, `text-texto-2`, `bg-muted-forte`, `bg-veu`.

**Atenção ao nome `accent`:** aqui `bg-accent` é o azul **suave** (convenção shadcn). O azul cheio é `bg-primary`. No sistema antigo era o contrário.

Proibido: bege/creme, serifa, roxo, gradiente de matiz, brilho, vidro, hex solto fora dos tokens. Vermelho só em estado de erro. Um destaque só: o azul-caneta marca a ação principal, a seleção e o progresso; nunca decora.

### Contraste conferido (`node design/scripts/contraste.mjs --tokens src/app/globals.css`)

Ver a tabela completa, claro e escuro, em `/design-system` e no fim do `DESIGN-LOG.md`. Mínimos: texto 4,5:1 (também sobre muted e sobre os suaves); borda de campo e UI 3:1. A linha decorativa (`--cor-linha`, 1,24:1 no claro) separa blocos e não carrega informação sozinha; todo controle usa `--cor-borda-campo` (3,42:1).

## Tipografia

- Texto e título: **IBM Plex Sans** (variável, local em `src/fonts/`, OFL). Escolhida pelos numerais e letras que não se confundem (1 l I, 0 O), o que importa num app de matemática.
- Dado: **IBM Plex Mono** 400/500, só para cronômetro, códigos (H20, Q148), `kbd`, valores de domínio, números grandes e código do Laboratório. Classe `.num` (mono + `tabular-nums`).
- Enunciado e alternativas: a mesma sans, `.qtext` 17px/1,6. A matemática usa as fontes do KaTeX (são serifadas por natureza; é a única serifa do app, e só dentro de fórmula).
- Escala: a do Tailwind (12 / 14 / 16 / 18 / 20 / 24 / 30). h1 `text-2xl` (celular `text-xl`), título de seção `text-base`, corpo `text-sm` na interface e 17px no enunciado, legenda `text-xs`. Nada abaixo de 11px.
- Pesos: 400 texto · 500 rótulo e botão · 600 título. Nunca 700+. Sem caixa alta com tracking, sem itálico de ênfase, sem tracking negativo em texto pequeno.

## Espaço, raio, sombra, motion

- Espaço: 4 / 8 / 12 / 16 / 24 / 32 / 48. Página 16px no celular, 32px no desktop. Barra lateral 232px, linhas de 36px.
- Raio: `--raio-1..4` = 6 / 8 / 10 / 14 (`rounded-sm` etiqueta · `rounded-md` controle · `rounded-lg` caixa · `rounded-xl` diálogo). `rounded-full` só em bolha, bolinha e polegar de interruptor.
- Sombra: nenhuma em bloco de página. `shadow-suave` em peça pequena elevada; `shadow-flutua` em diálogo, popover, toast e gaveta. No escuro a profundidade vem de degrau de superfície e linha.
- Blocos se separam por **linha de 1px e espaço**, não por card. Caixa com borda só quando o bloco é um objeto (questão gêmea, entrada do caderno, diálogo).
- Motion: `--duracao` 160ms, `--curva` cubic-bezier(.2,0,0,1); entradas 220ms; confirmação 240ms. Só `transform`/`opacity` (cor em `transition-colors`). Nada em loop além de spinner de carregamento real. `prefers-reduced-motion` zera tudo.

## Componentes base

Button (primary, secondary, ghost, outline, danger, link) · Input / Textarea / Select / Label · Card · Badge (neutral, accent, success, warning, danger, outline, solid) · Dialog (também a gaveta) · Toast (Radix; o app não usa sonner) · Esqueleto · Tabs (sublinhado) · Progress (6px) · Kbd · Tooltip · ScrollArea · Contador · **Bolha** (vazia, marcada, meia, certa, errada, feita; 12 / 20 / 28px). Todos em `src/components/ui`, lendo os tokens.

## Estados padrão

| Estado | O que mostrar |
|---|---|
| Loading | `Esqueleto` estático em `bg-muted` no lugar exato do conteúdo |
| Empty | ícone em quadrado `bg-muted`, por que está vazio + um botão com a próxima ação |
| Error | caixa `bg-erro-suave` com texto `text-erro`, o que falhou + como resolver |
| Partial | o que carregou + aviso `bg-aviso-suave text-aviso` (ex.: "sem parâmetro TRI", tutor em modo guiado) |
| Success | confirmação curta em `text-sucesso` + próximo passo |
| Permission | não se aplica (um usuário, sem login) |

## Preview

Rota `/design-system` (fora do índice e fora do menu): cores, contraste, tipo, bolhas, controles, raios, sombras, movimento, estados. Dados marcados como exemplo.

## Registro

Cada tela nova passa por `/base-de-design` e registra os passos em `design/DESIGN-LOG.md` antes do código. Direções novas são de composição; paleta e fonte só mudam com ok e com edição deste arquivo.

## Fonte da verdade

Este arquivo + o CSS de tokens. Não trocar fonte/cor/raio sem ok.
