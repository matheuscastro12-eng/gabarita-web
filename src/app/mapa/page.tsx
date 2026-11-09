import type { Metadata } from "next";
import { TelaMapa } from "@/components/mapa/tela-mapa";

export const metadata: Metadata = { title: "Mapa" };

export default function PaginaMapa() {
  return <TelaMapa />;
}
