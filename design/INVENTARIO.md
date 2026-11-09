# Inventário de UI do Gabarita

Levantamento factual do código em `feat/design-system-skills-test` (base `b630f1d`), feito em 09/11/2026 só lendo o código. Fontes: `README.md`, `docs/DESIGN.md`, `src/app/**`, `src/components/**`, `src/lib/atalhos/**`, `src/app/globals.css` e `e2e/*.spec.ts`. Serve de checklist para um redesign: cada função, estado, atalho e seletor listado aqui existe hoje e precisa continuar existindo.

Convenções: caminhos relativos a `src/`. "Celular" = abaixo do breakpoint `md` (768px), salvo indicação. Os textos entre aspas aparecem na tela exatamente assim.

---

## 0. Casca global (vale para todas as rotas)

**Arquivos:** `app/layout.tsx`, `components/app/providers.tsx`, `components/app/app-shell.tsx`, `components/app/sidebar.tsx`, `components/app/navegacao.ts`, `components/app/pagina.tsx`.

- **Providers** (de fora para dentro): `ThemeProvider` (next-themes, `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`, `disableTransitionOnChange`) → `TooltipProvider` (atraso 300ms) → `AtalhosProvider` → `ToastProvider` → `StoreProvider` (IndexedDB).
- **`<html lang="pt-BR">`** com a variável `--font-inter` (Inter local em `src/fonts/`, só reserva) e `suppressHydrationWarning`.
- **Link "Pular para o conteúdo"** (`sr-only`, aparece no foco, aponta para `#conteudo`).
- **Layout:** `div.flex.h-dvh` → Sidebar (desktop) ou BarraSuperior (celular) → `<main id="conteudo">` (contém `AvisoArmazenamento` + página) → `PaletaComandos` → `AjudaAtalhos`.
- **Modo foco:** a IDE dispara o evento `window` `gabarita:foco` (`definirModoFoco(bool)`). Com foco ligado a casca **não renderiza** Sidebar nem BarraSuperior (somem do DOM, não só ficam ocultas). Vale só para o `pathname` em que foi ligado; mudar de rota desliga.
- **Componentes de página** (`components/app/pagina.tsx`):
  - `CabecalhoPagina({ titulo, descricao?, acoes?, className? })`: `<h1>` 22px/800 (24px em `md`), `tracking-[-0.4px]`; descrição `max-w-prose` muted; ações à direita.
  - `ConteudoPagina({ className, semRodape?, ...div })`: área rolável própria, conteúdo `max-w-[1400px]` centralizado, `px-3 pt-4` (celular) / `md:px-7 md:pt-6.5`, `gap-5`, classe `entrada-stagger`; inclui `RodapeFonte` salvo `semRodape`.
  - `RodapeFonte`: "{N} questões oficiais do INEP (transcrição enem.dev)" ou "Dados de desenvolvimento (fixture): …" + " · nota TRI sempre estimada · explicações do tutor podem conter erros · seu progresso fica salvo neste navegador". 11,5px, centralizado.
  - `EstadoVazio({ icone?, titulo, descricao, acao? })`: card centralizado; ícone num quadrado `accent-soft` 48px; `<h2>` + texto + ação.

### 0.1 Navegação (`navegacao.ts`)

Ordem exibida e índice do atalho `Alt+n`:

| Ordem | Rótulo | Rota | Ícone (lucide) | Atalho |
|---|---|---|---|---|
| 1 | Hoje | `/` | Home | Alt+1 |
| 2 | Estudar | `/estudar` | Pencil | Alt+2 |
| 3 | Aprender | `/aprender` | Shapes | **Alt+7** |
| 4 | Mapa | `/mapa` | Map | Alt+3 |
| 5 | Caderno | `/caderno` | BookMarked | Alt+4 |
| 6 | Laboratório | `/laboratorio` | FlaskConical | Alt+5 |
| 7 | Ajustes | `/ajustes` | Settings | Alt+6 |

`itemAtivo`: `/` só ativa em `/` exato; os demais ativam em `href` e `href/…`. Fato: o README e o 404 dizem "Alt+1 a 6"; Aprender usa Alt+7.

### 0.2 Sidebar (desktop, `md` para cima) — `Sidebar`

- `<nav aria-label="Principal">`, largura fixa **210px**, `bg-surface`, `px-3 pt-7 pb-4`; no escuro ganha `border-r`.
- Seções na ordem: (1) registra os 7 atalhos `Alt+n` (componente `AtalhoNavegacao`, sem UI); (2) `Marca` (link para `/`, `aria-label="Gabarita, início"`, Logo capelo 22px + "Gabarita" `font-rounded` 20px/800); (3) rótulo "Menu" 10px/700 caixa alta, `aria-hidden`; (4) lista de 7 links (`ItemLateral`): ícone 18px traço 1,8 + rótulo; `title="{rótulo} (Alt+n)"`; ativo = `aria-current="page"`, `bg-accent-soft text-accent-text font-semibold`; (5) no fim (`mt-auto`), `ThemeToggle` em formato de item de menu.

### 0.3 Barra do celular (abaixo de `md`) — `BarraSuperior`

- `<nav aria-label="Principal">` de **52px** no topo (y=0), `bg-surface shadow-card`, rolagem horizontal sem barra.
- Ordem: `Marca compacta` (Logo 20px + "Gabarita" 16px) → 7 links só texto (12,5px, sem ícone; ativo `bg-accent-soft text-accent-text`, `aria-current="page"`) → `ThemeToggle compacto` (só ícone 36px, `ml-auto`).
- Não há barra inferior: a navegação no celular é esta barra superior.

### 0.4 Tema — `components/app/theme-toggle.tsx` (+ Ajustes e paleta)

- `ThemeToggle({ className?, compacto? })`. Alterna `light`/`dark` via `next-themes` (`setTheme`). Antes de montar assume claro (`useMontado`).
- `aria-label` = "Mudar para o modo escuro" (no claro) / "Mudar para o modo claro" (no escuro). Versão lateral mostra o texto "Modo escuro"/"Modo claro"; versão compacta tem também `title`. Ícone Moon/Sun.
- Outros pontos que trocam tema: paleta de comandos (item "Mudar para o modo …") e Ajustes → Aparência (rádios Claro/Escuro).
- O tema vira a classe `light`/`dark` no `<html>`; o CSS tem `@custom-variant dark (&:where(.dark, .dark *))`.

### 0.5 Aviso de armazenamento — `components/app/aviso-armazenamento.tsx`

- Aparece no topo do `<main>` quando `useStore().aviso` existe (IndexedDB falhou → progresso em memória).
- `role="status"`, `data-testid="aviso-armazenamento"`, faixa `bg-warning-soft` com borda inferior `border-warning/30`.
- Conteúdo: ícone HardDriveDownload + texto do aviso (contém "bloqueou o armazenamento local") + link "Abrir Ajustes" (`/ajustes`) + botão X `aria-label="Fechar o aviso"`.
- Estados: oculto (sem aviso) · visível · fechado (estado local; volta ao recarregar).

### 0.6 Toasts — `components/ui/toast.tsx`

- `ToastProvider` + `useToast().notificar({ titulo, descricao?, tipo?, duracao? })`. Tipos: `info` (ícone Info, `text-accent-text`), `sucesso` (CheckCircle2, `text-success`), `erro` (XCircle, `text-danger`), `aviso` (TriangleAlert, `text-warning`). Duração padrão 4000ms.
- Mantém no máximo 4 (descarta os mais antigos: `slice(-3)` + novo). Viewport fixo no canto inferior direito, `max-w-sm`, `z-[60]`. Card `rounded-lg`, `shadow-flutuante`, botão X `aria-label="Fechar"`. Deslize para a direita fecha (`swipeDirection="right"`). Região Radix `label="Notificações"`.
- Animação: `anim-slide-in-right` ao abrir, `anim-fade-out` ao fechar.
- Quem dispara (títulos exatos):
  - Estudar: "Não consegui iniciar o sprint", "Não consegui salvar a tentativa" (erro).
  - Gêmea: "Não consegui salvar a gêmea" (erro).
  - Simulado: "Não consegui salvar a resposta", "Não consegui encerrar o simulado" (erro).
  - Ajustes: "Salvo." (padrão, 1800ms), "Meta {n} salva.", "Data da prova salva."/"Data da prova removida.", "{H} entrou na semana."/"{H} saiu da semana.", "Cronômetro visível."/"Cronômetro escondido.", "Não consegui salvar"; "Backup exportado." (descrição = nome do arquivo); "Não consegui ler o backup" (6000ms); "Backup importado." ("{n} tentativas restauradas."); "Não consegui importar"; "Progresso zerado." ("Tudo voltou ao começo. O backup exportado continua valendo."); "Não consegui zerar".

### 0.7 Paleta de comandos — `components/app/paleta-comandos.tsx`

- Abre/fecha com `mod+k` (Ctrl/⌘+K), funciona até dentro de campos. É um `Dialog` sem botão de fechar (`semFechar`), posicionado a 18% do topo, com `DialogTitle` sr-only "Paleta de comandos"; dentro, `cmdk` (`Command label="Paleta de comandos"`).
- Seções na ordem: campo `placeholder="O que você quer fazer?"` (autofoco) → vazio "Nada encontrado." → grupo **"Ir para"** (7 destinos, ícone + rótulo + `Kbd` "Alt+n"; `value="ir {rótulo}"`) → grupo **"Nesta tela"** (todos os atalhos registrados que não são de "Navegação" nem "Geral" e não estão `ativo:false`; mostra descrição + teclas) → grupo **"Geral"** ("Mudar para o modo claro/escuro"; "Ver atalhos de teclado" com `Kbd ?`, abre a ajuda).
- Selecionar fecha o diálogo e executa no próximo tick (`setTimeout 0`). Itens com classe `.cmdk-item`, grupos `.cmdk-grupo` (CSS em `globals.css`).

### 0.8 Ajuda de atalhos — `components/app/ajuda-atalhos.tsx`

- Abre/fecha com `?` (shift+/). `Dialog` `max-w-2xl`, título "Atalhos de teclado", descrição "Dá para fazer um sprint inteiro sem tirar a mão do teclado."
- Lista **todos** os atalhos registrados no momento, agrupados na ordem Geral → Questão → Tutor → Sprint → Navegação → outros (ex.: "Simulado") em ordem alfabética. Grade de 2 colunas a partir de `sm`, rolagem em `max-h-[60vh]`. Atalho com `ativo:false` aparece em muted. Teclas exibidas por `teclasParaExibir` (⌘/⌥ no Mac, Ctrl/Alt fora; Enter, Esc, Espaço, setas).
- Fecha com Esc ou botão X (`aria-label="Fechar"`).

---

## 1. Rotas e superfícies

### 1.1 `/` — Hoje

**Arquivos:** `app/page.tsx` (metadata "Hoje · Gabarita"), `components/hoje/tela-hoje.tsx`.

Seções na ordem:
1. **Cabeçalho**: `<h1>` = saudação "Bom dia/Boa tarde/Boa noite, {nome}." (antes do estado carregar: "Hoje").
2. **Erro** (se houver): `role="alert"`, "Não consegui carregar seus dados." + mensagem.
3. **Stat cards** (`data-testid="stat-cards"`, grade 2 colunas; 4 em `lg`), cada um `data-testid="stat"`:
   - "Dias até a prova" — **hero** (`hero-azul`, gradiente azul, texto branco), ícone Calendar. Valor: dias, "0" se passou, "—" sem data. Detalhe: "Defina a data da prova nos Ajustes" ou "Faltam {n} dias · meta {m}".
   - "Resolvidas hoje" (CheckCircle2): tentativas de hoje; detalhe "{a} acertos · {n} sprints" ou "meta: 1 sprint de 5".
   - "Nota estimada" (Target): nota TRI ou "—"; detalhe "{inf}–{sup} · estimativa" ou "aparece após a 1ª questão com TRI".
   - "Revisões vencidas" (RotateCcw): contagem; detalhe = lista de habilidades ou "retenção prevista acima de 90%".
   - Valor usa `Contador` (número sobe de 0, 520ms). Detalhe com `line-clamp-2` e `title`.
