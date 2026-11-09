# DESIGN.md do Gabarita

**O design system vigente é o original do Gabarita ENEM, descrito em [`docs/DESIGN.md`](../docs/DESIGN.md).** Tokens em `src/app/globals.css`; componentes em `src/components/ui`; preview em `/design-system`.

Este arquivo existe em `design/` só para que a checagem das skills `/iniciar-design-system` e `/base-de-design` (que procuram `design/DESIGN.md`) encontre o sistema e **não** crie outro. Decisão de 2026-11-09: a fonte da verdade continua em `docs/DESIGN.md`, porque o README, o `docs/DECISOES.md` e os testes e2e já apontam para lá; aqui fica o ponteiro e o resumo da direção.

## Direção (copiada de `docs/DESIGN.md` §0)
1. **Propósito:** ferramenta de uso diário para resolver questões do ENEM com um tutor ao lado e ver o domínio subir.
2. **Público:** uma pessoa (Matheus, TDAH), várias sessões curtas por dia. Precisa ver primeiro: "Começar" e onde está no sprint.
3. **Tom:** claro e limpo, no estilo Apple/iOS. Cards brancos arredondados sobre um fundo cinza-azulado, azul de sistema, sombra suave, títulos em peso 800. Números em fonte arredondada; enunciado em serifa, com cara de prova impressa.
4. **Detalhe memorável:** o hero em gradiente azul no Hoje e as alternativas em cartões com a letra num círculo, sobre o enunciado serifado.
5. **Restrições:** Next.js + Tailwind v4 + Radix; `prefers-reduced-motion`; sem CDN (fontes do sistema, Inter vendorizada só como reserva); pt-BR; nada piscando; todos os atalhos e o layout questão | tutor mantidos.

## Regras para quem for mexer
- **Evoluir, não substituir.** Fonte (pilha do sistema, `ui-rounded` nos números, serifa no enunciado), cards de raio 20, pílulas, hero em gradiente e sidebar com ícones não mudam sem "ok" explícito do Matheus.
- A serifa do enunciado é do sistema e fica, mesmo com a regra geral "sem serifa em app" das skills.
- Melhorias aceitas sem pedir: contraste AA por token, estados que faltam, celular sem overflow, consistência de espaçamento.

## Registro do treino
`design/treino/` guarda a proposta "Cartão-resposta" (IBM Plex, bolhas), feita no treino das skills em 2026-11-09 e **recusada** pelo Matheus. `design/mockups/` tem os mockups das direções. `design/DESIGN-LOG.md` conta a história inteira, inclusive a correção de rumo.
