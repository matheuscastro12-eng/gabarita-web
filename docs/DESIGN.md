# Design do Gabarita

**Origem:** este é o design system original do "Gabarita ENEM", feito pelo próprio Matheus (projeto Vercel `gabarita`, deploy `gabarita-2131tgc4s`, 25/08/2026). A fonte está em `/workspace/gabarita/design-system-original/` (`DESIGN-SYSTEM.md`, `original-2131tgc4s.css`, `2131tgc4s.html`) e as capturas em `/workspace/gabarita/screens/original/`. Em 09/11/2026 ele foi reaplicado no gabarita-web no lugar do grafite com âmbar da v1 (que o Matheus achou feio). Este arquivo é a referência dos tokens e das regras visuais; o design system do repo manda sobre qualquer referência externa.

## 0. Direção
1. **Propósito:** ferramenta de uso diário para resolver questões do ENEM com um tutor ao lado e ver o domínio subir.
2. **Público:** uma pessoa (Matheus, TDAH), várias sessões curtas por dia. Precisa ver primeiro: "Começar" e onde está no sprint.
3. **Tom:** claro e limpo, no estilo Apple/iOS. Cards brancos arredondados flutuam sobre um fundo cinza-azulado, com azul de sistema como destaque, sombra suave e títulos grandes em peso 800. Números em fonte arredondada; enunciado em serifa, com cara de prova impressa.
4. **Detalhe memorável:** o hero em gradiente azul no Hoje e as alternativas em cartões com a letra num círculo, sobre o enunciado serifado.
5. **Restrições:** Next.js + Tailwind v4 + Radix; `prefers-reduced-motion`; sem CDN (fontes do sistema, Inter vendorizada só como reserva); pt-BR; nada piscando; todos os atalhos e o layout questão | tutor mantidos.

## 1. Paleta (tokens exatos do original)
| Token | Claro (padrão) | Escuro (opcional) | Uso |
|---|---|---|---|
| `--background` | `#F5F7FA` (`--bg`) | `#0F1217` | fundo da página, trilho das barras, tags neutras |
| `--surface` | `#FFFFFF` (`--card`) | `#181C23` | cards, sidebar, painel do tutor |
| `--surface-2` | `#EEF2F7` | `#222833` | hover sobre o card |
| `--foreground` | `#1D1D1F` (`--ink`) | `#F2F2F7` | texto |
| `--muted-foreground` | `#6E6E73` (`--muted`) | `#9A9FA8` | texto secundário, ícones do menu |
| `--border` | `#E3E8EF` (`--line`), sempre **1,5px** | `#2A313C` | bordas de alternativas, chips, inputs |
| `--accent` | `#0A84FF` (`--blue`) | `#0A84FF` | botão primário, chip ativo, marca, foco |
| `--accent-soft` | `#E5F1FF` (`--blue-soft`) | `#15304F` | item ativo do menu, tag de habilidade, balão do aluno |
| `--accent-deep` | `#0058CC` | `#0058CC` | fim do gradiente do hero, hover do primário |
| `--success` / `-soft` / `-tint` | `#30A46C` / `#E7F6EE` / `#F0FAF5` | `#30A46C` / `#143524` / `#12271B` | alternativa certa, acerto |
| `--danger` / `-soft` / `-tint` | `#E5484D` / `#FDEBEC` / `#FDF3F3` | `#E5484D` / `#3A1F21` / `#2C1A1B` | alternativa errada, erro |
| `--warning` / `-soft` | `#E8960C` / `#FCF2DF` | `#E8960C` / `#3A2C12` | aviso (tutor desligado, cronômetro no fim, "reta final") |
| `--marca-texto` | `#FFE9A8` | `#5A4A1A` | `<mark>` |
| hero | `linear-gradient(135deg, #0A84FF, #0058CC)`, texto branco | igual | primeiro stat card do Hoje e do fim do sprint |
| sombra do card | `0 1px 3px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.04)` | sombra preta + linha `--border` | todos os cards |

