import { BookMarked, FlaskConical, Home, Map, Pencil, Settings, type LucideIcon } from "lucide-react";

export interface ItemNavegacao {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** Tecla do atalho "g + x" não é usada: aqui é o número do atalho Alt+n. */
  indice: number;
}

export const NAVEGACAO: ItemNavegacao[] = [
  { href: "/", rotulo: "Hoje", icone: Home, indice: 1 },
  { href: "/estudar", rotulo: "Estudar", icone: Pencil, indice: 2 },
  { href: "/mapa", rotulo: "Mapa", icone: Map, indice: 3 },
  { href: "/caderno", rotulo: "Caderno", icone: BookMarked, indice: 4 },
  { href: "/laboratorio", rotulo: "Laboratório", icone: FlaskConical, indice: 5 },
  { href: "/ajustes", rotulo: "Ajustes", icone: Settings, indice: 6 },
];

export function itemAtivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
