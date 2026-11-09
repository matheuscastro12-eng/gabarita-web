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

# Checks — Etapa 3 (Mapa, Simulado, Caderno, Laboratório, Ajustes, banco final)

| # | Requisito | Evidência | Estado |
|---|---|---|---|
| 1 | `pnpm sync-provas` com TRI oficial 2009–2023, habilidade/gabarito oficiais, ~60 curadas | `src/data/provas/manifesto.json`: 636 questões, 614 com TRI, 60 com resolução; `src/data/tipos.ts` (campos novos) + `tipos.test.ts` | feito |
| 2 | Fonte em cada questão ("Fonte: INEP, ENEM {ano}, questão {n}" + transcrição enem.dev) | `fonteDetalhada`, `FonteQuestao` em `questao-view.tsx`; e2e do simulado confere `data-testid="fonte"` | feito |
| 3 | Fila do sprint usa b real | `src/lib/dominio/fila.ts` (`bOrdenacao`, `ehFacil` com p33 do banco); `fila.test.ts` | feito |
| 4 | Mapa: calor H1–H30 por competência e por assunto de foco | `src/lib/dominio/mapa.ts` + `mapa.test.ts`; `src/components/mapa/tela-mapa.tsx`; `e2e/mapa.spec.ts` (30 células, grupo C6, assuntos) | feito |
| 5 | Nota TRI estimada (EAP, só itens oficiais com TRI) com intervalo e rótulo "estimativa" | `tri.ts` (etapa 1) + card "Nota estimada" no Mapa; e2e confere o selo e a nota após 15 itens | feito |
| 6 | Três níveis de "pronto" com a lista explícita do que falta | `pronto.ts` + `NivelPronto` no Mapa; e2e confere "H24: domínio efetivo 0,30…", "falta 1 simulado…", "faltam 2 simulados completos…", detalhe com 4 critérios | feito |
| 7 | Simulado de 15 fáceis inéditos, 3 min/item, cronômetro discreto, conta para "pronto nos fáceis" | `simulado.ts` + `simulado.test.ts`; `tela-simulado.tsx`; e2e faz os 15 pelo teclado e vê o histórico no Mapa | feito |
| 8 | Caderno: questão, alternativa marcada, equívoco, revisão FSRS vencida, refazer e gêmea | `listarCaderno` + teste; `tela-caderno.tsx`; `e2e/caderno.spec.ts` | feito |
| 9 | Laboratório: editor Python/SymPy com realce leve no Pyodide do worker, exemplos prontos, plotador com sliders | `src/lib/laboratorio/realce.ts` + teste (100%); `editor-python.tsx`, `plotador.tsx`; `e2e/laboratorio.spec.ts`; execução real conferida à mão (1/6 em 3,7 s) | feito |
| 10 | Laboratório como gaveta dentro da IDE | `gaveta-laboratorio.tsx`, botão + atalho `L` em `ide.tsx`/`barra-sprint.tsx`; e2e | feito |
| 11 | Ajustes: perfil "explica do meu jeito" (texto + presets), data da prova, meta, tema, estado do tutor via /api/status (nunca a chave), export/import, zerar com confirmação | `perfil.ts` + teste; `tela-ajustes.tsx`; `e2e/ajustes.spec.ts` (inclui `not.toContainText(/sk-/)`) | feito |
| 12 | Testes vitest + e2e para cada tela (navegação, simulado, caderno após um erro, export/import) | `pnpm test`: 270 em 34 arquivos; `pnpm e2e`: 20 | feito |
| 13 | `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` | 09/11/2026: lint ok (0 problemas), typecheck ok, 270 testes ok com cobertura (domínio/store/atalhos/utils/aleatório/laboratório 100%), build ok (rotas /, /ajustes, /caderno, /estudar, /laboratorio, /mapa, /simulado, /api/status, /api/tutor), 20 e2e ok | feito |

# Checks — Etapa 4 (polimento, robustez, README, testes finais)

| # | Requisito | Evidência | Estado |
|---|---|---|---|
| 1 | Revisão visual de todas as telas, escuro/claro, 1440×900 e 390×844, com screenshots lidos e iterados | `.tmp/shots4.mjs` (fora do repo), `/workspace/gabarita/screens/*.png`, docs/DESIGN.md §7 | feito |
| 2 | Aviso do modo guiado com texto correto | `src/components/estudo/painel-tutor.tsx` (`AVISO_OFFLINE_PARTES`), e2e `tutor.spec.ts` (`role=note`) | feito |
| 3 | Rodapé do tutor cabe no celular (390 px) | `painel-tutor.tsx` (flex-wrap, Kbd `hidden sm:`/`lg:`), screenshot 09-celular-ide | feito |
| 4 | Mapa sem card esticado; Caderno sem quebra em "Marcou B · texto" | `tela-mapa.tsx` (grid `items-start`), `markdown.tsx` (`<span>` inline), screenshots 05/06 | feito |
| 5 | Esqueletos estáveis (sem piscar) em Hoje, Caderno, Mapa, Ajustes, IDE, gráfico | `src/components/ui/esqueleto.tsx`, `tela-hoje.tsx`, `tela-caderno.tsx`, `grafico.tsx` | feito |
| 6 | 404 bonita, centralizada, com ação principal | `src/app/not-found.tsx`, e2e `robustez.spec.ts` ("página inexistente") | feito |
| 7 | IndexedDB indisponível → memória + aviso | `src/lib/store/navegador.ts` + `navegador.test.ts` (100%), `aviso-armazenamento.tsx`, e2e "IndexedDB bloqueado" | feito |
| 8 | Pyodide (CDN) falha → mensagem + fallback mathjs; timeout de carga separado | `src/lib/pyodide/fallback.ts` + teste (100%), `cliente.ts` (`TIMEOUT_CARGA_MS`), `rodar.ts`, `editor-python.tsx`, e2e "CDN do Pyodide fora do ar" | feito |
| 9 | Imagens quebradas das questões | `src/components/estudo/imagem-questao.tsx`, `markdown.tsx`, `alternativas.tsx`, e2e "imagem da questão fora do ar" | feito |
| 10 | Questões sem curadoria no modo guiado | `src/lib/tutor/offline.ts` (`textoDegrau`), e2e "questão sem curadoria" | feito |
| 11 | Metadados/SEO, ícone, manifest PWA | `src/app/layout.tsx`, `manifest.ts`, `icon.svg`, `apple-icon.png`, `public/icons/*`, e2e "manifest e ícones" | feito |
| 12 | README completo em pt-BR | `README.md` | feito |
| 13 | `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` verdes | saída dos comandos no resumo final da etapa (logs em `/tmp/final-*.log` na sessão) | feito |
| 14 | Screenshots finais nomeadas em `/workspace/gabarita/screens/` | 01-hoje … 10-claro-ide | feito |
| 15 | Tutor conferido com chave real | sem chave na sandbox | pendente |
