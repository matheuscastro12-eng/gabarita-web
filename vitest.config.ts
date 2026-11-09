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
      include: [
        "src/lib/dominio/**/*.ts",
        "src/lib/store/**/*.ts",
        "src/lib/atalhos/registro.ts",
        "src/lib/utils.ts",
        "src/lib/aleatorio.ts",
        "src/lib/tutor/**/*.ts",
        "src/lib/gemeas/**/*.ts",
        "src/lib/laboratorio/**/*.ts",
        "src/lib/pyodide/fallback.ts",
        "src/lib/visuais/**/*.ts",
        "src/lib/movimento.ts",
      ],
      exclude: [
        "src/lib/**/*.test.ts",
        "src/lib/**/index.ts",
        "src/lib/**/teste-fixtures.ts",
        // Cola do navegador (fetch, dynamic import): coberta pelo e2e.
        "src/lib/tutor/status-cliente.ts",
        "src/lib/tutor/mathjs-cliente.ts",
      ],
      // Núcleo puro (domínio, store, atalhos, utils, aleatório): 100%.
      // Tutor e gêmeas (muita ramificação de texto e cola do AI SDK): 90% (global).
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
        "src/lib/dominio/**/*.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/store/**/*.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/atalhos/registro.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/utils.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/aleatorio.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/laboratorio/**/*.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/pyodide/fallback.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/visuais/**/*.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
        "src/lib/movimento.ts": { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  },
});
