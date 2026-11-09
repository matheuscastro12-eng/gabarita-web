# Brief dos mockups de direção (iniciar-design-system, passo 2)

Três direções para o design system novo do Gabarita, cada uma num HTML estático **autossuficiente** (`design/mockups/direcao-{a,b,c}.html`): CSS num `<style>` no próprio arquivo, sem JavaScript obrigatório, sem CDN, sem imagem externa, sem emoji. Ícones em SVG inline no estilo Lucide (traço 1,5–1,8, `currentColor`). Fontes só locais, por `@font-face` com URL relativa para `design/mockups/fonts/` (copie os `.ttf` de `/usr/share/fonts/truetype/sand-box/google/<Família>/`; não use fonte de rede). Textos em pt-BR. Todas as cores em variáveis CSS no `:root` do arquivo (nenhum hex solto fora do `:root`).

## Estrutura igual nos três arquivos (para comparar lado a lado)

Página de 1440px de largura (`body { width: 1440px; margin: 0 }`), com estes blocos empilhados:

1. **Faixa de identificação** (altura ~120px): nome da direção, frase de tom, e uma linha de amostras: fundo, superfície, muted, linha, texto, texto suave, destaque, destaque suave, sucesso, aviso, erro (quadradinhos de 28px com o hex embaixo em 11px), e o nome da fonte com "Aa 0123456789 ½ x² ≤".
2. **Tela 1: Hoje** — moldura de exatamente 1440×900 (`overflow: hidden`), com a barra lateral e o conteúdo abaixo.
3. **Tela 2: IDE de estudo** — moldura de exatamente 1440×900, com a barra lateral, a barra do sprint, questão à esquerda (≈58%) e tutor à direita (≈42%), alternativa **B marcada** (ainda não confirmada).
4. **Faixa de estados** (altura livre): lado a lado, (a) a mesma lista de alternativas depois de confirmar, com **B errada** e **E certa** e a frase "Não foi dessa vez. O gabarito é E"; (b) botões: primário, secundário, contorno, desabilitado, com um `kbd`; (c) etiquetas: neutra, destaque, sucesso, aviso, erro; (d) um campo de texto com rótulo e foco visível; (e) uma barra de progresso em 22%.

Acima de cada tela, um rótulo pequeno ("Tela 1 — Hoje (dados de exemplo)").

## Conteúdo (o mesmo nas três; é o conteúdo real do app, marcado como exemplo)

**Barra lateral:** marca "Gabarita" com um capelo em traço; itens Hoje, Estudar, Aprender, Mapa, Caderno, Laboratório, Ajustes (com ícone); no fim, "Modo escuro". Na Tela 1 o ativo é Hoje; na Tela 2, Estudar.

**Hoje:**
- Título (h1): "Boa noite, Matheus"
- Quatro números: "Dias até a prova" 362 (detalhe "prova em 07/11/2027") · "Resolvidas hoje" 5 (detalhe "1 acerto · 1 sprint") · "Nota estimada" 391 (detalhe "262–520 · estimativa") · "Revisões vencidas" 0 (detalhe "retenção prevista acima de 90%")
- "Sprint de 5 questões": texto "Próximas: 5 questões oficiais em 4 habilidades, fáceis primeiro. Uns 12 minutos, com as suas revisões no meio." Fila: H20 Gráfico cartesiano · H7 Planificações e sólidos · H26 Gráficos e argumentação · H6 Visão espacial · H6 Visão espacial (todas "fácil"). Botão principal "Começar" com `kbd` Enter. Ao lado: "Hoje: 1 sprint, 1/5 acertos"
- "Plano de hoje": feito "1 sprint feito hoje"; feito "Revisões em dia"; pendente "Refazer 4 erros abertos do caderno" (leva ao Caderno); pendente "Simulado de 15 fáceis inéditos" (leva ao Simulado)
- "Questões por dia": 7 dias (T Q Q S S D S), valores 0 0 0 0 0 0 5; legenda "meta 5/dia (um sprint)"
- "Domínio por habilidade": "As que mais precisam de atenção (de 0 a 1)": H20 0,22 · H7 0,22 · H26 0,22 · H6 0,22 · H1 0,51; link "Ver o mapa completo"
- Rodapé: "636 questões oficiais do INEP (transcrição enem.dev) · nota TRI sempre estimada · explicações do tutor podem conter erros · seu progresso fica salvo neste navegador"

