# Gabarita: brainstorm e plano de produto

## 0. Duas correções na premissa

**1. Quem define o que é "fácil" é o INEP.** Os microdados do ENEM têm um arquivo `ITENS_PROVA_<ano>.csv`. Para cada item ele traz:
- a habilidade (`CO_HABILIDADE`);
- o gabarito (`TX_GABARITO`);
- os parâmetros TRI (`NU_PARAM_A`, `NU_PARAM_B`, `NU_PARAM_C`).

Em vez de supor que um tema é fácil, ordene os itens reais pelo parâmetro **b** (a dificuldade) e estude primeiro o terço mais fácil. Essa é a decisão de produto mais importante do plano.

**2. A lista da semana precisa de ajuste:**

| Tema | O que fazer | Por quê |
|---|---|---|
| Leitura de gráficos e tabelas (C6, H24–H26) | ✅ Prioridade 1 | É o bloco com mais itens de b baixo. |
| Porcentagem | ✅ Prioridade 1 | Cai em toda prova, quase sempre como item fácil. |
| Regra de três, razão e proporção (C4, H15–H18) | ✅ Prioridade 1 | É a base de metade da prova. |
| Média, mediana e moda (H27, H28) | ✅ Prioridade 1 | A mediana com quantidade par de valores derruba muita gente. |
| Probabilidade | ⚠️ Só a simples | Condicional e "pelo menos um" costumam ser difíceis. |
| Funções | ⚠️ Só função afim e leitura de gráfico | Exponencial e logaritmo ficam entre médio e difícil. |
| Equação do 2º grau | ❌ Vai para a semana 2 | Costuma cair como função quadrática (vértice, máximo, mínimo), que é de nível médio. |

**O que faltou na lista:**
- escala de mapas e plantas;
- conversão de unidades (H10–H12);
- área e perímetro de figuras simples;
- visualização espacial e planificação (H6, H7);
- leitura de números: notação científica e ordem de grandeza;
- juros simples e descontos sucessivos;
- contagem pelo princípio multiplicativo.

**Estratégia TRI:** o TRI premia a coerência. Quem erra item fácil e acerta item difícil é tratado como quem chutou, e a nota cai. Para quem está começando, não errar nenhum fácil é o maior ganho de nota por hora estudada.

## 1. Visão e diferencial

**O Gabarita é o Cursor do estudo para o ENEM.** A prova fica de um lado e um tutor que raciocina junto fica do outro. Por trás, um modelo do aluno mede o que ele domina e diz quando está pronto.

| Concorrente | Onde perde para o Gabarita |
|---|---|
| Khan Academy / Khanmigo | Não é calibrado para o ENEM: nem a matriz de habilidades, nem o TRI, nem o estilo do enunciado. |
| Me Salva! | É passivo (vídeo e lista). Não tem tutor que reage ao seu erro nem diagnóstico TRI. |
| ChatGPT e afins | Dão a resposta de cara e erram contas sem conferir. Não sabem o b do item nem dizem quando você está pronto. |
| Brainly | Respostas de terceiros sem verificação. Vira cola e tem muita distração. |

**Diferencial:** nenhum deles junta os quatro pontos abaixo.
- Itens oficiais com os parâmetros TRI publicados.
- Um tutor socrático que confere toda conta no SymPy antes de responder.
- Um critério explícito de "pronto", que dá para auditar.
- Uma interface pensada para TDAH.

## 2. Ideias divergentes

Impacto: 🔥 baixo, 🔥🔥 médio, 🔥🔥🔥 alto. Esforço: ⚙️ uma noite, ⚙️⚙️ alguns dias, ⚙️⚙️⚙️ semanas.

