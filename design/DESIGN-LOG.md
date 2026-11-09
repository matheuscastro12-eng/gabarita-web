# DESIGN-LOG — Gabarita (treino das skills de design)

Treino pedido pelo Matheus em 2026-11-09: criar um design system novo passando pela `/iniciar-design-system` e redesenhar todas as telas com a `/base-de-design`. Onde as skills mandam "pare e espere o Matheus", **o orquestrador (Fable) escolheu**, por instrução explícita do treino, e registrou o porquê. Isso vale só para este treino: nenhuma dessas escolhas é aprovação do Matheus.

## 2026-11-09 — design system do app — iniciar-design-system

0. **Checagem.** A lista da skill encontrou: `src/app/globals.css` (único CSS com `:root { --… }`, pelo `grep` da skill) e `src/components/ui` (12 componentes). **Não** encontrou: `design/DESIGN.md`, `DESIGN.md` na raiz, `app/globals.css`, `src/index.css`, `painel/folha-base.css`, `components.json`. O repo tem um DESIGN.md completo, mas em **`docs/DESIGN.md`**, caminho que a lista da skill não olha. Pela letra da skill o resultado é **"Parcial"** (tokens sem DESIGN.md) e o certo seria só escrever o `design/DESIGN.md` a partir dos tokens que existem; pela realidade do repo é **"Completo"** e a skill deveria sair para a `/base-de-design`. Nos dois casos a skill mandaria **não** recomeçar. Seguimos criando um sistema novo porque o Matheus pediu isso neste treino (o "ok" que a regra "não recomece sem ok" exige). O sistema original entra como a direção A.
1. **Brief.**
   - Propósito: ferramenta diária para resolver questões oficiais de matemática do ENEM com um tutor ao lado e ver o domínio subir até "pronto".
   - Público: uma pessoa (Matheus, TDAH), várias sessões curtas por dia, no notebook e no celular. Vê primeiro: "Começar" e onde está no sprint.
   - Tom: exato e calmo, com cara de prova; uma ação principal por tela, nada piscando.
   - Detalhe memorável: a bolha do cartão-resposta (o nome do app vem de "gabarito").
   - Restrições: Next 16 + Tailwind v4 + Radix; sem CDN (fontes locais); AA conferido por script; pt-BR; `prefers-reduced-motion`; o tema escuro já existe como função e tem que continuar; nenhuma função pode sumir. Ferramenta diária: densa e escaneável.
2. **Direções mostradas** (mockup real da tela Hoje e da IDE em `design/mockups/direcao-{a,b,c}.html`, captura em `direcao-{a,b,c}.png`; brief em `design/mockups/BRIEF.md`):
   - **A "Original evoluído"**: fundo `#F5F7FA`, cards brancos com sombra, azul `#0066CC` (o `#0A84FF` do original escurecido), Inter + enunciado em serifa. Tom: claro e macio, estilo iOS.
   - **B "Cartão-resposta"**: fundo `#FFFFFF`, linhas de 1px no lugar de cards com sombra, azul-caneta `#1A56DB`, IBM Plex Sans + IBM Plex Mono para dado. Tom: exato e calmo, folha de prova; a tinta só aparece onde você marca.
   - **C "Marca-texto"**: fundo `#FFFFFF`, botão em tinta `#111827`, amarelo `#FFD60A` só como grifo, Atkinson Hyperlegible. Tom: direto, mesa de estudo.

   **Escolhida: B**, pelo orquestrador (não pelo Matheus), em 2026-11-09. Por quê:
   - É a única em que o detalhe memorável sai do produto: a bolha preenchida serve para a alternativa marcada, o progresso do sprint, o item feito do plano e a fila. Nas outras duas o detalhe é de estilo (gradiente/pílula na A, grifo na C).
   - Passa em AA sem exceção: branco sobre `#1A56DB` dá 6,18:1 e o mesmo azul como texto dá 6,18:1 sobre branco e 5,62:1 sobre muted. O original tinha 3,65:1 no botão primário e no azul em texto pequeno (documentado em `docs/DESIGN.md` como "herdado").
   - Cumpre o gosto registrado: fundo branco, cinzas neutros, um destaque, sem serifa, sem bege, sem roxo, vermelho só em erro.
   - Para TDAH: menos caixas competindo. A faixa de números sem cards e a fila numerada dão uma ordem de leitura só; na A são oito cards do mesmo peso.

   **Descartadas, com honestidade:**
   - **A** é a mais familiar e a de menor risco, e o mockup ficou bom. Perde porque (1) mantém o enunciado em serifa, que a regra fixa 2 da skill proíbe ("nunca serifa em app"), e sem a serifa ela perde o que tinha de próprio; (2) cards flutuantes, pílulas em tudo e fundo cinza-azulado são o padrão "dashboard iOS" que serve para qualquer produto; (3) o azul que passa em AA (`#0066CC`) já não é o azul de sistema do original, então nem a fidelidade se salva.
   - **C** é a mais ousada e a mais legível no corpo do texto. Perde porque (1) o amarelo como destaque disputa com o estado de aviso (âmbar) e some como anel de foco (amarelo sobre branco não chega a 3:1); (2) o suave do amarelo (`#FFF4B8`) puxa para o creme que o Matheus não quer; (3) a fonte só tem 400 e 700, o que força negrito pesado em rótulos; (4) o zero cortado da Atkinson confunde em enunciado de matemática (0 vs ∅).

   O que a comparação não mostra: as três só foram vistas em 1440px e no tema claro. Celular e escuro só existem para a direção escolhida.
