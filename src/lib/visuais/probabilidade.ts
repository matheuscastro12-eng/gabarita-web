import { simplificar } from "./fracoes";
import { arredondar } from "./porcentagem";

/** P = casos favoráveis / casos possíveis, como fração simplificada e porcentagem. */
export function probabilidade(favoraveis: number, total: number): { n: number; d: number; porcento: number } {
  if (total <= 0) throw new Error("total precisa ser positivo");
  if (favoraveis < 0 || favoraveis > total) throw new Error("favoráveis fora do intervalo");
  const f = simplificar(favoraveis, total);
  return { ...f, porcento: arredondar((favoraveis / total) * 100, 1) };
}

/** Faces de um dado que satisfazem o critério. */
export function facesDoDado(criterio: (face: number) => boolean): number[] {
  return [1, 2, 3, 4, 5, 6].filter(criterio);
}