1. **Tela dividida tipo IDE.** O trecho selecionado no enunciado vira contexto do chat. 🔥🔥🔥 ⚙️
2. **Escada de dicas em 4 degraus**, e o degrau usado conta no cálculo do domínio. 🔥🔥🔥 ⚙️
3. **"Por que errei?"** O tutor diagnostica pela alternativa marcada, já que cada distrator do ENEM corresponde a um erro típico. 🔥🔥🔥 ⚙️⚙️
4. **Verificação obrigatória no SymPy** antes de qualquer número sair. 🔥🔥🔥 ⚙️
5. **Fila "fáceis primeiro"** ordenada pelo b oficial. 🔥🔥🔥 ⚙️⚙️
6. **Mapa de calor das habilidades H1 a H30.** 🔥🔥 ⚙️⚙️
7. **Nota TRI estimada com intervalo de confiança.** 🔥🔥🔥 ⚙️⚙️
8. **Questões gêmeas verificadas:** mesma estrutura, números novos e gabarito calculado por código. 🔥🔥🔥 ⚙️⚙️
9. **Repetição espaçada (FSRS) por habilidade e por erro.** 🔥🔥 ⚙️⚙️
10. **Sprint de 5 questões** (uns 12 minutos) com pausa curta. 🔥🔥🔥 ⚙️
11. **Foto do rascunho:** o tutor aponta a linha errada. 🔥🔥 ⚙️⚙️
12. **Gráfico interativo com slider** dentro do chat. 🔥🔥 ⚙️
13. **Modo prova cronometrado**, com 3 minutos por item. 🔥🔥 ⚙️
14. **Perfil "explica do meu jeito".** 🔥🔥 ⚙️
15. **Perguntar por voz.** 🔥🔥 ⚙️⚙️
16. **Caderno de erros automático.** 🔥🔥🔥 ⚙️
17. **Detector de chute:** acerto rápido demais em item difícil volta para a fila. 🔥🔥 ⚙️
18. **"Ensine ao Gabarita":** você explica e o tutor faz o papel de aluno. 🔥🔥 ⚙️⚙️
19. **Simulado adaptativo de 15 itens.** 🔥🔥🔥 ⚙️⚙️⚙️
20. **Sequência de dias sem culpa.** 🔥 ⚙️
21. **Relatório semanal para `matheus/preceptor`.** 🔥 ⚙️
22. **Outras matérias e redação.** 🔥🔥🔥 ⚙️⚙️⚙️

## 3. Ideias escolhidas

Vou construir nesta ordem: **1, 2, 4, 10, 16, 5, 7, 3, 8**.

- **1, 2 e 4 são o produto.** Sem eles, o Gabarita é só mais um ChatGPT.
- **10** é a decisão de experiência para o TDAH: uma unidade de trabalho pequena, com fim visível.
- **16** sai quase de graça da tabela de tentativas.
- **5 e 7** transformam estudar em subir nota. Dependem de importar os microdados, então ficam para o dia 2.
- **3 e 8** são o diferencial pedagógico.

**Para depois:**
- 19, porque precisa de um banco calibrado.
- 22, porque espalhar o foco agora mata o produto.
- 11, 15 e 18: boas ideias, mas não são o gargalo.

**Descartada:** gamificação pesada, com XP e ligas. Para quem tem TDAH vira distração e ansiedade. Ver o domínio subir já é a recompensa.

## 4. Experiência e telas

**Princípios de design:**
- **Uma coisa por vez:** uma questão, o chat e um único botão principal.
- **Respostas curtas:** o tutor usa no máximo 3 frases e sempre termina com uma pergunta ou uma ação.
- **Ritmo visível:** barra do sprint (●●●○○) e um timer discreto, opcional.
- **Visual:** escuro grafite em vez de preto puro, uma única cor de destaque e texto de 17 a 18 px.
- **Modo foco** pela tecla `F`.
- **Atalhos:** `A` a `E` marcam a alternativa, `H` pede dica, `Enter` confirma, `N` passa para a próxima e `/` abre o chat.
- **Antes de codar a interface,** rodar a skill `base-de-design`, como está na sua regra.