4. **Linha 2** (grade; 4 colunas em `lg`):
   - **Card "Sprint de 5 questões"** (`data-testid="card-sprint"`, 2 colunas): descrição "Próximas: {n} questões oficiais em {k} habilidades, fáceis primeiro. Uns 12 minutos, com as suas revisões no meio." (ou "Nenhuma questão disponível agora. Volte amanhã ou importe o banco."; enquanto monta, texto sr-only "Montando a fila…"). Lista `<ol aria-label="Fila do sprint">` com até 5 chips: habilidade (`num`), nome da habilidade (só `md`+), badge de dificuldade "fácil/média/difícil/sem TRI". Botão **"Começar"** (`data-testid="comecar"`, `size="lg"`, link para `/estudar`, `Kbd Enter`). Ao lado, se já houve sprint hoje: "Hoje: {n} sprint(s), {a}/{t} acertos."
   - **Card "Plano de hoje"** (`data-testid="plano-hoje"`, 2 colunas): checklist de 4 itens (sprint → `/estudar`; revisões → `/estudar`; caderno → `/caderno`; simulado → `/simulado`). Feito = texto riscado + CheckCircle2 verde, sem link. Pendente = link com Circle azul + ChevronRight. Rodapé: "Sem data da prova. Definir nos Ajustes." (link) · "Reta final: {prazo} para a prova" (≤30 dias, `text-warning-text`) · "A prova {prazo}."
5. **Linha 3**:
   - **Card "Questões por dia"**: gráfico de barras de 7 dias feito com divs (`role="img"`, `aria-label="Questões por dia: …"`), barra com número em cima, inicial do dia embaixo (D S T Q Q S S), barras com `anim-barra`. Vazio: "Nenhuma questão nos últimos 7 dias. O primeiro sprint aparece aqui." Legenda "meta 5/dia (um sprint)".
   - **Card "Domínio por habilidade"** (`data-testid="card-dominio"`): "As que mais precisam de atenção (de 0 a 1)." Até 6 habilidades com menor domínio: código, `Progress` (`aria-label="Domínio em {H}"`), valor. Vazio: "Aparece depois do primeiro sprint." Link "Ver o mapa completo" → `/mapa`.
6. Rodapé de fonte.

**Interações:** botão Começar; atalho `Enter` (vai para `/estudar`); links do plano; link do mapa; link dos Ajustes.

**Estados:** carregando (esqueletos em stat, chips, plano, domínio; `Esqueleto` estático, sem pulsar) · erro (alerta no topo, resto continua) · vazio (sem tentativas: textos de vazio em cada card) · parcial (estado carregou mas questões não: fila `null`) · sucesso.

**Celular:** stat cards em 2 colunas; cards da linha 2 e 3 empilhados; chip da fila sem o nome da habilidade; stat 30px (3xl em `md`), altura mínima 104px (128px em `md`).

### 1.2 `/estudar` — IDE do sprint

**Arquivos:** `app/estudar/page.tsx` (metadata "Estudar"), `components/estudo/tela-estudar.tsx`, `ide.tsx`, `barra-sprint.tsx`, `questao-view.tsx`, `alternativas.tsx`, `imagem-questao.tsx`, `markdown.tsx`, `painel-tutor.tsx`, `mensagem-tutor.tsx`, `gemea-card.tsx`, `grafico.tsx`, `use-responder-gemea.ts`, `fim-sprint.tsx`, `components/laboratorio/gaveta-laboratorio.tsx`.

**Fases** (`TelaEstudar`): `carregando` → `vazio` | `sprint` → `fim`. Ao carregar estado+questões monta a fila e inicia o sprint uma vez. Query `?questao=<id>` põe essa questão na frente (usado pelo "Refazer" do caderno e pelos e2e).

**Estados de tela:**
- **Carregando:** `EsqueletoIDE` (`aria-busy="true"`, `aria-label="Carregando o sprint"`): barra de 48px, card da questão com linhas e 5 alternativas falsas, painel do tutor (só `md`+). Grade `md:grid-cols-[58%_1fr]`.
- **Erro:** `EstadoVazio` "Não consegui carregar" + mensagem + botão "Tentar de novo" (recarrega a página).
- **Vazio:** `EstadoVazio` "Nada para estudar agora" / "Todas as questões disponíveis foram acertadas nos últimos 7 dias. Volte amanhã ou sincronize mais questões com pnpm sync-provas." + botão "Voltar para Hoje".
- **Sprint:** IDE (abaixo). **Fim:** `FimSprint` (1.2.6).

#### 1.2.1 Barra do sprint (`BarraSprint`) — topo, 48px

Ordem: Logo + "Gabarita" (texto só `sm`+) → "Sprint" (só `sm`+) + bolinhas `●●◐○○` (`role="img"`, `aria-label="questão {i} de {n}"`; estados acertou verde / errou vermelho / atual meio azul / pendente vazio; ao responder fazem `anim-pop`) + "{i}/{n}" (`num`) → rótulo da habilidade "{nome} · {H}" (só `md`+) → à direita: cronômetro `CaixaTempo` mm:ss (`aria-label="tempo nesta questão"`, só se `perfil.mostrarTimer`; para ao confirmar) → botão Laboratório (ícone FlaskConical, `aria-label="Abrir o Laboratório"`, `data-testid="abrir-laboratorio"`, tooltip "Laboratório L") → botão Modo foco (`aria-label="Modo foco"`, `aria-pressed`, ícone Maximize2/Minimize2, tooltip "Modo foco F").

#### 1.2.2 Layout dos painéis

- **Desktop (`md`+):** `react-resizable-panels` `Group` horizontal: `Panel id="questao"` (padrão 58%, mín. 35%) | `Separator` (`w-1.5`, `cursor-col-resize`, `aria-label="Redimensionar painéis"`, role `separator`) | `Panel id="tutor"` (padrão 42%, mín. 28%, `bg-surface`). O layout arrastado pelo usuário é salvo em `localStorage["gabarita:layout-ide"]` e relido na próxima vez.
- **Celular:** `Tabs` com duas abas em chips de largura total: "Questão" e "Tutor" (role `tab`). Pedir dica, resposta direta, `/` ou "Perguntar sobre isto" trocam para a aba Tutor sozinhos.
- **Rodapé da IDE** (se a questão tem habilidade): "domínio {H}" (+ nome sr-only) · `Progress` (máx. 192px) · valor 0–1 · texto do que falta (`data-testid="falta"`, só `sm`+): "pronto nesta habilidade" / primeira falta / "primeiro item desta habilidade".
- **Modo foco:** esconde Sidebar/BarraSuperior (ver 0); a barra do sprint e os painéis ficam.

#### 1.2.3 Painel da questão (`QuestaoView`)

- `<article aria-labelledby="titulo-questao">`, fundo `bg-background`, área rolável; card central `max-w-[760px]` com `anim-questao` (entra a cada questão).
- Ordem no card: **linha de tags** — `<h2 id="titulo-questao">` "ENEM {ano} · Q{n}" (estilo tag) · badge dificuldade "fácil/média/difícil · b {x,xx}" (success/warning/danger) ou "sem parâmetro TRI" · badge habilidade (accent, `title`=nome; sufixo " (estimada)" se não for do INEP) · badge "anulada" (danger) · `canto` opcional (cronômetro no simulado) · botão **"Ver visualmente"** (só na IDE, se o assunto tem visual) → **enunciado** (`data-testid="enunciado"`, Markdown com classe `.qtext` serifada; imagens via `ImagemQuestao`) → **alternativas** → **status** após confirmar (`role="status"`, "Acertou." verde ou "Não foi dessa vez. O gabarito é {X}." vermelho; rola até ele) → `<details>` "Dados da imagem em texto" (se a curadoria tem) → **fonte** (`FonteQuestao`, `data-testid="fonte"`: citação INEP + link "provas e gabaritos" + link "transcrição enem.dev" + origem do gabarito + origem do TRI).
- **Rodapé fixo do painel:** antes de confirmar: "Pular" (ghost, à esquerda) e **"Confirmar"** (`data-testid="confirmar"`, desabilitado sem marcação, `Kbd Enter`); depois: **"Próxima"** ou **"Ver resultado"** na última (`data-testid="proxima"`, `Kbd N`).
- **Seleção → chat:** selecionar ≥3 caracteres dentro do enunciado mostra um botão flutuante **"Perguntar sobre isto"** (`data-testid="perguntar-sobre"`, classe `.selecao-flutuante`; vai para baixo da seleção perto do topo: `.selecao-flutuante-abaixo`). Clicar manda o trecho (até 400 caracteres) para o chip do tutor, troca para a aba Tutor e foca o campo.

**Alternativas (`Alternativas`):** `role="radiogroup" aria-label="Alternativas"`; cada uma é `<button role="radio" aria-checked data-letra="A…E">`, raio 14px (`rounded-lg`), borda 1,5px, texto serifado 15px, letra num círculo de 29px. Estados: normal · hover (borda azul 60%) · marcada (borda e círculo azuis) · confirmada certa (verde, `bg-success-tint`, check que se desenha `anim-desenha`, `anim-assenta`) · confirmada errada (vermelha, `bg-danger-tint`, X com `anim-pop`, `anim-shake`) · desabilitada após confirmar. Antes de confirmar, `Kbd` da letra aparece no hover/foco. Alternativa com imagem usa `ImagemQuestao` (`alt="Alternativa X"`).

**Imagem da questão (`ImagemQuestao`):** `<img loading="lazy">` (máx. 28rem). Se falha ou não tem `src`: bloco tracejado `role="img"` `data-testid="imagem-quebrada"` com "Imagem da questão não carregou.", texto explicativo (ou a descrição curada) e link "Abrir a imagem original".

**Diálogo "Ver visualmente" (`BotaoVisual` em `questao-view.tsx`):** botão outline `h-7` "Ver visualmente" (ícone Shapes, `data-testid="ver-visualmente"`), só aparece se `visualParaAssuntos(assuntos)` encontra um visual. Abre `Dialog` `max-w-2xl`, `max-h-[90dvh]` rolável: título = título do visual; descrição "O básico por trás desta questão, com outros números. Depois volte e resolva."; corpo = o mesmo componente visual de `/aprender` (com `data-testid="visual-{id}"`). Fecha com Esc ou X. Não aparece no simulado.

#### 1.2.4 Painel do tutor (`PainelTutor`)

Três modos com a mesma casca (`Casca`): **carregando** (status da IA ainda `null`: badge "conectando…", campo desabilitado, só o balão de abertura), **ia** (`ChatIA`, `useChat` + `/api/tutor`) e **guiado** (`ChatGuiado`, offline). Modo vem de `useStatusIA()` (`/api/status`).

