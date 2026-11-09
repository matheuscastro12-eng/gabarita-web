# Gabarita

IDE agêntica de estudo de matemática do ENEM. A questão oficial fica de um lado, um tutor que confere cada conta fica do outro, e um mapa de domínio diz quando você está pronto.

Feito para uso pessoal (um aluno, sem login), com atenção a quem tem TDAH: sprints curtos de 5 questões, uma ação principal por tela, ritmo visível, nada piscando.

## O que é

| Peça | O que faz |
|---|---|
| **Hoje** | Um botão: *Começar*. Mostra as 5 próximas questões (fáceis primeiro, revisões no meio), a nota estimada e as revisões vencidas. |
| **Estudar (IDE)** | Questão à esquerda, tutor à direita, painéis redimensionáveis. Alternativas A–E, escada de dicas em 4 degraus, "por que errei?", resposta direta registrada, modo foco, atalhos completos. No celular vira abas. |
| **Fim do sprint** | Os 5 resultados e quanto o domínio de cada habilidade mudou. |
| **Mapa** | Calor H1–H30 agrupado por competência e por assunto, nota TRI estimada com intervalo e os três níveis de "pronto" com o que falta em cada um. |
| **Simulado** | 15 itens fáceis inéditos, 3 minutos por item, sem tutor. Vale para o critério "pronto nos fáceis". |
| **Caderno de erros** | Todo erro entra sozinho com a alternativa marcada, o gabarito e o equívoco diagnosticado. Refazer, gêmea, filtros. |
| **Laboratório** | Python com SymPy no navegador (Pyodide num Web Worker) e gráficos de função com sliders (Mafs). Abre como gaveta dentro da IDE com `L`. |
| **Ajustes** | Perfil "explica do meu jeito", data da prova, meta de nota, habilidades da semana, estado do tutor, tema e backup JSON. |

## Funcionalidades

- **Banco oficial**: 636 questões de matemática do ENEM 2009–2023, 614 com parâmetros TRI (a, b, c) dos microdados do INEP, habilidade e gabarito oficiais, 60 com resolução curada e verificada no SymPy.
- **Fila "fáceis primeiro"** pelo parâmetro *b* real, com revisões vencidas (FSRS) no meio e no máximo 2 itens por habilidade.
- **Tutor socrático** (Claude via Vercel AI SDK): nunca revela a resposta antes do degrau 4 ou de um pedido explícito, usa no máximo 3 frases, confere todo número com `run_python` (SymPy) ou `verify_answer` (mathjs) e ganha o selo "✓ conferido" quando bate com o gabarito. Um filtro no servidor redige vazamentos (letra ou valor do gabarito).
- **Modo guiado offline**: sem chave de API o app funciona inteiro com as dicas, erros comuns e resoluções curadas do banco, questões gêmeas e cálculo pelo mathjs.
- **Questões gêmeas**: 10 geradores determinísticos em TypeScript (porcentagem, regra de três, razão, probabilidade, mediana, função afim, equações, PA, escala). A resposta sai do código, nunca do modelo; os distratores são erros típicos.
- **Modelo de domínio** (seção 6 do plano): evidência por tentativa, pesos por origem, bônus por dificuldade, detector de chute, esquecimento pelo FSRS, critérios de "pronto" por habilidade, nos fáceis e para a prova.
- **Nota TRI estimada**: 3PL, EAP com prior N(0, 1), só itens oficiais, escala 500 + 100θ com intervalo de 95% e rótulo "estimativa".
- **Tudo pelo teclado**: `A`–`E`, `Enter`, `N`, `H`, `/`, `F`, `L`, `⌥R`, `Alt+1…6`, `Ctrl/⌘+K` (paleta) e `?` (ajuda).
- **Robustez**: Pyodide fora do ar cai para o mathjs em contas simples e avisa; imagens quebradas viram um bloco explicativo com link; IndexedDB bloqueado cai para memória com aviso; questões sem curadoria recebem dicas genéricas, o gabarito oficial e o Laboratório; 404 com a casca do app; PWA instalável.
- **Design**: o design system original do Gabarita ENEM (claro, cards brancos de raio 20 px, azul de sistema, fonte do sistema na interface e serifa no enunciado), modo escuro opcional em azul, foco visível, `prefers-reduced-motion`. Tokens em `docs/DESIGN.md`.

## Como rodar

