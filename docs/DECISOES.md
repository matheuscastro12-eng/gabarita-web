# Decisões de implementação (v1)

Lidas junto com docs/BRAINSTORM.md (o plano do produto). Onde houver conflito, vale este arquivo.

## Escopo da v1
Produto completo e polido para uso pessoal do Matheus (um único usuário, sem login), não um esboço:
- Tela "Hoje" (início), IDE (questão | tutor, painéis redimensionáveis), fim do sprint, Mapa de domínio/"pronto", Caderno de erros, Laboratório (sandbox SymPy + gráficos), Configurações (perfil "explica do meu jeito", data da prova, meta de nota, chave/estado do tutor).
- Sprint de 5 questões, escada de dicas (0–4), "por que errei?" pela alternativa marcada, modo foco (F), atalhos de teclado completos (A–E, Enter, H, N, /, F, ?).
- Modelo de domínio e de "pronto" exatamente como na seção 6 do BRAINSTORM (evidência, atualização, critérios), mais nota TRI estimada (3PL, EAP, prior N(0,1), escala 500+100θ com rótulo "estimativa" e intervalo) usando só itens oficiais com parâmetros TRI; quando não houver TRI, mostrar "sem parâmetro TRI" e usar dificuldade heurística.
- Repetição espaçada com ts-fsrs por habilidade.
- Questões gêmeas: gerador determinístico por template (código TypeScript que gera números e calcula a resposta; distratores = erros típicos) para os assuntos de foco; a resposta sai do código, nunca do LLM. Peso 0,6 no domínio e fora da nota TRI.

## Stack
- Next.js (App Router, TypeScript estrito), Tailwind CSS, componentes no estilo shadcn/ui (Radix), react-resizable-panels, lucide-react, framer-motion com parcimônia (respeitar prefers-reduced-motion).
- KaTeX via react-markdown + remark-math + rehype-katex. Gráficos de função: Mafs (ou function-plot) com sliders.
- Vercel AI SDK (última versão estável; conferir a API atual nos docs/node_modules) com @ai-sdk/anthropic. Modelo configurável por env (TUTOR_MODEL); confira o ID de modelo Claude atual na documentação da Anthropic, não invente.
- Persistência: SEM banco externo na v1 (não criar projetos Supabase nem recursos pagos). Estado do aluno no navegador (IndexedDB via idb-keyval ou Dexie), atrás de uma interface `StudentStore` para trocar por Supabase depois. Exportar/importar backup JSON nas Configurações.
- Banco de questões: snapshot do repositório matheuscastro12-eng/PROVAS copiado para `src/data/provas/` por `scripts/sync-provas.ts` (lê de ../PROVAS local ou do GitHub raw). Imagens referenciadas pelas URLs públicas já presentes nos dados.

## Verificação matemática
- `run_python` / SymPy: Pyodide num Web Worker no navegador (carregado sob demanda do CDN oficial jsdelivr, com pacote sympy), exposto como ferramenta do tutor executada no cliente (tool sem execute no servidor + addToolResult/onToolCall do AI SDK) e no Laboratório. Timeout e cancelamento.
- Servidor: `verify_answer` e `calc` com mathjs (simbólico simples + comparação numérica em 20 pontos aleatórios) para checagens rápidas.
- Selo "✓ conferido" na mensagem quando a verificação bateu com o gabarito oficial.
- Resoluções curadas do PROVAS já trazem codigo_sympy verificado nos testes.

## Tutor sem chave (obrigatório funcionar)
- Envs: ANTHROPIC_API_KEY (ou AI_GATEWAY_API_KEY), TUTOR_MODEL. Documentar em .env.example. Nunca logar a chave.
- Sem chave: o app funciona inteiro em "modo guiado offline": o tutor usa as dicas em níveis, erros_comuns e resolução curadas do PROVAS (e o gerador de gêmeas), com um aviso claro e discreto: "Tutor de IA desligado: falta a chave ANTHROPIC_API_KEY. Usando dicas verificadas." Para questões sem curadoria, oferecer gabarito + Laboratório.

## Design
- **Design system original do Gabarita ENEM** (decisão do Matheus, 09/11/2026; fonte em `/workspace/gabarita/design-system-original/`, regras em docs/DESIGN.md): tema claro por padrão (fundo #F5F7FA, cards brancos de raio 20px com sombra dupla, azul de sistema #0A84FF e #E5F1FF, ink #1D1D1F, muted #6E6E73, linha #E3E8EF de 1,5px). Fonte do sistema na interface, ui-rounded na marca e nos números, serifa no enunciado e nas alternativas, KaTeX para a matemática. Botões e chips em pílula, barras de 11px, sidebar branca de 210px com o capelo. Modo escuro opcional como versão azul do mesmo sistema (nunca o grafite com âmbar). Nada piscando, blocos curtos (TDAH), contraste AA no texto de estado. Responsivo (notebook primeiro; no celular, barra superior e questão/tutor em abas).
- UI 100% em pt-BR.

## Qualidade
- Scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test` (vitest), `pnpm build`, `pnpm e2e` (Playwright, Chromium já instalado em ~/.cache/ms-playwright). Todos devem passar ao fim de cada etapa.
- Gerenciador: pnpm. Node 24.
- Commits pequenos e descritivos na branch feat/gabarita-v1. Sem push, merge ou deploy (quem faz é o orquestrador).
- Nunca imprimir, logar ou commitar segredos. Rodar o dev server SEM herdar ANTHROPIC_API_KEY do ambiente (use `env -u ANTHROPIC_API_KEY`).

## Tutor com o Claude local no app do Mac (09/11/2026)
- Pedido do Matheus: no app do Mac, o tutor usa o Claude Code logado (`~/.local/bin/claude`, assinatura) no lugar da API paga. A Vercel continua igual.
- Provedor `claude-local` (`TUTOR_PROVIDER=claude-local`, prioridade sobre as chaves) com `ai-sdk-provider-claude-code` 4.x (AI SDK v7, Claude Agent SDK). A CLI roda o laço de ferramentas, então as ferramentas com `execute` viram MCP em processo (`createAiSdkMcpServer`); um middleware tira o prefixo `mcp__tutor__` para o cliente renderizar as mesmas partes `tool-*`. Ferramentas internas da CLI desligadas (`tools: []`), `settingSources: []`, `permissionPrompts: "none"`, `cwd` em pasta temporária, sem sessão persistida.
- `run_python` e `record_event` ficam fora no modo local (são executadas no navegador e não podem atravessar a CLI). Contas: `calc`/`verify_answer`.
- O app do Mac sobe `next start` em 127.0.0.1:3917 (porta fixa por causa do localStorage por origem) e cai para a Vercel se falhar. Titlebar normal (sem `fullSizeContentView`), para os botões da janela não cobrirem a barra da IDE.
- Imagens da questão vão ao modelo em base64 na primeira mensagem do aluno (todos os provedores), para o tutor ler gráficos.