Ordem na casca (`<section aria-label="Tutor">`, role `region`):
1. **Cabeçalho:** ícone Sparkles + `<h2>` "Tutor" + badge à direita: "IA" (accent, `title="Modelo: …"`) / "modo guiado" (warning) / "conectando…" (outline).
2. **Conversa** (`data-testid="conversa"`, rola sozinha para o fim a cada mudança):
   - No guiado: nota `role="note"` com ícone WifiOff e o aviso offline (contém "Tutor de IA desligado" e `ANTHROPIC_API_KEY` em `<code>`).
   - Balão de abertura: "Antes de calcular: o que a questão está pedindo, com as suas palavras?" (na IA com rótulo "Degrau 0 · pergunta").
   - Balões (`Balao`): tutor à esquerda (`bg-background`, canto sup. esq. 4px), aluno à direita (`bg-accent-soft`); rótulo opcional em caixa alta 11px ("Degrau n · …", "Resolução completa" etc.); selo opcional.
   - Selos: **"conferido"** (`SeloConferido`, badge success, `data-testid="selo-conferido"`) quando uma verificação bateu; **"não conferido"** (`SeloNaoConferido`, warning) após 2 divergências acumuladas.
   - Partes de ferramenta (modo IA): `run_python` (bloco recolhível "Conferindo no SymPy"/objetivo, badge "SymPy"/"erro", spinner; aberto mostra código e saída; fechado mostra "= resultado"); `verify_answer` (linha verde com BadgeCheck ou âmbar com ShieldAlert); `calc` ("expr = resultado" monoespaçado); `plot_function` (`Grafico`); `make_twin` (`GemeaCard`); `record_event` e `get_hint` não aparecem. Enquanto rodam: "conferindo o valor…", "calculando…", "desenhando o gráfico…", "gerando a gêmea…". Balão "pensando…" enquanto espera.
   - Erro (IA): `role="alert"` "O tutor não respondeu." + mensagem + botão "Tentar de novo" (`chat.regenerate`). Erro `missing_key` muda o app para o modo guiado.
3. **Rodapé:**
   - **Sugestões** (`aria-label="Sugestões"`, chips outline sm). IA: "Por que errei?" (se confirmou errado), "Questão gêmea" (se confirmou ou degrau 4), "Gráfico", "Laboratório" (este é link para `/laboratorio`). Guiado: sugestões vêm de `lib/tutor/offline` e mudam a cada resposta; o chip "Laboratório" também vira link.
   - **Linha da escada:** "Dica" + `EscadaDicas` (4 barrinhas, `role="img"`, `aria-label="degrau {n} de 4"`; nome do degrau sr-only: pergunta, conceito, primeiro passo, quase lá, resolução) → à direita: botão **"Resposta direta"** (ghost, ícone Unlock, `data-testid="resposta-direta"`, `aria-label` "Resposta direta"/"Resposta pedida", texto só `sm`+, `Kbd ⌥R` só `lg`+; desabilita depois de pedido; `title` explica que fica registrado) e botão **"Próximo degrau"** (secondary, ícone Lightbulb, `data-testid="dica"`, `Kbd H` só `sm`+; vira "Resolução mostrada" e desabilita no degrau 4).
   - **Chip da seleção** (`data-testid="chip-selecao"`): "Sobre: «trecho»" + botão X `aria-label="Remover o trecho selecionado"`. O trecho vai junto da próxima mensagem e some.
   - **Formulário:** `<textarea id="pergunta-tutor">` (label sr-only "Pergunte do seu jeito"), 1 linha que cresce até 160px, placeholder "pergunte do seu jeito…" (IA) ou "peça dica, resolução ou conta…" (guiado). Enter envia, Shift+Enter quebra linha. Botão "Enviar" (ícone, `aria-label="Enviar"`) ou "Parar" (`aria-label="Parar"`) enquanto a IA transmite.

**Escada de dicas (4 degraus):** degrau 0 = pergunta de abertura; H/"Próximo degrau" pede 1 → 2 → 3 → 4 (resolução). O degrau nunca desce. Pedir resposta direta (⌥R ou botão) marca `pediuResposta` e leva ao degrau 4; o pedido é registrado como evento `pedido_resposta`. Na IA a ferramenta `record_event` também pode subir o degrau.

**Gêmeas (`GemeaCard`):** `<section aria-label="Questão gêmea" data-testid="gemea">` com borda azul 50%: badges "Gêmea · {gerador}" e "resposta calculada" (outline, com check) → enunciado `.qtext` → `Alternativas` → botão **"Confirmar gêmea"** (`data-testid="confirmar-gemea"`, desabilitado sem marcação) → depois `role="status"`: "Acertou a gêmea." ou "Não foi dessa vez. O gabarito é X." + "Erro típico de quem marca X: …" + botão "Ver a resolução" (mostra a resolução em Markdown). Responder registra tentativa de origem `gemea` (peso 0,6, sem sprint). Aparece no chat (IA e guiado) e no diálogo do Caderno.

**Gráfico (`Grafico`):** `<figure data-testid="grafico">`: título opcional → área Mafs (altura padrão 280px; pan e zoom; classe `.mafs-tema`) ou placeholder `aria-busy` "Carregando o gráfico" ou erro "Não consegui carregar o motor de gráficos." → legenda das funções (monoespaçada; erro em vermelho) → sliders por parâmetro (`<input type="range" aria-label="parâmetro {nome}">`, valor "a = 1,5" com vírgula).

#### 1.2.5 Gaveta do Laboratório (`GavetaLaboratorio`)

- Radix Dialog ancorado à direita (`data-testid="gaveta-laboratorio"`), `max-w-xl`; no celular ocupa a tela toda de cima a baixo; em `md`+ fica a 12px das bordas com raio 20px. Overlay escurecido. Entra com `anim-slide-in-right`.
- Abre com `L` ou o botão da barra; fecha com `Esc`, clique fora ou X (`aria-label="Fechar o Laboratório"`).
- Ordem: cabeçalho (FlaskConical + título "Laboratório" + "gaveta · L abre e Esc fecha" + X) → abas "Python + SymPy" | "Gráfico" → conteúdo: `EditorPython compacto` (editor 7 linhas, `id="codigo-python-gaveta"`) ou `Plotador compacto` (input `id="expressao-grafico-gaveta"`, gráfico 240px). Digitar no editor não dispara atalhos de letra.

#### 1.2.6 Fim do sprint (`FimSprint`)

`ConteudoPagina` `max-w-[760px]`. Ordem:
1. `<h1>` "{acertos} de {total}"; descrição "Sprint limpo. Faça uma pausa curta antes do próximo." ou "Cada erro já está no caderno. Faça uma pausa curta antes do próximo."
2. Três stat cards (2 colunas; 3 em `sm`): **"Acertos"** hero azul "{a}/{n}" · "Dicas usadas" · "Tempo total" "{m} min".
3. Card **"Questões"**: uma linha por tentativa (`data-testid="resultado-questao"`): círculo verde/vermelho (`aria-label` "acertou"/"errou"), "1.", "ENEM {ano} · Q{n} · {H}", "marcou X"/"pulou" + " · dica n" + " · rápido demais" (chute suspeito).
4. Card **"Domínio"** ("Como cada habilidade mudou neste sprint (de 0 a 1)."): por habilidade (`data-testid="delta-habilidade"`): código + nome, "antes → depois (+/−delta)" (verde/vermelho), `Progress` (accent ou danger).
5. Botões: **"Novo sprint"** (`data-testid="novo-sprint"`, lg, `Kbd N`) e "Voltar para Hoje" (ghost, link `/`).

**Interações:** `N` = novo sprint (volta à fase carregando e monta outra fila).

#### 1.2.7 Comportamento no celular (resumo)

Barra superior de navegação no topo (some no modo foco); barra do sprint sem "Gabarita"/"Sprint"/habilidade; abas Questão/Tutor no lugar dos painéis; sem separador redimensionável; rodapé sem o texto do que falta; esqueleto sem o painel do tutor; gaveta em tela cheia.

### 1.3 `/mapa` — Mapa

**Arquivos:** `app/mapa/page.tsx` (metadata "Mapa"), `components/mapa/tela-mapa.tsx`.

Seções na ordem:
1. **Cabeçalho** "Mapa" + descrição + ação **"Simulado de 15 fáceis"** (ícone Timer, `data-testid="ir-simulado"`, link `/simulado`).
2. Erro (`role="alert"`, "Não consegui carregar seus dados.").
3. **Grade** (1 coluna; em `lg` 2fr | 3fr):
   - Esquerda: **Card "Nota estimada"** (`data-testid="card-nota"`) com badge "estimativa"; descrição do método (EAP, N(0,1), 500+100θ, 95%). Com dados: "{nota} ({inf}–{sup})" 3xl + "θ = … ± … · {n} itens oficiais com TRI · meta {m}". Sem dados: "Ainda sem itens oficiais com TRI respondidos. A estimativa aparece depois da primeira questão oficial de um sprint."
   - Esquerda: **Card "Simulado de 15 fáceis inéditos"** (`data-testid="card-simulado"`): disponibilidade ("Contando as questões inéditas…" / "{n}+ questões fáceis inéditas disponíveis." / "Só {n} … disponíveis: não dá para montar um simulado completo."); histórico dos últimos 5 (`data-testid="historico-simulados"`, cada `<li>`: "{a} de {t} · maior tempo {s} s · {data}" + badge "vale"/"não vale"); "Critério do simulado cumprido." se houver um que vale; botão secundário "Começar o simulado" → `/simulado`.
   - Direita: **Card "O que falta para “pronto”"** (`data-testid="card-pronto"`) com 3 blocos `NivelPronto` (`data-testid="nivel-pronto"`): "Habilidades da semana" (dica "Clique numa habilidade para ver todos os critérios."; cada item "H{n}: {primeira falta} (+k)" é **botão** que seleciona a célula), "Fáceis da semana" (+ linha extra "Mais {n} habilidades da semana…"), "Prova de matemática". Cada bloco: ícone Check/CircleDashed + `<h3>` + badge "pronto"/"falta" + lista com bolinhas verde/azul.
4. **Seção "Calor por habilidade"** (`<h2 id="calor-titulo">`) + **Legenda** (5 níveis "sem dados → 0,85+", "da semana" = contorno azul, Check "pronta", RotateCcw "revisão vencida"). Grade (`lg`: 3fr | 2fr):
   - **Card do calor** (`data-testid="mapa-calor"`): por competência C1–C7: "C{n} {nome}" + média; grade de 5 colunas `role="group"` `aria-label="Competência C{n}: {nome}"` com células `CelulaCalor` (`<button data-testid="celula-calor" data-nivel="0–4" aria-pressed aria-label="H{n}, {nome}, domínio efetivo x,xx[, pronta][, revisão vencida]">`, 38px de altura; cores nível 0 cinza, 1 danger-soft, 2 warning-soft, 3 success-soft, 4 success cheio; selecionada = `ring-2`; da semana = contorno interno azul; ícones Check e RotateCcw nos cantos). Carregando: 7 blocos cinza.
   - **Detalhe** (`data-testid="detalhe-habilidade"`, `aria-live="polite"`): título "H{n} {nome}" + badges "da semana"/"pronta"/"revisão vencida"; "Competência C{n}."; `<dl>` Domínio, Retenção prevista (%), Domínio efetivo, Itens oficiais (+gêmeas), Acertos; `Progress` "Domínio efetivo"; "Pronta." ou "O que falta:" + lista (`data-testid="faltas-habilidade"`). Carregando: card vazio `aria-busy`. Seleção inicial: **H24**.
5. **Seção "Por assunto de foco"** (`<h2 id="assuntos-titulo">`): card (`data-testid="mapa-assuntos"`) com uma linha por assunto: nome + habilidades, `Progress` (`aria-label="Domínio em {assunto}"`, neutro sem dados), média ou "—", "{a}/{t} acertos" ou "sem itens".

**Interações:** botão do simulado (cabeçalho e card); clique em célula; clique nos itens H do bloco "Habilidades da semana".
**Estados:** carregando (células cinza, detalhe vazio, textos "Contando…") · erro · vazio (sem tentativas: nota sem dados, células nível 0) · parcial · sucesso.
**Celular:** tudo em 1 coluna; linhas de assunto empilham (3 colunas só a partir de `sm`).