**Telas:**
1. **Hoje:** um card com um único botão, "Começar".
2. **IDE:** a tela principal, desenhada abaixo.
3. **Fim do sprint:** os 5 resultados e quanto o domínio mudou.
4. **Mapa:** domínio por habilidade, nota estimada e qual critério de "pronto" ainda falta.
5. **Caderno de erros.**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ◆ Gabarita   Sprint ●●◐○○  3/5   Leitura de gráficos · H24      ⏱ 02:14   [F] │
├──────────────────────────────────────────┬─────────────────────────────────────┤
│  ENEM 2022 · Q148 · fácil · H24          │  Tutor                              │
│                                          │  ┌───────────────────────────────┐  │
│  O gráfico mostra o consumo de água      │  │ Antes de calcular: o que o    │  │
│  de uma cidade entre 2015 e 2021...      │  │ eixo vertical está medindo?   │  │
│   ┌──────────────────────────────┐       │  └───────────────────────────────┘  │
│   │   ▇  ▇     ▇                 │       │        acho que é milhões de L  ▸   │
│   │   ▇  ▇  ▇  ▇  ▇  ▇           │       │  ┌───────────────────────────────┐  │
│   └──────────────────────────────┘       │  │ Isso. Compare 2018 com 2019.  │  │
│  Qual foi a variação percentual...?      │  │ Subiu ou desceu?   ✓ conferido │  │
│   ( ) A  12%                             │  └───────────────────────────────┘  │
│   (•) B  15%                             │  Dica: ▮▮▯▯  [H] próximo degrau     │
│   ( ) C  18%                             │  ┌───────────────────────────────┐  │
│   ( ) D  20%                             │  │ pergunte do seu jeito…      ⏎ │  │
│   ( ) E  25%                             │  └───────────────────────────────┘  │
│        [ Confirmar ⏎ ]   [ Pular ]       │                                     │
├──────────────────────────────────────────┴─────────────────────────────────────┤
│  domínio H24 ▓▓▓▓▓▓░░░░ 0,62 → pronto em ~6 itens          [resposta direta ⌥R]│
└────────────────────────────────────────────────────────────────────────────────┘
```

## 5. Arquitetura do agente

**Rota do chat (`/api/tutor`).** Usa `streamText` do Vercel AI SDK com o **Claude Sonnet 5.5**. O contexto leva a questão, o gabarito oculto, o perfil do aluno e um resumo do histórico.

**Ferramentas do tutor:**
- `run_python`: executa SymPy e numpy num sandbox.
- `verify_answer`: compara uma expressão com o gabarito, de forma simbólica e numérica.
- `plot_function`: devolve um JSON que a interface desenha.
- `search_items`: busca questões no Postgres com pgvector.
- `make_twin`: dispara a geração de uma gêmea.
- `record_event`: registra dica, erro e equívoco identificado.
- `get_student_model`: lê o domínio e os erros recorrentes.

**O que existe de verdade e como integrar:**

| Ferramenta | Situação real | Como integrar |
|---|---|---|
| **Python + SymPy** | Três caminhos: a ferramenta de execução de código da Anthropic (sandbox gerenciado), o Vercel Sandbox (microVM) e o Pyodide no navegador (pesado na primeira carga). | No MVP, a ferramenta da Anthropic, porque não exige infraestrutura. Confira na documentação a versão atual e se o SymPy vem instalado; se não vier, use o Vercel Sandbox. Use `mathjs` no servidor como segunda opinião rápida. |
| **KaTeX** | Biblioteca madura. | `react-markdown` + `remark-math` + `rehype-katex`. |
| **Gráficos** | O Desmos exige chave de API e tem termos para uso comercial. Mafs e function-plot são livres (MIT). | Mafs, que é React e bonito. A ferramenta devolve algo como `{fn, domain, sliders}`. |
| **INEP** | O INEP publica as provas e os gabaritos em PDF e os microdados com os parâmetros a, b e c de cada item, por cor de caderno. | Importação offline: filtrar matemática (`SG_AREA='MT'`) e casar `CO_PROVA` e `CO_POSICAO` com o caderno de uma cor só. |
| **Texto das questões** | O enem.dev (API da comunidade em JSON) e datasets no Hugging Face, como `maritaca-ai/enem`. | Usar como atalho para não digitar enunciados. Conferir licença e cobertura de anos. O gabarito que vale é sempre o oficial. |
| **Repetição espaçada** | `ts-fsrs` (MIT). | Um cartão por habilidade e um por erro. |

**Prompt do tutor (o núcleo):**
```
Você é o tutor do Gabarita. O aluno é o Matheus, que tem TDAH. Seja curto.
REGRAS
1. Nunca revele a alternativa nem o valor final, a menos que ele peça explicitamente
   ou que a dica já esteja no degrau 4.
2. Use no máximo 3 frases e termine com UMA pergunta ou UMA ação.
3. Todo número ou simplificação que você afirmar tem que ter passado antes por run_python.
4. Escreva matemática em LaTeX. Para mostrar uma função, chame plot_function.
5. Quando ele errar, use distractor_map[alternativa marcada] para descobrir o erro e
   faça uma pergunta que o leve a enxergá-lo sozinho.
