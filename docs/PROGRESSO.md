# PROGRESSO — Gabarita v1

Registro das etapas. Uma sessão nova lê este arquivo e continua dele. Regras fixas em docs/DECISOES.md; design em docs/DESIGN.md.

## Etapa 1 de 4 — Arquitetura, scaffold, design system e núcleo de domínio (09/11/2026)

### O que foi feito
- **Scaffold:** Next.js 16.4.5 (App Router, Turbopack, `cacheComponents`), React 19.3, TypeScript estrito (`noUncheckedIndexedAccess`), Tailwind v4, ESLint 9 (config do Next), pnpm 10, Node 24 (`.nvmrc`). Scripts: `lint`, `typecheck`, `test` (vitest com cobertura), `build`, `e2e` (Playwright), `sync-provas`. `.env.example` documenta `ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`, `TUTOR_MODEL`, `PROVAS_DIR`, `PROVAS_GIT_REF`.
- **Playwright** fixado em `@playwright/test@1.64.1`, a versão que usa o Chromium 1248 já instalado em `~/.cache/ms-playwright` (nenhum navegador foi baixado). O dev server de teste sobe em `localhost:3100` com `env -u ANTHROPIC_API_KEY`.
- **Design system** (docs/DESIGN.md): tokens em CSS variables (escuro grafite padrão + modo claro via `next-themes`, uma cor de destaque âmbar, contraste AA conferido por script), Inter variável vendorizada (`src/fonts`, `next/font/local`, sem CDN), corpo 17px (18px ≥ 1280px), `prefers-reduced-motion`, foco visível. Componentes em `src/components/ui`: Button, Card, Badge, Kbd, Progress, Tabs, Dialog, Tooltip, Toast, ScrollArea (Radix + cva).
- **Casca do app** (`src/components/app`): barra lateral com Hoje, Estudar, Mapa, Caderno, Laboratório, Ajustes (barra inferior no celular), alternância de tema, link "pular para o conteúdo", paleta de comandos (Ctrl/Cmd+K, cmdk) e overlay de ajuda (`?`) alimentados por um **registro global de atalhos** (`src/lib/atalhos`, puro e testado): `Alt+1…6` navegação, `A–E`, `Enter`, `N`, `H`, `/`, `F`.
- **Camada de dados** (`src/data`): tipos e schemas zod compatíveis com `PROVAS/schema/questao.schema.json` e `resolucao.schema.json`; `scripts/sync-provas.ts` copia de `../PROVAS` (ou GitHub raw) para `src/data/provas/{ano}.json` + `manifesto.json` + `index.ts` gerado; `fixture.json` com 5 questões reais do ENEM 2023 (enem.dev, fonte INEP), usado quando não há snapshot. **Snapshot atual: 636 questões (2009–2023), 19 com resolução curada, 0 com TRI** (o PROVAS ainda não conseguiu baixar os microdados do INEP).
- **Núcleo de domínio** (`src/lib/dominio`, puro, 100% coberto): evidência e atualização de domínio (tabela da seção 6, detector de chute ×0,5, pesos 1/0,6, bônus 1,2 e 1,3), critérios de "pronto" por habilidade / nos fáceis / para a prova com mensagens do que falta, TRI 3PL + EAP por quadratura (prior N(0,1), 61 nós, log-verossimilhança) + nota 500+100θ com intervalo, repetição espaçada com ts-fsrs 5 (cartão por habilidade, retenção, domínio efetivo), fila do sprint (fáceis por b → revisão vencida → menor domínio → b, máx. 2 por habilidade, sem repetir acerto dos últimos 7 dias), caderno de erros, orquestrador `registrarTentativa`/`iniciarSprint`/`encerrarSprint`/`resumoSprint`.
- **StudentStore** (`src/lib/store`): interface + implementação IndexedDB (idb-keyval, validação zod, estado corrompido preservado em outra chave) + memória para testes; `exportarBackup`/`importarBackup` em JSON; `StoreProvider` React.
- **Telas:** Hoje (saudação, card "Começar" com prévia da fila, nota estimada ou aviso "sem parâmetro TRI", revisões vencidas, domínio por habilidade, origem dos dados); Estudar = IDE com painéis redimensionáveis (react-resizable-panels v4, layout salvo), barra do sprint ●●◐○○, timer discreto, modo foco, questão em Markdown/KaTeX com imagens do enem.dev, alternativas A–E, tutor em **modo guiado offline** (aviso de chave ausente, escada de dicas com `dica1–3` + resolução curada do PROVAS quando houver), rodapé com domínio e critério que falta; tela de fim do sprint (5 resultados e delta de domínio). Mapa, Caderno, Laboratório e Ajustes são esqueletos com estado vazio explicativo.
- **Testes:** 123 unitários (vitest) com 100% de cobertura no núcleo (`src/lib/dominio`, `src/lib/store`, `src/lib/atalhos/registro.ts`, `src/lib/utils.ts`); 9 e2e (sprint inteiro pelo teclado com persistência, modo foco, redimensionar painéis, abas no celular, paleta, ajuda, Alt+2, tema).

