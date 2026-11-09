"use client";

import * as React from "react";
import type { Questao } from "./tipos";
import { carregarQuestoes } from "./carregar";

interface Resultado {
  questoes: Questao[] | null;
  porId: Map<string, Questao> | null;
  erro: string | null;
}

/** Carrega o banco de questões uma vez (cache do módulo) e expõe busca por id. */
export function useQuestoes(): Resultado {
  const [questoes, setQuestoes] = React.useState<Questao[] | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ativo = true;
    carregarQuestoes()
      .then((q) => {
        if (ativo) setQuestoes(q);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar as questões.");
      });
    return () => {
      ativo = false;
    };
  }, []);

  const porId = React.useMemo(() => (questoes ? new Map(questoes.map((q) => [q.id, q])) : null), [questoes]);
  return { questoes, porId, erro };
}
