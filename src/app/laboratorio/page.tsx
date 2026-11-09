import type { Metadata } from "next";
import { TelaLaboratorio } from "@/components/laboratorio/tela-laboratorio";

export const metadata: Metadata = { title: "Laboratório" };

export default function PaginaLaboratorio() {
  return <TelaLaboratorio />;
}
