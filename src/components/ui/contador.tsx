"use client";

import * as React from "react";
import { interpolarContador, numeroDoTexto } from "@/lib/movimento";

const DURACAO_MS = 520;

function prefereMenosMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * Número que sobe do valor anterior (0 na primeira vez) até o atual. Textos que não são
 * inteiros ("—", "0,30") aparecem direto. Com prefers-reduced-motion, sem animação.
 */
export function Contador({ valor, className }: { valor: string; className?: string }) {
  const alvo = numeroDoTexto(valor);
  const [mostrado, setMostrado] = React.useState<number | null>(() => (alvo === null ? null : 0));
  const anterior = React.useRef(0);

  React.useEffect(() => {
    if (alvo === null) return;
    const de = anterior.current;
    anterior.current = alvo;
    if (de === alvo || prefereMenosMovimento()) {
      setMostrado(alvo);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = (agora - inicio) / DURACAO_MS;
      setMostrado(interpolarContador(de, alvo, t));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo]);

  if (alvo === null) return <span className={className}>{valor}</span>;
  return (
    <span className={className} aria-label={valor}>
      <span aria-hidden>{mostrado ?? alvo}</span>
    </span>
  );
}
