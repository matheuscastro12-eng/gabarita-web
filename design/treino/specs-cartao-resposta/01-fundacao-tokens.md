# Spec 01 — Fundação: fontes, tokens e migração das classes

Direção aprovada: **B "Cartão-resposta"** (ver `design/mockups/direcao-b.html` e `.png`, e a seção "Direção B" de `design/mockups/BRIEF.md`). Leia também `AGENTS.md` (Next 16: consulte `node_modules/next/dist/docs/` antes de usar API do Next, em especial `next/font/local`) e `design/INVENTARIO.md` §4 (classes em uso).

Não mexa em `src/lib/dominio`, `src/lib/tutor`, `src/data`, `e2e/`. Não mude textos, roles, aria-labels nem `data-testid`. Não rode `shadcn init` (ele reescreve o CSS global; decisão registrada pelo orquestrador). Não faça commit.

## 1. Fontes locais (sem CDN)
- Copie de `/usr/share/fonts/truetype/sand-box/google/`: `IBM Plex Sans/IBMPlexSans-VariableFont_wdth,wght.ttf`, `IBM Plex Sans/IBMPlexSans-Italic-VariableFont_wdth,wght.ttf`, `IBM Plex Mono/IBMPlexMono-Regular.ttf`, `IBM Plex Mono/IBMPlexMono-Medium.ttf` e o `OFL.txt`/licença se existir na pasta.
- Reduza o peso com `pyftsubset` (já instalado): unicodes `U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+2190-2199,U+2200-222B,U+2248,U+2260-2265,U+00B2,U+00B3,U+00BD,U+2212,U+2022,U+20AC,U+2325,U+2318,U+21B5`, `--layout-features='*'`, mantendo os eixos variáveis. Tente gerar `.woff2` (`pip install --user brotli` é grátis; se não instalar, fique com `.ttf`). Salve em `src/fonts/` como `plex-sans.*`, `plex-sans-italic.*`, `plex-mono-400.*`, `plex-mono-500.*`. Remova `src/fonts/inter-latin*.woff2`.
- `src/app/layout.tsx`: troque a Inter por duas `localFont`: Plex Sans (`variable: "--font-plex-sans"`, weight `"100 700"`, normal + itálico) e Plex Mono (`variable: "--font-plex-mono"`, 400 e 500). Ponha as duas variáveis no `<html>`. `themeColor`: claro `#ffffff`, escuro `#0f0f11`. O link "Pular para o conteúdo" passa a usar `bg-primary text-primary-foreground rounded-md font-semibold`.
- `src/app/manifest.ts`, `src/app/icon.svg`: troque o azul `#0A84FF` por `#1A56DB` e o fundo `#F5F7FA` por `#FFFFFF` (os PNG ficam como estão; anote no resumo).

## 2. `src/app/globals.css` — troque os blocos `:root`, `.dark` e `@theme inline` por estes (mantendo `@import "tailwindcss"` e o `@custom-variant dark` atuais)

