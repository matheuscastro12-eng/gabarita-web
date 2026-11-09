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
