import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Playwright e o dev server local falam por 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // O selo do dev overlay cobria o botão de tema na barra lateral (e trava o Playwright).
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "enem.dev" }],
  },
};

export default nextConfig;
