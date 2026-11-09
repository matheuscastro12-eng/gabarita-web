import type { Metadata } from "next";
import { TelaApostas } from "@/components/apostas/tela-apostas";

export const metadata: Metadata = { title: "Apostas 2026" };

export default function PaginaApostas() {
  return <TelaApostas />;
}
