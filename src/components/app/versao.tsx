"use client";

import * as React from "react";
import type { Area } from "@/data/tipos";
import { filtrarEstadoPorArea } from "@/lib/dominio/area";
import type { EstadoAluno } from "@/lib/dominio/tipos";
import { useStore } from "@/lib/store/provider";
import { areasDaVersao, CHAVE_VERSAO, versaoInicial, type Versao } from "@/lib/versao";

interface ContextoVersao {
  /** null = ainda não escolhida (mostrar a tela de entrada). */
  versao: Versao | null;
  /** true depois de ler o localStorage e o estado do aluno. */
  carregada: boolean;
  areas: Area[];
  definir: (v: Versao) => void;
}

const Ctx = React.createContext<ContextoVersao | null>(null);

function lerSalva(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_VERSAO);
  } catch {
    return null;
  }
}

/** Versão do app (Matemática, Natureza ou Geral), persistida em localStorage. */
export function VersaoProvider({ children, inicial }: { children: React.ReactNode; inicial?: Versao }) {
  const { estado } = useStore();
  const [escolhida, setEscolhida] = React.useState<Versao | null | undefined>(inicial);

  // Decide uma vez, quando o estado chega: quem já tem progresso vai direto para Matemática.
  React.useEffect(() => {
    if (escolhida !== undefined || !estado) return;
    const temProgresso = estado.tentativas.length > 0 || estado.sprints.length > 0 || estado.simulados.length > 0;
    const v = versaoInicial(lerSalva(), temProgresso);
    if (v) {
      try {
        window.localStorage.setItem(CHAVE_VERSAO, v);
      } catch {
        /* sem localStorage: vale só nesta aba */
      }
    }
    setEscolhida(v);
  }, [estado, escolhida]);

  const definir = React.useCallback((v: Versao) => {
    try {
      window.localStorage.setItem(CHAVE_VERSAO, v);
    } catch {
      /* idem */
    }
    setEscolhida(v);
  }, []);

  const versao = escolhida ?? null;
  const valor = React.useMemo<ContextoVersao>(
    () => ({ versao, carregada: escolhida !== undefined, areas: areasDaVersao(versao ?? "matematica"), definir }),
    [versao, escolhida, definir],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

const PADRAO: ContextoVersao = { versao: "matematica", carregada: true, areas: ["matematica"], definir: () => {} };

/** Fora do provider (testes de componente), vale Matemática. */
export function useVersao(): ContextoVersao {
  return React.useContext(Ctx) ?? PADRAO;
}

/** Estado do aluno recortado para as áreas da versão (ou das áreas pedidas). */
export function useEstadoArea(areas?: readonly Area[]): EstadoAluno | null {
  const { estado } = useStore();
  const { areas: daVersao } = useVersao();
  const alvo = areas ?? daVersao;
  const chave = alvo.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => (estado ? filtrarEstadoPorArea(estado, alvo) : null), [estado, chave]);
}
