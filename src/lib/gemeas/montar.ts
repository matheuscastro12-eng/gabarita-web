/** Transforma a Candidata de um gerador numa Gemea com 5 alternativas distintas e uma correta. */
import type { Habilidade, Letra } from "@/data/tipos";
import { LETRAS } from "@/data/tipos";
import { criarAleatorio } from "@/lib/aleatorio";
import type { Candidata, Gemea, NomeGerador } from "./tipos";

export const HABILIDADE_DO_GERADOR: Record<NomeGerador, Habilidade> = {
  porcentagem: "H3",
  "regra-de-tres": "H16",
  "razao-proporcao": "H15",
  probabilidade: "H28",
  "media-mediana-moda": "H27",
  "funcao-afim": "H21",
  "equacao-1-grau": "H21",
  "equacao-2-grau": "H21",
  "progressao-aritmetica": "H2",
  escala: "H10",
};

const ERRO_GENERICO = "Erro de conta: confira a operação passo a passo.";

/**
 * Garante 5 textos distintos: tira distratores iguais à resposta ou entre si e,
 * se faltar, completa com perturbações da resposta (rotuladas como erro de conta).
 */
export function montarGemea(gerador: NomeGerador, semente: number, c: Candidata): Gemea {
  const rnd = criarAleatorio(semente ^ 0x9e3779b9);
  const textoCorreto = c.formatar(c.resposta);
  const usados = new Set<string>([textoCorreto]);
  const distratores: { texto: string; erro: string }[] = [];
  for (const d of c.distratores) {
    if (!Number.isFinite(d.valor)) continue;
    const texto = c.formatar(d.valor);
    if (usados.has(texto)) continue;
    usados.add(texto);
    distratores.push({ texto, erro: d.erro });
    if (distratores.length === 4) break;
  }
  const fatores = [1.5, 2, 0.5, 3, 0.25, 4, 1.25, 0.75, 5, 0.1, 10, 1.1, 0.9];
  let i = 0;
  while (distratores.length < 4 && i < fatores.length * 2) {
    const f = fatores[i % fatores.length] as number;
    const valor =
      i < fatores.length
        ? c.resposta * f
        : c.resposta + (i - fatores.length + 1) * Math.max(1, Math.abs(c.resposta) * 0.1);
    const texto = c.formatar(valor);
    i++;
    if (usados.has(texto)) continue;
    usados.add(texto);
    distratores.push({ texto, erro: ERRO_GENERICO });
  }
  if (distratores.length < 4) {
    throw new Error(`Gerador ${gerador} (semente ${semente}): não consegui 5 alternativas distintas.`);
  }

  const itens = rnd.embaralhar([{ texto: textoCorreto, erro: null as string | null }, ...distratores]);
  const alternativas = itens.map((it, idx) => ({ letra: LETRAS[idx] as Letra, texto: it.texto }));
  const gabarito = LETRAS[itens.findIndex((it) => it.erro === null)] as Letra;
  const erros: Partial<Record<Letra, string>> = {};
  itens.forEach((it, idx) => {
    if (it.erro !== null) erros[LETRAS[idx] as Letra] = it.erro;
  });
  return {
    id: `gemea-${gerador}-${semente}`,
    gerador,
    habilidade: HABILIDADE_DO_GERADOR[gerador],
    semente,
    enunciado: c.enunciado,
    alternativas,
    gabarito,
    resposta: textoCorreto,
    resolucao: c.resolucao,
    erros,
  };
}