**Texto de estado em AA.** O azul `#0A84FF` em texto pequeno dá 3,6:1 sobre branco, igual ao original; ele fica nos preenchimentos, na marca, no menu ativo e nas tags (12px/700). Para texto corrido de estado existem as variantes `--success-text #1A7F4F`, `--danger-text #D2302F`, `--warning-text #9A5B00` (≥ 4,5:1 sobre branco), usadas em "Acertou.", "Não foi dessa vez", "Reta final" e nos badges. O âmbar nunca é destaque: só estado de aviso.

**Escuro** é o mesmo sistema (azul de sistema, cards elevados com linha, mesmos raios e fontes), não o grafite com âmbar antigo. Padrão é claro; o escuro fica nos Ajustes e no fim da barra lateral.

## 2. Tipografia
- **Interface:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, var(--font-inter), sans-serif` (SF no Mac, Segoe no Windows, Roboto no Android/Linux; Inter vendorizada é só a reserva, sem CDN).
- **Marca e números** (`.num`, `font-rounded`): `ui-rounded, -apple-system, …` com `tabular-nums`. Stat 40px/800 (30px no celular), marca 20px/800.
- **Enunciado e alternativas** (`.qtext`, `font-serif`): `"New York", "Times New Roman", Georgia, serif`, 16,5px, altura de linha 1,62; alternativas 15px. KaTeX usa as próprias fontes (1,06em dentro do enunciado).
- **Cronômetro:** `ui-monospace` numa tag (`CaixaTempo`).
- Escala: 12 / 14 / 16 / 19 / 24 / 28 / 40. H1 28px/800 com `letter-spacing -0,4px` (22px no celular); H2 19px/700; rótulo "MENU" 10px/700 em caixa alta com `letter-spacing 1px`; texto pequeno 12px; rodapé 11,5px. Corpo 16px.

## 3. Forma e espaçamento
- Cards: raio **20px**, padding 20px, gap de grid 14px, sem borda no claro (sombra dupla), linha no escuro.
- Alternativa: raio 14px, borda 1,5px, padding 12px 13px, letra em círculo de 29px (fonte do sistema, 13px/800). Marcada = borda e círculo azuis; certa = verde com `--success-tint`; errada = vermelha com `--danger-tint`.
- Botão primário: pílula azul, 14px/700, padding 11px 24px; `secondary` é pílula no cinza do fundo; `outline` é o chip (borda 1,5px, branco; hover azul). `Kbd` dentro do primário é branco translúcido.
- Chips (filtros, presets, abas no celular, tema): pílula, borda 1,5px, 13px/600; ativo = fundo azul, texto branco.
- Tags (`Badge`): fundo `--background`, texto muted, raio 8px, padding 3px 9px, 12px/700; `accent` azul suave; `success`/`warning`/`danger` suaves.
- Barras (`Progress`): **11px**, pílula, trilho no cinza do fundo, preenchimento azul.
- Inputs, select e textarea: raio 12px, borda 1,5px, fundo branco; foco = borda azul.
- Células do mapa de calor: 38px de altura, raio 8px, fonte arredondada; cinza = sem dados, vermelho/âmbar/verde suaves por nível, verde cheio no máximo; contorno azul = habilidade da semana.
- Main: padding 26px 28px, largura máxima 1400px, centralizado (preenche telas largas; antes 1060px à esquerda deixava faixa vazia). Celular: 16px 12px.
- Movimento: só `transform`, `opacity` e cores, 180–240ms, `cubic-bezier(.2,0,0,1)`; 0ms com `prefers-reduced-motion`. Detalhes na §7. Foco visível: anel de 2px azul.

## 4. Layout e componentes
- **Sidebar** (≥ 768px): 210px, branca, padding 28px 12px; marca (capelo azul em traço + "Gabarita"); rótulo MENU; itens com ícone Lucide 18px/1,8 em traço, 14px/500 muted, raio 10px; ativo = `--accent-soft` + azul + 600. Alternar tema no fim, como item de menu.
- **Celular** (< 768px): barra superior branca com sombra, marca compacta e os destinos em linha rolável (texto só), como no original; o tema vira um ícone no fim.
- **Hoje** (estilo Dashboard): linha de 4 stat cards (hero azul "Dias até a prova", "Resolvidas hoje", "Nota estimada", "Revisões vencidas"); card "Sprint de 5 questões" com a fila em chips e "Começar" em pílula; "Plano de hoje" com checklist (feito riscado em verde, pendente com seta) e a linha "Reta final" em âmbar; "Questões por dia" (7 barras azuis) e "Domínio por habilidade" com barras de 11px.
- **IDE** (estilo Resolver): barra do sprint branca (marca, ●●◐○○, habilidade, cronômetro em tag, Laboratório, modo foco); à esquerda, o card da questão sobre o fundo cinza (tags ENEM ano · Qn · dificuldade · Hn, enunciado serifado, alternativas, fonte) e o rodapé com "Pular" e "Confirmar" em pílula à direita; à direita, o painel do tutor branco (balões do tutor no cinza do fundo, do aluno em azul suave, chips de sugestão em pílula, escada de dicas em azul, campo com raio 14). Painéis redimensionáveis; abas em chips no celular.
- **Fim do sprint:** três stat cards (hero com os acertos), lista com círculos verde/vermelho, delta de domínio com barras.
- **Mapa, Caderno, Laboratório, Ajustes, Simulado, 404, diálogos, paleta, toasts:** mesma linguagem (cards brancos de raio 20, chips, tags, pílulas, inputs de raio 12). Diálogos e gaveta do Laboratório são cards flutuantes com sombra maior; overlay `rgba(29,29,31,.35)`.
- **Rodapé** em toda tela rolável: "636 questões oficiais do INEP (transcrição enem.dev) · nota TRI sempre estimada · explicações do tutor podem conter erros · seu progresso fica salvo neste navegador".
- **Mafs:** fundo branco, grade na cor da linha, curvas em azul/verde/âmbar/rosa, rótulos dos eixos com passo "bonito". **Realce de código:** palavras-chave em `--accent-deep`, strings em verde, números em vermelho, comentários muted.
- Ícone do app e manifest: capelo branco sobre azul `#0A84FF`, fundo `#F5F7FA`.

