/**
 * Legenda de cada fórmula dos resumos: o que cada letra significa, a unidade (quando faz sentido)
 * e "quando usar" em uma linha. Separada de conteudo.ts para o texto do resumo continuar legível.
 * Chave: id do resumo → rótulo da fórmula. O teste confere, por `simbolosDoTex`, que toda letra da
 * fórmula aparece na legenda e que a legenda não explica letra que não está na fórmula.
 */

export interface ItemLegenda {
  /** LaTeX do símbolo (KaTeX inline). */
  simbolo: string;
  significado: string;
  unidade?: string;
}

export interface Legenda {
  quandoUsar: string;
  itens: ItemLegenda[];
}

const i = (simbolo: string, significado: string, unidade?: string): ItemLegenda => (unidade ? { simbolo, significado, unidade } : { simbolo, significado });
const r = String.raw;

export const LEGENDAS: Record<string, Record<string, Legenda>> = {
  "razao-proporcao": {
    Proporção: {
      quandoUsar: "Duas razões iguais com um valor faltando: multiplique cruzado.",
      itens: [i("a, b", "a primeira razão (a sobre b)"), i("c, d", "a segunda razão (c sobre d)"), i(r`\iff`, "\"é o mesmo que\": vale nos dois sentidos")],
    },
    "Diretamente proporcionais": {
      quandoUsar: "Uma grandeza dobra e a outra dobra junto (preço e quantidade).",
      itens: [i("x", "a grandeza que você muda"), i("y", "a grandeza que acompanha"), i("k", "a constante: quanto vale y para cada 1 de x")],
    },
    "Inversamente proporcionais": {
      quandoUsar: "Uma dobra e a outra cai pela metade (operários e dias).",
      itens: [i("x, y", "as duas grandezas"), i("k", "o produto que nunca muda")],
    },
    "Divisão proporcional": {
      quandoUsar: "Dividir um total em partes com pesos (lucro entre sócios).",
      itens: [
        i(r`\text{parte}_i`, "o que cabe ao i-ésimo"),
        i(r`\text{total}`, "o valor a dividir"),
        i(r`p_i`, "o peso de quem você quer (investimento, idade…)"),
        i(r`p_1+\dots+p_n`, "a soma de todos os pesos; n é quantos são"),
      ],
    },
  },
  "regra-de-tres": {
    "Simples direta": {
      quandoUsar: "Duas grandezas que sobem juntas e um valor faltando.",
      itens: [i("a, b", "o par que você já conhece"), i("c", "o valor novo da grandeza de a"), i("x", "o valor que falta (par de c)"), i(r`\Rightarrow`, "\"então\"")],
    },
    "Simples inversa": {
      quandoUsar: "Uma sobe e a outra desce: o produto fica igual.",
      itens: [i("a, b", "o par conhecido"), i("c", "o valor novo da grandeza de a"), i("x", "o valor que falta")],
    },
    "Composta (fatores)": {
      quandoUsar: "Três ou mais grandezas: corrija uma de cada vez.",
      itens: [
        i("x", "o valor procurado"),
        i("x_0", "o valor que você já conhece da grandeza procurada"),
        i(r`\text{novo}_1`, "o valor novo da 1ª grandeza (idem para a 2ª)"),
        i(r`\text{velho}_1`, "o valor antigo da 1ª grandeza (idem para a 2ª)"),
      ],
    },
  },
  porcentagem: {
    Parte: {
      quandoUsar: "Achar quanto é uma porcentagem de um valor.",
      itens: [i("p", "a porcentagem, o número antes do %"), i(r`\%`, "\"por cem\": divide por 100"), i("V", "o valor inteiro (o todo)")],
    },
    "Aumento e desconto": {
      quandoUsar: "Preço que sobe ou cai uma porcentagem; em sequência, multiplique os fatores.",
      itens: [
        i("V", "valor inicial (antes do aumento ou desconto)"),
        i("p", "a porcentagem, o número antes do %"),
        i(r`V_{\text{final}}`, "valor depois da mudança"),
        i(r`\pm`, "+ para aumento, − para desconto"),
      ],
    },
    "Variação percentual": {
      quandoUsar: "Quanto % algo subiu ou caiu entre dois momentos.",
      itens: [
        i(r`\Delta\%`, "a variação em porcentagem (Δ, delta, é \"variação\")", "%"),
        i(r`V_{\text{novo}}`, "o valor depois"),
        i(r`V_{\text{antigo}}`, "o valor antes: é a base da divisão"),
      ],
    },
  },
  juros: {
    "Juros simples": {
      quandoUsar: "O juro de cada período é sempre sobre o capital inicial.",
      itens: [
        i("J", "os juros (só o que rendeu)", "R$"),
        i("C", "o capital: o valor aplicado ou emprestado", "R$"),
        i("i", "a taxa por período, em decimal (5% = 0,05)"),
        i("t", "o número de períodos, na mesma unidade da taxa"),
        i("M", "o montante: capital + juros", "R$"),
      ],
    },
    "Juros compostos": {
      quandoUsar: "Juro sobre juro: financiamento, poupança, cartão.",
      itens: [
        i("M", "o montante final", "R$"),
        i("C", "o capital inicial", "R$"),
        i("i", "a taxa por período, em decimal"),
        i("t", "o número de períodos (vira expoente)"),
      ],
    },
  },
  escala: {
    Escala: {
      quandoUsar: "Converter medida do mapa ou planta em medida real (ou o contrário).",
      itens: [
        i("E", "a escala, ex.: 1:500 = 1/500"),
        i(r`d_{\text{desenho}}`, "a medida no mapa ou planta", "mesma unidade de d real"),
        i(r`d_{\text{real}}`, "a medida de verdade"),
      ],
    },
    "Áreas e volumes": {
      quandoUsar: "Área ou volume de maquete e planta: a escala vai ao quadrado ou ao cubo.",
      itens: [
        i("E", "a escala de comprimento"),
        i("A_d, A_r", "área no desenho e área real"),
        i("V_d, V_r", "volume no desenho e volume real"),
      ],
    },
  },
  unidades: {
    "Volume e litro": {
      quandoUsar: "Caixa d'água, piscina, consumo: passar de m³ para litros.",
      itens: [
        i(r`\text{m}^3`, "metro cúbico: cubo de 1 m de lado"),
        i(r`\text{dm}^3`, "decímetro cúbico: cubo de 10 cm de lado"),
        i(r`\text{L}`, "litro: cabe exatamente em 1 dm³"),
      ],
    },
    Área: {
      quandoUsar: "Converter área: o fator de comprimento vai ao quadrado.",
      itens: [i(r`\text{m}^2`, "metro quadrado"), i(r`\text{cm}^2`, "centímetro quadrado; 1 m = 100 cm, então 1 m² = 100² cm²")],
    },
    Velocidade: {
      quandoUsar: "Passar de m/s para km/h: multiplique por 3,6 (o contrário, divida).",
      itens: [i(r`\text{m/s}`, "metros por segundo"), i(r`\text{km/h}`, "quilômetros por hora")],
    },
  },
  estatistica: {
    "Média aritmética": {
      quandoUsar: "Valor típico quando todos os dados pesam igual.",
      itens: [i(r`\bar{x}`, "a média (x com barra)"), i(r`x_1,\dots,x_n`, "os dados, um por um"), i("n", "quantos dados há")],
    },
    "Média ponderada": {
      quandoUsar: "Notas com peso, preço médio por quantidade.",
      itens: [i(r`\bar{x}`, "a média ponderada"), i(r`x_1,\dots,x_n`, "os valores"), i(r`p_1,\dots,p_n`, "o peso de cada valor; n é quantos são")],
    },
    "Variância e desvio padrão": {
      quandoUsar: "Medir o quanto os dados se espalham em torno da média (menor = mais regular).",
      itens: [
        i(r`\sigma`, "o desvio padrão (sigma), na mesma unidade dos dados"),
        i(r`\sigma^2`, "a variância: média dos quadrados dos desvios"),
        i(r`\sum`, "somatório (sigma maiúsculo): some para todos os dados"),
        i(r`x_i`, "cada dado"),
        i(r`\bar{x}`, "a média"),
        i("n", "quantos dados há"),
      ],
    },
  },
  "graficos-tabelas": {
    "Variação percentual": {
      quandoUsar: "Comparar dois anos ou duas barras de um gráfico em %.",
      itens: [
        i(r`\Delta\%`, "a variação em porcentagem (Δ = variação)", "%"),
        i(r`\text{final}`, "o valor mais recente"),
        i(r`\text{inicial}`, "o valor de antes: é a base"),
      ],
    },
    "Setor circular": {
      quandoUsar: "Gráfico de pizza: converter uma parte em ângulo (ou o contrário).",
      itens: [
        i(r`\text{ângulo}`, "abertura do setor", "graus (°)"),
        i(r`\text{parte}`, "o valor da categoria"),
        i(r`\text{total}`, "a soma de todas as categorias"),
        i(r`360^\circ`, "a volta inteira do círculo"),
      ],
    },
  },
  "geometria-plana": {
    "Retângulo e triângulo": {
      quandoUsar: "Área de terreno, parede, piso; o triângulo é meio retângulo.",
      itens: [
        i(r`A_{\text{ret}}`, "área do retângulo", "m², cm²…"),
        i(r`A_{\triangle}`, "área do triângulo", "m², cm²…"),
        i("b", "a base"),
        i("h", "a altura, perpendicular à base"),
      ],
    },
    Trapézio: {
      quandoUsar: "Figura com dois lados paralelos de tamanhos diferentes.",
      itens: [i("A", "a área", "unidade²"), i("B", "a base maior"), i("b", "a base menor"), i("h", "a altura entre as bases")],
    },
    Círculo: {
      quandoUsar: "Pizza, roda, praça circular: área por dentro, comprimento pela borda.",
      itens: [
        i("A", "a área do círculo", "unidade²"),
        i("C", "o comprimento da circunferência (a borda)"),
        i("r", "o raio: do centro até a borda (metade do diâmetro)"),
        i(r`\pi`, "pi ≈ 3,14 (o ENEM costuma dizer qual usar)"),
      ],
    },
    Pitágoras: {
      quandoUsar: "Triângulo retângulo com dois lados conhecidos e um faltando.",
      itens: [i("a", "a hipotenusa: o maior lado, oposto ao ângulo reto"), i("b, c", "os catetos: os lados que formam o ângulo reto")],
    },
  },
  "geometria-espacial": {
    "Prisma e cilindro": {
      quandoUsar: "Sólido \"reto\" com a mesma base em cima e embaixo (caixa, lata).",
      itens: [
        i("V", "o volume", "m³, cm³ (1 dm³ = 1 L)"),
        i(r`V_{\text{cil}}`, "o volume do cilindro"),
        i(r`A_{\text{base}}`, "a área da base", "unidade²"),
        i("h", "a altura"),
        i("r", "o raio da base do cilindro"),
        i(r`\pi`, "pi ≈ 3,14"),
      ],
    },
    "Pirâmide e cone": {
      quandoUsar: "Sólido que afina até uma ponta: um terço do prisma de mesma base e altura.",
      itens: [i("V", "o volume", "unidade³"), i(r`A_{\text{base}}`, "a área da base"), i("h", "a altura (da base até a ponta)")],
    },
    Esfera: {
      quandoUsar: "Bola, tanque esférico: volume por dentro, área pela casca.",
      itens: [i("V", "o volume", "unidade³"), i("A", "a área da superfície", "unidade²"), i("r", "o raio"), i(r`\pi`, "pi ≈ 3,14")],
    },
  },
  probabilidade: {
    Definição: {
      quandoUsar: "Casos igualmente prováveis: favoráveis sobre possíveis.",
      itens: [
        i("P(A)", "a probabilidade do evento A (entre 0 e 1)"),
        i("A", "o evento que você quer"),
        i("n(A)", "quantos casos favoráveis"),
        i(r`n(\Omega)`, "quantos casos possíveis; Ω (ômega) é o espaço amostral, tudo o que pode acontecer"),
      ],
    },
    Complementar: {
      quandoUsar: "\"Pelo menos um\" ou \"não acontecer\": às vezes é mais fácil fazer 1 menos o contrário.",
      itens: [i(r`\bar{A}`, "o complementar: A não acontece"), i("P(A)", "a probabilidade de A acontecer")],
    },
    União: {
      quandoUsar: "Probabilidade de A ou B (pelo menos um dos dois).",
      itens: [
        i(r`A\cup B`, "A ou B (∪ = união)"),
        i(r`A\cap B`, "A e B ao mesmo tempo (∩ = interseção); tira para não contar duas vezes"),
        i("P", "probabilidade"),
      ],
    },
    "Eventos independentes": {
      quandoUsar: "Um resultado não muda o outro (dois dados, sorteio com reposição).",
      itens: [i(r`A\cap B`, "A e B acontecerem juntos"), i("P", "probabilidade")],
    },
    Condicional: {
      quandoUsar: "\"Sabendo que B aconteceu\": o espaço encolhe para B.",
      itens: [i(r`P(A\mid B)`, "probabilidade de A dado que B aconteceu (a barra | lê-se \"dado\")"), i(r`A\cap B`, "A e B juntos"), i("P(B)", "probabilidade de B")],
    },
  },
  combinatoria: {
    Permutação: {
      quandoUsar: "Ordenar todos os n elementos (filas, anagramas sem repetir letra).",
      itens: [i("P_n", "o número de permutações de n elementos"), i("n", "quantos elementos"), i("n!", "fatorial: n·(n−1)·…·2·1; 0! = 1")],
    },
    Arranjo: {
      quandoUsar: "Escolher p de n e a ORDEM importa (pódio, senha, cargos).",
      itens: [i(r`A_{n,p}`, "o número de arranjos"), i("n", "quantos há para escolher"), i("p", "quantos você escolhe"), i("n!", "fatorial de n")],
    },
    Combinação: {
      quandoUsar: "Escolher p de n e a ordem NÃO importa (comissão, grupo, aposta).",
      itens: [
        i(r`C_{n,p}`, "o número de combinações (também escrito C(n,p))"),
        i(r`\binom{n}{p}`, "outra notação: \"n escolhe p\""),
        i("n", "quantos há para escolher"),
        i("p", "quantos você escolhe"),
        i("!", "fatorial: multiplica até 1"),
      ],
    },
    "Permutação com repetição": {
      quandoUsar: "Anagramas com letras repetidas: divida pelas trocas que não mudam nada.",
      itens: [i(r`P_n^{a,b}`, "permutações de n elementos com repetições a e b"), i("n", "total de elementos"), i("a, b", "quantas vezes cada elemento repetido aparece"), i("!", "fatorial")],
    },
  },
  "funcao-afim": {
    Lei: {
      quandoUsar: "Algo que cresce sempre o mesmo tanto: taxa fixa + valor inicial (táxi, conta de luz).",
      itens: [
        i("f(x)", "o valor da função para cada x (o y)"),
        i("x", "a variável (quilômetros, meses…)"),
        i("a", "a taxa de variação: quanto y muda quando x sobe 1"),
        i("b", "o valor inicial: y quando x = 0"),
      ],
    },
    "Taxa de variação": {
      quandoUsar: "Achar o a a partir de dois pontos do gráfico ou da tabela.",
      itens: [i("a", "a taxa de variação (inclinação)"), i(r`(x_1, y_1)`, "o primeiro ponto"), i(r`(x_2, y_2)`, "o segundo ponto")],
    },
    Raiz: {
      quandoUsar: "Onde a reta corta o eixo x (quando y vale zero).",
      itens: [i("x", "a raiz"), i("a", "a taxa de variação"), i("b", "o valor inicial")],
    },
  },
  "funcao-quadratica": {
    Bhaskara: {
      quandoUsar: "Achar as raízes de ax² + bx + c = 0.",
      itens: [
        i("x", "as raízes (os dois valores que zeram a função)"),
        i("a, b, c", "os coeficientes de ax² + bx + c"),
        i(r`\Delta`, "o discriminante (delta): > 0 duas raízes, = 0 uma, < 0 nenhuma real"),
        i(r`\pm`, "uma raiz com +, outra com −"),
      ],
    },
    Vértice: {
      quandoUsar: "Máximo ou mínimo: maior lucro, altura máxima, menor custo.",
      itens: [
        i("x_v", "o x do vértice (onde está o máximo ou mínimo)"),
        i("y_v", "o valor máximo ou mínimo"),
        i("a, b", "coeficientes de ax² + bx + c"),
        i(r`\Delta`, "o discriminante b² − 4ac"),
      ],
    },
  },
  "exponencial-log": {
    Crescimento: {
      quandoUsar: "Algo que multiplica pelo mesmo fator a cada período (bactérias, meia-vida).",
      itens: [
        i("N(t)", "a quantidade no tempo t"),
        i("N_0", "a quantidade inicial"),
        i("q", "o fator por período (2 dobra, 1/2 cai à metade)"),
        i("t", "o tempo passado"),
        i("T", "a duração de um período, na mesma unidade de t"),
      ],
    },
    "Definição de log": {
      quandoUsar: "Achar o expoente: \"b elevado a quanto dá a?\".",
      itens: [i(r`\log_b a`, "logaritmo de a na base b"), i("b", "a base (sem número escrito, é 10)"), i("a", "o resultado da potência (logaritmando)"), i("x", "o expoente procurado")],
    },
    Propriedades: {
      quandoUsar: "Transformar produto em soma e potência em multiplicação.",
      itens: [i(r`\log`, "logaritmo na base 10"), i("a, b", "números positivos"), i("n", "o expoente que \"desce\" multiplicando")],
    },
  },
  sequencias: {
    "Termo da PA": {
      quandoUsar: "Soma sempre o mesmo valor: o n-ésimo termo direto.",
      itens: [i("a_n", "o termo da posição n"), i("a_1", "o primeiro termo"), i("n", "a posição do termo"), i("r", "a razão: o que se soma de um termo ao próximo")],
    },
    "Soma da PA": {
      quandoUsar: "Somar muitos termos de uma PA (economia que cresce todo mês).",
      itens: [i("S_n", "a soma dos n primeiros termos"), i("a_1", "o primeiro termo"), i("a_n", "o último termo somado"), i("n", "quantos termos")],
    },
    "Termo da PG": {
      quandoUsar: "Multiplica sempre pelo mesmo valor: o n-ésimo termo direto.",
      itens: [i("a_n", "o termo da posição n"), i("a_1", "o primeiro termo"), i("q", "a razão: o que se multiplica de um termo ao próximo"), i("n", "a posição")],
    },
    "Soma da PG": {
      quandoUsar: "Somar termos de uma PG (q ≠ 1).",
      itens: [i("S_n", "a soma dos n primeiros termos"), i("a_1", "o primeiro termo"), i("q", "a razão"), i("n", "quantos termos")],
    },
  },
  trigonometria: {
    Razões: {
      quandoUsar: "Triângulo retângulo com um ângulo e um lado: rampa, escada, sombra.",
      itens: [
        i(r`\theta`, "o ângulo que você está olhando (teta)", "graus"),
        i(r`\operatorname{sen}`, "seno: oposto sobre hipotenusa"),
        i(r`\cos`, "cosseno: adjacente sobre hipotenusa"),
        i(r`\operatorname{tg}`, "tangente: oposto sobre adjacente"),
        i(r`\text{op}`, "cateto oposto: o lado em frente ao ângulo"),
        i(r`\text{adj}`, "cateto adjacente: o lado colado no ângulo (não é a hipotenusa)"),
        i(r`\text{hip}`, "hipotenusa: o maior lado, em frente ao ângulo reto"),
      ],
    },
    "Ângulos notáveis": {
      quandoUsar: "O ENEM quase sempre usa 30°, 45° ou 60°: decore a tabela.",
      itens: [i(r`\operatorname{sen}`, "seno do ângulo"), i(r`^\circ`, "graus")],
    },
    "Relação fundamental": {
      quandoUsar: "Tem o seno e quer o cosseno (ou o contrário).",
      itens: [i(r`\theta`, "qualquer ângulo"), i(r`\operatorname{sen}^2\theta`, "o seno ao quadrado"), i(r`\cos^2\theta`, "o cosseno ao quadrado")],
    },
  },
  potencias: {
    Propriedades: {
      quandoUsar: "Simplificar potências de mesma base antes de calcular.",
      itens: [i("a", "a base (o número que se multiplica)"), i("m, n", "os expoentes (quantas vezes)")],
    },
    "Notação científica": {
      quandoUsar: "Números muito grandes ou muito pequenos (distâncias, células, população).",
      itens: [i("N", "o número escrito"), i("a", "a mantissa: entre 1 e 10 (≥ 1 e < 10)"), i("n", "o expoente: quantas casas a vírgula andou (negativo para números pequenos)")],
    },
    "Expoente negativo": {
      quandoUsar: "Trocar o sinal do expoente invertendo a fração.",
      itens: [i("a", "a base (diferente de 0)"), i("n", "o expoente")],
    },
  },
};