Requisitos: Node 24 e pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local      # opcional: chave da API para ligar o tutor de IA
pnpm dev                        # http://localhost:3000
```

Sem chave o app abre em modo guiado offline. Para ligar a IA, preencha `ANTHROPIC_API_KEY` (ou `AI_GATEWAY_API_KEY`) no `.env.local` e reinicie.

Produção local:

```bash
pnpm build && pnpm start
```

## Variáveis de ambiente

Documentadas em [`.env.example`](.env.example). Nenhuma é obrigatória.

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic usada pelo tutor. Nunca é logada nem enviada ao navegador. |
| `AI_GATEWAY_API_KEY` | Alternativa: Vercel AI Gateway (usada se a anterior estiver vazia). |
| `TUTOR_MODEL` | ID do modelo (padrão `claude-sonnet-5-5`). Confira o ID atual na documentação da Anthropic. |
| `TUTOR_EFFORT` | `low` (padrão), `medium` ou `high`. |
| `PROVAS_DIR`, `PROVAS_GIT_REF` | Origem do banco de questões para `pnpm sync-provas`. |

## Arquitetura

```
src/
  app/                 rotas (App Router): /, /estudar, /mapa, /simulado, /caderno, /laboratorio, /ajustes,
                       /api/tutor (streamText + ferramentas), /api/status, manifest, ícones, 404
  components/
    app/               casca: barra lateral/inferior, paleta de comandos, ajuda de atalhos, aviso de armazenamento
    estudo/            IDE: questão, alternativas, barra do sprint, painel do tutor, mensagens, gráfico, gêmea
    hoje/ mapa/ caderno/ simulado/ laboratorio/ ajustes/
    ui/                componentes base (Radix + cva): button, card, badge, dialog, tabs, toast, esqueleto…
  data/                tipos zod do PROVAS, snapshot em provas/{ano}.json, taxonomia (C1–C7, assuntos), carregador
  lib/
    dominio/           núcleo puro: evidência e domínio, pronto, TRI (EAP), FSRS, fila, simulado, mapa, caderno, perfil
    tutor/             prompt, ferramentas, filtro de vazamento, mathjs, plot, modo guiado offline, handler da rota
    gemeas/            geradores determinísticos de questões gêmeas
    pyodide/           cliente do Web Worker, fallback para o mathjs
    store/             StudentStore: IndexedDB (idb-keyval) com fallback em memória, backup JSON, schema zod
    atalhos/           registro global de atalhos de teclado
public/workers/        pyodide.worker.js (carrega Pyodide + SymPy do jsdelivr sob demanda)
scripts/sync-provas.ts copia o banco do repositório PROVAS para src/data/provas
e2e/                   Playwright
docs/                  BRAINSTORM (plano), DECISOES (regras), DESIGN (tokens), PROGRESSO (etapas), CHECKS
```

Fluxo de uma tentativa: a IDE registra a resposta → `registrarTentativa` (puro) calcula evidência, atualiza domínio, FSRS, caderno e θ → o `StudentStore` grava no IndexedDB → as telas observam o estado. O tutor recebe um resumo de ~200 tokens do aluno (nunca o histórico bruto), com o bloco fixo do prompt em cache.

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript estrito, Tailwind v4, Radix, react-resizable-panels, KaTeX, Mafs, Vercel AI SDK 7 + `@ai-sdk/anthropic`, mathjs, ts-fsrs, idb-keyval, zod, vitest, Playwright.

## Fontes de dados

- **INEP**: provas, gabaritos e microdados (`ITENS_PROVA_<ano>.csv`) com habilidade, gabarito e parâmetros TRI. O gabarito oficial é sempre a verdade.
- **Espelho Zenodo (18801899)**: cópia dos microdados usada quando o download do INEP falha (TLS bloqueado em sandbox).
- **enem.dev**: transcrição comunitária do texto e das imagens das questões (as imagens são carregadas das URLs públicas deles).
- **PROVAS** (`matheuscastro12-eng/PROVAS`): repositório que junta tudo num JSON por ano, com resoluções curadas, dicas em níveis, erros comuns por alternativa e código SymPy verificado. O Gabarita copia um snapshot com `pnpm sync-provas`.

Cada questão mostra "Fonte: INEP, ENEM {ano}, questão {n}", o link da transcrição e a origem do gabarito e do TRI. Uso pessoal; para abrir o produto, leia a seção de direitos em `docs/BRAINSTORM.md`.

## Testes

```bash
pnpm lint        # ESLint (config do Next)
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest com cobertura: 100% no núcleo puro (domínio, store, atalhos, gêmeas…), ≥ 90% no tutor
pnpm e2e         # Playwright (Chromium): sprint pelo teclado, tutor offline, mapa, simulado, caderno,
                 # laboratório, ajustes, robustez (sem IndexedDB, imagem fora, CDN do Pyodide fora, 404, manifest)
```

O e2e sobe o dev server em `localhost:3100` sem herdar `ANTHROPIC_API_KEY` do ambiente. A rota do tutor com IA é coberta por testes unitários com modelo simulado (`MockLanguageModelV4`).

## Limitações

- **Sem login e sem servidor de dados**: tudo fica no IndexedDB do navegador. Troque de máquina pelo backup JSON dos Ajustes. A interface `StudentStore` está pronta para um backend depois.
- **Tutor de IA só com chave**: a rota foi validada com modelo simulado; os critérios de aceite com conversas reais (nunca revelar a resposta, ≤ 3 frases, 100% das contas conferidas) ainda precisam ser rodados com uma chave.
- **Pyodide pesa ~15 MB** na primeira carga (CDN jsdelivr, fica em cache). Sem internet o SymPy não roda; contas simples caem para o mathjs.
- **Nota TRI é estimativa**: não replica a equalização oficial do INEP; serve para acompanhar tendência e o critério de "pronto".
- **Habilidade estimada** em algumas questões antigas (marcadas "(estimada)"); **60 curadas** de 636, o resto usa dicas genéricas e o gabarito.
- **Simulado completo de 45 itens** ainda não tem tela (o critério "pronto para a prova" já o espera).
- **Imagens** vêm do enem.dev; se o serviço sair do ar, a questão mostra o aviso e o texto `dados_da_imagem` quando curado.
