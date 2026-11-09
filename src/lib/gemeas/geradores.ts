/**
 * Geradores determinísticos de questões gêmeas. Cada gerador recebe um
 * `Aleatorio` semeado e devolve uma Candidata: enunciado com números novos,
 * resposta calculada pelo código e distratores que são erros típicos do ENEM.
 */
import type { Aleatorio } from "@/lib/aleatorio";
import { fracaoLatex, numeroEnem, porcentagemTexto, reais } from "./formato";
import type { Candidata, NomeGerador } from "./tipos";

export type Gerador = (rnd: Aleatorio) => Candidata;

const PRODUTOS = ["uma bicicleta", "um celular", "uma geladeira", "um tênis", "uma televisão", "um notebook", "um sofá", "uma mochila"];
const CIDADES = ["Recife", "Curitiba", "Belém", "Goiânia", "Manaus", "Florianópolis", "Salvador", "Campinas"];
const NOMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabriela", "Heitor", "Iara", "João"];

export const porcentagem: Gerador = (rnd) => {
  const variante = rnd.inteiro(0, 2);
  if (variante === 0) {
    // Desconto sobre um preço.
    const preco = rnd.inteiro(12, 90) * 10;
    const d = rnd.escolher([10, 15, 20, 25, 30, 35, 40]);
    const resposta = preco * (1 - d / 100);
    return {
      enunciado: `Numa loja, ${rnd.escolher(PRODUTOS)} custava ${reais(preco)}. Na promoção de fim de ano, o preço teve um desconto de ${d}%.\n\nQual é o preço do produto na promoção?`,
      resposta,
      distratores: [
        { valor: (preco * d) / 100, erro: `Calculou só o valor do desconto (${d}% de ${reais(preco)}), não o preço final.` },
        { valor: preco * (1 + d / 100), erro: "Aplicou um aumento em vez de um desconto." },
        { valor: preco - d, erro: `Subtraiu ${d} reais em vez de ${d}% do preço.` },
        { valor: preco * (1 - d / 10), erro: "Tratou a porcentagem como décimos (dividiu por 10 em vez de 100)." },
      ],
      formatar: reais,
      resolucao: `**1.** Desconto de ${d}% significa pagar $100\\% - ${d}\\% = ${100 - d}\\%$ do preço.\n\n**2.** $${100 - d}\\% \\cdot ${preco} = ${(100 - d) / 100} \\cdot ${preco} = ${numeroEnem(resposta)}$.\n\nO preço na promoção é **${reais(resposta)}**.`,
    };
  }
  if (variante === 1) {
    // Valor original a partir de uma queda (como na ENEM 2022-154).
    const d = rnd.escolher([20, 25, 40, 50, 60, 75, 80]);
    const original = rnd.inteiro(20, 400) * 100;
    const atual = original * (1 - d / 100);
    return {
      enunciado: `Em janeiro deste ano, uma cidade registrou ${numeroEnem(atual)} novas matrículas na rede pública, uma queda de ${d}% em relação a janeiro do ano passado.\n\nDe acordo com essas informações, o número de matrículas em janeiro do ano passado foi`,
      resposta: original,
      distratores: [
        { valor: atual * (1 + d / 100), erro: `Aumentou o valor atual em ${d}% ("se caiu ${d}%, subo ${d}%"), mas a porcentagem era do valor original.` },
        { valor: (atual * d) / (100 - d), erro: `Calculou só a diferença entre os anos, não o total do ano passado.` },
        { valor: atual * (1 - d / 100), erro: "Aplicou a queda de novo sobre o valor atual, no sentido errado." },
        { valor: (atual * 100) / d, erro: `Dividiu por ${d}% em vez de por ${100 - d}% (confundiu a parte que caiu com a que sobrou).` },
      ],
      formatar: (v) => numeroEnem(v, 0),
      resolucao: `**1.** Se caiu ${d}%, o valor atual é $100\\% - ${d}\\% = ${100 - d}\\%$ do valor do ano passado.\n\n**2.** Chame o valor do ano passado de $V$: $${(100 - d) / 100} \\cdot V = ${numeroEnem(atual)} \\Rightarrow V = \\dfrac{${numeroEnem(atual)}}{${(100 - d) / 100}} = ${numeroEnem(original)}$.\n\nForam **${numeroEnem(original)}** matrículas.`,
    };
  }
  // Variação percentual entre dois valores.
  const antes = rnd.inteiro(4, 40) * 50;
  const p = rnd.escolher([5, 10, 12, 15, 20, 25, 30, 40, 50]);
  const depois = antes * (1 + p / 100);
  return {
    enunciado: `O consumo mensal de água de um condomínio passou de ${numeroEnem(antes)} m³ em março para ${numeroEnem(depois)} m³ em abril.\n\nA variação percentual do consumo de março para abril foi de`,
    resposta: p,
    distratores: [
      { valor: ((depois - antes) / depois) * 100, erro: "Dividiu a diferença pelo valor novo (abril) em vez do valor inicial (março)." },
      { valor: depois - antes, erro: "Deu a diferença absoluta em m³, não a porcentagem." },
      { valor: (depois / antes) * 100, erro: "Calculou a razão novo/antigo em porcentagem (incluiu os 100% iniciais)." },
      { valor: p / 2, erro: "Erro de conta na divisão da diferença pelo valor inicial." },
    ],
    formatar: (v) => porcentagemTexto(v),
    resolucao: `**1.** A variação é $\\dfrac{\\text{novo} - \\text{antigo}}{\\text{antigo}} = \\dfrac{${numeroEnem(depois)} - ${numeroEnem(antes)}}{${numeroEnem(antes)}} = \\dfrac{${numeroEnem(depois - antes)}}{${numeroEnem(antes)}} = ${p / 100}$.\n\n**2.** $${p / 100} = ${p}\\%$.\n\nO consumo aumentou **${p}%**.`,
  };
};

