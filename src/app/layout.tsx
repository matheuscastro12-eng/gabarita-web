import type { Metadata, Viewport } from "next";
import type * as React from "react";
import localFont from "next/font/local";
import { Providers } from "@/components/app/providers";
import { AppShell } from "@/components/app/app-shell";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../fonts/inter-latin.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/inter-latin-ext.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Gabarita", template: "%s · Gabarita" },
  description: "IDE de estudo de matemática do ENEM: a questão de um lado, o tutor do outro.",
  applicationName: "Gabarita",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16181c" },
    { media: "(prefers-color-scheme: light)", color: "#fdfdfd" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-foreground"
        >
          Pular para o conteúdo
        </a>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
