"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string | undefined;
  alt: string;
  className?: string;
  /** Texto que substitui a imagem quando ela não carrega (ex.: dados da imagem em texto). */
  descricao?: string | null;
}

/**
 * Imagem de questão (enem.dev) com fallback: se não carregar, mostra um bloco
 * explicando e um link para abrir a imagem original noutra aba.
 */
export function ImagemQuestao({ src, alt, className, descricao }: Props) {
  const [quebrada, setQuebrada] = React.useState(false);
  if (!src || quebrada) {
    return (
      <div
        role="img"
        aria-label={alt || "Imagem da questão indisponível"}
        data-testid="imagem-quebrada"
        className={cn("my-3 flex flex-col gap-2 rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground", className)}
      >
        <span className="flex items-center gap-2">
          <ImageOff className="size-4 shrink-0" aria-hidden />
          <span>Imagem da questão não carregou.</span>
        </span>
        {descricao ? (
          <span className="text-foreground">{descricao}</span>
        ) : (
          <span>Ela vem do enem.dev; sem internet ou com o servidor fora, não aparece. Use o texto do enunciado e as alternativas.</span>
        )}
        {src && (
          <a href={src} target="_blank" rel="noreferrer" className="w-fit text-primaria-texto underline underline-offset-4">
            Abrir a imagem original
          </a>
        )}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setQuebrada(true)}
      className={cn("my-2 block max-h-[28rem] max-w-full rounded-md border border-border bg-white object-contain", className)}
    />
  );
}
