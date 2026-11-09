# Design do Gabarita

Direção decidida em docs/DECISOES.md e no gosto registrado do Matheus (fundo neutro, cinzas, Inter, uma cor de destaque; sem bege, sem serifa). Este arquivo é a referência dos tokens e das regras visuais. O design system do repo manda sobre qualquer referência externa.

## 0. Direção
1. **Propósito:** ferramenta de uso diário para resolver questões do ENEM com um tutor ao lado e ver o domínio subir.
2. **Público:** uma pessoa (Matheus, TDAH), várias sessões curtas por dia. Precisa ver primeiro: o botão "Começar" e onde está no sprint.
3. **Tom:** utilitário, quieto, denso sem ser apertado. Nada de cara de landing page.
4. **Detalhe memorável:** a barra do sprint (●●◐○○) e o domínio por habilidade que muda na hora, em âmbar sobre grafite.
5. **Restrições:** Next.js + Tailwind v4 + Radix; AA (texto ≥ 4,5:1); `prefers-reduced-motion`; fontes vendorizadas (sem CDN); pt-BR; nada piscando.

## 1. Paleta (OKLCH, contraste conferido por script)
| Token | Escuro (padrão) | Claro | Uso |
|---|---|---|---|
| `--background` | `#16181c` (grafite, não preto) | `#fdfdfd` | fundo da página |
| `--surface` | `#1f2226` | `#f5f7f9` | cards, painéis |
| `--surface-2` | `#282b30` | `#eceef1` | hover, áreas elevadas |
| `--foreground` | `#edeef1` (15:1) | `#171b20` (17:1) | texto |
| `--muted-foreground` | `#a0a5ac` (7,1:1) | `#595e66` (6,4:1) | texto secundário |
| `--border` | `#34383e` | `#d5d8db` | bordas 1px |
| `--accent` | `#fcb442` âmbar | `#b55700` | botão principal, foco, domínio |
| `--accent-foreground` | `#23190a` (9,7:1) | `#fdfdfd` (4,8:1) | texto sobre o acento |
| `--accent-text` | `#fcb442` (9,9:1) | `#a44100` (6,2:1) | acento como texto |
| `--success` | `#6ed889` | `#007f35` | acerto, "✓ conferido" |
| `--danger` | `#ff958d` | `#be222a` | erro |
| `--warning` | `#f1c955` | `#8a6d00` | aviso (tutor desligado) |

Uma única cor de destaque (âmbar). Verde e vermelho só para estado de resposta. Sem gradientes, sem glassmorphism, sem brilho.

## 2. Tipografia
- Família única: **Inter** variável (vendorizada em `src/fonts`, `next/font/local`). Monoespaçada do sistema só em `<Kbd>` e código. KaTeX traz a própria fonte matemática (etapa 2).
- Corpo **17px** (18px a partir de 1280px). Escala: 13 / 15 / 17 / 20 / 24 / 30 / 38. Altura de linha 1,55 no corpo, 1,2 nos títulos.
- Números tabulares (`font-variant-numeric: tabular-nums`) em timer, nota e domínio.

## 3. Espaço, raio, movimento
- Escala de espaço 4 / 8 / 12 / 16 / 24 / 32 / 48. Raio 6px em controles, 10px em cards; nada de "tudo arredondado".
- Movimento: só `transform` e `opacity`, 150–200ms, `ease-out`. Com `prefers-reduced-motion: reduce`, duração 0.
- Foco visível: anel de 2px em `--accent` com 2px de offset, em tudo que recebe foco.

## 4. Componentes (shadcn-style, Radix)
Button, Card, Badge, Kbd, Progress, Tabs, Dialog, Tooltip, Toast, ScrollArea em `src/components/ui`. Layout em `src/components/app`: AppShell (barra lateral com Hoje, Estudar, Mapa, Caderno, Laboratório, Ajustes), paleta de comandos (Ctrl/Cmd+K), ajuda de atalhos (?).

## 5. Estados obrigatórios
| Estado | O que mostrar |
|---|---|
| Loading | esqueleto estável (sem spinner grande) |
| Empty | por que está vazio + próxima ação ("Comece um sprint") |
| Error | erro específico em pt-BR + como resolver |
| Partial | o que carregou + aviso do que falta (ex.: "sem parâmetro TRI") |
| Success | confirmação curta + próximo passo |
| Permission | não se aplica na v1 (sem login) |

## 6. Checagem anti-"cara de IA"
Sem gradiente roxo→azul, sem glassmorphism, sem blobs, sem emoji em rótulos, sem caixa alta espaçada, sem hero centralizado sobre gradiente, sem cards dentro de cards, sem animação de scroll.
