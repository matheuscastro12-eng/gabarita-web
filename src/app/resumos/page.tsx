import type { Metadata } from "next";
import { SoMatematica } from "@/components/app/so-matematica";
import { TelaResumos } from "@/components/resumos/tela-resumos";

export const metadata: Metadata = { title: "Resumos" };

export default function PaginaResumos() {
  return (
    <SoMatematica recurso="Resumos">
      <TelaResumos />
    </SoMatematica>
  );
}
