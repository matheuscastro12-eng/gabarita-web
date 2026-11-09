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

const DESCRICAO = "IDE de estudo de matemática do ENEM: a questão oficial de um lado, um tutor que confere cada conta do outro, e um mapa que diz quando você está pronto.";

export const metadata: Metadata = {
  title: { default: "Gabarita", template: "%s · Gabarita" },
  description: DESCRICAO,
  applicationName: "Gabarita",
  keywords: ["ENEM", "matemática", "TRI", "estudo", "tutor", "questões oficiais", "INEP"],
  authors: [{ name: "Matheus Castro" }],
  creator: "Matheus Castro",
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "Gabarita", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Gabarita",
    title: "Gabarita",
    description: DESCRICAO,
  },
  twitter: { card: "summary", title: "Gabarita", description: DESCRICAO },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#16181c" },
    { media: "(prefers-color-scheme: light)", color: "#fdfdfd" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
