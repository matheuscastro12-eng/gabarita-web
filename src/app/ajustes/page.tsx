import type { Metadata } from "next";
import { TelaAjustes } from "@/components/ajustes/tela-ajustes";

export const metadata: Metadata = { title: "Ajustes" };

export default function PaginaAjustes() {
  return <TelaAjustes />;
}
