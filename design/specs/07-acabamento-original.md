# Spec 07 — Acabamento do design system ORIGINAL (sem mudar a cara)

Contexto: o design system vigente é o **original** (`docs/DESIGN.md`, tokens em `src/app/globals.css`). O Matheus prefere ele: fonte do sistema, `ui-rounded` nos números, enunciado em serifa, cards brancos de raio 20, pílulas, hero em gradiente, sidebar com ícones. **Nada disso muda.** Esta tarefa é só acabamento. Capturas do estado atual em `design/capturas/antes/` (abra `hoje-1440.png`, `ajustes-375.png`, `laboratorio-375.png`, `estudar-marcada-375.png` para ter a referência). Leia `AGENTS.md`, `docs/DESIGN.md` e `design/INVENTARIO.md` (§3 = o que os testes usam).

Proibido: trocar fonte, raio, sombra, formato de botão/chip/card, layout das telas, textos, roles, aria, `data-testid`, atalhos, lógica. Não mexer em `src/lib/dominio`, `src/lib/tutor`, `src/data`, `design/`. Não criar `src/app/design-system` (é outra tarefa, em paralelo). Não fazer commit. Nunca `pkill -f`.

## 1. Contraste AA (só token; a cara fica)
Em `src/app/globals.css`:
- Novo token `--accent-solid: #0071e3` em `:root` **e** em `.dark` (mesmo valor), exposto em `@theme inline` como `--color-accent-solid`. É o azul para **preenchimento que leva texto ou ícone branco por cima** (branco sobre `#0A84FF` dá 3,65:1; sobre `#0071E3` dá 4,70:1). `--accent` (`#0A84FF`) continua sendo o azul de tudo que é só forma: barras de progresso, barras do gráfico, bolinhas, anel de foco, logo, contornos, borda da alternativa marcada.
- `--accent-text` no claro: `#0a84ff` → `#0066cc` (azul como texto: 5,57:1 no branco, 4,87:1 no azul suave). No escuro fica `#5eb0ff`.
- `--success-text` no claro: `#1a7f4f` → `#18794b` (4,85:1 sobre `--success-soft`; antes 4,49). `--danger-text` no claro: `#d2302f` → `#c92a2a` (4,75:1 sobre `--danger-soft`; antes 4,35).
- `--input` (borda de campo de formulário): claro `#e3e8ef` → `#8791a0` (3,19:1); escuro `#2a313c` → `#6b7380` (3,57:1). **`--border` não muda** (cards, alternativas, chips continuam com a linha clara).
- `.hero-azul`: `linear-gradient(135deg, var(--accent-solid), var(--accent-deep))` (o texto pequeno branco do card passa a ter 4,7:1).
- Apague as duplicatas no fim do arquivo (`@keyframes gab-barra`, `.anim-barra` e `.entrada-stagger > .entrada-stagger` aparecem duas vezes).

Nos componentes (`src/components/**`, `src/app/layout.tsx`, `not-found.tsx`):
- Todo `bg-accent` que tem **texto ou ícone por cima** (`text-accent-foreground`, `text-white`): `Button` primário, chips/abas/rádios/presets ativos, `Badge` `solid`, item ativo do menu de temas do Aprender no celular, botão enviar do tutor, link "Pular para o conteúdo" etc. → `bg-accent-solid`. Os `hover:bg-accent-deep` ficam. Onde `bg-accent` é só forma (Progress, barras, bolinhas, polegar de slider, círculo da letra da alternativa marcada **se** a letra por cima for branca → então também `accent-solid`), decida caso a caso e liste no resumo.
- Todo **texto** em `text-accent` (azul cheio usado como cor de letra ou de link) → `text-accent-text`. Ícone decorativo e o logo podem ficar em `text-accent`.
- Campos de formulário (`<input>`, `<select>`, `<textarea>`, inclusive o campo do tutor, o "y =" do Laboratório e o editor de código): a borda tem que vir de `border-input` (hoje vários usam `border-border`). Foco continua borda azul.
- Texto `text-muted-foreground` sobre `bg-accent-soft` dá 4,43:1: onde acontecer (ex.: resumo do tema ativo em Aprender), use `text-foreground` ou `text-accent-text` nesse estado.