6. Registre tudo com record_event.
ESCADA DE DICAS
0 pergunta socrática · 1 conceito · 2 primeiro passo com os números do enunciado ·
3 resolução até o penúltimo passo · 4 resolução completa e conferida + oferta de gêmea
CONTEXTO (OCULTO): enunciado, alternativas, gabarito, valor, habilidade, b,
distractor_map, perfil, os 3 erros mais recorrentes
```
Use cache de prompt no bloco fixo (regras, escada e perfil), que se repete em toda mensagem.

**Ciclo de verificação matemática:**
1. Se a resposta do tutor contém um fato matemático, ele roda `run_python`.
2. Se o resultado bate com o gabarito oficial, a mensagem sai com o selo "✓ conferido".
3. Se não bate, o tutor revisa o raciocínio e tenta de novo, no máximo 2 vezes.
4. Se continuar divergindo, ele diz que não conseguiu conferir e o caso fica registrado para revisão.

Quem decide é o gabarito oficial, e o SymPy confere as contas do caminho. Se os dois discordarem, o mais provável é a leitura da questão estar errada (ou a questão ter sido anulada).

Para respostas livres do aluno, `verify_answer` faz duas checagens:
- `simplify(aluno - esperado) == 0`;
- a comparação nos mesmos 20 pontos aleatórios, que pega equivalências que o `simplify` não detecta.

**Questões gêmeas:**
1. O **Claude Opus 5.5** escreve um gerador em Python. Cada distrator é a resposta de um erro típico.
2. O gerador roda, e a resposta correta sai do código, nunca do texto do modelo.
3. O **Sonnet 5.5** resolve às cegas. A gêmea só é aceita se ele concordar com o código.
4. Checagens automáticas: 5 alternativas diferentes, uma única correta, números "redondos" como no ENEM.
5. As gêmeas nunca entram no cálculo da nota TRI e têm peso menor no domínio.

**Memória no Supabase:**
- `items`: id, ano, cor, posição, habilidade, a, b, c, gabarito, enunciado_md, imagens, distractor_map, origem.
- `attempts`: item, escolha, se acertou, segundos, degrau máximo de dica, se pediu a resposta.
- `tutor_events`: cada dica, erro e equívoco registrado pelo tutor.
- `skill_state`: domínio, número de itens e estado do FSRS por habilidade.
- `misconceptions`: equívocos e quantas vezes apareceram.
- `profile`: preferências, data da prova, meta de nota.
- `error_notebook`: o caderno de erros.

A memória tem três camadas: o que aconteceu (tentativas), o que ele sabe (domínio e equívocos) e como ele prefere aprender (preferências). O tutor recebe só um resumo de uns 200 tokens, nunca o histórico bruto.

## 6. Modelo de domínio e de "pronto"

**Nota global (θ).** O ENEM usa o modelo de 3 parâmetros: $P_i(\theta)=c_i+\frac{1-c_i}{1+e^{-a_i(\theta-b_i)}}$.
- θ é estimado por EAP (média da distribuição a posteriori, com prior normal), **só com itens oficiais**.
- A nota estimada é $\hat N\approx 500+100\hat\theta$, sempre mostrada com intervalo e com o rótulo "estimativa". A equalização oficial do INEP não é replicada aqui.
- "Fácil" é o terço de menor b entre as questões de matemática do banco.
- Antes de confiar nos números absolutos, confira na documentação dos microdados a escala dos parâmetros e a constante D (1 ou 1,7).

**Domínio por habilidade.** Cada tentativa gera uma evidência $e$:

| Resultado | $e$ |
|---|---|
| Acertou sem dica | 1,0 |
| Acertou com dica até o degrau 1 | 0,8 |
| Acertou com dica no degrau 2 | 0,5 |
| Acertou com dica no degrau 3 ou 4, ou pediu a resposta | 0,1 |
| Errou | 0 |

Se acertou em menos de 25% do tempo mediano, a evidência é multiplicada por 0,5 (possível chute).

A atualização é $m_h \leftarrow m_h + 0{,}25\cdot w\cdot(e-m_h)$, com $m_h$ começando em 0,3.
- $w = 1$ para item oficial e $0{,}6$ para gêmea.
- $w \times 1{,}2$ quando ele acerta um item mais difícil que o θ atual.
- $w \times 1{,}3$ quando ele erra um item muito mais fácil que o θ, que é o erro que o TRI pune.

Para o esquecimento, o domínio efetivo é $m_h\cdot R(t)$, onde $R(t)$ é a retenção prevista pelo FSRS. Quando $R < 0{,}9$, a habilidade volta para a revisão.

**Pronto numa habilidade** (precisa cumprir tudo):
- domínio efetivo de pelo menos 0,85;
- pelo menos 6 itens oficiais feitos;
- os 4 últimos acertados com dica no máximo até o degrau 1;
- pelo menos 1 acerto num dia diferente.

**Pronto nos fáceis (a meta desta semana):**
- todas as habilidades da semana prontas;
- pelo menos 90% de acerto num simulado de 15 itens fáceis inéditos, com no máximo 3 minutos por item.

**Pronto para a prova de matemática:**
- o limite inferior do intervalo da nota estimada está acima da meta;
- menos de 5% de erro nos itens com $b<\hat\theta-1$;
- 2 simulados completos de 45 itens nos últimos 14 dias.

A tela sempre mostra **qual critério falta**, por exemplo: "H24: falta 1 acerto em outro dia".

## 7. Fonte das questões, direitos e formato

**Fontes:**
- os PDFs oficiais do INEP, que são a verdade do gabarito;
- os microdados, com os parâmetros TRI;
- o enem.dev e o Hugging Face, como atalho para o texto;
- as gêmeas, que são de autoria própria.

**Direitos (é a minha leitura, não é parecer jurídico):**
- **Uso pessoal:** tranquilo.
- **Produto aberto ou comercial:** cuidado. Muitas questões incluem textos, charges e gráficos de terceiros, e esses direitos não são do INEP. Para abrir o produto:
  - citar sempre "Fonte: INEP, ENEM ano, questão n";
  - evitar redistribuir o banco completo;
  - escalar o produto com as gêmeas;
  - consultar um advogado de propriedade intelectual antes do lançamento.
- **LGPD:** deixar o RLS ligado no Supabase desde o primeiro dia.

**Formato de um item:**
```json
{"id":"enem-2022-azul-148",
 "fonte":{"orgao":"INEP","ano":2022,"cor":"azul","posicao":148},
 "habilidade":"H24","competencia":"C6",
 "tri":{"a":2.1,"b":-0.4,"c":0.18},
 "enunciado_md":"...","imagens":["storage://provas/2022/148-1.png"],
 "alternativas":{"A":"12%","B":"15%","C":"18%","D":"20%","E":"25%"},
 "gabarito":"B","valor_simbolico":"Rational(3,20)",
 "distractor_map":{"C":"dividiu pelo valor novo"},
 "origem":"oficial","anulada":false}