## 5. Estados obrigatórios
| Estado | O que mostrar |
|---|---|
| Loading | esqueleto estático no cinza do fundo, dentro do card branco |
| Empty | card branco com ícone em quadrado azul suave, por que está vazio + próxima ação |
| Error | caixa `--danger-soft` com texto `--danger-text` e como resolver |
| Partial | o que carregou + aviso (ex.: "sem parâmetro TRI", tutor em modo guiado em `--warning-soft`) |
| Success | confirmação curta (verde) + próximo passo |
| Permission | não se aplica na v1 (sem login) |

## 6. Revisão do redesign (09/11/2026)
Screenshots de todas as telas a partir de `pnpm build && pnpm start`, 1440×900 e 390×844, claro e escuro, comparadas lado a lado com `/workspace/gabarita/screens/original/`; finais em `/workspace/gabarita/screens/redesign/`.

**unslop: polimento.** Auditoria: nenhum degradê roxo, brilho, emoji, blob, `transition-all` ou animação em loop (só o `Loader2` em estados vivos, com `motion-reduce`). Corrigido: exclamação na linha "Reta final" e `hover:scale` nas células do mapa. Mantido de propósito, porque é o sistema original pedido pelo Matheus: títulos em 800, rótulo "MENU" em caixa alta com tracking, botões e chips em pílula, hero em gradiente azul e a saudação "Bom dia, Matheus." (o e2e depende dela).

Nota 0–10 (1 exemplo e 1 correção em cada):
- **Cor 9** — tokens exatos; um acento. Correção: variantes `-text` para texto de estado em AA.
- **Tipografia 9** — sistema / arredondada / serifa como no original. Correção: `Kbd` em 11px mono sem destoar da pílula.
- **Espaçamento 8** — cards 20px, grid 14px, main 26/28. Correção: detalhe do stat card com `line-clamp-2` no celular.
- **Consistência 9** — os mesmos cards, tags, chips e pílulas em todas as telas, inclusive diálogos e gaveta. Correção: cronômetro do simulado virou `CaixaTempo` dentro da linha de tags.
- **Responsivo 8** — barra superior rolável, stat cards 2×2, abas em chips. Correção: texto da sprint bar só com a marca no celular.
- **Acessibilidade 8** — foco azul visível, `aria-*` mantidos, estado em AA; o azul em texto pequeno (3,6:1) é herdado do original e documentado.
- **Animação 9** — só cores/transform/opacity, 180ms. Correção: `hover:scale` removido do mapa.
- **Densidade 8** — denso sem apertar; enunciado com respiro de prova. Correção: card da questão limitado a 760px.
- **Acabamento 9** — hover azul nos chips, disabled a 40%, estados vazio/carregando/erro. Correção: eixos do Mafs com passo bonito (antes um rótulo por unidade).

