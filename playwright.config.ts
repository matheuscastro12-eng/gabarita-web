import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "pt-BR",
    trace: "retain-on-failure",
    // Os testes antigos são da versão Matemática: entram direto, sem a tela de entrada.
    // (e2e/versoes.spec.ts limpa isto para testar a escolha.)
    storageState: { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: "gabarita:versao", value: "matematica" }] }] },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Nunca herda a chave da API do ambiente da máquina.
    command: `env -u ANTHROPIC_API_KEY -u AI_GATEWAY_API_KEY pnpm exec next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
