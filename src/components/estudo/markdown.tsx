"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { ImagemQuestao } from "./imagem-questao";
import "katex/dist/katex.min.css";

const componentes: Components = {
  // Imagens das questões vêm do enem.dev; o tamanho real varia, então usamos <img> com limite.
  img: ({ src, alt }) => <ImagemQuestao src={typeof src === "string" ? src : undefined} alt={alt ?? ""} />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primaria-texto underline underline-offset-4">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1">
        {children}
      </table>
    </div>
  ),
};

/** Markdown + LaTeX (KaTeX) para enunciados, alternativas e mensagens do tutor. */
export function Markdown({ children, className, inline = false }: { children: string; className?: string; inline?: boolean }) {
  // Inline: o invólucro é um <span> para não quebrar a linha ("Marcou B · 86 700").
  const Tag = inline ? "span" : "div";
  return (
    <Tag
      className={cn(
        "break-words [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
        inline && "inline [&>p]:inline [&>p]:my-0",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={componentes}>
        {children}
      </ReactMarkdown>
    </Tag>
  );
}
