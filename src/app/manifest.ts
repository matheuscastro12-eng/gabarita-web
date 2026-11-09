import type { MetadataRoute } from "next";

/** PWA simples: instalável, abre em janela própria, cores do tema grafite. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gabarita",
    short_name: "Gabarita",
    description: "IDE de estudo de matemática do ENEM: a questão de um lado, o tutor do outro.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#16181c",
    theme_color: "#16181c",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Começar um sprint", short_name: "Sprint", url: "/estudar", description: "5 questões, fáceis primeiro" },
      { name: "Mapa de domínio", short_name: "Mapa", url: "/mapa" },
      { name: "Caderno de erros", short_name: "Caderno", url: "/caderno" },
    ],
  };
}
