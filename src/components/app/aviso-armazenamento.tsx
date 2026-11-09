"use client";

import * as React from "react";
import Link from "next/link";
import { HardDriveDownload, X } from "lucide-react";
import { useStore } from "@/lib/store/provider";

/** Faixa discreta quando o IndexedDB falhou e o progresso está só em memória. */
export function AvisoArmazenamento() {
  const { aviso } = useStore();
  const [fechado, setFechado] = React.useState(false);
  if (!aviso || fechado) return null;
  return (
    <div
      role="status"
      data-testid="aviso-armazenamento"
      className="flex items-start gap-3 border-b border-aviso/30 bg-aviso-suave px-4 py-2 text-sm text-foreground"
    >
      <HardDriveDownload className="mt-0.5 size-4 shrink-0 text-aviso" aria-hidden />
      <p className="min-w-0 flex-1">
        {aviso}{" "}
        <Link href="/ajustes" className="font-medium text-primaria-texto underline underline-offset-4">
          Abrir Ajustes
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setFechado(true)}
        aria-label="Fechar o aviso"
        className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