```css
:root {
  color-scheme: light;
  /* Cores de produto */
  --cor-fundo: #ffffff;
  --cor-superficie: #ffffff;
  --cor-muted: #f4f4f5;
  --cor-muted-forte: #e4e4e7;
  --cor-linha: #e4e4e7;
  --cor-borda-campo: #8a8a93;
  --cor-texto: #18181b;
  --cor-texto-2: #3f3f46;
  --cor-texto-suave: #63636b;
  /* Destaque único: azul-caneta */
  --cor-primaria: #1a56db;
  --cor-primaria-hover: #1648b8;
  --cor-primaria-suave: #eef4ff;
  --cor-primaria-contraste: #ffffff;
  --cor-primaria-texto: #1a56db;
  /* Estados (texto) e suaves (fundo) */
  --cor-sucesso: #15803d;
  --cor-sucesso-suave: #dcfce7;
  --cor-sucesso-forte: #15803d;
  --cor-sucesso-contraste: #ffffff;
  --cor-aviso: #b45309;
  --cor-aviso-suave: #fef3c7;
  --cor-erro: #be123c;
  --cor-erro-suave: #ffe4e6;
  --cor-erro-forte: #be123c;
  --cor-erro-contraste: #ffffff;
  --cor-espera: #0369a1;
  --cor-espera-suave: #e0f2fe;
  --cor-marca-texto: #fde68a;
  --cor-veu: rgb(24 24 27 / 0.4);
  /* Tipografia */
  --fonte-texto: var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif;
  --fonte-titulo: var(--fonte-texto);
  --fonte-dados: var(--font-plex-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  /* Raio, sombra, motion */
  --raio-1: 6px;
  --raio-2: 8px;
  --raio-3: 10px;
  --raio-4: 14px;
  --sombra-suave: 0 1px 2px rgb(24 24 27 / 0.08);
  --sombra-flutua: 0 0 0 1px var(--cor-linha), 0 12px 32px rgb(24 24 27 / 0.12);
  --duracao: 160ms;
  --curva: cubic-bezier(0.2, 0, 0, 1);
  /* shadcn */
  --radius: var(--raio-2);
  --background: var(--cor-fundo);
  --foreground: var(--cor-texto);
  --card: var(--cor-superficie);
  --card-foreground: var(--cor-texto);
  --popover: var(--cor-superficie);
  --popover-foreground: var(--cor-texto);
  --primary: var(--cor-primaria);
  --primary-foreground: var(--cor-primaria-contraste);
  --secondary: var(--cor-muted);
  --secondary-foreground: var(--cor-texto);
  --muted: var(--cor-muted);
  --muted-foreground: var(--cor-texto-suave);
  --accent: var(--cor-primaria-suave);
  --accent-foreground: var(--cor-texto);
  --destructive: var(--cor-erro);
  --border: var(--cor-linha);
  --input: var(--cor-borda-campo);
  --ring: var(--cor-primaria);
}

.dark {
  color-scheme: dark;
  --cor-fundo: #0f0f11;
  --cor-superficie: #18181b;
  --cor-muted: #27272a;
  --cor-muted-forte: #3f3f46;
  --cor-linha: #2e2e33;
  --cor-borda-campo: #7c7c86;
  --cor-texto: #fafafa;
  --cor-texto-2: #e4e4e7;
  --cor-texto-suave: #a1a1aa;
  --cor-primaria: #7aa5ff;
  --cor-primaria-hover: #9dbcff;
  --cor-primaria-suave: #16264d;
  --cor-primaria-contraste: #0b1020;
  --cor-primaria-texto: #8fb4ff;
  --cor-sucesso: #4ade80;
  --cor-sucesso-suave: #14532d;
  --cor-sucesso-forte: #4ade80;
  --cor-sucesso-contraste: #052e16;
  --cor-aviso: #fbbf24;
  --cor-aviso-suave: #422006;
  --cor-erro: #fb7185;
  --cor-erro-suave: #4c0519;
  --cor-erro-forte: #fb7185;
  --cor-erro-contraste: #4c0519;
  --cor-espera: #7dd3fc;
  --cor-espera-suave: #0c4a6e;
  --cor-marca-texto: #713f12;
  --cor-veu: rgb(0 0 0 / 0.6);
  --sombra-suave: 0 0 0 1px var(--cor-linha);
  --sombra-flutua: 0 0 0 1px var(--cor-linha), 0 12px 32px rgb(0 0 0 / 0.5);
}

@theme inline {
  --font-sans: var(--fonte-texto);
  --font-mono: var(--fonte-dados);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-texto-2: var(--cor-texto-2);
  --color-muted-forte: var(--cor-muted-forte);
  --color-primaria-hover: var(--cor-primaria-hover);
  --color-primaria-texto: var(--cor-primaria-texto);
  --color-sucesso: var(--cor-sucesso);
  --color-sucesso-suave: var(--cor-sucesso-suave);
  --color-sucesso-forte: var(--cor-sucesso-forte);
  --color-sucesso-contraste: var(--cor-sucesso-contraste);
  --color-aviso: var(--cor-aviso);
  --color-aviso-suave: var(--cor-aviso-suave);
  --color-erro: var(--cor-erro);
  --color-erro-suave: var(--cor-erro-suave);
  --color-erro-forte: var(--cor-erro-forte);
  --color-erro-contraste: var(--cor-erro-contraste);
  --color-espera: var(--cor-espera);
  --color-espera-suave: var(--cor-espera-suave);
  --color-marca-texto: var(--cor-marca-texto);
  --color-veu: var(--cor-veu);
  --radius-sm: var(--raio-1);
  --radius-md: var(--raio-2);
  --radius-lg: var(--raio-3);
  --radius-xl: var(--raio-4);
  --shadow-suave: var(--sombra-suave);
  --shadow-flutua: var(--sombra-flutua);
  --default-transition-duration: var(--duracao);
  --default-transition-timing-function: var(--curva);
  --ease-padrao: var(--curva);
}
```

