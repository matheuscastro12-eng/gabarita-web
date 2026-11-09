# Regras comuns do redesign das telas (leia antes de qualquer spec 03–06)

Sistema: **Cartão-resposta** (`design/DESIGN.md`). Composição escolhida: **2 "Uma coisa por vez"** (`design/mockups/composicao-2.png` e `.html`: abra a imagem). Tokens em `src/app/globals.css`; componentes em `src/components/ui` (use `Bolha`, `Button`, `Badge`, `Input`/`Textarea`/`Select`/`Label`, `Card`, `Tabs`, `Progress`, `Kbd`, `Esqueleto`, `Dialog`). Next 16: leia `AGENTS.md` antes de usar API do Next.

## Não pode
- Mexer em `src/lib/dominio`, `src/lib/tutor`, `src/data`, `e2e/`, `src/components/ui/*`, `src/components/app/*`, `src/app/globals.css` (se faltar algo neles, **não edite**: descreva no resumo final). Editar arquivos fora da lista da sua spec (outros workers estão editando as outras telas ao mesmo tempo).
- Remover ou mudar qualquer função, atalho, texto visível, `role`, `aria-*`, `title`, `id`, `data-testid`, `data-*`, ordem de foco ou lógica de estado. `design/INVENTARIO.md` lista tudo da sua tela (§1) e o que os testes e2e usam (§3): confira antes e depois. **É redesign visual: muda `className` e a estrutura de marcação em volta; os hooks, handlers e condições ficam.**
- Hex, `rgb()`, `text-white`, `bg-black` ou cor arbitrária no TSX (só classes de token). `rounded-full` em botão, chip ou etiqueta (só bolha, bolinha, polegar de interruptor, spinner). Sombra em bloco de página. Card dentro de card. Peso 700+. Caixa alta com tracking. Itálico de ênfase. Exclamação. Emoji. `transition-all`, `hover:scale`, animação em loop (fora spinner real). Tamanho de texto abaixo de 11px. Valores quebrados fora da grade de 4px (`py-[11px]`, `text-[12.5px]`, `gap-[7px]`…).

## Como é o sistema
- **Papel branco e linha:** blocos de página se separam por `border-t border-border` + espaço (`py-6`), não por `Card`. Use `Card` (borda 1px, `rounded-lg`) só quando o bloco é um objeto solto (entrada do caderno, questão gêmea, bloco de código). Títulos de seção: `<h2 className="text-base font-semibold">`; texto de apoio `text-sm text-muted-foreground`.
- **Tinta azul só onde se marca:** `bg-primary` no botão principal da tela (um só por tela), na bolha marcada, no item/aba ativos (barra de 2px) e no progresso. Links em `text-primaria-texto`. Seleção em lista: `bg-accent` (suave) + borda `border-primary`.
- **Bolha** (`@/components/ui/bolha`): alternativas, opções de teste, progresso do sprint, fila numerada, item feito de checklist, degraus da dica. Em nenhum outro lugar.
- **Dado em mono:** classe `.num` em códigos (H20, Q148), tempos, notas, domínio (0,22), contadores.
- **Chips de filtro/escolha** (rádio, alternância): `h-8 px-3 rounded-md border border-input text-sm font-medium`; ativo = `border-primary bg-accent text-primaria-texto` (não azul cheio). Em ponteiro grosso, `pointer-coarse:min-h-11`.
- **Estados** (tabela em `design/DESIGN.md`): carregando = `Esqueleto` no lugar exato; vazio = ícone 20px num quadrado `size-10 rounded-md bg-muted` + por quê + um botão; erro = `rounded-md bg-erro-suave text-erro p-3 text-sm` com `role="alert"`; parcial/aviso = `bg-aviso-suave text-aviso`; sucesso = `text-sucesso`.
- **Tipo:** h1 vem do `ConteudoPagina`. Corpo de interface `text-sm`; enunciado `.qtext`. Legenda `text-xs`. Pesos 400/500/600.
- **Espaço:** página já tem padding. Entre seções 24–32px; dentro de grupo 8–12px. Linhas de lista com a mesma altura. Ícones Lucide 16px, traço 1.5, na cor do texto ao lado.
- **Responsivo:** celular primeiro (375px): uma coluna, nada com largura fixa maior que a tela, tabelas e linhas longas quebram (`min-w-0`, `truncate` ou `flex-wrap`), alvos de toque ≥ 44px (`pointer-coarse:min-h-11`). Desktop até 1440px: use a largura (duas colunas com `lg:grid-cols-…`), sem coluna estreita centralizada com faixa vazia do lado, exceto texto de leitura (máx. 720px).
- **Escuro:** os tokens resolvem; não use `dark:` salvo necessidade real. Confira no escuro.
- **Movimento:** mantenha as classes `.anim-*` e `.entrada-stagger` onde já estão; transições só `transition-colors` ou `transition-[transform,opacity]`.

## Verificação obrigatória (ponha as saídas no resumo)
1. `pnpm lint` e `pnpm typecheck` verdes (rode só esses dois; **não** rode `pnpm build` nem `pnpm test`: outros workers estão no mesmo diretório e o orquestrador roda o build depois).
2. Veja a tela de verdade: o orquestrador já deixou **um** servidor de desenvolvimento rodando em `http://localhost:3100` (compartilhado com os outros workers; **não suba outro, não derrube este, não rode `next build`**). Rode `node design/scripts/capturar.mjs --base http://localhost:3100 --dir /tmp/gab-<número da sua spec> --prefixo t --semear --so <telas>`; **abra cada PNG** (375 e 1440) e corrija overflow horizontal (o script avisa), texto cortado, sobreposição, desalinhamento, contraste ruim, área vazia sem motivo. Até 3 rodadas. Se uma tela der erro de compilação num arquivo que não é seu, espere 30 s e tente de novo (outro worker está no meio de uma edição).
3. `grep -nE "#[0-9a-fA-F]{6}|rgba?\(|text-white|bg-black|font-bold|font-extrabold|uppercase|transition-all|hover:scale|italic" <seus arquivos>` vazio (ou justifique cada linha).
4. Resumo: arquivos alterados; o que viu e corrigiu nas capturas; qualquer coisa do inventário que você **não** conseguiu manter (deve ser nada); o que faltou nos componentes base.