3. **Base técnica.** `npx shadcn@latest init` **não foi rodado**. Motivo: o repo já tem 12 componentes no estilo shadcn em `src/components/ui`, com API própria (`variant="primary"`, `Esqueleto`, `Contador`, toast em Radix) usada em todas as telas, e um `globals.css` de 559 linhas com as animações do app; o init reescreve o CSS global e cria `components.json` apontando para um estilo (`new-york`) que não é o dos componentes. Decisão: manter os arquivos e as APIs (nenhum import quebra), retematizar pelos tokens e acrescentar à mão o que falta (`input.tsx`, `bolha.tsx`). Sem `components.json`, os registries do passo 5 da base (`@beui`, `@affectui`…) não são instaláveis por CLI; não fizeram falta.
4. **Tokens.** Estrutura do `templates/tokens.css` (nomes `--cor-*` em pt + variáveis shadcn + `@theme inline`), com a direção B e com `.dark` preenchido (o tema escuro é função existente; a skill diz "opcional; só se o Matheus pedir"). Acréscimos ao template: `--cor-primaria-texto` (o azul como texto, mais claro no escuro), `--cor-sucesso-forte`/`--cor-erro-forte` com `-contraste` (bolha cheia com ícone por cima), `--cor-marca-texto`, `--cor-veu`. Raio `--raio-1..4` = 6/8/10/14. Motion: `--duracao 160ms`, `--curva cubic-bezier(.2,0,0,1)`. Colisão resolvida: no sistema antigo `accent` era a cor cheia; no shadcn `--accent` é o suave. Todas as classes foram migradas (`bg-accent`→`bg-primary`, `bg-accent-soft`→`bg-accent`…), tabela em `design/specs/01-fundacao-tokens.md`. Lucian `tokens` consultado só para os papéis (página, superfície 1–3, tinta 1–3, linha 1–2, destaque, suave, sucesso/aviso/erro); nenhum valor copiado. Motion-prompt `list --pack ui` + `get 049 068`: modal abre em 320ms easeOutCubic e fecha em 280ms; passo do indicador em 300ms easeInOutCubic. Ficamos em 160–240ms, mais curto, por ser ferramenta de uso repetido.
   Contraste: `node design/scripts/contraste.mjs --tokens src/app/globals.css` (tabela no DESIGN.md).
5. **DESIGN.md.** `design/DESIGN.md`, a partir do template. `docs/DESIGN.md` (o original) fica como histórico, com um aviso no topo apontando para o novo. Refero e oh-my-design não foram usados.
6. **Componentes base.** Retematizados: button, card, badge, dialog, tabs, toast, tooltip, progress, kbd, esqueleto, scroll-area. Novos: `input.tsx` (Input, Textarea, Select, Label) e `bolha.tsx`. Diferenças para a lista da skill: **toast em Radix no lugar do `sonner`** (já existia, com testes e2e em cima); **sem `sheet`** (a gaveta do Laboratório usa o `dialog`); `skeleton` se chama `esqueleto`.
7. **Preview.** `/design-system` (`src/app/design-system/page.tsx`), `robots: { index: false, follow: false }`, fora do menu e da paleta.
8. **Revisão + handoff.** Ver o fim deste arquivo.

Pago usado? não.
Publicação/deploy: não (sem push, PR, merge ou deploy neste treino).