**IDE:**
- Barra do sprint: "Sprint", progresso de 5 questões (1ª em andamento), "1/5", "Gráfico cartesiano · H20", cronômetro "00:41", botão-ícone Laboratório, botão-ícone modo foco
- Questão: etiquetas "ENEM 2012 · Q148", "fácil · b −1,26", "H20"; botão pequeno "Ver visualmente"; uma figura (SVG inline simples: gráfico de linha "vendas (R$)" por mês, Jan–Dez, 12 pontos ligados, com tracejado vertical de cada ponto até o eixo; pico em Jun, mínimo em Ago); enunciado: "De acordo com o gráfico, os meses em que ocorreram, respectivamente, a maior e a menor venda absolutas em 2011 foram"; alternativas A "Março e abril." B "Março e agosto." C "Agosto e setembro." D "Junho e setembro." E "Junho e agosto."; fonte "ENEM 2012, INEP"
- Rodapé da questão: "Pular" e "Confirmar" (com `kbd` Enter); linha de domínio: "domínio H20" barra 22% "0,22" "domínio efetivo 0,16 (meta 0,85)"
- Tutor: título "Tutor" + etiqueta de aviso "modo guiado"; aviso "Tutor de IA desligado: falta a chave ANTHROPIC_API_KEY. Usando dicas verificadas."; mensagem do tutor com rótulo "Degrau 0 · pergunta": "Antes de calcular: o que a questão está pedindo, com as suas palavras?"; uma mensagem do aluno: "o mês que mais vendeu e o que menos vendeu"; sugestões "Dica", "Gráfico", "Laboratório"; escada de dicas "Dica" com 4 degraus (nenhum usado); "Resposta direta" (`kbd` ⌥R); "Próximo degrau" (`kbd` H); campo "peça dica, resolução ou conta…" com botão enviar

## Regras de todas as direções
- Um destaque só. Vermelho só em erro. Sem bege/creme, sem roxo, sem gradiente de matiz, sem brilho, sem vidro, sem blob.
- Texto ≥ 4,5:1; borda de campo e UI ≥ 3:1. Os hex abaixo já foram conferidos; não invente outros.
- Sem `text-transform: uppercase` com tracking largo. Sem exclamação. Pesos como indicado na direção.
- Nada pode vazar da moldura de 1440×900 nem se sobrepor. Alinhe ícones e rótulos numa coluna; números com `font-variant-numeric: tabular-nums`.
- Estados de foco visíveis (anel de 2px na cor de destaque).

---

## Direção A — "Original evoluído"
**Tom:** claro e macio, estilo iOS: cards brancos que flutuam num fundo cinza-azulado, azul de sistema.
É o design system atual (`docs/DESIGN.md`) com os defeitos medidos corrigidos. Veja o atual em `src/app/globals.css` e reproduza a linguagem dele.
- Fundo `#F5F7FA` · superfície `#FFFFFF` · muted/hover `#EEF2F7` · linha `#E3E8EF` (1,5px) · borda de campo `#8A93A0`
- Texto `#1D1D1F` · texto suave `#6E6E73`
- Destaque `#0066CC` (o azul `#0A84FF` do original escurecido: branco sobre ele dá 5,57:1; o original dava 3,65:1) · hover `#0058B3` · suave `#E5F1FF`
- Sucesso `#1A7F4F` / suave `#E7F6EE` · aviso `#9A5B00` / suave `#FCF2DF` · erro `#D2302F` / suave `#FDEBEC`
- Fonte: **Inter** (variável, `Inter/Inter-VariableFont_opsz,wght.ttf`) na interface e nos números; **enunciado e alternativas em serifa** (`Source Serif Pro` de `/usr/share/fonts/truetype/sand-box/custom/` se existir, senão Georgia), como no original. Títulos 700 (o original usava 800), corpo 400/500.
- Forma: cards raio 20px com sombra dupla suave (`0 1px 3px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.04)`), sem borda; botões e chips em pílula; alternativas raio 14 com borda 1,5px e a letra num círculo de 29px; barras de 11px em pílula.
- Hoje: primeiro card de número em azul chapado (sem gradiente) com texto branco; os outros três brancos. Depois "Sprint" + "Plano de hoje" lado a lado, e "Questões por dia" + "Domínio" lado a lado. Barra lateral branca de 210px, item ativo em azul suave.
- IDE: card da questão flutuando no fundo cinza; painel do tutor branco; balões do tutor no cinza do fundo, do aluno em azul suave.

