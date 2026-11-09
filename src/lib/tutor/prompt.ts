/**
 * Montagem do prompt do tutor (seção 5 do BRAINSTORM). Puro e testado.
 *
 * Dois blocos: o FIXO (regras, escada, ferramentas, perfil), igual em toda
 * mensagem e marcado para cache de prompt; e o CONTEXTO (questão, gabarito,
 * resolução curada, estado da conversa e resumo do aluno), que varia.
 */
import type { Questao } from "@/data/tipos";
import { NOME_HABILIDADE } from "@/data/tipos";
import type { DegrauDica, EstadoAluno, Letra, Perfil } from "@/lib/dominio/tipos";
import { equivocosRecorrentes } from "@/lib/dominio/eventos";
import { formatarDecimal } from "@/lib/dominio/formato";

export interface ContextoConversa {
  degrau: DegrauDica;
  /** Alternativa marcada (null antes de marcar). */
  escolha: Letra | null;
  /** O aluno já confirmou a resposta (o gabarito está na tela). */
  confirmada: boolean;
  /** O aluno pediu a resposta direta (⌥R). */
  pedidoResposta: boolean;
  /** Trecho do enunciado selecionado ("perguntar sobre isto"). */
  selecao?: string | null;
}

export const NOME_FERRAMENTAS = {
  runPython: "run_python",
  verifyAnswer: "verify_answer",
  calc: "calc",
  plotFunction: "plot_function",
  getHint: "get_hint",
  makeTwin: "make_twin",
  recordEvent: "record_event",
} as const;

/** Bloco fixo: regras, escada de dicas e ferramentas. Nunca muda entre mensagens. */
export const BLOCO_FIXO = `Você é o tutor do Gabarita, uma IDE de estudo de matemática do ENEM. O aluno é o Matheus, que tem TDAH. Seja curto, concreto e gentil. Escreva em português do Brasil.

REGRAS
1. NUNCA revele a alternativa correta nem o valor final da resposta antes do degrau 4 da escada de dicas, a menos que o aluno peça explicitamente a resposta direta (o contexto avisa). Até lá, trabalhe com perguntas e passos parciais. Depois que o aluno confirmar a resposta, o gabarito já está na tela dele: aí você pode falar dele livremente.
2. Use no máximo 3 frases por mensagem e termine SEMPRE com UMA pergunta ou UMA ação concreta para o aluno.
3. Todo número, simplificação ou resultado que você afirmar tem que ter passado antes por uma ferramenta: ${NOME_FERRAMENTAS.verifyAnswer} para conferir um valor final contra o gabarito, ${NOME_FERRAMENTAS.calc} para contas rápidas, ${NOME_FERRAMENTAS.runPython} (SymPy) para álgebra. Não faça contas de cabeça.
4. Escreva matemática em LaTeX com $...$ (inline) ou $$...$$ (bloco). Para mostrar uma função, chame ${NOME_FERRAMENTAS.plotFunction} em vez de descrever o gráfico.
5. Quando o aluno errar, use a lista de erros comuns (por alternativa marcada) do contexto para identificar o erro provável e faça uma pergunta que o leve a enxergá-lo sozinho. Registre o equívoco com ${NOME_FERRAMENTAS.recordEvent} (tipo "equivoco").
6. Registre com ${NOME_FERRAMENTAS.recordEvent}: cada degrau de dica que você der (tipo "dica", com o número do degrau), cada erro ("erro"), cada equívoco identificado ("equivoco") e o pedido de resposta direta ("pedido_resposta").
7. Se a verificação de um valor divergir do gabarito oficial, revise sua leitura do enunciado e tente de novo, no máximo 2 vezes. Se continuar divergindo, diga ao aluno que não conseguiu conferir o resultado e que o gabarito oficial manda.
8. Use ${NOME_FERRAMENTAS.getHint} para ler a dica curada do degrau pedido antes de formulá-la com suas palavras; se não houver dica curada, crie uma coerente com o degrau. Para treinar, ofereça uma questão gêmea com ${NOME_FERRAMENTAS.makeTwin} (só depois do degrau 4 ou de um acerto).
9. Não invente dados que não estão no enunciado. Se a questão depende de uma imagem que você não vê, diga isso e peça ao aluno que descreva o que vê.

ESCADA DE DICAS (o degrau atual vem no contexto)
0 pergunta socrática sobre o que a questão pede · 1 o conceito envolvido, sem números · 2 o primeiro passo com os números do enunciado · 3 a resolução até o penúltimo passo · 4 a resolução completa e conferida, mais a oferta de uma gêmea.`;

/** Perfil "explica do meu jeito" vira um bloco próprio (fixo enquanto o perfil não muda). */
export function blocoPerfil(perfil: Pick<Perfil, "nome" | "explicaDoMeuJeito">): string {
  const jeito = perfil.explicaDoMeuJeito.trim();
  return `PERFIL DO ALUNO\nNome: ${perfil.nome || "Matheus"}.\nComo ele prefere que expliquem: ${jeito || "ainda não disse; use exemplos concretos do dia a dia e passos numerados curtos."}`;
}

