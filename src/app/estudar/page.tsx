import type { Metadata } from "next";
import { TelaEstudar } from "@/components/estudo/tela-estudar";

export const metadata: Metadata = { title: "Estudar" };

export default function PaginaEstudar() {
  return <TelaEstudar />;
}