## 2. Celular (375px), sem mudar o desenho
- **Ajustes › Habilidades da semana:** hoje o rótulo da competência ("C1 · Números") fica numa coluna e os chips quebram por baixo dele, desalinhados. Abaixo de `sm`: rótulo numa linha própria e os chips embaixo, alinhados à esquerda; a partir de `sm`, como está.
- **Laboratório:** o status "Pyodide não carregado (carrega ao rodar)" quebra torto embaixo do título no celular. Deixe título e status numa linha com `flex-wrap` e `gap`, status alinhado à esquerda quando quebrar.
- **Alvos de toque:** os links da barra superior do celular e os botões só de ícone (`size="icon"`/`"icon-sm"`: Laboratório, modo foco, tema, fechar diálogo, enviar) ganham área mínima de 44px **só em ponteiro grosso** (`pointer-coarse:min-h-11 pointer-coarse:min-w-11`), sem mudar o tamanho no desktop.
- Procure nas capturas do antes (todas as `*-375.png`) qualquer texto cortado, sobreposição ou quebra feia e corrija com o mínimo (`min-w-0`, `flex-wrap`, `truncate`).

## 3. Os seis estados (`docs/DESIGN.md` §5)
Audite cada tela (Hoje, Estudar, fim do sprint, Mapa, Simulado, Caderno, Laboratório, Aprender, Ajustes): carregando, vazio, erro, parcial, sucesso (permissão não se aplica). O inventário §1 lista o que existe. Onde um estado **falta** ou foge do padrão do §5 (esqueleto estático no cinza do fundo; vazio = ícone em quadrado azul suave + por quê + próxima ação; erro = caixa `danger-soft` com `danger-text` e como resolver, `role="alert"`), complete no padrão. Não invente estado que não pode acontecer. Liste no resumo uma tabela tela × estado (ok / completado / não se aplica + motivo).

## 4. Testes
- `e2e/hoje.spec.ts:49` espera o botão "Começar" com `rgb(10, 132, 255)`: passe para `rgb(0, 113, 227)` (o novo `--accent-solid`). Só essa asserção muda; as outras (fundo, 210px, raio 20, pílula, borda da alternativa `rgb(10, 132, 255)`) têm que continuar passando **sem editar**. Se outra asserção de e2e quebrar por causa do item 1, pare e explique no resumo em vez de editar o teste.
- Atualize `design/scripts/contraste.mjs`? **Não**: não mexa em `design/`.

## 5. Verificação (mostre as saídas)
1. `pnpm lint`, `pnpm typecheck`, `pnpm test` verdes. **Não rode `pnpm build`** (o orquestrador roda).
2. O orquestrador deixou um servidor de desenvolvimento em `http://localhost:3100` (não suba outro nem derrube). Rode `node design/scripts/capturar.mjs --base http://localhost:3100 --dir /tmp/gab-07 --prefixo "" --semear`, abra as capturas de 375 e 1440 de hoje, hoje-escuro, estudar-marcada, estudar-confirmada, estudar-escuro, ajustes, laboratorio, caderno, aprender, mapa, simulado, 404 e compare com as de mesmo nome em `design/capturas/antes/`: tem que parecer **a mesma tela**, com o azul dos botões um tom mais fundo e as bordas de campo visíveis. Qualquer outra diferença é erro seu: corrija. O script tem que terminar com "Sem overflow horizontal."
3. Rode os e2e contra o servidor que já está no ar: `pnpm exec playwright test e2e/hoje.spec.ts e2e/estudar.spec.ts e2e/ajustes.spec.ts` (o `playwright.config` reutiliza o servidor da 3100) e mostre o resultado.
4. Resumo: arquivos alterados; a lista caso a caso `bg-accent` → `accent-solid` ou mantido; a tabela de estados; o que corrigiu no celular.
