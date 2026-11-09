import type { Metadata, Viewport } from "next";
import type * as React from "react";
import localFont from "next/font/local";
import { Providers } from "@/components/app/providers";
import { AppShell } from "@/components/app/app-shell";
import "./globals.css";

const plexSans = localFont({
  src: [
    { path: "../fonts/plex-sans.woff2", weight: "100 700", style: "normal" },
    { path: "../fonts/plex-sans-italic.woff2", weight: "100 700", style: "italic" },
  ],
  variable: "--font-plex-sans",
  weight: "100 700",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../fonts/plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
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
  appleWebApp: { capable: true, title: "Gabarita", statusBarStyle: "default" },
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
    { media: "(prefers-color-scheme: dark)", color: "#0f0f11" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
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
