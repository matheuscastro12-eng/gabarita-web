/**
 * Modo guiado offline: o mesmo painel de chat, sem IA. As respostas são
 * montadas das dicas curadas em níveis, dos erros comuns pela alternativa
 * marcada, da resolução passo a passo, das gêmeas e do Laboratório.
 * Puro (as contas chegam por injeção) e testado.
 */
import type { Questao } from "@/data/tipos";
import type { DegrauDica, Letra } from "@/lib/dominio/tipos";
import type { EntradaEvento } from "@/lib/dominio/eventos";
import { gemeaDaQuestao, geradorPara, ROTULO_GERADOR, type Gemea } from "@/lib/gemeas";
import type { ResultadoCalculo } from "./mathjs";
import { extrairFuncao, type PlotSpec } from "./plot";

export const AVISO_OFFLINE = "Tutor de IA desligado: falta a chave ANTHROPIC_API_KEY. Usando dicas verificadas.";

export const NOMES_DEGRAU = ["pergunta", "conceito", "primeiro passo", "quase lá", "resolução"] as const;

export interface EstadoOffline {
  questao: Questao;
  degrau: DegrauDica;
  escolha: Letra | null;
  confirmada: boolean;
  pedidoResposta: boolean;
  /** Quantas gêmeas já foram geradas nesta questão (muda a semente). */
  gemeasGeradas: number;
}

export interface Sugestao {
  rotulo: string;
  /** Texto que vai como mensagem do aluno ao clicar. */
  mensagem: string;
}

export interface RespostaOffline {
  texto: string;
  rotulo?: string;
  grafico?: PlotSpec;
  gemea?: Gemea;
  calculo?: ResultadoCalculo;
  /** Novo degrau da escada, quando a resposta avançou. */
  novoDegrau?: DegrauDica;
  /** A resposta registra um pedido explícito de resposta direta. */
  pedidoResposta?: boolean;
  /** Selo "✓ conferido": o conteúdo veio de curadoria verificada no SymPy. */
  conferido?: boolean;
  eventos: EntradaEvento[];
  sugestoes: Sugestao[];
}

export type Intencao =
  | { tipo: "dica" }
  | { tipo: "por-que-errei" }
  | { tipo: "resposta" }
  | { tipo: "grafico"; spec: PlotSpec | null }
  | { tipo: "gemea" }
  | { tipo: "calcular"; expressao: string }
  | { tipo: "laboratorio" }
  | { tipo: "desconhecida" };

const RE_DICA = /\b(dica|ajuda|pista|como (eu )?come[cç]o|por onde|n[aã]o sei|pr[oó]ximo degrau|degrau)\b/i;
const RE_ERREI = /\b(por ?qu[eê]|pq)\b.*\berr|\berrei\b|onde (foi que )?errei|meu erro|o que (eu )?fiz de errado/i;
const RE_RESPOSTA = /\b(resposta|gabarito|solu[cç][aã]o|resolu[cç][aã]o|resolve|resolver|responde|qual [eé] a certa|me mostra tudo|passo a passo)\b/i;
const RE_GEMEA = /\b(g[eê]mea|parecida|semelhante|outra quest[aã]o|treinar|mais uma|outra igual|praticar|exerc[ií]cio)\b/i;
const RE_LAB = /\b(laborat[oó]rio|sympy|python|c[oó]digo)\b/i;
const RE_CALC = /\b(calcul[ae]|calcular|quanto [eé]|quanto d[aá]|resultado de|conta de|simplifica|simplifique|resolve a conta)(?=\s|:|$)/i;

/** Extrai a expressão de um pedido de cálculo ("calcule 28900/0,25", "quanto é 3/4 de 200?"). */
export function extrairExpressao(texto: string): string | null {
  let t = texto.trim().replace(/[?!.]+$/, "");
  t = t.replace(/^.*?\b(calcul[ae]|calcular|quanto [eé]|quanto d[aá]|resultado de|conta de|simplifica|simplifique|resolve a conta)(?=\s|:|$)\s*:?\s*/i, "");
  t = t.replace(/\bde\b/gi, "*").replace(/\bvezes\b/gi, "*").replace(/\bdividido por\b/gi, "/").replace(/\bmais\b/gi, "+").replace(/\bmenos\b/gi, "-");
  t = t.replace(/\bpor cento\b/gi, "%").trim();
  if (!t || !/\d/.test(t)) return null;
  if (/[a-wyzA-WYZÀ-ÿ]{3,}/.test(t.replace(/sqrt|sin|cos|tan|log|exp|abs|pi/gi, ""))) return null;
  return t;
}

