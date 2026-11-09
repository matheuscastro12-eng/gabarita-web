import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TelaResumo } from "@/components/resumos/tela-resumo";
import { RESUMOS, resumoPorId } from "@/lib/resumos/conteudo";

export function generateStaticParams() {
  return RESUMOS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: resumoPorId(id)?.titulo ?? "Resumo" };
}

function Conteudo({ id }: { id: string }) {
  const resumo = resumoPorId(id);
  if (!resumo) notFound();
  return <TelaResumo resumo={resumo} />;
}

export default function PaginaResumo({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={null}>{params.then(({ id }) => <Conteudo id={id} />)}</Suspense>;
}
