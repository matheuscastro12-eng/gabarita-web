/**
 * Resumos de caderno de matemática do ENEM. Texto e exemplos próprios (fontes de referência em
 * docs/FONTES-RESUMOS.md). Cada exemplo traz a conta em sintaxe do mathjs (`conta`), conferida nos
 * testes contra `resposta`. O selo de incidência cruza levantamentos públicos (SAS 2009–2024 e
 * outros) com a contagem de assuntos das 636 questões do próprio app (2009–2023).
 */
import type { Competencia, Habilidade } from "@/data/tipos";
import type { IdVisual } from "@/lib/visuais/catalogo";

export type Incidencia = "cai-muito" | "cai-as-vezes";

export interface RamoMapa {
  rotulo: string;
  itens: string[];
}

export interface Formula {
  rotulo: string;
  /** LaTeX (KaTeX, modo display). */
  tex: string;
}

export interface ExemploResolvido {
  /** Enunciado curto, markdown com $...$. */
  enunciado: string;
  passos: string[];
  /** Expressão mathjs que dá a resposta numérica. */
  conta: string;
  resposta: number;
  /** Como a resposta aparece no texto (ex.: "R$ 600"). */
  respostaTexto: string;
}

export interface Resumo {
  id: string;
  titulo: string;
  competencia: Competencia;
  habilidades: Habilidade[];
  /** Slugs de src/data/taxonomia.ts: ligam o resumo às questões do app. */
  assuntos: string[];
  incidencia: Incidencia;
  visual?: IdVisual;
  /** Frase curta do índice. */
  chamada: string;
  mapa: { centro: string; ramos: RamoMapa[] };
  formulas: Formula[];
  comoCobra: string;
  exemplo: ExemploResolvido;
  /** "**termo**: explicação" (o termo vira marca-texto). */
  pegadinhas: string[];
  truque: string;
  /** Anotações curtas na margem do caderno. */
  margem: string[];
}