Não testado: leitor de tela real, Safari/Firefox (só Chromium do Playwright), fontes SF/New York de verdade (na máquina de teste caem em Roboto e Tinos), tutor com chave real.

## 7. Movimento (09/11/2026)
Regras: só `transform` e `opacity` (cores com `transition-colors` quando é estado), 180–240ms, `cubic-bezier(.2,0,0,1)` (`--ease`), nada em loop, nada piscando. O bloco `@media (prefers-reduced-motion: reduce)` do `globals.css` zera toda animação e transição; o `Contador` também confere a preferência e mostra o número final direto. E2E: `aprender.spec.ts` confere a duração zero com `reducedMotion: "reduce"`.

| Onde | Como | Classe / componente |
|---|---|---|
| Entrada das telas | filhos diretos do `ConteudoPagina` sobem 6px e aparecem, 220ms, 40ms entre eles (máx. 200ms); grades internas (stat cards, linhas do Hoje) fazem o próprio stagger | `.entrada-stagger`, `.anim-entrada` |
| Stat cards | número sobe do anterior (0 na primeira vez) até o valor, 520ms com ease-out; "—" e decimais aparecem direto | `ui/contador.tsx`, `lib/movimento.ts` |
| Confirmar resposta | certa "assenta" (scale .985 → 1.012 → 1) com o check desenhado (traço de 0 ao fim); errada faz shake de 240ms e o X entra com pop | `.anim-assenta`, `.anim-desenha`, `.anim-shake`, `.anim-pop` em `alternativas.tsx` |
| Progresso do sprint | bolinha que vira verde/vermelha faz pop; barras de 11px crescem de 0 até o valor ao montar e animam a mudança (240ms) | `barra-sprint.tsx`, `ui/progress.tsx` |
| Troca de questão | o card da questão entra deslizando 10px da direita, 220ms | `.anim-questao` em `questao-view.tsx` |
| Questões por dia | barras crescem de baixo (`scaleY`) | `.anim-barra` |
| Visuais | quadradinhos, barras e fichas mudam por cor/transform com atraso curto por item; leitura do eixo desenhada com `scaleX` | `components/visuais/*` |

Exceção registrada: o check desenhado usa `stroke-dashoffset` num SVG de 16px (pintura mínima, sem layout).

## 8. Aprender o básico (componentes visuais)
Tela `/aprender` (menu "Aprender", Alt+7) e botão **"Ver visualmente"** (chip pequeno no canto da linha de tags do card da questão, só no sprint, não no simulado) que abre o visual do assunto num diálogo. O mapeamento assunto → visual fica em `src/lib/visuais/catalogo.ts`.

- **`MolduraVisual`** (`components/visuais/moldura.tsx`): área do visual no cinza da página (r14), controles livres (slider `Deslizador`, chips, `+/−`), texto do passo (`aria-live`), Voltar (chip) / "Passo n de N" / Avançar (pílula azul), trilho de passos em pílulas de 6px, caixa **Truque do ENEM** em azul suave com lâmpada, e o **Teste rápido** (enunciado em serifa, opções em chips; certa = verde + assenta, errada = vermelho + shake, com retorno em `role="status"`).
- Visuais: porcentagem (100 quadradinhos), proporção (duas barras com marcas de unidade), frações (barra dividida e a equivalente), gráficos (SVG com eixo, barra escolhida e leitura tracejada), estatística (fichas que se ordenam, mediana em azul, moda em verde, média como traço âmbar na reta), unidades (escada km…mm com marcador), área (grade que se preenche, contorno azul = perímetro), probabilidade (urna, favoráveis com anel, o resto apagado).
- Cores: azul = o que se olha agora; verde = acerto/moda; vermelho = o que sai (desconto) ou erro; âmbar = referência (média, barra comparada). Números em `.num`.
- A conta de cada visual vem de funções puras em `src/lib/visuais/` (100% de cobertura), nunca do componente.

