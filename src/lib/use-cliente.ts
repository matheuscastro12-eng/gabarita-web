"use client";

import * as React from "react";
import { ehMac } from "./utils";

const semAssinatura = () => () => {};

/** true depois da hidratação; false no servidor e no primeiro render do cliente. */
export function useMontado(): boolean {
  return React.useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false,
  );
}

/** Detecta macOS sem divergir na hidratação (false no servidor). */
export function useEhMac(): boolean {
  return React.useSyncExternalStore(semAssinatura, ehMac, () => false);
}
