"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { AtalhosProvider } from "@/lib/atalhos/provider";
import { StoreProvider } from "@/lib/store/provider";
import { VersaoProvider } from "./versao";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider>
        <AtalhosProvider>
          <ToastProvider>
            <StoreProvider>
              <VersaoProvider>{children}</VersaoProvider>
            </StoreProvider>
          </ToastProvider>
        </AtalhosProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