### Decisões desta etapa
- `@playwright/test` fixo em 1.64.1 por causa do Chromium 1248 local; ao atualizar o Playwright, atualize o navegador junto.
- Cobertura 100% vale para o núcleo puro; a cola React (`provider.tsx`, `use-cliente.ts`, componentes) é coberta pelo e2e.
- Lint do React Compiler (`react-hooks/set-state-in-effect`, `refs`): estado por questão vive num componente com `key` por questão; "montado"/"é Mac" via `useSyncExternalStore`; leitura do IndexedDB em `.then`.
- `cacheComponents` ligado: nada de `new Date()` em render de client component durante o prerender (só depois que o estado chega do IndexedDB).
- `devIndicators: false` no dev (o selo cobria o botão de tema e travava o Playwright); `allowedDevOrigins` inclui 127.0.0.1.
- Sem TRI no banco, "fácil" usa `dificuldade_estimada`; como ela é null em tudo hoje, a fila ordena por domínio e id. Quando os microdados entrarem, nada muda no código.
- A habilidade do PROVAS é heurística (`habilidade_origem: "heuristica"`) e às vezes errada (ex.: 2023-143 veio como H6). A UI marca "(estimada)".
- Fontes: só Inter normal (latin + latin-ext); itálico é sintetizado. KaTeX traz as próprias fontes via CSS do pacote.

### Pendências para as próximas etapas
- **Etapa 2 (tutor):** rota `/api/tutor` com Vercel AI SDK + `@ai-sdk/anthropic` (modelo por `TUTOR_MODEL`), ferramentas `run_python` (Pyodide no cliente), `verify_answer`/`calc` (mathjs), `plot_function` (Mafs), selo "✓ conferido", "por que errei?" pelo `erros_comuns`, registro de eventos; o campo de pergunta e o botão de enviar já existem desabilitados.
- **Etapa 3:** Mapa (calor H1–H30, nota com intervalo, critérios), Caderno (listar/refazer), Laboratório (SymPy + gráficos), Ajustes (perfil, data da prova, meta, backup JSON — `exportarBackup`/`importarBackup` prontos), questões gêmeas (gerador determinístico, peso 0,6).
- **Dados:** TRI oficial depende de o PROVAS baixar os microdados (INEP bloqueia TLS na sandbox). Alinhar slugs de assunto do fixture com `PROVAS/taxonomia/assuntos.json`. Resoluções curadas crescem no PROVAS: rode `pnpm sync-provas` a cada etapa.
- **Fila:** o parâmetro `theta` é aceito mas ainda não influencia a ordem; o critério "itens inéditos" do simulado de fáceis não é verificado.
- **Acessibilidade/visual:** screenshots 1440/390 conferidos à mão nesta etapa (fora do repo, em `.tmp/capturas`); não há teste automatizado de contraste nem de `prefers-reduced-motion`.

### Como rodar
```
pnpm install
pnpm sync-provas          # copia ../PROVAS (ou GitHub) para src/data/provas
env -u ANTHROPIC_API_KEY pnpm dev
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```

## Etapa 2 de 4 — Tutor agêntico, ferramentas e verificação matemática (09/11/2026)