A escala tipográfica volta a ser a **padrão do Tailwind** (apague os `--text-*` customizados) e os raios `xs`/`2xl` customizados saem.

### Resto do `globals.css`
- Tudo que lê variável antiga passa a ler a nova: `--accent`→`--cor-primaria`, `--accent-soft`→`--cor-primaria-suave`, `--accent-text`/`--accent-deep`→`--cor-primaria-texto`, `--surface`→`--cor-superficie`, `--surface-2`→`--cor-muted`, `--success`→`--cor-sucesso`, `--danger`→`--cor-erro`, `--warning`→`--cor-aviso`, `--success-text`→`--cor-sucesso`, `--danger-text`→`--cor-erro`, `--marca-texto`→`--cor-marca-texto`, `--duration`→`--duracao`, `--ease`→`--curva`. Nenhum hex fora de `:root`/`.dark` (o rosa do Mafs `#d6409f` vira `var(--cor-espera)`; a seleção no escuro usa `var(--cor-primaria-suave)` com `color: var(--cor-texto)`).
- `:focus-visible`: `outline: 2px solid var(--ring); outline-offset: 2px;` (sem mexer no raio).
- `.num` vira `font-family: var(--fonte-dados); font-variant-numeric: tabular-nums;` (dado em mono). `.tabular` fica.
- `.qtext` vira sans (herda a fonte), `font-size: 1.0625rem` (17px), `line-height: 1.6`. A regra `.qtext .katex` passa para `font-size: 1.04em`.
- Apague `.hero-azul`. Apague as duplicatas (`gab-barra`, `.anim-barra`, `.entrada-stagger > .entrada-stagger` aparecem duas vezes).
- `.cmdk-grupo [cmdk-group-heading]`: sem `text-transform` nem `letter-spacing`; peso 500. `.cmdk-item`: raio `var(--raio-2)`; selecionado = `background: var(--cor-muted); color: var(--cor-texto)`.
- `.tok-palavra` usa `var(--cor-primaria-texto)` nos dois temas (apague a regra `.dark .tok-palavra`). `.tok-comentario` sem itálico.
- Os keyframes e classes `.anim-*`, `.entrada-stagger`, `.selecao-flutuante`, `.editor-*`, `[data-separator]`, scrollbar e o bloco `prefers-reduced-motion` continuam (com as variáveis novas). O `gab-shake` fica mais curto: amplitudes -3px, 2px, -1px (sem o passo de 85%).
- `body`: `background: var(--background); color: var(--foreground); font-family: var(--fonte-texto);`. Acrescente `font-feature-settings: "zero" 0;` nada mais.

## 3. Migração das classes em `src/app/**` e `src/components/**` (`.ts`/`.tsx`)
Faça com um script (sed/node) e depois confira com `grep` que não sobrou nenhuma classe antiga. Cuide da **ordem** (os nomes compostos primeiro) e dos prefixos (`hover:`, `dark:`, `md:`, `data-[…]:`, opacidade `/NN`):