### 1.4 `/simulado` — Simulado de 15 fáceis

**Arquivos:** `app/simulado/page.tsx` (metadata "Simulado de fáceis"), `components/simulado/tela-simulado.tsx` (reusa `QuestaoView`, `CaixaTempo`, `formatarTempo`, `Logo`).

**Fases:** `intro` → `rodando` → `fim`.

- **Erro:** `EstadoVazio` "Não consegui carregar" + "Tentar de novo".
- **Intro** (`max-w-[760px]`): `<h1>` "Simulado de 15 fáceis" + descrição "…Sem tutor, sem dicas: só você e o cronômetro." → Card **"Como funciona"** (regras: 15 itens do tercil fácil inéditos, até 3 min por item, tempo esgotado fecha sem resposta, vale com ≥90% (14/15) e nenhum item estourado) → botão **"Começar"** (Timer, lg, `data-testid="comecar-simulado"`, desabilitado se < 15) + texto (`data-testid="disponiveis-simulado"`): "Montando a lista…" / "15 questões prontas, {n} habilidades (H…)." / "Só {n} questões fáceis inéditas restantes: não dá para montar o simulado. …" → nota "Cada resposta conta como tentativa oficial…" → botão outline "Voltar para o Mapa".
- **Rodando:** barra de 48px: Logo + "Simulado" (só `sm`+) · "{i}/15" (`data-testid="progresso-simulado"`) · `Progress` (`aria-label="Progresso do simulado"`, só `sm`+) · habilidade (só `md`+) · "{n} acertos" à direita. Abaixo, `QuestaoView` **sem** "Ver visualmente", sem tutor, sem seleção→chat, com o cronômetro no `canto`: `CaixaTempo` regressivo mm:ss (`data-testid="cronometro"`, `aria-label="tempo restante neste item"`; ≤30s fica `bg-warning-soft text-warning-text`; após responder mostra o tempo gasto ou "tempo esgotado"). Ao zerar, responde sozinho sem escolha. Rodapé: Pular / Confirmar / Próxima / Ver resultado (mesmo do `QuestaoView`).
- **Fim** (`FimSimulado`): `<h1>` "{a} de {t}" + descrição (vale / "Faltou acerto: {p}% (meta 90%). …" / "Acertos suficientes, mas um item passou de 3 minutos. …") → badges "vale para pronto nos fáceis"/"não vale ainda" (`data-testid="simulado-vale"`) e "maior tempo por item: mm:ss" → Card "Questões" (linhas `data-testid="resultado-simulado"`: círculo, número, "ENEM {ano} · Q{n} · {H}", "tempo esgotado"/"marcou X"/"pulou" + " · mm:ss") → botões **"Ver o Mapa"** (lg, link) e "Caderno de erros" (ghost, link).

**Sem barra do sprint, sem modo foco, sem Laboratório.** A navegação global continua visível.
**Celular:** barra do simulado sem "Simulado", sem barra de progresso e sem habilidade.

### 1.5 `/caderno` — Caderno de erros

**Arquivos:** `app/caderno/page.tsx` (metadata "Caderno de erros"), `components/caderno/tela-caderno.tsx` (reusa `GemeaCard`, `Markdown`, `useResponderGemea`).

Seções na ordem:
1. **Cabeçalho** "Caderno de erros" + descrição + ações (se há entradas): badge "{n} erro(s) aberto(s)" (accent; success se 0) e badge "{n} revisão(ões) vencida(s)" (warning, com RotateCcw).
2. Erro (`role="alert"`).
3. **Carregando:** `aria-busy` `aria-label="Carregando o caderno"`, esqueleto da barra de filtros + 2 cards falsos.
4. **Vazio:** `EstadoVazio` ícone BookMarked, "Nenhum erro ainda", "Quando você errar uma questão num sprint ou simulado, ela aparece aqui…", botão "Começar um sprint" → `/estudar`.
5. **Filtros** (`role="toolbar" aria-label="Filtros do caderno"`): rádios em chip "Abertos" | "Todos" (`role="radiogroup" aria-label="Mostrar"`, cada `role="radio"`; padrão Abertos) + `<select>` rotulado "Habilidade" ("todas" + habilidades presentes "H{n} · {nome}").
6. **Lista** (`data-testid="lista-caderno"`) ou "Nenhum erro com esse filtro." Cada entrada (`EntradaView`, Card `data-testid="entrada-caderno"`, `data-resolvida="true|false"`, opacidade 70% se resolvida):
   - Linha de tags: "ENEM {ano} · Q{n}" ou "Gêmea · {gerador}" · badge habilidade · badge dificuldade · "errada {n}×" · "revisão vencida" · "resolvida" · data "dd mmm".
   - Prévia do enunciado (serifa, máx. 96px com máscara de degradê, imagens escondidas).
   - `<dl>`: "Marcou" (`data-testid="marcou"`, letra em vermelho + texto, ou "pulou") e "Gabarito" (verde + texto).
   - "Equívoco:" (`data-testid="equivoco"`) com o porquê ou "sem diagnóstico ainda. Refaça com o tutor e peça “por que errei?”."
   - Ações: questão oficial → **"Refazer"** (link `/estudar?questao={id}`, `data-testid="refazer"`) + **"Gêmea"** (`data-testid="gemea-caderno"`, desabilitado se não há gerador, com `title`); entrada que já é gêmea → **"Refazer"** (mesma semente, `data-testid="refazer"`) + **"Nova gêmea"** (`data-testid="gemea-caderno"`). Se há resolução curada: "resolução curada disponível no tutor".
7. **Diálogo "Questão gêmea"** (`max-w-2xl`): descrição "Mesma estrutura de {rótulo}, números novos. A resposta sai do código, e a tentativa conta com peso 0,6 no domínio." + `GemeaCard` (rolável, `max-h-[65vh]`).

**Estados:** carregando · erro · vazio · filtro vazio · com entradas abertas/resolvidas.
**Celular:** `<dl>` em 1 coluna (2 a partir de `sm`); filtros quebram linha.

### 1.6 `/laboratorio` — Laboratório

**Arquivos:** `app/laboratorio/page.tsx` (metadata "Laboratório"), `components/laboratorio/tela-laboratorio.tsx`, `editor-python.tsx`, `plotador.tsx`; `lib/laboratorio/realce` (tokens e exemplos).

Ordem: cabeçalho "Laboratório" + descrição ("…Dentro de um sprint, abra com L.") → **Card Python** (`EditorPython`) → **Card Gráfico** (`Plotador`).

**`EditorPython({ compacto?, codigoInicial? })`**, ordem:
1. "Python + SymPy" (FlaskConical) + `StatusPyodideBadge` à direita (`data-testid="status-pyodide"`): "Pyodide não carregado (carrega ao rodar)" (neutral) · "Carregando: {etapa}" (spinner) · "SymPy pronto (Pyodide x)" (success) · "Rodando…" (spinner) · "Pyodide não carregou" (danger).
2. Nota "`from sympy import *` já está feito…" (só fora da gaveta).
3. Exemplos (`role="group" aria-label="Exemplos prontos"`): um botão outline por `EXEMPLOS_PYTHON` (`data-testid="exemplo-{id}"`, ex.: `exemplo-probabilidade`, `exemplo-simplificar`), `title`=descrição; troca o código.
4. Erro do Pyodide (`role="alert"`, `data-testid="erro-pyodide"`, warning): "O Pyodide não carregou do CDN (jsdelivr). Sem ele, o SymPy não roda aqui." + motivo resumido + explicação do fallback mathjs + botão "Tentar carregar de novo" (`data-testid="recarregar-pyodide"`).
5. **`CampoCodigo`**: `<pre data-testid="realce-python">` colorido por baixo (classes `.tok-comentario/.tok-string/.tok-numero/.tok-palavra/.tok-builtin/.tok-operador`) + `<textarea>` transparente por cima (label sr-only "Código Python", `id` "codigo-python" ou "codigo-python-gaveta"; 9 linhas na página, 7 na gaveta). Rolagem sincronizada. **Ctrl/⌘+Enter roda; Tab insere 4 espaços.** Sem corretor ortográfico.
6. Botão **"Rodar"** (Play, `Kbd Ctrl+Enter`, `data-testid="rodar-python"`) ou **"Cancelar"** (Square, `data-testid="cancelar-python"`) enquanto roda + aviso "Primeira execução baixa uns 15 MB do CDN jsdelivr (fica em cache). Limite de 30 s por execução."
7. **Saída** (`role="status"`, `data-testid="saida-python"`): badge "mathjs" + nota (quando caiu no fallback) ou stdout em `<pre>`; resultado em `<pre>` verde; erro em `<pre>` vermelho; "{ms} ms".

**`Plotador({ compacto? })`**, ordem: "Gráfico de função" (LineChart) + ajuda (só fora da gaveta) → exemplos (`role="group" aria-label="Exemplos de função"`: "2x + 3", "a*x + b", "a*x^2 + b", "-5x^2 + 40x", "1000*(1 + k)^x"; clicar desenha) → formulário "y =" + `<input>` (label sr-only "Função de x", padrão "a*x^2 + b") + botão "Desenhar" (`data-testid="desenhar"`; Enter também) → erro `role="alert"` "Escreva uma função de x, por exemplo 2x + 3 ou a*x^2 + b (letras viram sliders)." → `Grafico` (320px; 240px na gaveta), já desenhado no início.

**Estados:** Pyodide parado / carregando / pronto / rodando / erro; saída via Pyodide, via mathjs, com erro; gráfico carregando / erro / ok; expressão inválida.
**Celular:** cards empilhados; botões quebram linha.

### 1.7 `/aprender` — Aprender o básico

**Arquivos:** `app/aprender/page.tsx` (metadata "Aprender o básico"), `components/aprender/tela-aprender.tsx`, `components/visuais/index.tsx`, `moldura.tsx`, `visual-porcentagem.tsx`, `visual-proporcao.tsx`, `visual-fracoes.tsx`, `visual-graficos.tsx`, `visual-estatistica.tsx`, `visual-unidades.tsx`, `visual-area.tsx`, `visual-probabilidade.tsx`; catálogo em `lib/visuais/catalogo`.

Ordem: cabeçalho "Aprender o básico" + descrição → grade (1 coluna; em `lg` 240px | resto):
1. **Menu de temas** (`<nav aria-label="Temas">`): 8 botões (`aria-current="true"` no ativo). No celular/tablet: chips horizontais roláveis (ativo azul cheio, texto branco). Em `lg`: lista vertical com título + resumo (ativo `bg-accent-soft text-accent-text`).
2. **Card do visual** (`data-testid="card-visual"`, `anim-entrada` a cada troca): título + resumo + componente do visual.

O tema ativo vive no **hash** da URL (`#porcentagem` padrão; `#estatistica`, `#area`, etc.). Trocar usa `history.replaceState` + `hashchange`.

**`MolduraVisual({ id, passos, truque, exercicio, controles?, children(passo) })`** (`<section data-testid="visual-{id}" aria-label="Explicação visual">`), ordem: área do desenho (`bg-background`, recebe o passo) → controles livres (sliders `Deslizador`, botões +/− nas frações com `aria-label="Diminuir/Aumentar {rótulo}"`) → texto do passo (`data-testid="texto-passo"`, `aria-live="polite"`, `anim-entrada`) → botões "Voltar" (`aria-label="Passo anterior"`, desabilitado no 1º) / "Passo i de n" / "Avançar" (`aria-label="Próximo passo"`, `data-testid="avancar-passo"`, desabilitado no último) → pontinhos de progresso → **"Truque do ENEM:"** (`data-testid="truque"`, `bg-accent-soft`) → **`MiniExercicio`** (`data-testid="mini-exercicio"`: "Teste rápido", pergunta serifada, opções em chips `role="radio"` dentro de `role="radiogroup" aria-label="Opções do teste"`; acerto verde + `anim-assenta` + "Isso. {explicação}"; erro vermelho + `anim-shake` + "Ainda não. Tente de novo: volte um passo no visual se precisar." em `role="status"`; pode tentar de novo).