export function legendaDe(resumoId: string, rotulo: string): Legenda | undefined {
  return LEGENDAS[resumoId]?.[rotulo];
}

/** Palavras de `\text{…}` que não são variáveis (preposições e avisos). */
const TEXTO_NAO_VARIAVEL = new Set(["de", "inverta o fator se for inversa"]);
/** Comandos que são símbolos com significado próprio (precisam de legenda). */
const COMANDOS_SIMBOLO = new Set(["Delta", "pi", "sigma", "theta", "Omega", "sum", "log", "cos", "binom", "triangle"]);

/**
 * Símbolos-variável de um LaTeX: letras soltas, palavras de `\text{}` (exceto preposições),
 * funções de `\operatorname{}`, letras gregas e funções (`\Delta`, `\log`…), `%` e `!` (fatorial).
 * Comandos de estrutura (`\frac`, `\cdot`, `\qquad`…) e números não contam.
 */
export function simbolosDoTex(tex: string): Set<string> {
  const saida = new Set<string>();
  let s = tex.replace(/\\operatorname\{([^}]*)\}/g, (_m, nome: string) => {
    saida.add(nome);
    return " ";
  });
  s = s.replace(/\\text\{([^}]*)\}/g, (_m, dentro: string) => {
    const t = dentro.trim();
    if (t && !TEXTO_NAO_VARIAVEL.has(t)) saida.add(t);
    return " ";
  });
  s = s.replace(/\\%/g, () => {
    saida.add("%");
    return " ";
  });
  s = s.replace(/\\([a-zA-Z]+)/g, (_m, nome: string) => {
    if (COMANDOS_SIMBOLO.has(nome)) saida.add(`\\${nome}`);
    return " ";
  });
  s = s.replace(/\\./g, " ");
  if (s.includes("!")) saida.add("!");
  for (const letra of s.match(/[a-zA-Z]/g) ?? []) saida.add(letra);
  return saida;
}