## 9. Resumos de caderno (09/11/2026)
Tela `/resumos` (menu "Resumos", Alt+8) e `/resumos/<id>`. Item próprio no menu, e não aba de Aprender, porque Aprender é interação curta com visuais e o resumo é leitura de revisão longa, com índice, busca e progresso; misturar os dois deixaria a lista lateral de Aprender com 26 itens. O `/caderno` continua sendo o caderno de erros.

- **Folha de caderno:** `.caderno-pauta` (pauta de 28px na cor da linha sobre o branco do card) nos blocos de texto e nos cards do índice; `.caderno-quadriculado` (24px) atrás do mapa mental. Nada de bege nem fonte manuscrita; no escuro as linhas usam o `--border` escuro.
- **Grifo e sublinhado:** pegadinhas com o termo em marca-texto (`.grifo strong`, token `--marca-texto`); a resposta do exemplo sublinhada em azul (`.sublinhado`).
- **Margem:** coluna de 220px à direita com anotações curtas (linha azul suave à esquerda, rótulo "NA MARGEM"); no celular vira chips depois do conteúdo.
- **Selo:** "cai muito" = tag azul cheia (`solid`); "cai às vezes" = tag neutra. Habilidades em tags azuis suaves com o nome curto.
- **Mapa mental** (`components/resumos/mapa-mental.tsx`): SVG com nó central em pílula azul, ramos em pílulas brancas de borda azul numa elipse que crescem para fora, filhos empilhados além do ramo com ligação tracejada. Um ramo aberto por vez; clique, Enter ou Espaço; `aria-expanded`. Filhos entram com `.anim-mapa` (opacity + scale .92→1, 200ms, 40ms entre eles), zerado por `prefers-reduced-motion`. Abaixo de 768px vira árvore em lista com os mesmos ramos. A geometria e o viewBox saem de `geometriaMapa` (função pura testada contra sobreposição).
- **Fórmulas** em KaTeX (modo display) dentro de cartões de borda azul suave; **Truque de prova** na caixa azul suave com lâmpada, como o Truque do ENEM de Aprender.
- **IDE:** chip "Ver resumo" ao lado de "Ver visualmente" quando a habilidade e o assunto da questão têm resumo (só no sprint).
- **Legenda das fórmulas** (09/11/2026): embaixo de cada fórmula, separada por uma linha `--accent-soft`, a linha "**Quando usar:** …" (13px, muted) e uma lista de definição em duas colunas: o símbolo em KaTeX inline alinhado à direita e o significado à esquerda, com a unidade em muted depois de "·". Os dados ficam em `src/lib/resumos/legendas.ts` (id do resumo → rótulo da fórmula); o teste confere que toda letra da fórmula está na legenda e que a legenda não explica letra que não está na fórmula.
- **Tirar dúvida** (09/11/2026, `components/resumos/painel-duvida.tsx`): o mesmo chat do tutor da IDE, com o contexto do resumo. **Desktop (≥ 1024px):** a coluna da direita (360px; 400px a partir de 1280px) fica colada no topo com a altura da tela: a margem em cima (rótulo "NA MARGEM", anotações em tags neutras, "Próximo") e o painel embaixo, num card de raio 20 com a mesma casca do tutor (cabeçalho com selo IA, balões, chips em pílula, campo de raio 14). **Celular:** pílula azul "Tirar dúvida" fixa no canto inferior direito que abre uma gaveta de baixo (85dvh, cantos de cima arredondados, entra com `.anim-slide-in-up`); a gaveta fica montada depois da primeira abertura, para a conversa não sumir. Sem escada de dicas nem "Resposta direta" (não há gabarito). Chips: "Explica de outro jeito", "Me dá outro exemplo", "O que significa cada letra?", "Como isso cai no ENEM?". **Sem IA:** estado vazio (ícone em quadrado azul suave, "O tutor de IA está desligado", caixa `--warning-soft` "Como ligar" com as variáveis) e selo "desligado"; não há modo guiado aqui porque ele só sabe dar dica de questão.
- As peças do chat (cabeçalho, lista com rolagem automática, chips, campo e erro) ficam em `components/estudo/tutor-comum.tsx` e servem aos dois painéis.
