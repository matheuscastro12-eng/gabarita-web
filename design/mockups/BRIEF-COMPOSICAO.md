# Brief das direções de composição (base-de-design, passo 3)

O design system já está decidido: **direção B "Cartão-resposta"**. Paleta, fontes, raios e a bolha **não mudam**: copie o `:root`, os `@font-face` e os estilos de base (bolha, botão, etiqueta, kbd, barra, barra lateral) de `design/mockups/direcao-b.html`. Aqui só muda a **composição**: layout, densidade, hierarquia e ritmo. Três arquivos estáticos autossuficientes, `design/mockups/composicao-{1,2,3}.html`, mesmas regras técnicas e o **mesmo conteúdo** de `design/mockups/BRIEF.md` (seções "Estrutura", "Conteúdo" e "Regras de todas as direções"), com estas diferenças de estrutura:

- Faixa de identificação curta (nome da composição + 1 frase).
- Tela 1 Hoje em 1440×900 · Tela 2 IDE em 1440×900 · **Tela 3 Hoje no celular** e **Tela 4 IDE no celular**, lado a lado, cada uma numa moldura de 375×812 (no celular não há barra lateral: barra superior de 48px com a marca e os destinos em linha rolável; na IDE, abas "Questão | Tutor" com sublinhado de 2px na ativa e o rodapé "Pular / Confirmar" fixo embaixo).
- Sem a faixa de estados.

## Composição 1 — "Folha"
A do mockup `direcao-b.html`, sem mudar: cabeçalho com h1 e "Começar" à direita; faixa única com os quatro números separados por linhas verticais; duas colunas 62/38 (fila do sprint numerada + questões por dia | plano de hoje + domínio). IDE: questão direto no papel, alternativas como linhas de cartão-resposta separadas por linha de 1px; tutor à direita com linha vertical. Celular: números em grade 2×2 com linhas; depois sprint, plano, questões por dia, domínio empilhados.

## Composição 2 — "Uma coisa por vez"
Para TDAH: a primeira dobra tem **uma** coisa para fazer.
- Hoje: h1 pequeno (18px, texto suave) e, logo abaixo, o bloco do sprint como protagonista, ocupando a largura da coluna principal (máx. 760px, alinhado à esquerda): título 28px/600 "Sprint de 5 questões", a frase "Próximas…", a fila como **uma fileira horizontal de 5 bolhas grandes (40px) numeradas ligadas por uma linha**, com o código (H20…) em mono e o nome da habilidade embaixo de cada bolha, e o botão "Começar" grande (44px de altura) com `kbd`. Os quatro números viram **uma linha de texto** embaixo do botão, separados por "·" (ex.: "362 dias até a prova · 5 resolvidas hoje · nota estimada 391 (262–520) · 0 revisões vencidas"), 14px, números em mono 500. À direita (coluna de 360px, separada por linha vertical): "Plano de hoje". Abaixo de uma linha horizontal, em duas colunas: "Questões por dia" e "Domínio por habilidade", com menos peso (títulos 14px/600).
- IDE: barra do sprint igual; a questão numa coluna de leitura centralizada no painel esquerdo (máx. 680px); alternativas como **caixas separadas** (borda 1px, raio 8, 48px de altura mínima, 8px entre elas, bolha à esquerda); marcada = borda de 1,5px azul-caneta + fundo azul suave + bolha cheia. Tutor mais estreito (≈36%), com o campo de mensagem fixo embaixo e a escada de dicas logo acima dele.
- Celular: sprint primeiro (bolhas de 32px em linha, só o código embaixo), "Começar" de largura total; a linha de números quebra em duas; plano; o resto abaixo.

## Composição 3 — "Painel"
Densa, tudo à vista sem rolar.
- Hoje: cabeçalho com h1 e "Começar" à direita. Grade de três colunas iguais separadas por linhas verticais, altura cheia: (1) "Sprint de 5 questões" com a fila numerada; (2) os quatro números numa grade 2×2 com linhas + "Questões por dia" embaixo; (3) "Plano de hoje" + "Domínio por habilidade".
- IDE: questão à esquerda com o enunciado e a figura; as alternativas numa **faixa compacta** (linhas de 40px, bolha de 24px); tutor à direita (≈45%) com o aviso, as mensagens e, numa barra de ferramentas de uma linha só no rodapé do painel, sugestões + escada + campo.
- Celular: tudo empilhado em seções compactas com linhas; números em uma linha rolável.
