"use client";

import type * as React from "react";
import type { IdVisual } from "@/lib/visuais/catalogo";
import { VisualArea } from "./visual-area";
import { VisualEstatistica } from "./visual-estatistica";
import { VisualFracoes } from "./visual-fracoes";
import { VisualGraficos } from "./visual-graficos";
import { VisualPorcentagem } from "./visual-porcentagem";
import { VisualProbabilidade } from "./visual-probabilidade";
import { VisualProporcao } from "./visual-proporcao";
import { VisualUnidades } from "./visual-unidades";

export const COMPONENTE_VISUAL: Record<IdVisual, () => React.JSX.Element> = {
  porcentagem: VisualPorcentagem,
  proporcao: VisualProporcao,
  fracoes: VisualFracoes,
  graficos: VisualGraficos,
  estatistica: VisualEstatistica,
  unidades: VisualUnidades,
  area: VisualArea,
  probabilidade: VisualProbabilidade,
};

export { MolduraVisual, MiniExercicio, Deslizador } from "./moldura";
