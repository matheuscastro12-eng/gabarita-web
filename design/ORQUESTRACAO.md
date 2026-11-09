# Orquestração do treino (2026-11-09)

Orquestrador: Fable (decide, escreve as specs, revisa diffs e capturas). Workers: Opus com esforço low, chamados por `claude -p --model opus --effort low`, um por tarefa fechada. Specs em `design/specs/` e `design/mockups/BRIEF.md`.

O que o orquestrador escreveu à mão (não é código do app): `design/scripts/capturar.mjs` e `design/scripts/contraste.mjs` (ferramentas de verificação), as specs, `design/DESIGN.md`, `design/DESIGN-LOG.md`, este arquivo e o relatório de feedback das skills.

| # | Worker | Tarefa | Resultado | O que o orquestrador corrigiu ou mandou refazer |
|---|---|---|---|---|
| 1 | inventário | Ler todas as telas, atalhos, seletores dos e2e e classes de token; escrever `design/INVENTARIO.md` | 77 KB, completo; achou keyframes duplicados no CSS antigo | nada |
| 2 | mockup A | `design/mockups/direcao-a.html` + captura | limpo na primeira | nada |
| 3 | mockup B | `design/mockups/direcao-b.html` + captura | limpo na primeira | nada |
| 4 | mockup C | `design/mockups/direcao-c.html` + captura | limpo; anel de foco amarelo sem contraste (defeito da direção, não do worker) | nada |
