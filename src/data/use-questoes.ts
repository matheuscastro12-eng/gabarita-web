"use client";

import * as React from "react";
import type { Area, Questao } from "./tipos";
import { carregarQuestoes } from "./carregar";
import { useVersao } from "@/components/app/versao";

interface Resultado {
  questoes: Questao[] | null;
  porId: Map<string, Questao> | null;
  erro: string | null;
}

/**
 * Carrega as questões das áreas da versão atual (ou das áreas pedidas), uma vez por área
 * (cache do módulo, um chunk por ano), e expõe busca por id.
 */
export function useQuestoes(areas?: readonly Area[]): Resultado {
  const { areas: daVersao } = useVersao();
  const chave = (areas ?? daVersao).join(",");
  const [dados, setDados] = React.useState<{ chave: string; questoes: Questao[] } | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ativo = true;
    carregarQuestoes(chave.split(",") as Area[])
      .then((q) => {
        if (ativo) setDados({ chave, questoes: q });
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar as questões.");
      });
    return () => {
      ativo = false;
    };
  }, [chave]);

  const questoes = dados && dados.chave === chave ? dados.questoes : null;
  const porId = React.useMemo(() => (questoes ? new Map(questoes.map((q) => [q.id, q])) : null), [questoes]);
  return { questoes, porId, erro };
}