/** Parece uma conta digitada direto ("28 900 / 0,25", "2^10")? */
function pareceConta(texto: string): boolean {
  const t = texto.trim();
  return /\d/.test(t) && /[+\-*/^%×÷]/.test(t) && !/[a-wyzA-WYZÀ-ÿ]{3,}/.test(t);
}

export function interpretar(texto: string): Intencao {
  const t = texto.trim();
  if (!t) return { tipo: "desconhecida" };
  if (RE_ERREI.test(t)) return { tipo: "por-que-errei" };
  const spec = extrairFuncao(t);
  if (spec) return { tipo: "grafico", spec };
  if (/gr[aá]fico|plot|desenh|esbo[cç]/i.test(t)) return { tipo: "grafico", spec: null };
  if (RE_LAB.test(t)) return { tipo: "laboratorio" };
  if (RE_GEMEA.test(t)) return { tipo: "gemea" };
  if (RE_CALC.test(t)) {
    const expressao = extrairExpressao(t);
    return expressao ? { tipo: "calcular", expressao } : { tipo: "desconhecida" };
  }
  if (pareceConta(t)) return { tipo: "calcular", expressao: t };
  if (RE_RESPOSTA.test(t)) return { tipo: "resposta" };
  if (RE_DICA.test(t)) return { tipo: "dica" };
  return { tipo: "desconhecida" };
}

/** Dicas genéricas por degrau quando a questão não tem curadoria. */
const DICAS_GENERICAS: Record<1 | 2 | 3, string> = {
  1: "Conceito: identifique quais grandezas o enunciado relaciona e o que está sendo pedido no final. Qual é a pergunta exata?",
  2: "Primeiro passo: anote só os números do enunciado que entram na conta e descarte o resto. Quais são eles?",
  3: "Quase lá: monte a conta com esses números e estime a ordem de grandeza antes de calcular. Qual alternativa fica perto da sua estimativa?",
};

/** Texto do degrau `n` (1–4) da escada para a questão. */
export function textoDegrau(questao: Questao, n: 1 | 2 | 3 | 4): { texto: string; curado: boolean } {
  const res = questao.resolucao;
  if (n === 4) {
    if (res) return { texto: res.resolucao, curado: true };
    return {
      texto: `Esta questão ainda não tem resolução curada no PROVAS. O gabarito oficial é **${questao.gabarito}**. Leve a conta para o Laboratório e confira cada passo no SymPy: qual foi o primeiro número que você usou?`,
      curado: false,
    };
  }
  if (res) return { texto: res.dicas[`dica${n}`], curado: true };
  return { texto: DICAS_GENERICAS[n], curado: false };
}

function sugestoesPara(estado: EstadoOffline, extras: Sugestao[] = []): Sugestao[] {
  const s: Sugestao[] = [];
  if (estado.degrau < 4) s.push({ rotulo: estado.degrau === 3 ? "Ver a resolução" : "Dica", mensagem: "Me dá uma dica." });
  if (estado.confirmada && estado.escolha && estado.escolha !== estado.questao.gabarito) {
    s.push({ rotulo: "Por que errei?", mensagem: "Por que errei?" });
  }
  if (geradorPara(estado.questao)) s.push({ rotulo: "Questão gêmea", mensagem: "Quero uma questão gêmea." });
  s.push({ rotulo: "Gráfico", mensagem: "Gráfico de y = 2x + 3" });
  s.push({ rotulo: "Laboratório", mensagem: "Abrir o Laboratório" });
  const lista = [...extras, ...s.filter((x) => !extras.some((e) => e.rotulo === x.rotulo))];
  return lista.slice(0, 5);
}

/** Primeira mensagem do painel: pergunta socrática + chips. */
export function aberturaOffline(estado: EstadoOffline): RespostaOffline {
  return {
    texto: "Antes de calcular: o que a questão está pedindo, com as suas palavras?",
    rotulo: "Degrau 0 · pergunta",
    eventos: [],
    sugestoes: sugestoesPara(estado),
  };
}

