import type { Metadata } from "next";
import { TelaSimulado } from "@/components/simulado/tela-simulado";

export const metadata: Metadata = { title: "Simulado de fáceis" };

export default function PaginaSimulado() {
  return <TelaSimulado />;
}