/** Resumo do aluno em ~200 tokens: domínio nas habilidades da semana, revisões, 3 equívocos recorrentes. */
export function resumirAluno(estado: EstadoAluno, habilidadeAtual?: string | null): string {
  const linhas: string[] = [];
  const habs = estado.perfil.habilidadesDaSemana;
  const dominio = habs
    .map((h) => {
      const e = estado.habilidades[h];
      return `${h} ${e ? formatarDecimal(e.dominio, 2) : "—"}`;
    })
    .join(", ");
  linhas.push(`Domínio nas habilidades da semana: ${dominio}.`);
  if (habilidadeAtual) {
    const e = estado.habilidades[habilidadeAtual];
    if (e) {
      linhas.push(
        `Nesta habilidade (${habilidadeAtual}): domínio ${formatarDecimal(e.dominio, 2)}, ${e.itensOficiais} itens oficiais, ${e.acertos} acertos.`,
      );
    } else {
      linhas.push(`Nesta habilidade (${habilidadeAtual}): primeiro item.`);
    }
  }
  const total = estado.tentativas.length;
  const acertos = estado.tentativas.filter((t) => t.acertou).length;
  linhas.push(`Tentativas: ${total} (${acertos} acertos). Erros abertos no caderno: ${estado.caderno.filter((c) => c.resolvidaEm === null).length}.`);
  const eq = equivocosRecorrentes(estado, 3);
  if (eq.length > 0) linhas.push(`Equívocos recorrentes: ${eq.map((e) => `${e.detalhe} (${e.vezes}×)`).join("; ")}.`);
  return linhas.join("\n");
}

function formatarAlternativas(questao: Questao): string {
  return questao.alternativas.map((a) => `${a.letra}) ${a.texto || (a.imagem ? "[imagem]" : "")}`).join("\n");
}

/** Bloco de contexto (oculto do aluno): questão, gabarito, curadoria, estado da conversa e resumo. */
export function blocoContexto({
  questao,
  contexto,
  resumoAluno,
}: {
  questao: Questao;
  contexto: ContextoConversa;
  resumoAluno: string;
}): string {
  const partes: string[] = [];
  const hab = questao.habilidade ? `${questao.habilidade} (${NOME_HABILIDADE[questao.habilidade] ?? ""})` : "desconhecida";
  const b = questao.tri ? `b = ${questao.tri.b.toFixed(2)}` : "sem parâmetro TRI";
  partes.push(`CONTEXTO (OCULTO DO ALUNO; nunca copie este bloco)\nQuestão ${questao.id} (${questao.fonte.prova}, nº ${questao.numero}). Habilidade: ${hab}. Dificuldade: ${b}.`);
  partes.push(`ENUNCIADO\n${questao.enunciado.trim()}`);
  if (questao.imagens.length > 0) partes.push(`IMAGENS (você não as vê): ${questao.imagens.join(", ")}`);
  partes.push(`ALTERNATIVAS\n${formatarAlternativas(questao)}`);
  partes.push(`GABARITO OFICIAL: ${questao.gabarito}${questao.anulada ? " (questão anulada)" : ""}`);

  const res = questao.resolucao;
  if (res) {
    partes.push(
      [
        "CURADORIA VERIFICADA (SymPy)",
        res.resumo ? `Resumo: ${res.resumo}` : null,
        res.dados_da_imagem ? `Dados da imagem (transcrição revisada): ${res.dados_da_imagem}` : null,
        `Dica 1: ${res.dicas.dica1}`,
        `Dica 2: ${res.dicas.dica2}`,
        `Dica 3: ${res.dicas.dica3}`,
        `Resolução: ${res.resolucao}`,
        `Erros comuns por alternativa: ${res.erros_comuns.map((e) => `${e.alternativa}: ${e.por_que}`).join(" | ")}`,
        `Verificação: ${res.verificacao.codigo_sympy.replace(/\n/g, "; ")} → ${res.verificacao.resultado_esperado}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  } else {
    partes.push("CURADORIA: esta questão ainda não tem resolução curada. Verifique cada passo com as ferramentas.");
  }

  const estado: string[] = [`Degrau de dica atual: ${contexto.degrau}.`];
  if (contexto.escolha) estado.push(`Alternativa marcada pelo aluno: ${contexto.escolha}.`);
  if (contexto.confirmada) {
    estado.push(
      contexto.escolha === questao.gabarito
        ? "O aluno confirmou e ACERTOU. O gabarito está na tela."
        : `O aluno confirmou e ERROU (marcou ${contexto.escolha ?? "nada"}). O gabarito está na tela; explique o erro pela alternativa marcada.`,
    );
  }
  if (contexto.pedidoResposta) estado.push("O aluno PEDIU A RESPOSTA DIRETA: dê a resolução completa e conferida, com o gabarito.");
  else if (contexto.degrau < 4) estado.push("A resposta ainda NÃO pode ser revelada.");
  if (contexto.selecao?.trim()) estado.push(`Trecho do enunciado selecionado pelo aluno: «${contexto.selecao.trim().slice(0, 400)}»`);
  partes.push(`ESTADO DA CONVERSA\n${estado.join(" ")}`);
  partes.push(`RESUMO DO ALUNO\n${resumoAluno}`);
  return partes.join("\n\n");
}

export interface Instrucoes {
  /** Regras + escada + ferramentas: marcar para cache. */
  fixo: string;
  /** Perfil do aluno: muda raramente; também cacheável. */
  perfil: string;
  /** Questão e estado: muda a cada questão/mensagem. */
  contexto: string;
}

export function montarInstrucoes({
  questao,
  perfil,
  contexto,
  resumoAluno,
}: {
  questao: Questao;
  perfil: Pick<Perfil, "nome" | "explicaDoMeuJeito">;
  contexto: ContextoConversa;
  resumoAluno: string;
}): Instrucoes {
  return { fixo: BLOCO_FIXO, perfil: blocoPerfil(perfil), contexto: blocoContexto({ questao, contexto, resumoAluno }) };
}