Cada visual tem desenho com `role="img"` e `aria-label` descritivo (ex.: "{n} de 100 quadradinhos pintados", "Vendas por mês…", "Valores …; mediana …; média …").

**Celular:** menu vira faixa horizontal rolável acima do card.

### 1.8 `/ajustes` — Ajustes

**Arquivos:** `app/ajustes/page.tsx` (metadata "Ajustes"), `components/ajustes/tela-ajustes.tsx`; `lib/store/backup`.

**Estados:** erro (cabeçalho + `role="alert"` "Não consegui carregar seus dados.") · carregando (`aria-busy`, descrição "Carregando…", 3 blocos de 160px) · sucesso (formulários; remontam com `key=estado.criadoEm` após importar/zerar).

Ordem dos cards (`max-w-[760px]`):
1. **"Explica do meu jeito"**: campo "Como o tutor te chama" (`data-testid="campo-nome"`, salva ao sair; vazio vira "Matheus") → presets (`role="group" aria-label="Presets de explicação"`, botões `aria-pressed`, `data-testid="preset-{id}"`, ex.: `preset-direto`; ativo azul com Check; salva na hora e mexe no texto livre) → "Texto livre" `<textarea>` 4 linhas (`data-testid="campo-explica"`, salva ao sair) + "{n} caracteres · salva ao sair do campo".
2. **"Prova e meta"**: "Data da prova de matemática" `<input type="date">` (`data-testid="campo-data-prova"`, `min`=hoje, salva ao mudar) + prazo (`data-testid="prazo-prova"`: "Sem data: o Gabarita não conta os dias." / "A prova {faltam n dias…}.") → "Meta de nota (matemática)" `<input type="number">` 300–1000, passo 10 (`data-testid="campo-meta"`, `aria-invalid`; inválido = borda vermelha + "Use um número entre 300 e 1000."; salva ao sair).
3. **"Habilidades da semana"**: por competência C1–C7, rótulo "C{n} · {nome}" + chips H (`role="switch"`, `aria-checked`, `title`=nome, `data-testid="semana-H{n}"`; ativo azul). Rodapé "30 habilidades da Matriz…".
4. **"Tutor"** (ícone Bot): estado (`data-testid="estado-tutor"`): "IA configurada:" + "verificando…" / "sim" + provedor ("AI Gateway", "Claude local (assinatura)", "Anthropic") · modelo / "não" + instrução com `ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`, `.env.local`. Interruptor `Interruptor` (`id="mostrar-timer"`, `role="switch"`, 46×26px, verde ligado): "Mostrar o cronômetro discreto durante o sprint".
5. **"Aparência"**: rádios "Claro" (Sun) / "Escuro" (Moon) (`role="radiogroup" aria-label="Tema"`, `data-testid="tema-light"`/`"tema-dark"`).
6. **"Seus dados"**: resumo (tentativas, sprints, simulados, erros no caderno, desde {data}) → **"Exportar backup (JSON)"** (`data-testid="exportar-backup"`; baixa `gabarita-backup-AAAA-MM-DD.json`) · **"Importar backup"** (`data-testid="importar-backup"`, abre o `<input type="file">` sr-only `aria-label="Arquivo de backup"` `data-testid="arquivo-backup"`, aceita `.json`) · **"Zerar progresso"** (danger, `data-testid="zerar-progresso"`) → "Importar substitui tudo…".
   - Diálogo **"Importar este backup?"**: resumo do arquivo (nome, tentativas, erros, data) + "Cancelar" + **"Substituir e importar"** (`data-testid="confirmar-importacao"`). Arquivo inválido → toast de erro, sem diálogo.
   - Diálogo **"Zerar todo o progresso?"**: aviso sem desfazer + "Cancelar" + **"Zerar tudo"** (danger, `data-testid="confirmar-zerar"`).

**Celular:** campos de "Prova e meta" empilhados (lado a lado a partir de `sm`); chips das habilidades quebram linha.

### 1.9 404 — `app/not-found.tsx`

Metadata "Página não encontrada"; status HTTP 404; renderiza dentro da casca (sidebar/barra visíveis). Card `max-w-md` centralizado (`aria-labelledby="titulo-404"`): ícone Logo num quadrado `accent-soft` → "Erro 404" (`num`) → `<h1 id="titulo-404">` "Essa página não existe" → "O endereço pode ter mudado ou foi digitado errado. Nada do seu progresso se perdeu: ele continua neste navegador." → botões **"Ir para Hoje"** (lg, ícone Home, link `/`) e "Começar um sprint" (ghost, ArrowRight, link `/estudar`) → dica "Alt + 1 a 6 vão direto para cada tela, e ? mostra todos os atalhos."

### 1.10 Outras superfícies sem rota visual

`app/manifest.ts` (PWA "Gabarita", ícones), `app/api/status/route.ts`, `app/api/tutor/route.ts`, ícones (`favicon.ico`, `apple-icon.png`, `/icon.svg`, `/icons/icon-192.png`). Tema da barra do navegador: `#f5f7fa` (claro) / `#0f1217` (escuro).

---

## 2. Atalhos de teclado

Registro central: `lib/atalhos/registro.ts` (classe `RegistroAtalhos`, funções `analisarCombinacao`, `combina`, `ehCampoEditavel`, `teclasParaExibir`) e `lib/atalhos/provider.tsx` (um único `keydown` em `window`; ignora `defaultPrevented`, `isComposing` e `repeat`; chama `preventDefault` quando um atalho dispara). Hook `useAtalho({ id, combinacao, descricao, grupo, acao, emCampos?, ativo? })` registra enquanto o componente está montado; `useListaAtalhos()` alimenta a ajuda e a paleta.

Regras do despacho: atalho `ativo:false` não dispara (mas aparece na ajuda); com foco em `input`/`textarea`/`select`/`contenteditable` só disparam os que têm `emCampos:true`; `mod` = Ctrl ou ⌘; letra simples aceita Shift; `?` exige Shift. Ids repetidos substituem o anterior (a IDE e o simulado usam os mesmos ids `marcar-A…E`, `confirmar`, `proxima`).

| Tecla | Id | Descrição (texto da ajuda) | Grupo | Quando está ativo | Em campos | Registrado em |
|---|---|---|---|---|---|---|
| Ctrl/⌘+K | `paleta` | Abrir a paleta de comandos | Geral | sempre | sim | `components/app/paleta-comandos.tsx` |
| ? (Shift+/) | `ajuda` | Mostrar os atalhos de teclado | Geral | sempre | não | `components/app/ajuda-atalhos.tsx` |
| Alt+1 | `nav-1` | Ir para Hoje | Navegação | sempre que a Sidebar está montada (ela fica no DOM também no celular, oculta por CSS); **some no modo foco**, porque a casca desmonta a Sidebar | sim | `components/app/sidebar.tsx` (`AtalhoNavegacao`) |
| Alt+2 | `nav-2` | Ir para Estudar | Navegação | idem | sim | idem |
| Alt+3 | `nav-3` | Ir para Mapa | Navegação | idem | sim | idem |
| Alt+4 | `nav-4` | Ir para Caderno | Navegação | idem | sim | idem |
| Alt+5 | `nav-5` | Ir para Laboratório | Navegação | idem | sim | idem |
| Alt+6 | `nav-6` | Ir para Ajustes | Navegação | idem | sim | idem |
| Alt+7 | `nav-7` | Ir para Aprender | Navegação | idem | sim | idem |
| Enter | `comecar` | Começar um sprint | Sprint | tela Hoje | não | `components/hoje/tela-hoje.tsx` |
| F | `foco` | Alternar o modo foco | Geral | IDE (sprint em andamento) | não | `components/estudo/ide.tsx` (`IDE`) |
| L | `laboratorio` | Abrir o Laboratório (gaveta) | Tutor | IDE | não | `components/estudo/ide.tsx` (`IDE`) |
| A, B, C, D, E | `marcar-A`…`marcar-E` | Marcar a alternativa X | Questão | IDE/simulado, antes de confirmar e se a letra existe | não | `components/estudo/ide.tsx` (`QuestaoDoSprint`) e `components/simulado/tela-simulado.tsx` (`ItemSimulado`) |
| Enter | `confirmar` | Confirmar a resposta | Questão | IDE/simulado, antes de confirmar | não | idem |
| N | `proxima` | Próxima questão | Sprint (IDE) / Simulado (simulado) | depois de confirmar | não | idem |
| H | `dica` | Pedir o próximo degrau de dica | Tutor | IDE, degrau < 4 | não | `components/estudo/ide.tsx` |
| Alt+R (⌥R) | `resposta-direta` | Pedir a resposta direta (fica registrado) | Tutor | IDE, antes de pedir | **sim** | `components/estudo/ide.tsx` |
| ⌥R no Mac (chega como `®`) | — (fora do registro) | mesmo que acima | — | IDE, antes de pedir | sim | `components/estudo/ide.tsx` (`useEffect` com `keydown` próprio) |
| / | `chat` | Perguntar ao tutor | Tutor | IDE | não | `components/estudo/ide.tsx` (troca para a aba Tutor e foca o campo) |
| N | `novo-sprint` | Novo sprint | Sprint | fim do sprint | não | `components/estudo/fim-sprint.tsx` |

Teclas tratadas direto no elemento (fora do registro):

| Tecla | Onde | Efeito | Arquivo |
|---|---|---|---|
| Enter (sem Shift) | campo do tutor | envia a mensagem | `components/estudo/painel-tutor.tsx` |
| Shift+Enter | campo do tutor | quebra linha | idem |
| Ctrl/⌘+Enter | editor Python | roda o código | `components/laboratorio/editor-python.tsx` (`CampoCodigo`) |
| Tab | editor Python | insere 4 espaços | idem |
| Enter | campo "Função de x" | desenha (submit do form) | `components/laboratorio/plotador.tsx` |
| Esc | qualquer Dialog (paleta, ajuda, gaveta, Ver visualmente, gêmea, importar, zerar) | fecha | Radix Dialog (`components/ui/dialog.tsx`, `gaveta-laboratorio.tsx`) |
| ↑ ↓ Enter | paleta de comandos | navega e executa | `cmdk` |
| ← → | sliders (gráfico, visuais) | muda o valor | `<input type="range">` nativo |
| ← → | abas (IDE no celular, gaveta) | troca de aba | Radix Tabs |
| ← → / teclado | separador dos painéis | redimensiona | `react-resizable-panels` |

---

## 3. Seletores dos quais os testes e2e dependem

Formato: `arquivo:linha` → seletor (tipo) → onde está no código. **Mudar texto, role, nome acessível ou testid destes elementos quebra o teste.** Também estão listadas as asserções de CSS (cores, raios, larguras), que travam valores do design.

### 3.1 Auxiliares (`e2e/apoio.ts`) — usados por vários specs

- `apoio.ts:10` → `getByRole("heading", { level: 1 })` com texto `/^(Bom dia|Boa tarde|Boa noite), /` → saudação do Hoje (`tela-hoje.tsx`).
- `apoio.ts:11` → `getByText(/^Próximas:/)` → descrição do card do sprint.
- `apoio.ts:17` → `getByRole("radiogroup", { name: "Alternativas" })` → `alternativas.tsx`.

### 3.2 `e2e/hoje.spec.ts`