### O que foi feito
- **Dependências:** `ai@7`, `@ai-sdk/anthropic@4`, `@ai-sdk/react@4`, `@ai-sdk/gateway@4`, `mathjs@15`, `mafs@0.21` (+ `@ai-sdk/provider` como dev, só para os tipos do mock). API conferida em `node_modules/ai/docs` (v7: `instructions` em vez de `system`, `isStepCount`, `toUIMessageStream` + `createUIMessageStreamResponse`, `MockLanguageModelV4` em `ai/test`).
- **Rota `/api/tutor`** (`src/app/api/tutor/route.ts` → `src/lib/tutor/servidor.ts`, testável): valida o corpo com zod (`messages` + `contexto` com questão, degrau, alternativa marcada, confirmada, pedido de resposta, trecho selecionado, resumo do aluno e perfil), carrega a questão do snapshot, monta as instruções em três blocos de sistema (regras+escada **com `cacheControl` ephemeral**, perfil **com cache**, contexto variável sem cache), `streamText` com as 7 ferramentas, `isStepCount(8)`, `effort` por `TUTOR_EFFORT` (padrão `low`). Provedor: `ANTHROPIC_API_KEY` → `@ai-sdk/anthropic`; senão `AI_GATEWAY_API_KEY` → `@ai-sdk/gateway` com `anthropic/<modelo>`. Sem chave: **503 `{codigo:"missing_key"}`** sem detalhes. Erros: 400 `invalid_body`, 404 `question_not_found`. Modelo padrão `claude-sonnet-5-5` (BRAINSTORM §8; id conferido na tabela atual de modelos).
- **`/api/status`**: `{ ia: boolean, provedor, modelo }`, dinâmico (`connection()`), `cache-control: no-store`; nunca o valor da chave.
- **Prompt** (`src/lib/tutor/prompt.ts`): núcleo da seção 5 (socrático, ≤3 frases, termina com pergunta/ação, nunca revela antes do degrau 4 ou de pedido explícito, LaTeX, erros_comuns por alternativa, record_event, 2 divergências → admite que não conferiu). Contexto oculto com enunciado, alternativas, gabarito, resolução/dicas/erros/verificação curados, habilidade, b, estado da conversa e `resumirAluno` (~200 tokens: domínio da semana, habilidade atual, tentativas, 3 equívocos recorrentes).
- **Ferramentas** (`src/lib/tutor/ferramentas.ts`): `run_python` (cliente: Web Worker `public/workers/pyodide.worker.js` com Pyodide 0.29.0 + sympy do jsdelivr, stdout capturado, valor da última expressão, timeout 30 s e cancelamento por `terminate`), `verify_answer` e `calc` (mathjs: `simplify(a−b)==0` e 20 pontos aleatórios com semente fixa; valores em notação brasileira, %, LaTeX simples; `verify_answer` compara com as alternativas numéricas e só "bate" na letra do gabarito), `plot_function` (spec zod → Mafs com sliders), `get_hint(nível)` (dicas curadas), `make_twin` (gerador determinístico), `record_event` (cliente → StudentStore).
- **Gêmeas** (`src/lib/gemeas`): 10 geradores em TS com PRNG mulberry32 (porcentagem ×3 variantes, regra de três, razão/proporção, probabilidade simples, mediana com n par, função afim, equação do 1º grau, 2º grau (lançamento), PA, escala). Resposta calculada pelo código; distratores = erros típicos com explicação; `montarGemea` garante 5 textos distintos. `gemeaDaQuestao` escolhe o gerador pelos slugs de assunto do PROVAS; `gemeaComoQuestao` registra a tentativa com origem `gemea` (peso 0,6, fora do TRI, `sprintId` null).
- **Guardas:** `src/lib/tutor/vazamento.ts` detecta a letra ("alternativa C", "é a C", "marque C"…) e o valor do gabarito (115 600 / 115.600 / 115600 / `115\,600`, %, alternativa textual) ignorando números do enunciado e distratores; `redigir` troca por ▮▮▮ e acrescenta aviso. Aplicado no servidor por `experimental_transform` (buffer por bloco de texto; libera no `text-end` ou no flush) quando a guarda está ativa (degrau < 4, sem pedido, antes de confirmar) e emite `data-guarda`. Botão/atalho **Resposta direta (⌥R)**: marca o pedido, sobe para o degrau 4, registra `pedido_resposta`; no Mac, `®` também é tratado.
- **Modo guiado offline** (`src/lib/tutor/offline.ts` + `painel-tutor.tsx`): mesmo painel; aviso discreto "Tutor de IA desligado: falta a chave ANTHROPIC_API_KEY. Usando dicas verificadas."; intenções em pt-BR (dica, por que errei, resposta/resolução, gráfico, gêmea, cálculo com mathjs carregado sob demanda, laboratório); escada 1–3 das dicas curadas + resolução (selo "✓ conferido" quando vem da curadoria verificada no SymPy); erros_comuns pela alternativa marcada; chips de sugestão; sem curadoria → dicas genéricas + gabarito + Laboratório.
- **Interface:** chat com `useChat` (`DefaultChatTransport` com `body` dinâmico, `sendAutomaticallyWhen`, `onToolCall` para `run_python`/`record_event`, parar, tentar de novo, 503 vira modo guiado), partes de ferramenta renderizadas (código SymPy recolhível, verificação, cálculo, gráfico Mafs com sliders, gêmea respondível), selo "✓ conferido"/"não conferido", chips, campo com Enter/Shift+Enter, "perguntar sobre isto" por seleção no enunciado (botão flutuante → chip no chat → prefixo da mensagem). Markdown+KaTeX já valia para enunciado e alternativas; agora também no chat.
- **Laboratório** (`src/components/laboratorio/tela-laboratorio.tsx`): editor Python (Ctrl+Enter), status do Pyodide, cancelar, exemplos, saída; gráfico de função com sliders.
- **Domínio:** `EventoTutor` (`dica|erro|equivoco|pedido_resposta|verificacao|gemea`) em `EstadoAluno.eventosTutor` (opcional para estados antigos; schema zod atualizado), `registrarEventoTutor` preenche o `porQue` do caderno quando o tutor identifica o equívoco, `equivocosRecorrentes`.
- **Testes:** 240 unitários em 28 arquivos (config, mathjs, vazamento, prompt, plot, offline, ferramentas, servidor com `MockLanguageModelV4` cobrindo chamada de ferramenta no servidor, encaminhamento ao cliente, redação do vazamento, cache nos blocos de sistema, erro do provedor; gêmeas com 100 sementes por gerador + oráculo independente a partir do enunciado; eventos). Cobertura: núcleo puro 100% (globs), tutor/gêmeas ≥90%. E2E: 15 (os 9 anteriores + status/503, conversa offline numa questão curada com dica, "por que errei?" e resposta direta, gráfico com slider, gêmea, seleção do enunciado, Laboratório).

