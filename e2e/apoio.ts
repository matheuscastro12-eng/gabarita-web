import { expect, type Page } from "@playwright/test";

/**
 * Abre a tela Hoje e espera a hidratação terminar: a saudação só aparece
 * quando o estado já veio do IndexedDB, então os atalhos já estão registrados.
 */
export async function abrirHoje(page: Page) {
  await page.goto("/");
  // Em dev, a primeira compilação da rota e a leitura do IndexedDB podem demorar sob carga.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite), /, { timeout: 20_000 });
  await expect(page.getByText(/^Próximas:/)).toBeVisible();
}

/** Abre a tela Estudar e espera a primeira questão. */
export async function abrirEstudar(page: Page) {
  await page.goto("/estudar");
  await expect(page.getByRole("radiogroup", { name: "Alternativas" }).first()).toBeVisible();
}