function respostaDica(estado: EstadoOffline): RespostaOffline {
  const { questao, degrau } = estado;
  if (degrau >= 4) {
    return {
      texto: "A resolução completa já está acima. Quer treinar numa questão gêmea ou levar a conta para o Laboratório?",
      eventos: [],
      sugestoes: sugestoesPara(estado),
    };
  }
  const n = (degrau + 1) as 1 | 2 | 3 | 4;
  const { texto, curado } = textoDegrau(questao, n);
  const proximo: EstadoOffline = { ...estado, degrau: n };
  const eventos: EntradaEvento[] = [{ tipo: "dica", questaoId: questao.id, detalhe: `degrau ${n} (modo guiado)`, degrau: n }];
  if (n === 4) eventos.push({ tipo: "pedido_resposta", questaoId: questao.id, detalhe: "degrau 4 pela escada (modo guiado)", degrau: 4 });
  return {
    texto: n === 4 ? texto : `${texto}${/[?!.]$/.test(texto) ? "" : "."} ${n < 3 ? "Quer tentar o próximo passo sozinho?" : "Consegue fechar a conta agora?"}`,
    rotulo: `Degrau ${n} · ${NOMES_DEGRAU[n]}${curado ? "" : " (sem curadoria)"}`,
    novoDegrau: n,
    conferido: n === 4 && curado ? true : undefined,
    eventos,
    sugestoes: sugestoesPara(proximo),
  };
}

function respostaPorQueErrei(estado: EstadoOffline): RespostaOffline {
  const { questao, escolha, confirmada } = estado;
  if (!confirmada) {
    return {
      texto: "Primeiro confirme a sua resposta (marque uma alternativa e aperte Enter). Depois eu te mostro o erro típico de quem marca essa alternativa. Qual você vai marcar?",
      eventos: [],
      sugestoes: sugestoesPara(estado),
    };
  }
  if (!escolha) {
    return {
      texto: "Você pulou esta questão sem marcar, então não há um erro para analisar. Quer ver a escada de dicas ou a resolução?",
      eventos: [],
      sugestoes: sugestoesPara(estado),
    };
  }
  if (escolha === questao.gabarito) {
    return {
      texto: "Você acertou esta. Quer uma gêmea para confirmar que não foi sorte?",
      eventos: [],
      sugestoes: sugestoesPara(estado),
    };
  }
  const erro = questao.resolucao?.erros_comuns.find((e) => e.alternativa === escolha);
  if (erro) {
    return {
      texto: `Quem marca **${escolha}** em geral ${minuscula(erro.por_que)} O gabarito é **${questao.gabarito}**. Onde, na sua conta, isso aconteceu?`,
      rotulo: "Por que errei?",
      conferido: true,
      eventos: [{ tipo: "equivoco", questaoId: questao.id, detalhe: erro.por_que }],
      sugestoes: sugestoesPara(estado),
    };
  }
  return {
    texto: `Não há um erro típico catalogado para a alternativa ${escolha} nesta questão. O gabarito é **${questao.gabarito}**: compare o seu caminho com a resolução. Quer vê-la passo a passo?`,
    rotulo: "Por que errei?",
    eventos: [{ tipo: "erro", questaoId: questao.id, detalhe: `marcou ${escolha}, sem erro catalogado` }],
    sugestoes: sugestoesPara(estado, [{ rotulo: "Ver a resolução", mensagem: "Me mostra a resolução." }]),
  };
}

function respostaResposta(estado: EstadoOffline): RespostaOffline {
  const { questao } = estado;
  const { texto, curado } = textoDegrau(questao, 4);
  const pedido = estado.degrau < 4 && !estado.confirmada;
  const eventos: EntradaEvento[] = [];
  if (pedido) eventos.push({ tipo: "pedido_resposta", questaoId: questao.id, detalhe: "pediu a resposta direta (modo guiado)", degrau: 4 });
  const proximo: EstadoOffline = { ...estado, degrau: 4, pedidoResposta: true };
  return {
    texto: `${texto}\n\n${geradorPara(questao) ? "Quer treinar numa gêmea com números novos?" : "Quer levar a conta para o Laboratório?"}`,
    rotulo: `Resolução completa${curado ? "" : " (sem curadoria)"}`,
    novoDegrau: 4,
    // O botão "Resposta direta" fica marcado como pedido; o evento só conta antes do degrau 4 e antes de confirmar.
    pedidoResposta: true,
    conferido: curado ? true : undefined,
    eventos,
    sugestoes: sugestoesPara(proximo),
  };
}