- `:7` → testid `comecar` (botão Começar).
- `:8` → `getByRole("navigation", { name: "Principal" })` (Sidebar/BarraSuperior).
- `:9` → `getByRole("link", { name: "Estudar" })`.
- `:10` → texto `/questões oficiais do INEP|Dados de desenvolvimento/` (RodapeFonte).
- `:15–16` → tecla `Control+k`; `getByPlaceholder("O que você quer fazer?")`.
- `:18–21` → digitar "mapa" + Enter leva a `/mapa`; `getByRole("heading", { name: "Mapa", exact: true })`.
- `:26–27` → tecla `Shift+?`; `getByRole("heading", { name: "Atalhos de teclado" })`.
- `:28` → texto "Começar um sprint" (descrição do atalho `comecar` na ajuda).
- `:29–30` → Esc fecha a ajuda.
- `:35` → `Alt+2` vai para `/estudar`.
- `:42–43` → `<html>` sem classe `dark`; CSS `color-scheme: light`.
- `:44, :46` → `getByRole("button", { name: "Mudar para o modo escuro" })` e `"Mudar para o modo claro"` (ThemeToggle).
- `:48–49` → cor de fundo de `comecar` no escuro = `rgb(10, 132, 255)`.
- `:54` → `body` `background-color: rgb(245, 247, 250)`.
- `:56` → nav `width: 210px`; `:57` → nav `background-color: rgb(255, 255, 255)`.
- `:58` → `nav.getByRole("link", { name: "Hoje" })` com fundo `rgb(229, 241, 255)` (ativo).
- `:59–61` → testid `card-sprint`: `border-radius: 20px`, fundo branco.
- `:62` → `comecar` com `border-radius` de pílula (`3.35544e+07px|9999px|999px`).
- `:63` → `stat-cards` contém 4 × testid `stat`.
- `:64` → testid `plano-hoje`.
- `:65` → texto `/nota TRI sempre estimada/` (RodapeFonte).

### 3.3 `e2e/estudar.spec.ts`

- `:7–8` → Enter no Hoje vai para `/estudar$`.
- `:11` → radiogroup "Alternativas".
- `:12` → `getByRole("img", { name: "questão {i} de 5" })` (bolinhas da BarraSprint).
- `:13–14` → teclas `h`, `b`.
- `:15` → `getByRole("radio", { checked: true })` com atributo `data-letra="B"`.
- `:16–17` → Enter; `getByRole("status")` (status do resultado).
- `:18` → tecla `n`.
- `:21` → `heading level 1` = `/^\d de 5$/` (FimSprint).
- `:22` → testid `resultado-questao` × 5.
- `:23` → testid `delta-habilidade` (≥1).
- `:27` → texto `/Hoje: 1 sprint/` (card do sprint no Hoje).
- `:32–36` → tecla `f` remove **todas** as `navigation "Principal"` do DOM (`toHaveCount(0)`) e volta.
- `:41` → `getByRole("separator", { name: "Redimensionar painéis" })`; `:43–50` arrasta 150px para a esquerda e espera que o separador se mova > 50px.
- `:54–59` → viewport 390×844: nav "Principal" visível com `y = 0` (barra no topo).
- `:60–61` → `getByRole("tab", { name: "Questão" })`, `getByRole("tab", { name: "Tutor" })`.
- `:62` → `getByRole("button", { name: /Próximo degrau/ })`.
- `:67–68` → `getByTestId("enunciado")` → `p` com `font-family` contendo `New York|Times New Roman|Georgia|serif`.
- `:69–70` → primeiro `radio` com `border-radius: 14px`; `:72` → `border-top-width` `1px` ou `1.5px`.
- `:73–74` → depois de `a`, `border-top-color: rgb(10, 132, 255)`.

### 3.4 `e2e/tutor.spec.ts`

- `:6` → `getByRole("heading", { name: "ENEM 2022 · Q154" })` (h2 `titulo-questao`).
- `:7` → radiogroup "Alternativas".
- `:27` (e 57, 73) → `getByRole("region", { name: "Tutor" })` (`<section aria-label="Tutor">`).
- `:28` → texto "modo guiado" (badge).
- `:29` → `getByRole("note")` contém "Tutor de IA desligado".
- `:30` → texto "Antes de calcular".
- `:33–34` → tecla `h`; texto "Se algo caiu 75%, o que sobrou é 25% do original" (conteúdo curado).
- `:35` → `getByRole("img", { name: "degrau 1 de 4" })` (EscadaDicas).
- `:38–40` → teclas `b`, Enter; `status` contém "O gabarito é C".
- `:41` (e 58) → `getByPlaceholder(/peça dica, resolução/)`; `:43` Enter envia.
- `:44` → texto `/Multiplicou 28 900 por 3/i`.
- `:45` → testid `selo-conferido`.
- `:48` → testid `resposta-direta` (clique); `:49` → texto "Resolução completa"; `:50` → `/115\s?600/`; `:51` → img "degrau 4 de 4"; `:52` → `resposta-direta` desabilitado.
- `:61` → testid `grafico`; `:63` → `svg.MafsView, .MafsView svg`.
- `:64` → `getByRole("slider", { name: "parâmetro a" })`; `:67–68` → ArrowRight muda para texto `/a = 1,5/`.
- `:74` → `getByRole("button", { name: "Questão gêmea" })` (chip de sugestão).
- `:75` → testid `gemea`; `:77` → `getByRole("radio")`; `:78` → testid `confirmar-gemea`; `:79` → `status` com `/Acertou a gêmea|O gabarito é/`.
- `:84–94` → seleção dentro de `enunciado > p` + evento `selectionchange`.
- `:96` → testid `perguntar-sobre`; `:97` → testid `chip-selecao` contém "Em janeiro de 2013".

### 3.5 `e2e/caderno.spec.ts`

- `:6` → `getByRole("heading", { name: "Nenhum erro ainda" })` (EstadoVazio).
- `:9–13` → `/estudar?questao=enem-2022-154`; heading "ENEM 2022 · Q154"; teclas `b`, Enter; `status` "O gabarito é C".
- `:16` → testid `entrada-caderno` filtrado por texto "ENEM 2022 · Q154".
- `:19` → testid `marcou` contém "B".
- `:20` → texto "Gabarito".
- `:21` → testid `equivoco` contém `/Multiplicou 28 900 por 3/i`.
- `:22` → texto "1 erro aberto" (badge do cabeçalho; também `:55` "0 erros abertos").
- `:25` → testid `gemea-caderno`.
- `:26` → `getByRole("dialog", { name: "Questão gêmea" })`.
- `:28–31` → testid `gemea`, `radio`, `confirmar-gemea`, `status`.
- `:32–33` → Esc fecha o diálogo.
- `:36` → `entrada-caderno` filtrado por "Gêmea ·"; `:38` → testid `refazer` com texto `/Refazer/`.
- `:41` (e 56) → `getByRole("radio", { name: "Todos" })` (filtro).
- `:43` → `getByLabel("Habilidade").selectOption("H3")` (label envolvendo o `<select>`).
- `:47–48` → testid `refazer` navega para `/estudar?questao=enem-2022-154`.
- `:51–53` → `c`, Enter, `status` "Acertou".
- `:57` → atributo `data-resolvida="true"` na entrada.

### 3.6 `e2e/mapa.spec.ts`

- `:6` → heading "Mapa" (exact).
- `:7` → testid `celula-calor` × 30.
- `:8` → `getByRole("group", { name: /Competência C6/ })`.
- `:10–11` → testid `card-nota` + texto "estimativa" (exact, badge).
- `:12` → texto `/Ainda sem itens oficiais com TRI/`.
- `:14–15` → testid `card-pronto` com 3 × testid `nivel-pronto`.
- `:16` → texto `/^H24: domínio efetivo 0,30/`; `:17` → `/falta 1 simulado de 15 fáceis/`; `:18` → `/faltam 2 simulados completos de 45 itens/` (textos de `lib/dominio`).
- `:21` → `getByRole("button", { name: /^H16:/ })` dentro de `card-pronto`.
- `:22–23` → testid `detalhe-habilidade` + `heading` `/H16/`.
- `:24` → testid `faltas-habilidade` com 4 `listitem`; `:25` → texto "falta 1 acerto em outro dia".
- `:28` → `getByRole("button", { name: /^H1, Sistemas de numeração/ })` (aria-label da célula); `:29` heading `/H1/`.
- `:31` → testid `mapa-assuntos` com texto "Porcentagem".
- `:36` → testid `ir-simulado` → `/simulado`.
- `:38` → testid `disponiveis-simulado` contém "15 questões prontas".
- `:39` → testid `comecar-simulado`.
- `:42` → testid `progresso-simulado` = "{i}/15".
- `:43` → testid `cronometro` = `/^0[23]:\d\d$/`.
- `:44` → testid `fonte` contém `/Fonte: INEP, ENEM \d{4}, questão \d+/`.
- `:45–49` → `a`, `radio checked` com `data-letra="A"`, Enter, `status`, `n`.
- `:52` → heading level 1 `/^\d+ de 15$/`.
- `:53` → testid `resultado-simulado` × 15.
- `:54` → testid `simulado-vale`.
- `:56` → `getByRole("link", { name: "Ver o Mapa" })`.
- `:58–59` → testid `historico-simulados` com 1 `listitem` e texto `/\d+ de 15/`.
- `:61` → `card-nota` contém "15 itens oficiais com TRI".

### 3.7 `e2e/laboratorio.spec.ts`

- `:6` → heading "Laboratório" (exact).
- `:7` → testid `rodar-python`.
- `:8` → testid `status-pyodide` contém "não carregado".
- `:9` → testid `exemplo-probabilidade`.
- `:10` → `getByLabel("Código Python")` com valor `/Rational\(len\(favoraveis\)/`.
- `:11–12` → testid `realce-python` com `.tok-builtin` e `.tok-palavra` (texto "from").
- `:14–15` → testid `grafico` com `slider "parâmetro a"`.
- `:16` → `getByLabel("Função de x")`; `:17` → testid `desenhar`; `:18` → texto "y = 2x + 3" (legenda).
- `:22–24` → tecla `l` na IDE; `:25` → testid `gaveta-laboratorio`.
- `:27` → testid `exemplo-simplificar`; `:28` → `getByLabel("Código Python")` dentro da gaveta.
- `:30–32` → digitar "abc" no editor não marca alternativa (`radio checked` = 0) — depende de `ehCampoEditavel`.
- `:33` → `getByRole("tab", { name: "Gráfico" })` na gaveta; `:34` → slider "parâmetro a".
- `:35–36` → Esc fecha a gaveta.
- `:38` → testid `abrir-laboratorio`.

### 3.8 `e2e/aprender.spec.ts`

- `:7` → `navigation "Principal"` → `link "Aprender"`.
- `:8` → heading level 1 "Aprender o básico".
- `:10` → testid `visual-porcentagem`; `:11` → testid `texto-passo` contém "R$ 80".
- `:12, :14` → texto "Passo 1 de 3", "Passo 2 de 3" (`rotuloPasso`).
- `:13` → testid `avancar-passo`; `:15` → "R$ 20".
- `:16` → testid `truque` contém "Truque do ENEM".
- `:18` → testid `mini-exercicio`; `:19, :21` → `radio "R$ 200"`, `radio "R$ 198"`; `:20, :22` → `status` "Ainda não" / "Isso.".
- `:26–27` → `/aprender#estatistica` → testid `visual-estatistica`; `:31` → texto "Mediana é o do meio da lista ordenada: 5".
- `:32` → `getByRole("button", { name: /Área e perímetro/ })` (menu de temas); `:33` → URL `#area`; `:34` → testid `visual-area`.
- `:39` → testid `ver-visualmente`; `:42` → `getByRole("dialog")`; `:44` → `[data-testid^=visual-]` dentro do diálogo; `:45–46` → Esc fecha.
- `:50–53` → com `reducedMotion: "reduce"`, `card-sprint` tem `animation-duration` < 0,001s (depende do bloco `prefers-reduced-motion` e de `entrada-stagger`).