export const RESUMOS: Resumo[] = [
  {
    id: "razao-proporcao",
    titulo: "Razão e proporção",
    competencia: "C4",
    habilidades: ["H15", "H16", "H17"],
    assuntos: ["razao-proporcao"],
    incidencia: "cai-muito",
    visual: "proporcao",
    chamada: "Comparar grandezas e dividir em partes proporcionais.",
    mapa: {
      centro: "Proporção",
      ramos: [
        { rotulo: "Razão", itens: ["a/b compara grandezas", "Densidade, velocidade", "Ordem importa"] },
        { rotulo: "Direta", itens: ["Uma sobe, outra sobe", "y = k·x", "Razão constante"] },
        { rotulo: "Inversa", itens: ["Uma sobe, outra desce", "x·y = k", "Produto constante"] },
        { rotulo: "Divisão", itens: ["Soma os pesos", "Parte = total·peso/soma"] },
      ],
    },
    formulas: [
      { rotulo: "Proporção", tex: "\\frac{a}{b}=\\frac{c}{d}\\iff a\\cdot d=b\\cdot c" },
      { rotulo: "Diretamente proporcionais", tex: "y=k\\,x" },
      { rotulo: "Inversamente proporcionais", tex: "x\\cdot y=k" },
      { rotulo: "Divisão proporcional", tex: "\\text{parte}_i=\\text{total}\\cdot\\frac{p_i}{p_1+p_2+\\dots+p_n}" },
    ],
    comoCobra:
      "Quase sempre num contexto do dia a dia: receita, mistura, consumo de combustível, divisão de lucro entre sócios. O ENEM pede para reconhecer se a relação é direta ou inversa antes de qualquer conta.",
    exemplo: {
      enunciado: "Três sócios investiram R\\$ 2 mil, R\\$ 3 mil e R\\$ 4 mil. O lucro de R\\$ 1.800 é dividido na proporção do investimento. Quanto recebe quem investiu R\\$ 3 mil?",
      passos: [
        "Some os pesos: $2+3+4=9$ partes.",
        "Valor de uma parte: $1800\\div 9=200$.",
        "Quem tem 3 partes recebe $3\\cdot 200=600$.",
      ],
      conta: "1800 * 3 / (2 + 3 + 4)",
      resposta: 600,
      respostaTexto: "R$ 600",
    },
    pegadinhas: [
      "**Inversa disfarçada**: mais torneiras enchem o tanque em menos tempo. Montar como direta dá a resposta errada.",
      "**Ordem da razão**: \"razão entre meninos e meninas\" é meninos sobre meninas, não o contrário.",
      "**Unidades diferentes**: compare g com g e min com min antes de montar a proporção.",
    ],
    truque: "Antes de escrever a conta, diga em voz alta: \"se dobrar isto, aquilo dobra ou cai pela metade?\". A resposta decide direta ou inversa.",
    margem: ["direta: divide", "inversa: multiplica", "soma dos pesos primeiro"],
  },
  {
    id: "regra-de-tres",
    titulo: "Regra de três simples e composta",
    competencia: "C4",
    habilidades: ["H16", "H17", "H18"],
    assuntos: ["regra-de-tres"],
    incidencia: "cai-muito",
    visual: "proporcao",
    chamada: "Três valores conhecidos, um desconhecido, e o sentido das setas.",
    mapa: {
      centro: "Regra de três",
      ramos: [
        { rotulo: "Simples", itens: ["Duas grandezas", "Multiplica cruzado"] },
        { rotulo: "Composta", itens: ["Três ou mais grandezas", "Compara cada uma com x"] },
        { rotulo: "Setas", itens: ["Mesmo sentido: direta", "Sentido oposto: inversa"] },
        { rotulo: "Conferir", itens: ["Resultado faz sentido?", "Mais máquinas, mais peças"] },
      ],
    },
    formulas: [
      { rotulo: "Simples direta", tex: "\\frac{a}{b}=\\frac{c}{x}\\Rightarrow x=\\frac{b\\cdot c}{a}" },
      { rotulo: "Simples inversa", tex: "a\\cdot b=c\\cdot x\\Rightarrow x=\\frac{a\\cdot b}{c}" },
      { rotulo: "Composta (fatores)", tex: "x=x_0\\cdot\\frac{\\text{novo}_1}{\\text{velho}_1}\\cdot\\frac{\\text{novo}_2}{\\text{velho}_2}\\;(\\text{inverta o fator se for inversa})" },
    ],
    comoCobra:
      "Produção de fábrica, obra com operários, consumo de ração ou de energia. Na composta, o ENEM mistura uma grandeza direta com uma inversa para ver se você confere cada uma separadamente.",
    exemplo: {
      enunciado: "Seis máquinas iguais produzem 900 peças em 5 horas. Quantas peças 4 dessas máquinas produzem em 8 horas?",
      passos: [
        "Compare cada grandeza com as peças: mais máquinas, mais peças (direta); mais horas, mais peças (direta).",
        "Ajuste pelas máquinas: $900\\cdot\\frac{4}{6}=600$ peças em 5 h.",
        "Ajuste pelo tempo: $600\\cdot\\frac{8}{5}=960$ peças.",
      ],
      conta: "900 * (4 / 6) * (8 / 5)",
      resposta: 960,
      respostaTexto: "960 peças",
    },
    pegadinhas: [
      "**Prazo e operários**: mais operários terminam em menos dias. É inversa, mesmo parecendo \"tudo cresce junto\".",
      "**Comparar com x**: na composta, cada grandeza se compara com a incógnita, nunca uma com a outra.",
      "**Horas e minutos**: 1 h 30 min é 1,5 h, não 1,3 h.",
    ],
    truque: "Na composta, faça em etapas como no exemplo: corrija uma grandeza por vez e confira se o número subiu ou desceu como deveria.",
    margem: ["uma grandeza por vez", "1h30 = 1,5 h"],
  },
  {
    id: "porcentagem",
    titulo: "Porcentagem e fator multiplicativo",
    competencia: "C1",
    habilidades: ["H3", "H4", "H5", "H16"],
    assuntos: ["porcentagem"],
    incidencia: "cai-muito",
    visual: "porcentagem",
    chamada: "Aumentos e descontos viram multiplicação.",
    mapa: {
      centro: "Porcentagem",
      ramos: [
        { rotulo: "Definição", itens: ["p% = p/100", "Parte de um todo"] },
        { rotulo: "Aumento", itens: ["Fator 1 + p/100", "+20% → × 1,2"] },
        { rotulo: "Desconto", itens: ["Fator 1 − p/100", "−15% → × 0,85"] },
        { rotulo: "Sucessivos", itens: ["Multiplica os fatores", "Nunca soma as taxas"] },
        { rotulo: "Variação", itens: ["(novo − velho)/velho", "Base é o valor antigo"] },
      ],
    },
    formulas: [
      { rotulo: "Parte", tex: "p\\%\\text{ de }V=\\frac{p}{100}\\cdot V" },
      { rotulo: "Aumento e desconto", tex: "V_{\\text{final}}=V\\cdot\\left(1\\pm\\frac{p}{100}\\right)" },
      { rotulo: "Variação percentual", tex: "\\Delta\\%=\\frac{V_{\\text{novo}}-V_{\\text{antigo}}}{V_{\\text{antigo}}}\\cdot 100" },
    ],
    comoCobra:
      "Promoções, reajustes de salário, inflação, participação de um grupo num total. O ENEM gosta de aumentos e descontos em sequência e de perguntar a variação percentual entre dois anos de uma tabela.",
    exemplo: {
      enunciado: "Um produto de R\\$ 250 sobe 20% e, no mês seguinte, cai 20%. Qual o preço final?",
      passos: [
        "Aumento de 20%: fator $1{,}2$. Desconto de 20%: fator $0{,}8$.",
        "Fator total: $1{,}2\\cdot 0{,}8=0{,}96$.",
        "Preço final: $250\\cdot 0{,}96=240$. Ficou 4% mais barato, não igual.",
      ],
      conta: "250 * 1.2 * 0.8",
      resposta: 240,
      respostaTexto: "R$ 240",
    },
    pegadinhas: [
      "**Sobe e desce o mesmo %**: não volta ao preço original. Sempre termina abaixo.",
      "**Base da variação**: a variação percentual divide pelo valor antigo, não pelo novo.",
      "**Pontos percentuais**: de 10% para 12% é +2 pontos percentuais, mas +20% em termos relativos.",
    ],
    truque: "Troque toda porcentagem por fator e multiplique. Três descontos de 10% dão $0{,}9^3\\approx 0{,}73$, ou seja, 27% de desconto, não 30%.",
    margem: ["+p% → ×(1+p/100)", "fatores multiplicam", "base = antigo"],
  },
  {
    id: "juros",
    titulo: "Juros simples e compostos",
    competencia: "C1",
    habilidades: ["H3", "H5", "H21"],
    assuntos: ["matematica-financeira"],
    incidencia: "cai-as-vezes",
    visual: "porcentagem",
    chamada: "Simples soma sempre o mesmo; composto rende sobre o rendido.",
    mapa: {
      centro: "Juros",
      ramos: [
        { rotulo: "Simples", itens: ["J = C·i·t", "Cresce em reta (PA)"] },
        { rotulo: "Compostos", itens: ["M = C·(1+i)^t", "Cresce como PG"] },
        { rotulo: "Taxa e tempo", itens: ["Mesma unidade", "% ao mês × meses"] },
        { rotulo: "Parcelas", itens: ["À vista vs. a prazo", "Compare no mesmo mês"] },
      ],
    },
    formulas: [
      { rotulo: "Juros simples", tex: "J=C\\cdot i\\cdot t\\qquad M=C\\,(1+i\\,t)" },
      { rotulo: "Juros compostos", tex: "M=C\\,(1+i)^{t}" },
    ],
    comoCobra:
      "Financiamento, cartão de crédito, aplicação na poupança, comparação entre pagar à vista com desconto ou parcelado. Em geral o tempo é curto (2 a 4 períodos) para dar para fazer à mão.",
    exemplo: {
      enunciado: "R\\$ 2.000 ficam aplicados a juros compostos de 10% ao mês por 3 meses. Qual o montante?",
      passos: [
        "Fator mensal: $1{,}1$.",
        "Três meses: $1{,}1^3=1{,}331$.",
        "Montante: $2000\\cdot 1{,}331=2662$. Nos juros simples seriam só R\\$ 2.600.",
      ],
      conta: "2000 * 1.1^3",
      resposta: 2662,
      respostaTexto: "R$ 2.662",
    },
    pegadinhas: [
      "**Taxa e tempo em unidades diferentes**: 12% ao ano não é 1% ao mês nos compostos.",
      "**Juros ou montante**: leia se pedem só os juros (M − C) ou o valor total.",
    ],
    truque: "Com poucos períodos, multiplique o fator passo a passo (2000 → 2200 → 2420 → 2662) em vez de calcular a potência.",
    margem: ["M = C + J", "1,1³ = 1,331"],
  },
  {
    id: "escala",
    titulo: "Escala de mapas e plantas",
    competencia: "C3",
    habilidades: ["H10", "H11", "H12", "H13"],
    assuntos: ["grandezas-unidades-escalas"],
    incidencia: "cai-muito",
    visual: "unidades",
    chamada: "Desenho sobre real, sempre na mesma unidade.",
    mapa: {
      centro: "Escala",
      ramos: [
        { rotulo: "Definição", itens: ["Desenho : real", "Mesma unidade"] },
        { rotulo: "Linear", itens: ["1 : 100 000", "1 cm = 1 km"] },
        { rotulo: "Área", itens: ["Escala ao quadrado", "1 : k² nas áreas"] },
        { rotulo: "Volume", itens: ["Escala ao cubo", "Maquetes"] },
      ],
    },
    formulas: [
      { rotulo: "Escala", tex: "E=\\frac{d_{\\text{desenho}}}{d_{\\text{real}}}" },
      { rotulo: "Áreas e volumes", tex: "\\frac{A_d}{A_r}=E^2\\qquad \\frac{V_d}{V_r}=E^3" },
    ],
    comoCobra:
      "Mapa de cidade, planta de casa, maquete, miniatura. O ENEM pede a distância real, a escala adequada para caber num papel ou a área real de um terreno desenhado.",
    exemplo: {
      enunciado: "Num mapa de escala 1 : 250 000, duas cidades estão a 6 cm. Qual a distância real, em km?",
      passos: [
        "Real em centímetros: $6\\cdot 250\\,000=1\\,500\\,000$ cm.",
        "1 km tem $100\\,000$ cm.",
        "Distância: $1\\,500\\,000\\div 100\\,000=15$ km.",
      ],
      conta: "6 * 250000 / 100000",
      resposta: 15,
      respostaTexto: "15 km",
    },
    pegadinhas: [
      "**Área não usa a escala direta**: na escala 1 : 100, 1 cm² do desenho vale 10 000 cm² (1 m²) de verdade.",
      "**Escala maior ou menor**: 1 : 500 é maior que 1 : 5 000 (mostra mais detalhe, cabe menos coisa).",
    ],
    truque: "Converta a escala para uma frase: \"1 : 250 000\" vira \"1 cm no mapa = 2,5 km\". Daí é só multiplicar.",
    margem: ["1 km = 100 000 cm", "área → E²"],
  },
  {
    id: "unidades",
    titulo: "Unidades de medida e conversões",
    competencia: "C3",
    habilidades: ["H10", "H11", "H13"],
    assuntos: ["grandezas-unidades-escalas"],
    incidencia: "cai-muito",
    visual: "unidades",
    chamada: "A escada do metro, do metro quadrado e do metro cúbico.",
    mapa: {
      centro: "Unidades",
      ramos: [
        { rotulo: "Comprimento", itens: ["km hm dam m dm cm mm", "Cada degrau × 10"] },
        { rotulo: "Área", itens: ["Cada degrau × 100", "1 m² = 10 000 cm²"] },
        { rotulo: "Volume", itens: ["Cada degrau × 1000", "1 m³ = 1000 L"] },
        { rotulo: "Capacidade", itens: ["1 L = 1 dm³", "1 mL = 1 cm³"] },
        { rotulo: "Tempo", itens: ["Base 60", "0,5 h = 30 min"] },
      ],
    },
    formulas: [
      { rotulo: "Volume e litro", tex: "1\\,\\text{m}^3=1000\\,\\text{L}\\qquad 1\\,\\text{dm}^3=1\\,\\text{L}" },
      { rotulo: "Área", tex: "1\\,\\text{m}^2=100^2\\,\\text{cm}^2=10\\,000\\,\\text{cm}^2" },
      { rotulo: "Velocidade", tex: "1\\,\\text{m/s}=3{,}6\\,\\text{km/h}" },
    ],
    comoCobra:
      "Caixa d'água, consumo de remédio em mL, área de piso em m² e azulejo em cm², velocidade em km/h. Quase toda questão de C3 esconde uma conversão no meio.",
    exemplo: {
      enunciado: "Uma caixa d'água tem a forma de um bloco de 1,2 m × 1 m × 0,5 m. Quantos litros ela comporta?",
      passos: [
        "Volume: $1{,}2\\cdot 1\\cdot 0{,}5=0{,}6$ m³.",
        "Cada m³ tem 1000 L.",
        "Capacidade: $0{,}6\\cdot 1000=600$ L.",
      ],
      conta: "1.2 * 1 * 0.5 * 1000",
      resposta: 600,
      respostaTexto: "600 L",
    },
    pegadinhas: [
      "**Área converte ao quadrado**: m² para cm² é × 10 000, não × 100.",
      "**Tempo não é decimal**: 2,25 h são 2 h 15 min.",
      "**Unidades misturadas**: um lado em metros e outro em centímetros. Converta tudo antes de multiplicar.",
    ],
    truque: "Desenhe a escada km → mm na margem e conte os degraus: × 10 por degrau no comprimento, × 100 na área, × 1000 no volume.",
    margem: ["m³ ↔ L: × 1000", "m/s × 3,6 = km/h"],
  },
  {
    id: "estatistica",
    titulo: "Média, moda, mediana e desvio padrão",
    competencia: "C7",
    habilidades: ["H27", "H28", "H30"],
    assuntos: ["estatistica-basica"],
    incidencia: "cai-muito",
    visual: "estatistica",
    chamada: "Medidas de centro e de dispersão de uma lista.",
    mapa: {
      centro: "Estatística",
      ramos: [
        { rotulo: "Média", itens: ["Soma ÷ quantidade", "Ponderada: pesos"] },
        { rotulo: "Mediana", itens: ["Ordene primeiro", "Par: média dos 2 do meio"] },
        { rotulo: "Moda", itens: ["Valor mais frequente", "Pode ter duas ou nenhuma"] },
        { rotulo: "Dispersão", itens: ["Variância", "Desvio = √variância", "Menor = mais regular"] },
      ],
    },
    formulas: [
      { rotulo: "Média aritmética", tex: "\\bar{x}=\\frac{x_1+x_2+\\dots+x_n}{n}" },
      { rotulo: "Média ponderada", tex: "\\bar{x}=\\frac{p_1x_1+\\dots+p_nx_n}{p_1+\\dots+p_n}" },
      { rotulo: "Variância e desvio padrão", tex: "\\sigma^2=\\frac{\\sum (x_i-\\bar{x})^2}{n}\\qquad \\sigma=\\sqrt{\\sigma^2}" },
    ],
    comoCobra:
      "Notas de candidatos, tempos de atletas, salários de uma empresa. O ENEM pede a mediana de uma tabela de frequência, a nota necessária para atingir uma média ou qual grupo é mais regular (menor desvio).",
    exemplo: {
      enunciado: "As notas de um aluno foram 3, 5, 5, 6, 8 e 9. Calcule média, moda, mediana e desvio padrão.",
      passos: [
        "Média: $\\frac{3+5+5+6+8+9}{6}=\\frac{36}{6}=6$.",
        "Moda: 5 (aparece duas vezes). Mediana: a lista já está em ordem; os do meio são 5 e 6, então $5{,}5$.",
        "Desvios ao quadrado: $9,1,1,0,4,9$; soma 24. Variância $24\\div 6=4$.",
        "Desvio padrão: $\\sqrt{4}=2$.",
      ],
      conta: "std([3, 5, 5, 6, 8, 9], 'uncorrected')",
      resposta: 2,
      respostaTexto: "média 6, moda 5, mediana 5,5, desvio 2",
    },
    pegadinhas: [
      "**Mediana sem ordenar**: pegar o valor do meio da lista como veio no enunciado.",
      "**Tabela de frequência**: o valor que aparece 4 vezes conta 4 vezes na média e na posição da mediana.",
      "**Valor extremo**: um salário enorme puxa a média, mas quase não mexe na mediana.",
    ],
    truque: "Para achar a nota que falta numa média, trabalhe com a soma: média 7 em 4 provas exige soma 28.",
    margem: ["ordene antes!", "média × n = soma", "σ pequeno = regular"],
  },
  {
    id: "graficos-tabelas",
    titulo: "Leitura de gráficos e tabelas",
    competencia: "C6",
    habilidades: ["H24", "H25", "H26"],
    assuntos: ["graficos-tabelas", "leitura-grafico-funcao"],
    incidencia: "cai-muito",
    visual: "graficos",
    chamada: "Ler o eixo, comparar barras e calcular variações.",
    mapa: {
      centro: "Gráficos",
      ramos: [
        { rotulo: "Antes de ler", itens: ["Título e unidade", "Escala do eixo"] },
        { rotulo: "Tipos", itens: ["Barras: comparar", "Linha: evolução", "Setores: partes"] },
        { rotulo: "Contas", itens: ["Diferença absoluta", "Variação percentual"] },
        { rotulo: "Tendência", itens: ["Maior crescimento", "Inclinação da linha"] },
      ],
    },
    formulas: [
      { rotulo: "Variação percentual", tex: "\\Delta\\%=\\frac{\\text{final}-\\text{inicial}}{\\text{inicial}}\\cdot 100" },
      { rotulo: "Setor circular", tex: "\\text{ângulo}=\\frac{\\text{parte}}{\\text{total}}\\cdot 360^\\circ" },
    ],
    comoCobra:
      "A informação está toda na figura: o ENEM pede o período de maior aumento, a diferença entre dois grupos ou se uma conclusão é coerente com os dados. A conta é leve; o erro costuma estar na leitura.",
    exemplo: {
      enunciado: "Uma loja vendeu 120 unidades em janeiro, 150 em fevereiro e 135 em março. Qual a variação percentual de fevereiro para março?",
      passos: [
        "Inicial é fevereiro (150) e final é março (135).",
        "Diferença: $135-150=-15$.",
        "Variação: $\\frac{-15}{150}=-0{,}10$, ou seja, queda de 10%.",
      ],
      conta: "(135 - 150) / 150 * 100",
      resposta: -10,
      respostaTexto: "queda de 10%",
    },
    pegadinhas: [
      "**Eixo que não começa no zero**: a barra parece o dobro, mas o valor pode ser só um pouco maior.",
      "**Maior valor ou maior aumento**: o mês com mais vendas não é necessariamente o que mais cresceu.",
      "**Legenda trocada**: confira qual cor é qual série antes de ler.",
    ],
    truque: "Escreva a unidade do eixo ao lado de cada número que você tirar do gráfico (mil, %, milhões). Metade dos erros some.",
    margem: ["base = inicial", "olhe o zero do eixo"],
  },
  {
    id: "geometria-plana",
    titulo: "Geometria plana: áreas e perímetros",
    competencia: "C2",
    habilidades: ["H7", "H8", "H12", "H14"],
    assuntos: ["geometria-plana", "semelhanca-pitagoras"],
    incidencia: "cai-muito",
    visual: "area",
    chamada: "Contorno é perímetro; o que cobre é área.",
    mapa: {
      centro: "Geometria plana",
      ramos: [
        { rotulo: "Perímetro", itens: ["Soma dos lados", "Círculo: 2πr"] },
        { rotulo: "Quadriláteros", itens: ["Retângulo: b·h", "Trapézio: (B+b)h/2"] },
        { rotulo: "Triângulo", itens: ["b·h/2", "Pitágoras a² = b² + c²"] },
        { rotulo: "Círculo", itens: ["Área πr²", "Use o π do enunciado"] },
        { rotulo: "Composta", itens: ["Recorte em partes", "Total menos o furo"] },
      ],
    },
    formulas: [
      { rotulo: "Retângulo e triângulo", tex: "A_{\\text{ret}}=b\\cdot h\\qquad A_{\\triangle}=\\frac{b\\cdot h}{2}" },
      { rotulo: "Trapézio", tex: "A=\\frac{(B+b)\\cdot h}{2}" },
      { rotulo: "Círculo", tex: "A=\\pi r^2\\qquad C=2\\pi r" },
      { rotulo: "Pitágoras", tex: "a^2=b^2+c^2" },
    ],
    comoCobra:
      "Pisos, terrenos, cercas, jardins, quantidade de tinta ou de grama. O ENEM combina figuras simples e pede a área que sobra, o custo do material ou quantas peças cabem.",
    exemplo: {
      enunciado: "Um terreno retangular de 20 m por 12 m terá um canteiro circular de raio 3 m. Use $\\pi=3$. Qual a área livre?",
      passos: [
        "Área do terreno: $20\\cdot 12=240$ m².",
        "Área do canteiro: $3\\cdot 3^2=27$ m².",
        "Área livre: $240-27=213$ m².",
      ],
      conta: "20 * 12 - 3 * 3^2",
      resposta: 213,
      respostaTexto: "213 m²",
    },
    pegadinhas: [
      "**Raio ou diâmetro**: o enunciado dá o diâmetro e a fórmula pede o raio (metade).",
      "**Dobrar o lado quadruplica a área**: área cresce com o quadrado da medida.",
      "**Valor de π**: use exatamente o que o enunciado manda (3 ou 3,14).",
    ],
    truque: "Em figura estranha, recorte em retângulos e triângulos, ou calcule o retângulo inteiro e subtraia o que falta.",
    margem: ["d = 2r", "lado ×2 → área ×4", "3-4-5"],
  },
  {
    id: "geometria-espacial",
    titulo: "Geometria espacial: volumes e planificações",
    competencia: "C2",
    habilidades: ["H6", "H7", "H14"],
    assuntos: ["geometria-espacial"],
    incidencia: "cai-muito",
    chamada: "Base vezes altura, e o sólido aberto no papel.",
    mapa: {
      centro: "Espacial",
      ramos: [
        { rotulo: "Prismas", itens: ["V = A_base · h", "Bloco: a·b·c"] },
        { rotulo: "Cilindro", itens: ["V = πr²h", "Lateral: retângulo"] },
        { rotulo: "Pontiagudos", itens: ["Pirâmide e cone", "V = A_base·h/3"] },
        { rotulo: "Esfera", itens: ["V = 4πr³/3", "Área 4πr²"] },
        { rotulo: "Planificação", itens: ["Conte as faces", "Cone: setor + círculo"] },
      ],
    },
    formulas: [
      { rotulo: "Prisma e cilindro", tex: "V=A_{\\text{base}}\\cdot h\\qquad V_{\\text{cil}}=\\pi r^2 h" },
      { rotulo: "Pirâmide e cone", tex: "V=\\frac{A_{\\text{base}}\\cdot h}{3}" },
      { rotulo: "Esfera", tex: "V=\\frac{4}{3}\\pi r^3\\qquad A=4\\pi r^2" },
    ],
    comoCobra:
      "Embalagens, reservatórios, piscinas, silos. Cobra volume com conversão para litros, qual planificação monta o sólido e a vista de cima ou de lado de um objeto (H6).",
    exemplo: {
      enunciado: "Um reservatório cilíndrico tem raio 2 m e altura 3 m. Use $\\pi=3$. Quantos litros ele comporta?",
      passos: [
        "Área da base: $3\\cdot 2^2=12$ m².",
        "Volume: $12\\cdot 3=36$ m³.",
        "Em litros: $36\\cdot 1000=36\\,000$ L.",
      ],
      conta: "3 * 2^2 * 3 * 1000",
      resposta: 36000,
      respostaTexto: "36 000 L",
    },
    pegadinhas: [
      "**Esquecer o 1/3**: cone e pirâmide têm um terço do volume do cilindro ou prisma de mesma base e altura.",
      "**Raio dobrado**: no cilindro, dobrar o raio multiplica o volume por 4; na esfera, por 8.",
      "**Planificação do cubo**: seis quadrados, mas nem todo arranjo de seis fecha um cubo.",
    ],
    truque: "Pense sempre \"área da base × altura\". Só os pontiagudos dividem por 3, e a esfera é a exceção que vale decorar.",
    margem: ["÷3 nos pontudos", "m³ → × 1000 L"],
  },
  {
    id: "probabilidade",
    titulo: "Probabilidade",
    competencia: "C7",
    habilidades: ["H28", "H29", "H30"],
    assuntos: ["probabilidade"],
    incidencia: "cai-muito",
    visual: "probabilidade",
    chamada: "Casos favoráveis sobre casos possíveis.",
    mapa: {
      centro: "Probabilidade",
      ramos: [
        { rotulo: "Básica", itens: ["Favoráveis ÷ possíveis", "Entre 0 e 1"] },
        { rotulo: "Complementar", itens: ["P(não A) = 1 − P(A)", "\"Pelo menos um\""] },
        { rotulo: "E (sucessivos)", itens: ["Multiplica", "Com ou sem reposição"] },
        { rotulo: "OU", itens: ["Soma", "Tira a interseção"] },
        { rotulo: "Condicional", itens: ["Espaço encolhe", "\"Sabendo que...\""] },
      ],
    },
    formulas: [
      { rotulo: "Definição", tex: "P(A)=\\frac{n(A)}{n(\\Omega)}" },
      { rotulo: "Complementar", tex: "P(\\bar{A})=1-P(A)" },
      { rotulo: "União", tex: "P(A\\cup B)=P(A)+P(B)-P(A\\cap B)" },
      { rotulo: "Eventos independentes", tex: "P(A\\cap B)=P(A)\\cdot P(B)" },
      { rotulo: "Condicional", tex: "P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}" },
    ],
    comoCobra:
      "Sorteios, dados, exames médicos, rifas, escolha de caminho. Muitas vezes a questão compara a chance de duas opções e pede a mais vantajosa.",
    exemplo: {
      enunciado: "Dois dados comuns são lançados. Qual a probabilidade de a soma ser 7?",
      passos: [
        "Casos possíveis: $6\\cdot 6=36$.",
        "Favoráveis: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1), ou seja, 6.",
        "Probabilidade: $\\frac{6}{36}=\\frac{1}{6}\\approx 16{,}7\\%$.",
      ],
      conta: "6 / 36",
      resposta: 1 / 6,
      respostaTexto: "1/6",
    },
    pegadinhas: [
      "**Pelo menos um**: calcule o contrário (nenhum) e faça 1 menos. Chance de pelo menos um 6 em dois dados é $1-\\frac{25}{36}=\\frac{11}{36}$.",
      "**Sem reposição**: o total diminui a cada retirada.",
      "**(2,5) e (5,2)**: são casos diferentes nos dados.",
    ],
    truque: "Quando aparecer \"pelo menos\", vá direto para o complementar.",
    margem: ["pelo menos → 1 − P(nenhum)", "E → ×, OU → +"],
  },
  {
    id: "combinatoria",
    titulo: "Análise combinatória",
    competencia: "C1",
    habilidades: ["H2", "H3"],
    assuntos: ["analise-combinatoria"],
    incidencia: "cai-as-vezes",
    chamada: "Contar sem listar: a ordem importa ou não?",
    mapa: {
      centro: "Contagem",
      ramos: [
        { rotulo: "Princípio", itens: ["Etapas multiplicam", "Desenhe os tracinhos"] },
        { rotulo: "Arranjo", itens: ["Ordem importa", "Senhas, pódios"] },
        { rotulo: "Combinação", itens: ["Ordem não importa", "Grupos, comissões"] },
        { rotulo: "Permutação", itens: ["Todos em fila: n!", "Repetidos: divide"] },
      ],
    },
    formulas: [
      { rotulo: "Permutação", tex: "P_n=n!" },
      { rotulo: "Arranjo", tex: "A_{n,p}=\\frac{n!}{(n-p)!}" },
      { rotulo: "Combinação", tex: "C_{n,p}=\\binom{n}{p}=\\frac{n!}{p!\\,(n-p)!}" },
      { rotulo: "Permutação com repetição", tex: "P_n^{a,b}=\\frac{n!}{a!\\,b!}" },
    ],
    comoCobra:
      "Senhas, placas, cardápios, anagramas, formação de times e comissões. A pergunta central é sempre se trocar a ordem gera uma possibilidade nova.",
    exemplo: {
      enunciado: "De um grupo de 8 pessoas, quantas comissões de 3 pessoas podem ser formadas?",
      passos: [
        "Trocar a ordem dos escolhidos não cria comissão nova: é combinação.",
        "Se a ordem importasse: $8\\cdot 7\\cdot 6=336$.",
        "Cada grupo foi contado $3!=6$ vezes: $336\\div 6=56$.",
      ],
      conta: "combinations(8, 3)",
      resposta: 56,
      respostaTexto: "56 comissões",
    },
    pegadinhas: [
      "**Presidente e vice**: cargos diferentes, então a ordem importa (arranjo).",
      "**Letras repetidas**: anagramas de ARARA são $\\frac{5!}{3!\\,2!}=10$, não 120.",
      "**Zero na frente**: números de 3 algarismos não começam com 0.",
    ],
    truque: "Desenhe um tracinho por posição, escreva quantas opções cabem em cada um e multiplique. Se a ordem não importa, divida pelo fatorial do tamanho do grupo.",
    margem: ["ordem importa? A : C", "3! = 6"],
  },
  {
    id: "funcao-afim",
    titulo: "Função afim (1º grau)",
    competencia: "C5",
    habilidades: ["H15", "H19", "H20", "H21"],
    assuntos: ["funcao-afim", "equacao-1-grau", "leitura-grafico-funcao"],
    incidencia: "cai-muito",
    visual: "graficos",
    chamada: "Valor fixo mais taxa constante: o gráfico é uma reta.",
    mapa: {
      centro: "Função afim",
      ramos: [
        { rotulo: "Coeficiente a", itens: ["Taxa de variação", "a > 0 sobe, a < 0 desce"] },
        { rotulo: "Coeficiente b", itens: ["Valor fixo", "Onde corta o eixo y"] },
        { rotulo: "Raiz", itens: ["f(x) = 0", "x = −b/a"] },
        { rotulo: "Dois pontos", itens: ["a = Δy/Δx", "Depois acha b"] },
      ],
    },
    formulas: [
      { rotulo: "Lei", tex: "f(x)=a\\,x+b" },
      { rotulo: "Taxa de variação", tex: "a=\\frac{y_2-y_1}{x_2-x_1}" },
      { rotulo: "Raiz", tex: "x=-\\frac{b}{a}" },
    ],
    comoCobra:
      "Tarifas (táxi, conta de luz, plano de celular), comparação de dois planos, gráfico de reta com dois pontos marcados. O ENEM pede a lei, o valor para certo x ou a partir de quando um plano fica mais barato.",
    exemplo: {
      enunciado: "Um táxi cobra R\\$ 5,00 de bandeirada e R\\$ 2,50 por km. Uma corrida custou R\\$ 30,00. Quantos km foram rodados?",
      passos: [
        "Lei: $f(x)=2{,}5x+5$.",
        "Igualar: $2{,}5x+5=30\\Rightarrow 2{,}5x=25$.",
        "$x=25\\div 2{,}5=10$ km.",
      ],
      conta: "(30 - 5) / 2.5",
      resposta: 10,
      respostaTexto: "10 km",
    },
    pegadinhas: [
      "**Trocar a e b**: o valor fixo é b; o que multiplica x é a taxa.",
      "**Plano mais barato**: depende do x. Iguale as duas leis para achar o ponto de virada.",
    ],
    truque: "Com dois pontos do gráfico, ache a taxa (Δy/Δx) e depois substitua um ponto para achar b. Não precisa decorar nada além disso.",
    margem: ["b = valor fixo", "a = Δy/Δx"],
  },
  {
    id: "funcao-quadratica",
    titulo: "Função quadrática (2º grau)",
    competencia: "C5",
    habilidades: ["H19", "H21", "H22"],
    assuntos: ["funcao-quadratica", "equacao-2-grau"],
    incidencia: "cai-as-vezes",
    chamada: "Parábola, raízes e o vértice como máximo ou mínimo.",
    mapa: {
      centro: "Função quadrática",
      ramos: [
        { rotulo: "Concavidade", itens: ["a > 0: mínimo", "a < 0: máximo"] },
        { rotulo: "Raízes", itens: ["Bhaskara", "Δ = b² − 4ac"] },
        { rotulo: "Vértice", itens: ["xv = −b/2a", "Máximo ou mínimo"] },
        { rotulo: "Contexto", itens: ["Lucro máximo", "Altura de um lançamento"] },
      ],
    },
    formulas: [
      { rotulo: "Bhaskara", tex: "x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a},\\quad \\Delta=b^2-4ac" },
      { rotulo: "Vértice", tex: "x_v=-\\frac{b}{2a}\\qquad y_v=-\\frac{\\Delta}{4a}" },
    ],
    comoCobra:
      "Lucro em função do preço, trajetória de uma bola, área máxima de um cercado. Quase sempre a pergunta é o máximo ou o mínimo, ou seja, o vértice.",
    exemplo: {
      enunciado: "O lucro de uma empresa é $L(x)=-x^2+40x-300$, em mil reais, com $x$ em milhares de peças. Qual o lucro máximo?",
      passos: [
        "$a=-1<0$: a parábola tem máximo no vértice.",
        "$x_v=-\\frac{40}{2\\cdot(-1)}=20$.",
        "$L(20)=-400+800-300=100$, ou seja, 100 mil reais.",
      ],
      conta: "-(20^2) + 40 * 20 - 300",
      resposta: 100,
      respostaTexto: "100 mil reais (em x = 20)",
    },
    pegadinhas: [
      "**x ou y do vértice**: \"para qual preço\" pede $x_v$; \"qual o lucro máximo\" pede $y_v$.",
      "**Sinal de −b**: com b negativo, $-b$ fica positivo.",
    ],
    truque: "O vértice está no meio das raízes: se as raízes são 10 e 30, $x_v=20$ sem fórmula nenhuma.",
    margem: ["xv = média das raízes", "a < 0 → ∩"],
  },
  {
    id: "exponencial-log",
    titulo: "Função exponencial e logaritmo",
    competencia: "C5",
    habilidades: ["H19", "H21"],
    assuntos: ["progressao-geometrica", "polinomios-funcoes-outras"],
    incidencia: "cai-as-vezes",
    chamada: "Crescimento que dobra, decaimento que cai pela metade.",
    mapa: {
      centro: "Exponencial",
      ramos: [
        { rotulo: "Lei", itens: ["f(t) = f₀ · q^t", "q > 1 cresce"] },
        { rotulo: "Decaimento", itens: ["0 < q < 1", "Meia-vida"] },
        { rotulo: "Logaritmo", itens: ["Pergunta o expoente", "log₂ 8 = 3"] },
        { rotulo: "Propriedades", itens: ["log(a·b) = log a + log b", "log aⁿ = n·log a"] },
      ],
    },
    formulas: [
      { rotulo: "Crescimento", tex: "N(t)=N_0\\cdot q^{\\,t/T}" },
      { rotulo: "Definição de log", tex: "\\log_b a=x\\iff b^x=a" },
      { rotulo: "Propriedades", tex: "\\log(a\\,b)=\\log a+\\log b\\qquad \\log a^n=n\\log a" },
    ],
    comoCobra:
      "Bactérias, população, meia-vida de remédio ou material radioativo, escala de terremotos e pH. Quando o expoente é a incógnita, o ENEM costuma dar o valor de um log no enunciado.",
    exemplo: {
      enunciado: "Uma cultura começa com 500 bactérias e dobra a cada 3 horas. Em quantas horas chega a 8.000?",
      passos: [
        "Quantas vezes dobrou: $8000\\div 500=16=2^4$.",
        "Foram 4 dobras.",
        "Tempo: $4\\cdot 3=12$ horas.",
      ],
      conta: "log2(8000 / 500) * 3",
      resposta: 12,
      respostaTexto: "12 horas",
    },
    pegadinhas: [
      "**Período de dobra**: dobrar a cada 3 h é $2^{t/3}$, não $2^t$.",
      "**Crescer não é linear**: em 6 h a cultura fica 4 vezes maior, não 2 vezes.",
    ],
    truque: "Divida o final pelo inicial e escreva como potência da base (16 = 2⁴). O expoente diz quantos períodos passaram.",
    margem: ["log pergunta o expoente", "2¹⁰ ≈ 1000"],
  },
  {
    id: "sequencias",
    titulo: "Sequências: PA e PG",
    competencia: "C1",
    habilidades: ["H2", "H3"],
    assuntos: ["sequencias-pa", "progressao-geometrica"],
    incidencia: "cai-as-vezes",
    chamada: "Somar sempre o mesmo ou multiplicar sempre pelo mesmo.",
    mapa: {
      centro: "Sequências",
      ramos: [
        { rotulo: "PA", itens: ["Soma razão r", "aₙ = a₁ + (n−1)r"] },
        { rotulo: "Soma da PA", itens: ["(a₁ + aₙ)·n/2", "Primeiro + último"] },
        { rotulo: "PG", itens: ["Multiplica razão q", "aₙ = a₁·qⁿ⁻¹"] },
        { rotulo: "Padrões", itens: ["Figuras que crescem", "Conte os primeiros"] },
      ],
    },
    formulas: [
      { rotulo: "Termo da PA", tex: "a_n=a_1+(n-1)\\,r" },
      { rotulo: "Soma da PA", tex: "S_n=\\frac{(a_1+a_n)\\,n}{2}" },
      { rotulo: "Termo da PG", tex: "a_n=a_1\\cdot q^{\\,n-1}" },
      { rotulo: "Soma da PG", tex: "S_n=\\frac{a_1\\,(q^n-1)}{q-1}" },
    ],
    comoCobra:
      "Poupança com aumento fixo, empilhamento de latas, padrões de figuras com palitos, treino que aumenta toda semana. Em geral o ENEM pede um termo distante ou a soma total.",
    exemplo: {
      enunciado: "Uma pessoa guarda R\\$ 50 no 1º mês e, a cada mês, R\\$ 10 a mais que no anterior. Quanto terá guardado em 12 meses?",
      passos: [
        "PA com $a_1=50$ e $r=10$.",
        "12º termo: $a_{12}=50+11\\cdot 10=160$.",
        "Soma: $S_{12}=\\frac{(50+160)\\cdot 12}{2}=1260$.",
      ],
      conta: "(50 + (50 + 11 * 10)) * 12 / 2",
      resposta: 1260,
      respostaTexto: "R$ 1.260",
    },
    pegadinhas: [
      "**n − 1 razões**: do 1º ao 12º termo são 11 saltos, não 12.",
      "**Termo ou soma**: \"quanto guardou no 12º mês\" é $a_{12}$; \"quanto guardou no total\" é $S_{12}$.",
    ],
    truque: "Na soma da PA, junte o primeiro com o último (50 + 160), o segundo com o penúltimo, e assim vai: todos os pares dão o mesmo.",
    margem: ["saltos = n − 1", "primeiro + último"],
  },
  {
    id: "trigonometria",
    titulo: "Trigonometria no triângulo retângulo",
    competencia: "C2",
    habilidades: ["H7", "H8", "H12"],
    assuntos: ["trigonometria", "semelhanca-pitagoras"],
    incidencia: "cai-as-vezes",
    chamada: "Seno, cosseno e tangente para alturas e distâncias.",
    mapa: {
      centro: "Trigonometria",
      ramos: [
        { rotulo: "Seno", itens: ["Oposto ÷ hipotenusa", "sen 30° = 1/2"] },
        { rotulo: "Cosseno", itens: ["Adjacente ÷ hipotenusa", "cos 60° = 1/2"] },
        { rotulo: "Tangente", itens: ["Oposto ÷ adjacente", "tg 45° = 1"] },
        { rotulo: "Contexto", itens: ["Rampas e escadas", "Altura de prédio"] },
      ],
    },
    formulas: [
      { rotulo: "Razões", tex: "\\operatorname{sen}\\theta=\\frac{\\text{op}}{\\text{hip}}\\quad \\cos\\theta=\\frac{\\text{adj}}{\\text{hip}}\\quad \\operatorname{tg}\\theta=\\frac{\\text{op}}{\\text{adj}}" },
      { rotulo: "Ângulos notáveis", tex: "\\operatorname{sen}30^\\circ=\\tfrac12,\\ \\operatorname{sen}45^\\circ=\\tfrac{\\sqrt2}{2},\\ \\operatorname{sen}60^\\circ=\\tfrac{\\sqrt3}{2}" },
      { rotulo: "Relação fundamental", tex: "\\operatorname{sen}^2\\theta+\\cos^2\\theta=1" },
    ],
    comoCobra:
      "Rampas de acessibilidade, escadas encostadas na parede, sombra de um poste, altura vista sob certo ângulo. Costuma vir com os valores de seno e cosseno no enunciado.",
    exemplo: {
      enunciado: "Uma rampa reta de 10 m de comprimento faz 30° com o chão. Qual a altura que ela vence?",
      passos: [
        "A rampa é a hipotenusa; a altura é o cateto oposto ao ângulo de 30°.",
        "$\\operatorname{sen}30^\\circ=\\frac{h}{10}$.",
        "$h=10\\cdot\\frac{1}{2}=5$ m.",
      ],
      conta: "10 * sin(30 deg)",
      resposta: 5,
      respostaTexto: "5 m",
    },
    pegadinhas: [
      "**Oposto ou adjacente**: depende de qual ângulo você está olhando. Marque o ângulo no desenho antes.",
      "**Altura do observador**: em \"altura do prédio vista por uma pessoa\", some a altura dos olhos dela.",
    ],
    truque: "Decore só a linha 1/2, √2/2, √3/2 do seno (30°, 45°, 60°). O cosseno é a mesma linha ao contrário.",
    margem: ["SOH CAH TOA", "cos = seno ao contrário"],
  },
  {
    id: "potencias",
    titulo: "Potências e notação científica",
    competencia: "C1",
    habilidades: ["H1", "H3", "H4"],
    assuntos: ["numeros-operacoes"],
    incidencia: "cai-as-vezes",
    visual: "fracoes",
    chamada: "Números enormes e minúsculos escritos com potência de 10.",
    mapa: {
      centro: "Potências",
      ramos: [
        { rotulo: "Propriedades", itens: ["aᵐ·aⁿ = aᵐ⁺ⁿ", "aᵐ ÷ aⁿ = aᵐ⁻ⁿ", "(aᵐ)ⁿ = aᵐⁿ"] },
        { rotulo: "Notação científica", itens: ["a × 10ⁿ", "1 ≤ a < 10"] },
        { rotulo: "Prefixos", itens: ["kilo 10³, mega 10⁶", "micro 10⁻⁶, nano 10⁻⁹"] },
        { rotulo: "Ordem de grandeza", itens: ["Potência de 10 mais perto", "Estimar antes de calcular"] },
      ],
    },
    formulas: [
      { rotulo: "Propriedades", tex: "a^m\\cdot a^n=a^{m+n}\\qquad \\frac{a^m}{a^n}=a^{m-n}\\qquad (a^m)^n=a^{m\\cdot n}" },
      { rotulo: "Notação científica", tex: "N=a\\times 10^{n},\\quad 1\\le a<10" },
      { rotulo: "Expoente negativo", tex: "a^{-n}=\\frac{1}{a^n}" },
    ],
    comoCobra:
      "Distâncias astronômicas, tamanho de vírus, capacidade de memória, população mundial. O ENEM pede para escrever em notação científica ou comparar ordens de grandeza.",
    exemplo: {
      enunciado: "A luz percorre cerca de $3\\times 10^5$ km por segundo e a distância da Terra ao Sol é cerca de $1{,}5\\times 10^8$ km. Quanto tempo a luz do Sol leva para chegar aqui?",
      passos: [
        "Tempo = distância ÷ velocidade: $\\frac{1{,}5\\times 10^8}{3\\times 10^5}$.",
        "Divida as mantissas e subtraia os expoentes: $0{,}5\\times 10^3=500$ s.",
        "Em minutos: $500\\div 60\\approx 8{,}3$ min.",
      ],
      conta: "1.5e8 / 3e5",
      resposta: 500,
      respostaTexto: "500 s (cerca de 8 min)",
    },
    pegadinhas: [
      "**Mantissa fora do intervalo**: $25\\times 10^3$ não está em notação científica; o certo é $2{,}5\\times 10^4$.",
      "**Somar potências**: $10^3+10^3=2\\times 10^3$, não $10^6$.",
    ],
    truque: "Ao mover a vírgula para a esquerda, o expoente sobe; para a direita, desce. Uma casa, uma unidade.",
    margem: ["vírgula ← expoente +", "1 ≤ a < 10"],
  },
];

const porId = new Map(RESUMOS.map((r) => [r.id, r]));

export function resumoPorId(id: string): Resumo | undefined {
  return porId.get(id);
}