```
Os números deste exemplo são ilustrativos.

## 8. Stack recomendada

| Camada | Escolha |
|---|---|
| Front e back | Next.js (App Router) na Vercel |
| IA | Vercel AI SDK com o provedor Anthropic |
| Tutor | **Claude Sonnet 5.5**, porque a latência importa para o ritmo do TDAH |
| Gerar gêmeas e `distractor_map` | **Claude Opus 5.5**, offline |
| Classificação e resumos | **Claude Haiku 5.5** |
| Banco | Supabase (Postgres, pgvector, Storage, Auth com RLS) |
| Matemática | Execução de código da Anthropic ou Vercel Sandbox, mais `mathjs` |
| Interface | Tailwind, shadcn/ui e `react-resizable-panels` para a tela dividida |
| Matemática na tela | KaTeX e Mafs |
| Repetição espaçada | `ts-fsrs` |

Confirme os IDs dos modelos e a versão da ferramenta de execução de código na documentação atual da Anthropic na hora de codar.

## 9. MVP para uma noite (5 a 6 horas)

**Meta:** amanhã você faz 3 sprints de 5 questões oficiais fáceis com o tutor e vê o domínio mudar.

**Fica fora do MVP:** login (um único usuário), nota TRI, gêmeas e FSRS.

| Tempo | O que fazer |
|---|---|
| 0:00 | Criar o projeto Next.js com Tailwind e shadcn, criar o projeto no Supabase e as tabelas `items`, `attempts`, `tutor_events` e `skill_state`. |
| 0:30 | Montar o banco inicial: matemática de 2022 e 2023 pelo enem.dev, gabarito conferido no PDF, habilidade classificada pelo Haiku, **40 itens**. Se der tempo, puxar o b dos microdados; se não, marcar fácil ou médio à mão. |
| 1:30 | Tela dividida: KaTeX, imagens e atalhos de A a E. |
| 2:30 | `/api/tutor` com o prompt e as ferramentas `run_python`, `verify_answer` e `plot_function`. Testar 5 conversas reais. |
| 3:45 | Sprint de 5: fila que começa pela habilidade de menor domínio, registro das tentativas, cálculo do domínio e tela de fim. |
| 4:30 | Caderno de erros e um mapa simples. |
| 5:00 | Acabamento do modo escuro e deploy na Vercel. |
| 5:30 | Rodar os critérios de aceite. |

**Se o tempo apertar:** corte o gráfico e o caderno de erros. A tela dividida, o tutor com verificação e o sprint de 5 não podem sair.

**Depois do MVP:**
1. **Dia 2:** microdados, fila pelo b real e nota estimada.
2. **Dia 3:** "por que errei?" com o `distractor_map`.
3. **Dia 4:** questões gêmeas.
4. **Dia 5:** FSRS.
5. **Semana 2:** tela de "pronto", simulado de 15 fáceis e o conteúdo da semana 2 (função quadrática, exponencial, geometria espacial, combinatória).
6. **Semana 3:** modo prova de 45 itens, voz e foto do rascunho.
7. **Depois:** simulado adaptativo, outras matérias, relatório pela Reason Network e, só então, abrir para outros alunos.

## 10. Critérios de aceite do MVP

1. A tela "Hoje" abre e, com um clique, carrega uma questão em menos de 2 segundos.
2. As 40 questões aparecem com LaTeX, imagens e 5 alternativas, e o gabarito confere com o PDF do INEP nas 40.
3. Em 10 conversas, o tutor nunca revela a resposta sem que você peça.
4. Quando você pede a resposta direta, o tutor resolve tudo e o pedido fica registrado.
5. Todo número calculado pelo tutor tem uma chamada `run_python` correspondente no log, em 100% das 10 conversas.
6. Em 5 tentativas de induzir o erro ("tem certeza de que não é 18%?"), o tutor mantém a resposta correta.
7. Em pelo menos 90% das mensagens, o tutor usa no máximo 3 frases e termina com uma pergunta ou ação.
8. Pedir "gráfico de $y=2x+3$" desenha um gráfico interativo no chat.
9. Dá para fazer um sprint inteiro só pelo teclado.
10. A mudança de domínio mostrada no fim do sprint bate com a fórmula da seção 6, e um teste unitário confere isso.
11. Todo erro aparece no caderno de erros.
12. A interface é toda escura, com contraste AA e sem nada piscando.
13. Você faz 3 sprints seguidos e quer usar de novo amanhã. Esse é o critério que manda.

## 11. Riscos e perguntas abertas

**Riscos:**
- **O tutor errar conta com confiança.** Mitigação: verificação obrigatória, gabarito como âncora e o selo "✓ conferido".
- **O tutor deixar escapar a resposta.** Mitigação: regras duras no prompt e um teste automático que procura a letra ou o valor nas mensagens antes do degrau 4.
- **Casar o parâmetro TRI com a questão errada** (cores e posições de caderno diferentes). Mitigação: usar uma única cor e validar 10 itens à mão.
- **A nota estimada ser lida como oficial.** Mitigação: mostrar o intervalo e usar só itens oficiais no cálculo.
- **Construir o Gabarita virar uma forma de adiar o estudo.** Esse é um risco real para quem tem TDAH e perfil de fundador. Regra: toda sessão de código começa com 1 sprint de estudo no próprio Gabarita.
- **Questões com imagem.** Mitigação: mandar a imagem para o Claude ler e guardar uma descrição revisada no banco.
- **Direitos autorais ao abrir o produto.** Mitigação: escalar com as gêmeas e consultar um advogado.
- **Custo e latência.** Mitigação: Sonnet no chat, cache de prompt, `mathjs` para contas simples e SymPy só quando houver álgebra.

**Perguntas para você:**
1. **Qual é a prova-alvo?** Se for o 2º dia do ENEM 2026 (a matemática cai no 2º dia), faltam poucos dias, e o plano vira "só fáceis e simulado". Se for o ENEM 2027, o plano acima está certo.
2. Qual é a sua meta de nota em matemática?
3. O Gabarita é só para você ou vai virar produto da PRECEPTOR!?
4. Você estuda mais no notebook ou no celular?
5. Prefere digitar ou falar com o tutor?
6. Quer o relatório semanal no bot `matheus/preceptor`?
7. As fotos do seu caderno podem passar pelo Claude?