### 3.9 `e2e/ajustes.spec.ts`

- `:7` → testid `campo-nome` = "Matheus".
- `:10–11` → testid `preset-direto` com `aria-pressed="true"`; `:12` → testid `campo-explica` com `/Vá direto ao ponto/`.
- `:13` → texto "Salvo." (toast).
- `:16` → testid `campo-meta`; `:18` → `/Use um número entre 300 e 1000/`; `:21` → "Meta 750 salva.".
- `:24` → testid `campo-data-prova`; `:25` → testid `prazo-prova` com `/faltam \d+ dias/`.
- `:28–30` → testid `estado-tutor` contém "não" e não contém `sk-`.
- `:33–37` → `<html>` com classe `light`/`dark`; testids `tema-dark`, `tema-light`.
- `:41` → testid `exportar-backup`; `:43` → nome `gabarita-backup-AAAA-MM-DD.json`; `:47–49` → JSON com `app: "gabarita"` e perfil.
- `:52` → testid `zerar-progresso`; `:53` → `dialog "Zerar todo o progresso?"`; `:54` → testid `confirmar-zerar`; `:55` → "Progresso zerado.".
- `:56–57` → meta volta a "700", preset `aria-pressed="false"`.
- `:60` → testid `arquivo-backup` (`setInputFiles`); `:61` → `dialog "Importar este backup?"`; `:62` → testid `confirmar-importacao`; `:63` → "Backup importado.".
- `:71` → "Não consegui ler o backup".

### 3.10 `e2e/robustez.spec.ts`

- `:13` → testid `aviso-armazenamento` contém "bloqueou o armazenamento local".
- `:14` → heading level 1 saudação.
- `:16–20` → Enter, radiogroup "Alternativas", `a`, Enter, `status`.
- `:21` → dentro do aviso, `button "Fechar o aviso"`; `:22` → aviso some (`count 0`).
- `:29` → heading "ENEM 2012 · Q148".
- `:30` → testid `imagem-quebrada`; `:32` → texto "não carregou"; `:33` → `link "Abrir a imagem original"` com `href` `/enem\.dev/`.
- `:43` → `getByLabel("Código Python")`; `:47` → testid `exemplo-simplificar`.
- `:52, :62` → testid `rodar-python`.
- `:53` → testid `erro-pyodide` contém "não carregou do CDN".
- `:54` → testid `recarregar-pyodide`.
- `:55–57` → testid `saida-python` contém "115600" e "mathjs"; `:63` → "Pyodide indisponível".
- `:58` → testid `status-pyodide` contém "Pyodide não carregou".
- `:70` → `region "Tutor"`; `:71` → testid `resposta-direta`; `:72` → texto `/sem curadoria/`; `:73` → `/O gabarito oficial é/`; `:74` → `link "Laboratório"` (chip de sugestão como link).
- `:78–80` → `/nao-existe` status 404; heading "Essa página não existe"; `:81` → `link "Ir para Hoje"` → `/`.
- `:86–95` → `/manifest.webmanifest` com `name: "Gabarita"`, ícones e `/apple-icon.png` respondem.

### 3.11 Lista consolidada de `data-testid` usados pelos testes

`abrir-laboratorio`, `arquivo-backup`, `avancar-passo`, `aviso-armazenamento`, `campo-data-prova`, `campo-explica`, `campo-meta`, `campo-nome`, `card-nota`, `card-pronto`, `card-sprint`, `celula-calor`, `chip-selecao`, `comecar`, `comecar-simulado`, `confirmar-gemea`, `confirmar-importacao`, `confirmar-zerar`, `cronometro`, `delta-habilidade`, `desenhar`, `detalhe-habilidade`, `disponiveis-simulado`, `enunciado`, `equivoco`, `erro-pyodide`, `estado-tutor`, `exemplo-probabilidade`, `exemplo-simplificar`, `exportar-backup`, `faltas-habilidade`, `fonte`, `gaveta-laboratorio`, `gemea`, `gemea-caderno`, `grafico`, `historico-simulados`, `imagem-quebrada`, `ir-simulado`, `mapa-assuntos`, `marcou`, `mini-exercicio`, `nivel-pronto`, `perguntar-sobre`, `plano-hoje`, `prazo-prova`, `preset-direto`, `progresso-simulado`, `realce-python`, `recarregar-pyodide`, `refazer`, `resposta-direta`, `resultado-questao`, `resultado-simulado`, `rodar-python`, `saida-python`, `selo-conferido`, `simulado-vale`, `stat`, `stat-cards`, `status-pyodide`, `tema-dark`, `tema-light`, `texto-passo`, `truque`, `ver-visualmente`, `visual-area`, `visual-estatistica`, `visual-porcentagem` (e o prefixo `visual-*`), `zerar-progresso`.

Atributos `data-*` testados: `data-letra` (alternativas), `data-resolvida` (entrada do caderno). Existem no código sem uso nos testes: `confirmar`, `proxima`, `dica`, `conversa`, `falta`, `novo-sprint`, `lista-caderno`, `entrada-caderno` (este é usado), `card-dominio`, `card-simulado`, `mapa-calor`, `card-visual`, `cancelar-python`, `semana-H*`, `preset-*` (só `direto` testado), `data-nivel`, `data-papel`, `data-slot`.

### 3.12 Nomes acessíveis e roles que os testes usam

- Roles + nome: `navigation "Principal"`, `radiogroup "Alternativas"`, `radio` (com `checked` e `data-letra`), `img "questão n de 5"`, `img "degrau n de 4"`, `status`, `note`, `region "Tutor"`, `separator "Redimensionar painéis"`, `tab "Questão"`/`"Tutor"`/`"Gráfico"`, `button "Próximo degrau"` (regex), `button "Questão gêmea"`, `button "Mudar para o modo escuro"`/`"claro"`, `button "Fechar o aviso"`, `button /^H16:/`, `button /^H1, Sistemas de numeração/`, `button /Área e perímetro/`, `group /Competência C6/`, `dialog "Questão gêmea"`/`"Zerar todo o progresso?"`/`"Importar este backup?"`, `slider "parâmetro a"`, `link "Estudar"`/`"Hoje"`/`"Aprender"`/`"Ver o Mapa"`/`"Ir para Hoje"`/`"Abrir a imagem original"`/`"Laboratório"`, `radio "Todos"`, `radio "R$ 200"`/`"R$ 198"`, `heading level 1`, `heading "Mapa"`/`"Laboratório"`/`"Atalhos de teclado"`/`"Nenhum erro ainda"`/`"Essa página não existe"`/`"ENEM {ano} · Q{n}"`, `listitem`.
- Labels: `getByLabel("Código Python")`, `getByLabel("Função de x")`, `getByLabel("Habilidade")`.
- Placeholders: "O que você quer fazer?", `/peça dica, resolução/`.

---

## 4. Classes de token e utilitárias

Contagem aproximada por `grep` em `src/components/**` e `src/app/**` (`.ts`/`.tsx`, sem testes), já somando variantes com prefixo (`hover:`, `dark:`, `md:`, `data-[…]:` etc.). Definições em `src/app/globals.css` (`@theme inline` mapeia `--color-*`, `--font-*`, `--radius-*`, `--shadow-*` para as variáveis de `:root` e `.dark`).

### 4.1 Cores (tokens `--color-*`)

| Classe | Usos | | Classe | Usos |
|---|---|---|---|---|
| `text-muted-foreground` | 144 | | `bg-danger` | 8 |
| `bg-surface` | 51 | | `border-success` | 7 |
| `border-border` | 39 | | `border-danger` | 7 |
| `text-foreground` | 37 | | `bg-warning-soft` | 6 |
| `bg-background` | 35 | | `bg-border` | 5 |
| `bg-surface-2` | 32 | | `border-white/40` (Kbd em botão azul) | 5 |
| `bg-accent` | 25 | | `text-accent-foreground` | 4 |
| `border-accent` | 24 | | `divide-border` | 4 |
| `text-danger-text` | 21 | | `text-success` | 3 |
| `text-white` | 20 | | `bg-success-tint` | 3 |
| `text-accent-text` | 14 | | `bg-success-soft` | 3 |
| `text-success-text` | 12 | | `bg-danger-tint` | 2 |
| `bg-accent-soft` | 12 | | `bg-warning` | 2 |
| `bg-success` | 10 | | `ring-offset-surface` | 2 |
| `text-accent` | 9 | | `text-background` | 2 |
| `border-card-borda` | 9 | | `bg-white` | 2 |
| `bg-danger-soft` | 9 | | `bg-black/60` (overlay escuro) | 2 |
| `text-warning-text` | 8 | | `bg-accent/25` | 2 |
| `border-input` | 8 | | `text-white/90`, `text-white/85` | 2 cada |

Uso único (1): `text-white/80`, `text-warning`, `text-danger`, `text-accent-text/80`, `ring-ring`, `ring-accent`, `ring-foreground/70`, `caret-foreground`, `border-warning/30`, `border-danger/30`, `border-accent/60`, `border-accent/50`, `border-background/30`, `border-surface/70`, `bg-accent-deep`, `bg-foreground`, `bg-muted-foreground/50`, `bg-muted-foreground/60`, `bg-danger/20`, `bg-accent/30`, `bg-accent/35`, `bg-white/25`, `bg-white/5`, `bg-black/5`. Tokens definidos e sem classe utilitária encontrada: `marca-texto` (usado via CSS em `<mark>`). Cores arbitrárias: `bg-[rgba(29,29,31,0.35)]` (overlay claro, 2), `bg-[linear-gradient(…var(--accent)…)]` (bolinha atual, 1), `accent-(--accent)`/`accent-[var(--accent)]` (sliders, 2), `shadow-[inset_0_0_0_1.5px_var(--accent)]` (calor/legenda, 2).

### 4.2 Raio (`--radius-*`: sm 8, md 12, lg 14, xl 20)

`rounded-full` 34 · `rounded-md` 21 · `rounded-lg` 14 · `rounded-xl` 12 · `rounded-sm` 12 · `rounded-[10px]` 9 · `rounded-[3px]` 4 · `rounded-[4px]` 3 · `rounded-[12px]` 3 · `rounded-[6px]` 2 · `rounded-[8px]` 1 · `rounded-[7px]` 1 · `rounded-[28px]` 1 · `rounded-tl-[4px]` 1 · `rounded-tr-[4px]` 1 · `rounded-[inherit]` 1 · `rounded` puro 1 (legenda do `Grafico`). `rounded-xs` e `rounded-2xl`: 0 usos.

### 4.3 Sombra

`shadow-card` 10 · `shadow-flutuante` 5 · `shadow-[0_1px_3px_rgba(0,0,0,0.25)]` 1 (bolinha do interruptor).

### 4.4 Fonte e tipografia

- Famílias: `font-mono` 21 · `font-serif` 3 · `font-rounded` 3 · `font-sans` 2 (padrão do body).
- Pesos: `font-semibold` 48 · `font-bold` 47 · `font-medium` 23 · `font-extrabold` 16 · `font-normal` 5.
- Tamanhos: `text-sm` 96 · `text-xs` 38 · `text-[13px]` 26 · `text-lg` 8 · `text-base` 7 · `text-[15px]` 7 · `text-3xl` 6 · `text-[10px]` 5 · `text-2xl` 4 · `text-[11px]` 4 · `text-[9px]` 4 · `text-xl` 2 · `text-[11.5px]` 2 · `text-[30px]` 1 · `text-[22px]` 1 · `text-[12.5px]` 1.
- Espaçamento de letra: `tracking-[1px]` 2 (rótulos "MENU" e grupos da ajuda) · `tracking-[-0.4px]` 2 (H1) · `tracking-[0.5px]` 1 (rótulo do balão) · `tracking-tight` (CardTitle).

