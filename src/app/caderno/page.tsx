import type { Metadata } from "next";
import { TelaCaderno } from "@/components/caderno/tela-caderno";

export const metadata: Metadata = { title: "Caderno de erros" };

export default function PaginaCaderno() {
  return <TelaCaderno />;
}