## Direção B — "Cartão-resposta"
**Tom:** exato e calmo, com cara de folha de prova: papel branco, linha fina, e a tinta azul da caneta só onde você marca.
**Ideia:** o nome do app vem de "gabarito". A assinatura é a **bolha do cartão-resposta**: um círculo com a letra dentro, vazio enquanto não marcado e **preenchido de tinta** quando marcado. A mesma bolha conta o progresso do sprint (5 bolhas), marca o item feito do plano e a questão da fila.
- Fundo `#FFFFFF` · superfície `#FFFFFF` · muted `#F4F4F5` · muted forte `#E4E4E7` · linha `#E4E4E7` (1px) · borda de campo `#8A8A93`
- Texto `#18181B` · texto 2 `#3F3F46` · texto suave `#63636B`
- Destaque "azul-caneta" `#1A56DB` (branco sobre ele 6,18:1) · hover `#1648B8` · suave `#EEF4FF`
- Sucesso `#15803D` / suave `#DCFCE7` · aviso `#B45309` / suave `#FEF3C7` · erro `#BE123C` / suave `#FFE4E6`
- Fontes: **IBM Plex Sans** (variável, `IBM Plex Sans/IBMPlexSans-VariableFont_wdth,wght.ttf`), pesos 400/500/600, na interface, no enunciado e nas alternativas (sem serifa em nenhum lugar); **IBM Plex Mono** (`IBM Plex Mono/`, 400 e 500) só para dado: cronômetro, códigos (H20, Q148), `kbd`, valores de domínio e os números grandes.
- Forma: **sem sombra e sem card flutuante**. Blocos separados por linha de 1px e por espaço; onde precisa de caixa, borda de 1px e raio 10px. Controles raio 8px. Etiquetas raio 6px. **Nada em pílula**, exceto as bolhas (círculos) e as barras de progresso (6px de altura, raio 3px). Espaço em múltiplos de 4.
- Barra lateral de 232px, fundo branco com linha à direita; linhas de 36px; item ativo com fundo muted, texto em 600 e uma barrinha de 2px de tinta azul à esquerda (não fundo azul).
- Hoje (composição de "folha"): cabeçalho com o h1 (24px/600) e, à direita, o botão "Começar". Logo abaixo, uma **faixa única** com os quatro números separados por linhas verticais (rótulo 13px suave, número 32px Plex Mono 500, detalhe 12px), sem caixas individuais. Depois, duas colunas (≈62/38): à esquerda "Sprint de 5 questões" com a fila como **lista numerada de 5 linhas** (bolha com o número, código H20 em mono, nome da habilidade, "fácil" como texto suave à direita) e, abaixo, "Questões por dia" (barras finas, a de hoje em tinta azul, as outras em cinza, linha tracejada da meta 5); à direita "Plano de hoje" (linhas com bolha: feita = bolha preenchida com check, pendente = bolha vazia + seta) e "Domínio por habilidade" (linhas com código em mono, barra de 6px, valor em mono alinhado à direita).
- IDE: barra do sprint de 48px com linha embaixo; progresso = 5 bolhas pequenas (12px), a atual com meio preenchimento; cronômetro em mono. Questão direto no papel branco (sem card), coluna de leitura com no máximo 720px, enunciado 17px/1,6. Alternativas como **linhas de cartão-resposta**: bolha de 28px com a letra (borda 1,5px `#8A8A93`), texto ao lado, linha de 1px entre elas; marcada = bolha preenchida de azul-caneta com a letra branca e a linha com fundo azul suave; certa = bolha verde com check; errada = bolha com X em erro e fundo erro suave. Tutor: painel à direita separado por linha vertical, fundo branco (muted `#F4F4F5` só nos balões do tutor); balão do aluno em azul suave; rótulo do degrau em mono 12px; escada de dicas = 4 bolhas pequenas.

## Direção C — "Marca-texto"
**Tom:** direto, de mesa de estudo: preto no branco, com grifo amarelo só no que importa agora.
- Fundo `#FFFFFF` · superfície `#FFFFFF` · muted `#F3F4F6` · linha `#E5E7EB` · borda de campo `#868B94`
- Texto / tinta `#111827` · texto suave `#5B6472`
- Botão primário em **tinta** `#111827` com texto branco (17,7:1). Destaque único: **amarelo marca-texto `#FFD60A`**, usado só como preenchimento com texto `#111827` por cima (12,6:1): grifo atrás do número principal de cada stat, alternativa marcada, item ativo do menu, barra de progresso e a barra do dia de hoje. Nunca como cor de texto. Suave `#FFF4B8` (só em hover da alternativa).
- Sucesso `#15803D` / suave `#DCFCE7` · aviso `#9A3412` / suave `#FFEDD5` · erro `#BE123C` / suave `#FFE4E6`
- Fonte: **Atkinson Hyperlegible** (`Atkinson Hyperlegible/`, Regular 400 e Bold 700), feita para leitura fácil; na interface, no enunciado e nas alternativas. Números com `tabular-nums`. Sem serifa.
- Forma: cards com borda de 1px `#E5E7EB`, raio 12px, sem sombra; botões raio 10px; alternativas raio 12 com a letra num quadrado arredondado de 28px (raio 8); marcada = fundo amarelo cheio com texto preto; barras de 8px.
- Barra lateral de 220px no cinza `#F3F4F6`, item ativo com grifo amarelo atrás do rótulo.
- Hoje: h1 grande (32px/700) com "Começar" (botão preto) logo abaixo dentro do bloco do sprint, que ocupa a largura toda no topo; os quatro números em linha abaixo, cada número com um grifo amarelo atrás; depois Plano, Questões por dia e Domínio em três colunas.
- IDE: questão num card com borda; tutor em painel no cinza `#F3F4F6` com balões brancos.