export const regraDeTres: Gerador = (rnd) => {
  const pecasPorHora = rnd.inteiro(3, 25) * 10;
  const horas = rnd.inteiro(2, 8);
  const novasHoras = rnd.inteiro(horas + 1, 15);
  const pecas = pecasPorHora * horas;
  const resposta = pecasPorHora * novasHoras;
  return {
    enunciado: `Uma máquina produz ${numeroEnem(pecas)} peças em ${horas} horas, mantendo sempre o mesmo ritmo.\n\nMantendo esse ritmo, quantas peças a máquina produzirá em ${novasHoras} horas?`,
    resposta,
    distratores: [
      { valor: (pecas * horas) / novasHoras, erro: "Montou a proporção invertida (como se fossem grandezas inversamente proporcionais)." },
      { valor: pecas + (novasHoras - horas), erro: "Somou a diferença de horas às peças, sem usar a proporção." },
      { valor: pecas * novasHoras, erro: `Multiplicou as peças pelas horas sem dividir por ${horas}.` },
      { valor: pecas + pecasPorHora, erro: "Acrescentou só uma hora de produção." },
    ],
    formatar: (v) => numeroEnem(v, 0),
    resolucao: `**1.** Ritmo: $\\dfrac{${numeroEnem(pecas)}}{${horas}} = ${numeroEnem(pecasPorHora)}$ peças por hora.\n\n**2.** Em ${novasHoras} horas: $${numeroEnem(pecasPorHora)} \\cdot ${novasHoras} = ${numeroEnem(resposta)}$.\n\nOu pela regra de três: $\\dfrac{${numeroEnem(pecas)}}{${horas}} = \\dfrac{x}{${novasHoras}} \\Rightarrow x = ${numeroEnem(resposta)}$ peças.`,
  };
};

export const razaoProporcao: Gerador = (rnd) => {
  const a = rnd.inteiro(2, 7);
  let b = rnd.inteiro(2, 9);
  if (b === a) b += 1;
  const k = rnd.inteiro(3, 12);
  const total = (a + b) * k;
  const resposta = b * k;
  return {
    enunciado: `Numa escola, a razão entre o número de alunos que vão de ônibus e o número dos que vão a pé é de ${a} para ${b}. Ao todo, ${total} alunos vão de ônibus ou a pé.\n\nQuantos alunos vão a pé?`,
    resposta,
    distratores: [
      { valor: a * k, erro: "Calculou a outra parte da razão (os que vão de ônibus)." },
      { valor: total / b, erro: `Dividiu o total por ${b} em vez de dividir pela soma das partes (${a + b}).` },
      { valor: (total * b) / a, erro: "Montou a proporção com a parte errada no denominador." },
      { valor: total - b, erro: `Subtraiu ${b} do total, tratando a razão como quantidade.` },
    ],
    formatar: (v) => numeroEnem(v, 0),
    resolucao: `**1.** A razão ${a}:${b} divide o total em $${a} + ${b} = ${a + b}$ partes iguais.\n\n**2.** Cada parte vale $\\dfrac{${total}}{${a + b}} = ${k}$ alunos.\n\n**3.** A pé: $${b} \\cdot ${k} = ${resposta}$ alunos.`,
  };
};

