/** Orquestrador puro do estado do aluno. */
import type { Questao } from "@/data/tipos";
import { registrarErro, marcarResolvida } from "./caderno";
import { aplicarTentativa, medianaSegundos, novoEstadoHabilidade } from "./evidencia";
import { gerarId, type GeradorId } from "./id";
import { estimarTheta, respostasTRI, type BuscaQuestao } from "./tri";
import type {
  DegrauDica,
  EstadoAluno,
  Habilidade,
  Letra,
  OrigemItem,
  Perfil,
  Sprint,
  Tentativa,
} from "./tipos";

export const PERFIL_PADRAO: Perfil = {
  nome: "Matheus",
  dataProva: null,
  metaNota: 700,
  explicaDoMeuJeito: "",
  habilidadesDaSemana: ["H3", "H16", "H17", "H19", "H24", "H25", "H27", "H28"],
  mostrarTimer: true,
};

const geradorPadrao: GeradorId = (prefixo) => gerarId(prefixo);

export function estadoInicial(agora: Date, perfil: Partial<Perfil> = {}): EstadoAluno {
  const iso = agora.toISOString();
  return {
    versao: 1,
    criadoEm: iso,
    atualizadoEm: iso,
    perfil: {
      ...PERFIL_PADRAO,
      habilidadesDaSemana: [...PERFIL_PADRAO.habilidadesDaSemana],
      ...perfil,
    },
    habilidades: {},
    tentativas: [],
    caderno: [],
    sprints: [],
    simulados: [],
    eventosTutor: [],
  };
}

export interface EntradaTentativa {
  questao: Questao;
  escolha: Letra | null;
  segundos: number;
  degrauMaximo: DegrauDica;
  pediuResposta: boolean;
  origem: OrigemItem;
  sprintId: string | null;
  porQue?: string | null;
  /**
   * Busca das questões já respondidas, para estimar θ antes da tentativa
   * (a TRI precisa de a, b e c). Sem ela, só a própria questão é conhecida;
   * na prática, passe a busca do banco inteiro.
   */
  buscarQuestao?: BuscaQuestao;
}

export function registrarTentativa(
  estado: EstadoAluno,
  entrada: EntradaTentativa,
  agora: Date,
  idFn: GeradorId = geradorPadrao,
): { estado: EstadoAluno; tentativa: Tentativa } {
  const { questao, origem } = entrada;
  const habilidade = questao.habilidade as Habilidade | null;
  if (!habilidade) {
    throw new Error(`A questão ${questao.id} está sem habilidade: não dá para registrar a tentativa.`);
  }

  const buscar: BuscaQuestao = (id) =>
    id === questao.id ? questao : entrada.buscarQuestao?.(id);
  const respostas = respostasTRI(estado.tentativas, buscar);
  const thetaAntes = respostas.length > 0 ? estimarTheta(respostas).theta : null;
  const b = origem === "oficial" ? (questao.tri?.b ?? null) : null;
  const acertou = entrada.escolha === questao.gabarito;
  const anterior = estado.habilidades[habilidade] ?? novoEstadoHabilidade(habilidade, agora);

  const r = aplicarTentativa(
    anterior,
    {
      acertou,
      degrauMaximo: entrada.degrauMaximo,
      pediuResposta: entrada.pediuResposta,
      origem,
      segundos: entrada.segundos,
      medianaSegundos: medianaSegundos(estado.tentativas),
      b,
      theta: thetaAntes,
    },
    agora,
  );

  const tentativa: Tentativa = {
    id: idFn("tentativa"),
    questaoId: questao.id,
    habilidade,
    origem,
    escolha: entrada.escolha,
    gabarito: questao.gabarito,
    acertou,
    segundos: entrada.segundos,
    degrauMaximo: entrada.degrauMaximo,
    pediuResposta: entrada.pediuResposta,
    b,
    thetaAntes,
    chuteSuspeito: r.chuteSuspeito,
    evidencia: r.evidencia,
    peso: r.peso,
    dominioAntes: anterior.dominio,
    dominioDepois: r.estado.dominio,
    em: agora.toISOString(),
    sprintId: entrada.sprintId,
  };

  const caderno = acertou
    ? marcarResolvida(estado.caderno, questao.id, agora)
    : registrarErro(estado.caderno, tentativa, entrada.porQue ?? null, agora);

  const sprints = entrada.sprintId
    ? estado.sprints.map((s) =>
        s.id === entrada.sprintId ? { ...s, tentativaIds: [...s.tentativaIds, tentativa.id] } : s,
      )
    : estado.sprints;

  return {
    estado: {
      ...estado,
      habilidades: { ...estado.habilidades, [habilidade]: r.estado },
      tentativas: [...estado.tentativas, tentativa],
      caderno,
      sprints,
      atualizadoEm: agora.toISOString(),
    },
    tentativa,
  };
}

export function iniciarSprint(
  estado: EstadoAluno,
  questaoIds: string[],
  agora: Date,
  idFn: GeradorId = geradorPadrao,
  area?: Sprint["area"],
): { estado: EstadoAluno; sprint: Sprint } {
  const sprint: Sprint = {
    id: idFn("sprint"),
    iniciadoEm: agora.toISOString(),
    terminadoEm: null,
    questaoIds: [...questaoIds],
    tentativaIds: [],
    ...(area ? { area } : {}),
  };
  return {
    estado: { ...estado, sprints: [...estado.sprints, sprint], atualizadoEm: agora.toISOString() },
    sprint,
  };
}

/** Encerra o sprint (se já encerrado, mantém a data original). */
export function encerrarSprint(estado: EstadoAluno, sprintId: string, agora: Date): EstadoAluno {
  return {
    ...estado,
    sprints: estado.sprints.map((s) =>
      s.id === sprintId && s.terminadoEm === null ? { ...s, terminadoEm: agora.toISOString() } : s,
    ),
    atualizadoEm: agora.toISOString(),
  };
}

export function resumoSprint(
  estado: EstadoAluno,
  sprintId: string,
): {
  tentativas: Tentativa[];
  acertos: number;
  deltaPorHabilidade: Record<string, { antes: number; depois: number }>;
} {
  const tentativas = estado.tentativas.filter((t) => t.sprintId === sprintId);
  const deltaPorHabilidade: Record<string, { antes: number; depois: number }> = {};
  for (const t of tentativas) {
    const d = deltaPorHabilidade[t.habilidade];
    if (d) d.depois = t.dominioDepois;
    else deltaPorHabilidade[t.habilidade] = { antes: t.dominioAntes, depois: t.dominioDepois };
  }
  return { tentativas, acertos: tentativas.filter((t) => t.acertou).length, deltaPorHabilidade };
}
