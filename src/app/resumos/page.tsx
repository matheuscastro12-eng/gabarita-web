import type { Metadata } from "next";
import { TelaResumos } from "@/components/resumos/tela-resumos";

export const metadata: Metadata = { title: "Resumos" };

export default function PaginaResumos() {
  return <TelaResumos />;
}