export const probabilidade: Gerador = (rnd) => {
  const vermelhas = rnd.inteiro(2, 9);
  const azuis = rnd.inteiro(2, 9);
  const verdes = rnd.inteiro(1, 9);
  const total = vermelhas + azuis + verdes;
  const formatar = (v: number) => {
    // v é uma fração representada como número; recupera numerador/denominador por busca em denominadores plausíveis.
    for (const den of [total, total - 1, azuis + verdes, vermelhas + azuis, vermelhas + verdes, 2, 3, 4, 5, 6, 8, 10, 12, 100]) {
      const num = v * den;
      if (Math.abs(num - Math.round(num)) < 1e-9 && den > 0) return fracaoLatex(Math.round(num), den);
    }
    return numeroEnem(v, 3);
  };
  return {
    enunciado: `Uma urna contém ${vermelhas} bolas vermelhas, ${azuis} bolas azuis e ${verdes} bolas verdes, todas do mesmo tamanho. Uma bola é retirada ao acaso.\n\nA probabilidade de a bola retirada ser vermelha é`,
    resposta: vermelhas / total,
    distratores: [
      { valor: vermelhas / (azuis + verdes), erro: "Dividiu os casos favoráveis pelos desfavoráveis (razão), não pelo total." },
      { valor: azuis / total, erro: "Usou a quantidade de bolas azuis em vez das vermelhas." },
      { valor: 1 / 3, erro: "Supôs que as três cores são igualmente prováveis (1 em 3), ignorando as quantidades." },
      { valor: (vermelhas + 1) / total, erro: "Errou a contagem dos casos favoráveis em uma unidade." },
    ],
    formatar,
    resolucao: `**1.** Total de bolas: $${vermelhas} + ${azuis} + ${verdes} = ${total}$.\n\n**2.** Casos favoráveis: ${vermelhas} vermelhas.\n\n**3.** $P = \\dfrac{\\text{favoráveis}}{\\text{total}} = \\dfrac{${vermelhas}}{${total}}$${formatar(vermelhas / total) !== `$\\frac{${vermelhas}}{${total}}$` ? ` = ${formatar(vermelhas / total)}` : ""}.`,
  };
};

export const mediaMedianaModa: Gerador = (rnd) => {
  // Seis valores (quantidade par) para a mediana exigir a média dos dois centrais.
  const base = rnd.inteiro(10, 40);
  const valores: number[] = [];
  while (valores.length < 6) {
    const v = base + rnd.inteiro(0, 12);
    valores.push(v);
  }
  // Garante uma moda (um valor repetido) e mediana não inteira ou diferente da média.
  valores[5] = valores[0] as number;
  const ordenados = [...valores].sort((x, y) => x - y);
  const mediana = ((ordenados[2] as number) + (ordenados[3] as number)) / 2;
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  const contagem = new Map<number, number>();
  for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  const moda = [...contagem.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0]?.[0] as number;
  const nome = rnd.escolher(NOMES);
  return {
    enunciado: `${nome} anotou a quantidade de páginas que leu em cada um dos últimos seis dias: ${valores.join(", ")}.\n\nA mediana dessa sequência de valores é`,
    resposta: mediana,
    distratores: [
      { valor: Math.round(media * 10) / 10, erro: "Calculou a média aritmética em vez da mediana." },
      { valor: moda, erro: "Deu a moda (o valor mais frequente) em vez da mediana." },
      { valor: ((valores[2] as number) + (valores[3] as number)) / 2, erro: "Pegou os dois valores do meio sem ordenar a lista antes." },
      { valor: ordenados[3] as number, erro: "Com quantidade par de valores, escolheu só um dos dois centrais em vez da média deles." },
      { valor: ((ordenados[0] as number) + (ordenados[5] as number)) / 2, erro: "Fez a média entre o menor e o maior valor." },
    ],
    formatar: (v) => numeroEnem(v, 1),
    resolucao: `**1.** Ordene: ${ordenados.join(", ")}.\n\n**2.** São 6 valores (quantidade par): a mediana é a média dos dois centrais, o 3º e o 4º: $\\dfrac{${ordenados[2]} + ${ordenados[3]}}{2} = ${numeroEnem(mediana, 1)}$.\n\nA mediana é **${numeroEnem(mediana, 1)}**.`,
  };
};

