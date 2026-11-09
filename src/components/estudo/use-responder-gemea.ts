"use client";

import * as React from "react";
import type { Questao } from "@/data/tipos";
import { useStore } from "@/lib/store/provider";
import { registrarTentativa } from "@/lib/dominio";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { gemeaComoQuestao } from "@/lib/gemeas";
import { useToast } from "@/components/ui/toast";
import type { RespostaGemea } from "./gemea-card";

/**
 * Registra a resposta a uma questão gêmea como tentativa de origem "gemea"
 * (peso 0,6, fora da nota TRI, sem sprint). Usado no chat do tutor e no caderno.
 */
export function useResponderGemea(porId: Map<string, Questao> | null) {
  const { atualizar } = useStore();
  const { notificar } = useToast();
  return React.useCallback(
    (questaoPai: Pick<Questao, "habilidade" | "competencia">, r: RespostaGemea) => {
      if (!porId) return;
      const agora = new Date();
      const questaoGemea = gemeaComoQuestao(r.gemea, questaoPai);
      const porQue = r.acertou ? null : (r.gemea.erros[r.escolha] ?? null);
      atualizar((e: EstadoAluno) =>
        registrarTentativa(
          e,
          {
            questao: questaoGemea,
            escolha: r.escolha,
            segundos: r.segundos,
            degrauMaximo: 0,
            pediuResposta: false,
            origem: "gemea",
            sprintId: null,
            porQue,
            buscarQuestao: (id) => porId.get(id),
          },
          agora,
        ).estado,
      ).catch((err: unknown) => {
        notificar({ tipo: "erro", titulo: "Não consegui salvar a gêmea", descricao: err instanceof Error ? err.message : undefined });
      });
    },
    [porId, atualizar, notificar],
  );
}
