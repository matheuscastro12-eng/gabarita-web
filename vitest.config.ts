import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Núcleo puro: 100% obrigatório. A cola React (provider.tsx, use-cliente.ts) é coberta pelo e2e.
      include: ["src/lib/dominio/**/*.ts", "src/lib/store/**/*.ts", "src/lib/atalhos/registro.ts", "src/lib/utils.ts"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/**/index.ts", "src/lib/**/teste-fixtures.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