export const funcaoAfim: Gerador = (rnd) => {
  const bandeirada = rnd.escolher([4, 5, 6, 8]);
  const porKm = rnd.escolher([2, 2.5, 3, 4]);
  const km = rnd.inteiro(5, 30);
  const total = bandeirada + porKm * km;
  return {
    enunciado: `Um aplicativo de transporte em ${rnd.escolher(CIDADES)} cobra uma tarifa fixa de ${reais(bandeirada)} mais ${reais(porKm)} por quilômetro rodado. Uma corrida custou ${reais(total)}.\n\nQuantos quilômetros teve essa corrida?`,
    resposta: km,
    distratores: [
      { valor: total / porKm, erro: "Esqueceu de descontar a tarifa fixa antes de dividir pelo preço por km." },
      { valor: (total + bandeirada) / porKm, erro: "Somou a tarifa fixa em vez de subtrair." },
      { valor: total - bandeirada, erro: "Parou no valor em reais da parte variável, sem dividir pelo preço do km." },
      { valor: (total - porKm) / bandeirada, erro: "Trocou os papéis da tarifa fixa e do preço por km." },
    ],
    formatar: (v) => `${numeroEnem(v, 1)} km`,
    resolucao: `**1.** O preço é uma função afim: $P(x) = ${numeroEnem(bandeirada)} + ${numeroEnem(porKm)}\\,x$, com $x$ em km.\n\n**2.** $${numeroEnem(bandeirada)} + ${numeroEnem(porKm)}\\,x = ${numeroEnem(total)} \\Rightarrow ${numeroEnem(porKm)}\\,x = ${numeroEnem(total - bandeirada)} \\Rightarrow x = ${km}$.\n\nA corrida teve **${km} km**.`,
  };
};

export const equacao1Grau: Gerador = (rnd) => {
  const n = rnd.inteiro(6, 40);
  const mult = rnd.escolher([2, 3, 4, 5]);
  const a = rnd.inteiro(3, 25);
  const b = mult * n - a;
  const nomeMult = { 2: "O dobro", 3: "O triplo", 4: "O quádruplo", 5: "O quíntuplo" }[mult] ?? `${mult} vezes`;
  return {
    enunciado: `${nomeMult} de um número, diminuído de ${a}, é igual a ${b}.\n\nQual é esse número?`,
    resposta: n,
    distratores: [
      { valor: (b - a) / mult, erro: `Subtraiu ${a} em vez de somar ao passar para o outro lado da igualdade.` },
      { valor: (b + a) * mult, erro: `Multiplicou por ${mult} em vez de dividir no último passo.` },
      { valor: b + a, erro: `Esqueceu de dividir por ${mult}.` },
      { valor: b / mult - a, erro: "Dividiu antes de somar, invertendo a ordem das operações inversas." },
    ],
    formatar: (v) => numeroEnem(v, 2),
    resolucao: `**1.** Chame o número de $x$: $${mult}x - ${a} = ${b}$.\n\n**2.** $${mult}x = ${b} + ${a} = ${b + a}$.\n\n**3.** $x = \\dfrac{${b + a}}{${mult}} = ${n}$.`,
  };
};

export const equacao2Grau: Gerador = (rnd) => {
  // h(t) = -5t² + v t: a bola volta ao solo em t = v/5.
  const t = rnd.inteiro(2, 12);
  const v = 5 * t;
  return {
    enunciado: `Uma bola é lançada verticalmente para cima e sua altura, em metros, após $t$ segundos é dada por $h(t) = -5t^2 + ${v}t$.\n\nQuantos segundos após o lançamento a bola volta ao solo?`,
    resposta: t,
    distratores: [
      { valor: t / 2, erro: "Calculou o instante da altura máxima (vértice), não o retorno ao solo." },
      { valor: v, erro: "Igualou a altura a zero e esqueceu de dividir pelo coeficiente 5." },
      { valor: (v * v) / 20, erro: "Calculou a altura máxima em metros, não o tempo." },
      { valor: t + 1, erro: "Erro de conta ao resolver a equação." },
      { valor: t * 2, erro: "Dobrou o tempo por confundir com ida e volta separadas." },
    ],
    formatar: (v2) => `${numeroEnem(v2, 1)} s`,
    resolucao: `**1.** No solo, $h(t) = 0$: $-5t^2 + ${v}t = 0 \\Rightarrow t(-5t + ${v}) = 0$.\n\n**2.** As raízes são $t = 0$ (lançamento) e $-5t + ${v} = 0 \\Rightarrow t = \\dfrac{${v}}{5} = ${t}$.\n\nA bola volta ao solo após **${t} s**.`,
  };
};

