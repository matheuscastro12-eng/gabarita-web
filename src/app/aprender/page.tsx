import type { Metadata } from "next";
import { TelaAprender } from "@/components/aprender/tela-aprender";

export const metadata: Metadata = { title: "Aprender o básico" };

export default function PaginaAprender() {
  return <TelaAprender />;
}