### 4.5 Movimento

`duration-(--duration)` 22 · `ease-(--ease)` 17 · `duration-[240ms]` 1 (Progress). Variáveis `--duration` e `--ease` em `globals.css`; `@media (prefers-reduced-motion: reduce)` zera animações e transições.

### 4.6 Classes próprias definidas em `globals.css`

| Classe | Usos | O que é | Onde |
|---|---|---|---|
| `.num` | ~50 | fonte arredondada + `tabular-nums` | stats, contadores, códigos H, tempos |
| `.tabular` | 1 | só `tabular-nums` | valor do slider no `Grafico` |
| `.qtext` | 2 | enunciado serifado 16,5px, linha 1,62 (KaTeX 1,06em) | `QuestaoView`, `GemeaCard` |
| `.hero-azul` | 2 | gradiente `#0A84FF → #0058CC`, texto branco | stat "Dias até a prova", stat "Acertos" do fim do sprint |
| `.entrada-stagger` | 4 | filhos entram em cascata (atrasos por `nth-child`) | `ConteudoPagina` e grades do Hoje |
| `.anim-entrada` | 5 | entrada curta (fade + deslocamento) | card do visual, texto do passo, retorno do teste |
| `.anim-questao` | 1 | entrada do card da questão | `QuestaoView` |
| `.anim-assenta` | 2 | "assentar" ao acertar | alternativa certa, chip certo do teste |
| `.anim-shake` | 2 | tremida curta ao errar | alternativa errada, chip errado |
| `.anim-desenha` | 1 | traço do check se desenha (`--traco`) | `CheckDesenhado` |
| `.anim-pop` | 2 | pop de escala | bolinhas do sprint, X da errada |
| `.anim-barra` | 1 | barra cresce de baixo | gráfico da semana |
| `.anim-traco-eixo` | 1 | traço de eixo | visual de gráficos |
| `.anim-fade-in` | 3 | fade de entrada | overlays, tooltip |
| `.anim-fade-out` | 4 | fade de saída | overlays, gaveta, toast |
| `.anim-pop-in` / `.anim-pop-out` | 1 / 1 | escala de entrada/saída | `DialogContent` |
| `.anim-slide-in-right` | 2 | entra pela direita | gaveta do Laboratório, toast |
| `.selecao-flutuante` / `-abaixo` | 2 / 1 | posição do botão "Perguntar sobre isto" | `QuestaoView` |
| `.editor-codigo` / `.editor-camada` | 1 / 2 | camadas sobrepostas do editor | `CampoCodigo` |
| `.tok-comentario/-string/-numero/-palavra/-builtin/-operador` | 1 cada | cores do realce Python | `CampoCodigo` |
| `.cmdk-item` / `.cmdk-grupo` | 4 / 3 | itens e grupos da paleta | `PaletaComandos` |
| `.mafs-tema` | 1 | cores do Mafs nos tokens | `Grafico` |

Keyframes: `gab-fade-in`, `gab-fade-out`, `gab-pop-in`, `gab-pop-out`, `gab-slide-in-right`, `gab-entrada`, `gab-assenta`, `gab-shake`, `gab-desenha`, `gab-pop`, `gab-questao-entra`, `gab-barra` (definido duas vezes, linhas 523 e 538), `gab-traco-eixo`. O bloco `.entrada-stagger > .entrada-stagger` e `.anim-barra` também aparecem duplicados (linhas 520/535 e 531/546).

Animações do Tailwind em uso: `animate-spin` com `motion-reduce:animate-none` (spinners Loader2).

---

## 5. API dos componentes em `src/components/ui`

Todos usam `cn()` (`lib/utils`) para mesclar `className` e marcam `data-slot`.

### `button.tsx` — `Button`, `buttonVariants`
- Props: `React.ComponentProps<"button">` + `variant` + `size` + `asChild?: boolean` (Radix `Slot`; ex.: envolver `Link`). `type` padrão `"button"` (omitido com `asChild`).
- Base: pílula (`rounded-full`), `font-bold`, gap 8px, `disabled:opacity-40`, `active:translate-y-px`, ícone `1.1em`.
- `variant`: `primary` (padrão; `bg-accent`, hover `bg-accent-deep`) · `secondary` (`bg-background`, hover `bg-surface-2`) · `ghost` (transparente, hover `bg-surface-2`, semibold) · `outline` (borda 1,5px `border-border`, `bg-surface`, hover borda/texto azul) · `danger` (`bg-danger-soft text-danger-text`, hover vermelho cheio) · `link` (texto `accent-text`, sublinha no hover).
- `size`: `sm` (h-9, 13px) · `md` (padrão; h-10, 14px) · `lg` (h-12, 16px) · `icon` (40px) · `icon-sm` (36px).

### `badge.tsx` — `Badge`, `badgeVariants`
- Props: `React.ComponentProps<"span">` + `variant`.
- Base: `rounded-sm` (8px), `text-xs font-bold leading-5`, padding 9×3px, ícone 14px.
- `variant`: `neutral` (padrão) · `accent` · `success` · `danger` · `warning` · `outline` (borda 1,5px) · `solid` (azul cheio).

### `card.tsx` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Todos repassam props de `div` (`CardTitle` = `h2`, `CardDescription` = `p`). Sem variantes.
- `Card`: `rounded-xl` (20px), `border border-card-borda` (transparente no claro, linha no escuro), `bg-surface`, `p-5`, `shadow-card`, `flex-col gap-4`.
- `CardHeader` gap 4px · `CardTitle` `text-lg font-bold` · `CardDescription` `text-sm muted` · `CardContent` `flex-col gap-3` · `CardFooter` linha com gap 12px.

### `dialog.tsx` — `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- Wrappers de `@radix-ui/react-dialog`.
- `DialogContent`: props do Radix Content + `semFechar?: boolean` (esconde o X, `aria-label="Fechar"`). Centralizado, `w-[calc(100%-2rem)] max-w-lg`, `rounded-xl`, `p-6`, `shadow-flutuante`, `anim-pop-in/out`. Inclui `DialogOverlay` (`bg-[rgba(29,29,31,0.35)]`, escuro `bg-black/60`, `anim-fade-in/out`).
- `DialogHeader` (`pr-8` para não bater no X) · `DialogFooter` (coluna invertida no celular; linha à direita em `sm`) · `DialogTitle` `text-lg font-bold` · `DialogDescription` `text-sm muted`.

### `tabs.tsx` — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Wrappers de `@radix-ui/react-tabs`, sem variantes.
- `TabsTrigger`: chip pílula h-9, borda 1,5px, 13px semibold; ativo (`data-[state=active]`) azul cheio com texto branco.
- `TabsList` `inline-flex flex-wrap gap-2` · `TabsContent` `flex-1 outline-none`.

### `toast.tsx` — `ToastProvider`, `useToast`, tipos `TipoToast`, `ToastOpcoes`
- `useToast().notificar({ titulo: string, descricao?: string, tipo?: "info" | "sucesso" | "erro" | "aviso", duracao?: number })`. Detalhes em 0.6.

### `tooltip.tsx` — `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`
- `TooltipProvider({ delayDuration = 300 })`. `TooltipContent({ sideOffset = 6, … })`: pílula `rounded-[10px]` em `bg-foreground text-background` (invertida), 13px, `shadow-flutuante`; `Kbd` dentro fica transparente com borda clara.

### `progress.tsx` — `Progress`
- Props: Radix Progress Root + `value?: number` (0–100, limitado) + `tom?: "accent" | "success" | "danger" | "warning" | "neutral"` (padrão `accent`).
- Trilho 11px pílula `bg-background` (escuro `bg-surface-2`); indicador cresce de 0 até o valor ao montar (`translateX`, 240ms).

### `kbd.tsx` — `Kbd`
- Props de `kbd`. 22px de altura, `rounded-[6px]`, borda `border-border`, `bg-background`, `font-mono` 11px semibold muted. Dentro de botão azul recebe `border-white/40 bg-transparent text-white` por `className`.

### `esqueleto.tsx` — `Esqueleto`, `EsqueletoTexto`
- `Esqueleto`: props de `div`, `aria-hidden`, bloco estático `rounded-sm bg-background` (sem pulsar).
- `EsqueletoTexto({ linhas = 3, className? })`: linhas de 16px com larguras variadas.

### `contador.tsx` — `Contador`
- Props: `valor: string`, `className?`. Se o texto é inteiro, anima do valor anterior (0 na primeira vez) até o atual em 520ms com `requestAnimationFrame`; textos não inteiros ("—", "0,30") aparecem direto. Com `prefers-reduced-motion`, sem animação. O `aria-label` é o valor final.

### `scroll-area.tsx` — `ScrollArea`, `ScrollBar`
- Wrappers de `@radix-ui/react-scroll-area`. `ScrollBar({ orientation = "vertical" })`: barra de 10px, polegar `bg-border` pílula. (Nenhum uso encontrado nas telas atuais.)

### Componentes compartilhados fora de `ui/` (referência rápida)

- `CabecalhoPagina`, `ConteudoPagina`, `RodapeFonte`, `EstadoVazio` — `components/app/pagina.tsx` (ver 0).
- `Marca({ className?, compacta? })`, `Logo({ className? })`, `Sidebar`, `BarraSuperior` — `components/app/sidebar.tsx`.
- `ThemeToggle({ className?, compacto? })` — `components/app/theme-toggle.tsx`.
- `CaixaTempo(props de span)`, `formatarTempo(seg)`, `BarraSprint` — `components/estudo/barra-sprint.tsx`.
- `Balao({ children, rotulo?, papel?: "tutor"|"aluno", selo?, className? })`, `SeloConferido`, `SeloNaoConferido` — `components/estudo/mensagem-tutor.tsx`.
- `EscadaDicas({ degrau, className? })` — `components/estudo/painel-tutor.tsx`.
- `Alternativas({ alternativas, marcada, gabarito?, confirmada, desabilitada?, aoMarcar })` — `components/estudo/alternativas.tsx`.
- `QuestaoView({ questao, marcada, confirmada, aoMarcar, aoConfirmar, aoPular, aoProxima, ehUltima, aoPerguntarSobre?, canto?, comVisual? })`, `FonteQuestao({ questao, className? })` — `components/estudo/questao-view.tsx`.
- `GemeaCard({ gemea, aoResponder? })` — `components/estudo/gemea-card.tsx`.
- `Grafico({ spec, className?, altura = 280 })` — `components/estudo/grafico.tsx`.
- `ImagemQuestao({ src, alt, className?, descricao? })` — `components/estudo/imagem-questao.tsx`.
- `MolduraVisual`, `MiniExercicio({ exercicio })`, `Deslizador({ rotulo, valor, min, max, passo = 1, aoMudar, sufixo = "" })` — `components/visuais/moldura.tsx`.
- `EditorPython({ compacto?, codigoInicial? })`, `CampoCodigo({ valor, aoMudar, aoRodar, linhas = 8, id = "codigo-python" })`, `StatusPyodideBadge` — `components/laboratorio/editor-python.tsx`.
- `Plotador({ compacto? })` — `components/laboratorio/plotador.tsx`.
- `GavetaLaboratorio({ aberta, aoMudar })` — `components/laboratorio/gaveta-laboratorio.tsx`.