| Antiga | Nova |
|---|---|
| `*-accent-soft` | `*-accent` |
| `*-accent-text` | `*-primaria-texto` |
| `*-accent-deep` | `*-primaria-hover` |
| `*-accent-foreground` | `*-primary-foreground` |
| `bg-accent`, `text-accent`, `border-accent`, `ring-accent` (o azul cheio) | `bg-primary`, `text-primary`, `border-primary`, `ring-primary` |
| `accent-(--accent)`, `accent-[var(--accent)]`, `var(--accent)` em valores arbitrários | `accent-(--cor-primaria)`, `var(--cor-primaria)` |
| `*-surface-2` | `*-muted` |
| `*-surface` (`bg-`, `border-`, `ring-offset-`) | `*-card` |
| `*-card-borda` | `*-border` |
| `*-success-soft`, `*-success-tint` | `*-sucesso-suave` |
| `*-success-text`, `text-success`, `border-success` | `*-sucesso` |
| `bg-success` | `bg-sucesso-forte` (texto por cima: `text-sucesso-contraste` no lugar de `text-white`) |
| `*-danger-soft`, `*-danger-tint` | `*-erro-suave` |
| `*-danger-text`, `text-danger`, `border-danger` | `*-erro` |
| `bg-danger` | `bg-erro-forte` (texto por cima: `text-erro-contraste`) |
| `*-warning-soft` | `*-aviso-suave` |
| `*-warning-text`, `text-warning`, `border-warning`, `bg-warning` | `*-aviso` |
| `shadow-card` | (remover) |
| `shadow-flutuante` | `shadow-flutua` |
| `duration-(--duration)` / `ease-(--ease)` | `duration-(--duracao)` / `ease-(--curva)` |
| `font-rounded`, `font-serif` | (remover) |
| `font-extrabold`, `font-bold` | `font-semibold` |
| `hero-azul` | (remover; o card fica como os outros. Tire também os `text-white*` que só existiam por causa dele) |
| `bg-[rgba(29,29,31,0.35)]`, `bg-black/60` (véus) | `bg-veu` |
| `text-white` sobre `bg-primary` | `text-primary-foreground` |

**`bg-background` precisa de olho, não de sed:** antes o fundo da página era cinza e `bg-background` era usado como "cinza de preenchimento" (trilho de barra, etiqueta neutra, botão secundário, balão do tutor, esqueleto). Agora o fundo é branco. Em cada uso, decida: é a página/painel inteiro → continua `bg-background`; é preenchimento cinza de um elemento → `bg-muted` (e tire o `dark:bg-surface-2`/`dark:bg-muted` que fazia esse papel no escuro).

Não redesenhe telas nesta tarefa: só a troca de tokens. Vai ficar com cara de meio do caminho; as telas são as próximas tarefas.

## 4. Critérios de aceite e verificação (rode e mostre a saída no resumo)
1. `grep -rnE "(accent-soft|accent-text|accent-deep|surface|card-borda|success|danger|warning|shadow-card|shadow-flutuante|font-rounded|font-serif|font-extrabold|hero-azul|--duration|--ease\b)" src/app src/components` não retorna nada (fora de comentário).
2. `grep -nE "#[0-9a-fA-F]{3,8}\b" src/app/globals.css` só mostra linhas dentro de `:root` e `.dark`.
3. `node design/scripts/contraste.mjs --tokens src/app/globals.css` sai com código 0 (todas as linhas "passa", claro e escuro). Se algum par falhar, **não mude o hex por conta própria**: reporte a linha.
4. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `env -u ANTHROPIC_API_KEY pnpm build` verdes. Atenção: há um servidor `next start` na porta 3100 usando `.next`; se a porta 3100 estiver ocupada, mate o processo pelo PID (`fuser -k 3100/tcp`), não o suba de novo.
5. Resumo final: arquivos alterados, tamanho das fontes, saída do contraste, e toda decisão caso a caso que você tomou em `bg-background`.
