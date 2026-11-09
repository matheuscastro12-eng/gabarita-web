import type { Metadata } from "next";
import { SoMatematica } from "@/components/app/so-matematica";
import { TelaAprender } from "@/components/aprender/tela-aprender";

export const metadata: Metadata = { title: "Aprender o básico" };

export default function PaginaAprender() {
  return (
    <SoMatematica recurso="Aprender">
      <TelaAprender />
    </SoMatematica>
  );
}
