# Checks — Etapa 2 (tutor agêntico)

Um requisito por linha, com a evidência (arquivo, teste ou comando). Atualizado ao fim da etapa.

| # | Requisito | Evidência | Estado |
|---|---|---|---|
| 1 | Rota `/api/tutor` com streamText + tools (AI SDK 7), provedor Anthropic ou AI Gateway, `TUTOR_MODEL` | `src/app/api/tutor/route.ts`, `src/lib/tutor/servidor.ts`, `src/lib/tutor/config.ts` | feito |
| 2 | Prompt socrático (seção 5), contexto oculto, perfil, resumo do aluno, cache no bloco fixo | `src/lib/tutor/prompt.ts` + `prompt.test.ts` | feito |
| 3 | `run_python` no cliente (Web Worker + Pyodide/sympy do jsdelivr, timeout, cancelar) | `public/workers/pyodide.worker.js`, `src/lib/pyodide/cliente.ts`; conferido à mão no Laboratório (não há e2e que baixe o Pyodide) | feito |
| 4 | `verify_answer` e `calc` com mathjs (simbólico + 20 pontos) | `src/lib/tutor/mathjs.ts` + teste | feito |
| 5 | `plot_function` → spec JSON; chat desenha com Mafs + sliders | `src/lib/tutor/plot.ts`, `src/components/estudo/grafico.tsx` | feito |
| 6 | `get_hint(nível)` lê dicas curadas | `src/lib/tutor/ferramentas.ts` | feito |
| 7 | `make_twin`: 10 geradores determinísticos, resposta pelo código, distratores = erros típicos | `src/lib/gemeas/*` + testes (100 seeds) | feito |
| 8 | `record_event` → StudentStore | `src/lib/dominio/eventos.ts`, cliente em `painel-tutor.tsx` | feito |
| 9 | Selo "✓ conferido"; 2 divergências → tutor admite | `src/components/estudo/mensagem-tutor.tsx`, prompt | feito |
| 10 | Filtro de vazamento (letra/valor antes do degrau 4 ou pedido) com teste | `src/lib/tutor/vazamento.ts` + teste; aplicado no stream em `servidor.ts` | feito |
| 11 | Botão/atalho "resposta direta" (⌥R) registra o pedido | `painel-tutor.tsx`, `ide.tsx` | feito |
| 12 | Modo guiado offline completo + aviso discreto | `src/lib/tutor/offline.ts` + teste, `painel-tutor.tsx` | feito |
| 13 | `/api/tutor` sem chave → 503 `missing_key`; `/api/status` → booleano | `route.test.ts`, `src/app/api/status/route.ts` | feito |
| 14 | Markdown + KaTeX no enunciado, alternativas e chat; seleção → contexto do chat | `questao-view.tsx`, `markdown.tsx` | feito |
| 15 | Testes vitest: mathjs, gêmeas, vazamento, prompt, offline, rota sem chave, rota com mock | `pnpm test` | feito |
| 16 | E2E: conversa offline numa questão curada + pedido de gráfico | `e2e/tutor.spec.ts` | feito |
| 17 | `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` | 09/11/2026: lint ok, typecheck ok, 240 testes (28 arquivos) ok com cobertura, build ok, 15 e2e ok | feito |
