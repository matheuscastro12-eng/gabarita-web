import type { Metadata } from "next";
import { TelaHoje } from "@/components/hoje/tela-hoje";

export const metadata: Metadata = { title: "Hoje · Gabarita" };

export default function PaginaHoje() {
  return <TelaHoje />;
}