### Decisões desta etapa
- A guarda de vazamento é desligada depois que o aluno **confirma** (o gabarito já está na tela): senão "por que errei?" seria redigido.
- A guarda bufferiza cada bloco de texto no servidor (as respostas têm ≤3 frases, o atraso é pequeno); com degrau 4, pedido explícito ou resposta confirmada o stream passa direto.
- `TUTOR_EFFORT=low` por padrão (latência para TDAH; as contas são das ferramentas). `TUTOR_MODEL` sem `/` ganha o prefixo `anthropic/` no gateway.
- Worker do Pyodide é um arquivo estático em `public/workers` (worker clássico com `importScripts` do CDN, o caminho oficial), fora do bundler; `public/**` fica fora do ESLint.
- mathjs só entra no bundle do cliente por `import()` dinâmico (conta offline e gráficos).
- `?questao=<id>` em `/estudar` põe uma questão na frente da fila (refazer do caderno e e2e determinístico).
- `/api/status` precisa de `connection()` com `cacheComponents` (sem isso era pré-renderizado estático no build).
- Painel do tutor existe duas vezes no DOM (desktop e abas do celular); os e2e usam `.first()`.
- O chip "Dica" do modo guiado não repete o texto do botão "Próximo degrau" (estrito do Playwright).

### Pendências
- **Conferir ao vivo com chave:** a rota foi testada só com mock (nenhuma chave disponível na sandbox). Ao ligar `ANTHROPIC_API_KEY`, rodar 10 conversas dos critérios 3–7 do BRAINSTORM §10 e ajustar o prompt.
- **Pyodide:** sem e2e que baixe o Pyodide (15 MB do CDN); conferido à mão no Laboratório. Primeira carga lenta; considerar aviso de progresso no chat quando `run_python` for chamado pela primeira vez.
- **Etapa 3:** Mapa, Caderno (refazer via `?questao=`), Ajustes (perfil "explica do meu jeito" já vai no prompt; falta a tela), status da IA nos Ajustes; gêmeas na fila do sprint.
- Guarda: só letra e valor da alternativa correta; alternativas com imagem não são cobertas.
