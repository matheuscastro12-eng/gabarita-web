# Orquestração do treino (2026-11-09)

Orquestrador: Fable (decide, escreve as specs, revisa diffs e capturas). Workers: Opus com esforço low, chamados por `claude -p --model opus --effort low`, um por tarefa fechada. Specs em `design/specs/` e `design/mockups/BRIEF.md`.

O que o orquestrador escreveu à mão (não é código do app): `design/scripts/capturar.mjs` e `design/scripts/contraste.mjs` (ferramentas de verificação), as specs, `design/DESIGN.md`, `design/DESIGN-LOG.md`, este arquivo e o relatório de feedback das skills.

| # | Worker | Tarefa | Resultado | O que o orquestrador corrigiu ou mandou refazer |
|---|---|---|---|---|
| 1 | inventário | Ler todas as telas, atalhos, seletores dos e2e e classes de token; escrever `design/INVENTARIO.md` | 77 KB, completo; achou keyframes duplicados no CSS antigo | nada |
| 2 | mockup A | `design/mockups/direcao-a.html` + captura | limpo na primeira | nada |
| 3 | mockup B | `design/mockups/direcao-b.html` + captura | limpo na primeira | nada |
| 4 | mockup C | `design/mockups/direcao-c.html` + captura | limpo; anel de foco amarelo sem contraste (defeito da direção, não do worker) | nada |
| 5 | fundação (treino) | Spec 01: tokens novos, IBM Plex, migração de classes | Verde; achou um defeito no `contraste.mjs` do orquestrador (casava `.dark` com o `@custom-variant`); renomeou variantes para passar num grep da spec | Orquestrador corrigiu o script (1 linha) e aceitou os nomes. **Trabalho descartado na correção de rumo** |
| 6–8 | composições (treino) | `design/mockups/composicao-{1,2,3}.html` | Limpos na primeira | nada |
| 9 | componentes (treino) | Spec 02: componentes, casca, `/design-system` | Verde; avisou que o `capturar.mjs` cortava páginas com rolagem interna e que `?` não abria a ajuda | Orquestrador corrigiu o script. **Descartado na correção de rumo** |
| 10–13 | telas (treino) | Specs 03–06, quatro workers em paralelo com um `next dev` compartilhado | Terminaram; o orquestrador foi interrompido antes de revisar | **Descartado**: o Matheus preferiu o original (código na branch `feat/ds-cartao-resposta-wip`, specs em `design/treino/`) |

## Correção de rumo (decisão do Matheus)

O orquestrador restaurou `src/app`, `src/components`, `src/fonts` e `e2e` da `main` (comando git, sem worker), arquivou a proposta em `design/treino/`, capturou o original (porta 3200) em `design/capturas/antes/` e escreveu `design/scripts/comparar.py` (montagem antes | depois).

| # | Worker | Tarefa | Resultado | O que o orquestrador corrigiu ou mandou refazer |
|---|---|---|---|---|
| 14 | acabamento | `design/specs/07-acabamento-original.md`: contraste AA por token, 375px, estados, limpeza, uma asserção de e2e | lint, typecheck e testes verdes; listou caso a caso onde `bg-accent` virou `bg-accent-solid`; tabela tela × estado; avisou que só comparou parte das capturas com o antes | O orquestrador fez a comparação completa (30 imagens lado a lado) e não achou diferença fora do plano; rodou build e os 32 e2e |
| 15 | preview | `design/specs/08-pagina-design-system-original.md`: `/design-system` do sistema original | Página com 11 seções, claro e escuro, sem overflow | nada |

Erros do próprio orquestrador neste treino: seguir com um sistema novo depois de anotar que o repo já tinha um completo; capturar o app real só depois dos mockups; um `pkill -f "next start"` que matou o próprio shell (duas vezes); um critério de aceite por grep que induziu renomeação de variantes; o defeito do `.dark` no script de contraste.