export const progressaoAritmetica: Gerador = (rnd) => {
  const a1 = rnd.inteiro(5, 40) * 10;
  const d = rnd.inteiro(1, 8) * 10;
  const n = rnd.inteiro(6, 24);
  const an = a1 + (n - 1) * d;
  const nome = rnd.escolher(NOMES);
  return {
    enunciado: `${nome} decidiu guardar dinheiro: no primeiro mês guardou ${reais(a1)} e, a cada mês seguinte, guardou ${reais(d)} a mais do que no mês anterior.\n\nQuanto ${nome} guardou no ${n}º mês?`,
    resposta: an,
    distratores: [
      { valor: a1 + n * d, erro: `Usou $n$ em vez de $n - 1$ na fórmula do termo geral (contou ${n} aumentos).` },
      { valor: (n * (a1 + an)) / 2, erro: "Calculou a soma dos termos (total guardado), não o valor do mês." },
      { valor: a1 * n, erro: "Multiplicou o primeiro valor pelo número de meses, ignorando a razão." },
      { valor: a1 + (n - 2) * d, erro: "Usou $n - 2$ aumentos em vez de $n - 1$." },
    ],
    formatar: reais,
    resolucao: `**1.** É uma PA com $a_1 = ${a1}$ e razão $r = ${d}$.\n\n**2.** Termo geral: $a_n = a_1 + (n - 1)\\,r = ${a1} + (${n} - 1) \\cdot ${d} = ${a1} + ${(n - 1) * d} = ${an}$.\n\nNo ${n}º mês, guardou **${reais(an)}**.`,
  };
};

export const escala: Gerador = (rnd) => {
  const escalaMapa = rnd.escolher([25000, 50000, 100000, 200000, 250000, 500000]);
  const cm = rnd.inteiro(2, 24);
  const km = (cm * escalaMapa) / 100000;
  const [c1, c2] = rnd.embaralhar(CIDADES).slice(0, 2) as [string, string];
  return {
    enunciado: `Num mapa na escala 1:${numeroEnem(escalaMapa, 0)}, a distância em linha reta entre ${c1} e ${c2} mede ${cm} cm.\n\nA distância real, em linha reta, entre as duas cidades é de`,
    resposta: km,
    distratores: [
      { valor: (cm * escalaMapa) / 1000, erro: "Converteu centímetros para metros (÷ 100) e esqueceu de ir até quilômetros (÷ 100 000 no total)." },
      { valor: (cm * escalaMapa) / 10000, erro: "Errou uma casa decimal na conversão de cm para km." },
      { valor: escalaMapa / 100000 / cm, erro: "Dividiu a escala pela medida em vez de multiplicar." },
      { valor: (cm * escalaMapa) / 1000000, erro: "Converteu como se 1 km tivesse 1 000 000 cm." },
    ],
    formatar: (v) => `${numeroEnem(v, 2)} km`,
    resolucao: `**1.** Escala 1:${numeroEnem(escalaMapa, 0)}: cada 1 cm no mapa vale ${numeroEnem(escalaMapa, 0)} cm reais.\n\n**2.** $${cm} \\cdot ${numeroEnem(escalaMapa, 0)} = ${numeroEnem(cm * escalaMapa, 0)}$ cm.\n\n**3.** $1\\,\\text{km} = 100\\,000\\,\\text{cm}$, então $\\dfrac{${numeroEnem(cm * escalaMapa, 0)}}{100\\,000} = ${numeroEnem(km, 2)}$ km.`,
  };
};

export const GERADORES: Record<NomeGerador, Gerador> = {
  porcentagem,
  "regra-de-tres": regraDeTres,
  "razao-proporcao": razaoProporcao,
  probabilidade,
  "media-mediana-moda": mediaMedianaModa,
  "funcao-afim": funcaoAfim,
  "equacao-1-grau": equacao1Grau,
  "equacao-2-grau": equacao2Grau,
  "progressao-aritmetica": progressaoAritmetica,
  escala,
};