function respostaGemea(estado: EstadoOffline): RespostaOffline {
  const gerador = geradorPara(estado.questao);
  if (!gerador) {
    return {
      texto: "Ainda não tenho um gerador de gêmeas para o assunto desta questão (tenho para porcentagem, regra de três, razão e proporção, probabilidade, média/mediana/moda, função afim, equações do 1º e 2º grau, PA e escala). Quer uma dica ou a resolução desta?",
      eventos: [],
      sugestoes: sugestoesPara(estado),
    };
  }
  const gemea = gemeaDaQuestao(estado.questao, estado.gemeasGeradas);
  if (!gemea) throw new Error("gerador sem gêmea"); // impossível: geradorPara já confirmou
  return {
    texto: `Aqui vai uma gêmea de **${ROTULO_GERADOR[gerador]}**, com números novos e resposta calculada pelo código. Marque a alternativa e confirme:`,
    rotulo: "Questão gêmea",
    gemea,
    conferido: true,
    eventos: [{ tipo: "gemea", questaoId: estado.questao.id, detalhe: gemea.id }],
    sugestoes: sugestoesPara(estado, [{ rotulo: "Outra gêmea", mensagem: "Quero outra gêmea." }]),
  };
}

function respostaGrafico(estado: EstadoOffline, spec: PlotSpec | null): RespostaOffline {
  if (!spec) {
    return {
      texto: "Me diga a função que você quer ver, por exemplo: «gráfico de y = 2x + 3» ou «gráfico de a·x² + b» (letras viram sliders). Qual é a função?",
      eventos: [],
      sugestoes: sugestoesPara(estado),
    };
  }
  const comSliders = spec.parametros.length > 0;
  return {
    texto: `Gráfico de $y = ${spec.funcoes[0]?.expressao ?? ""}$.${comSliders ? " Mexa nos sliders e veja o que muda na curva." : ""} O que acontece com $y$ quando $x$ aumenta 1?`,
    rotulo: "Gráfico",
    grafico: spec,
    eventos: [],
    sugestoes: sugestoesPara(estado),
  };
}

function respostaCalculo(estado: EstadoOffline, expressao: string, calculo: ResultadoCalculo): RespostaOffline {
  const texto = calculo.ok
    ? `$${escaparLatex(calculo.expressao)} = ${calculo.resultado}$${calculo.aproximado ? ` (≈ ${calculo.aproximado.replace(".", ",")})` : ""}. Esse valor bate com alguma alternativa?`
    : `Não consegui avaliar «${expressao}»: ${calculo.erro ?? "expressão inválida"}. Tente escrever a conta só com números e operadores, por exemplo «28900 / 0,25». O que você quer calcular?`;
  return {
    texto,
    rotulo: "Cálculo (mathjs)",
    calculo,
    eventos: [],
    sugestoes: sugestoesPara(estado),
  };
}

export interface DependenciasOffline {
  calcular: (expressao: string) => Promise<ResultadoCalculo> | ResultadoCalculo;
}

/** Resposta do modo guiado para uma mensagem do aluno. */
export async function responderOffline(mensagem: string, estado: EstadoOffline, deps: DependenciasOffline): Promise<RespostaOffline> {
  const intencao = interpretar(mensagem);
  switch (intencao.tipo) {
    case "dica":
      return respostaDica(estado);
    case "por-que-errei":
      return respostaPorQueErrei(estado);
    case "resposta":
      return respostaResposta(estado);
    case "gemea":
      return respostaGemea(estado);
    case "grafico":
      return respostaGrafico(estado, intencao.spec);
    case "calcular":
      return respostaCalculo(estado, intencao.expressao, await deps.calcular(intencao.expressao));
    case "laboratorio":
      return {
        texto: "O Laboratório roda Python com SymPy no seu navegador e desenha gráficos com sliders. Abra pelo menu (Alt+5) ou pelo link abaixo. Qual conta você quer conferir lá?",
        rotulo: "Laboratório",
        eventos: [],
        sugestoes: sugestoesPara(estado),
      };
    default:
      return {
        texto:
          "No modo guiado eu não entendo perguntas livres (a IA está desligada). Posso dar o próximo degrau de dica, explicar por que você errou, mostrar a resolução, gerar uma gêmea, desenhar um gráfico ou calcular uma conta. Qual você quer?",
        eventos: [],
        sugestoes: sugestoesPara(estado),
      };
  }
}

function minuscula(s: string): string {
  const t = s.trim();
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function escaparLatex(expressao: string): string {
  return expressao.replace(/\*/g, " \\cdot ").replace(/%/g, "\\%");
}
