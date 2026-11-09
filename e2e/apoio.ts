import { expect, type Page } from "@playwright/test";

/** Mesma regra de `interpretarTutorVisivel`: só 1, true, on ou sim, exatamente. */
export const TUTOR_VISIVEL = ["1", "true", "on", "sim"].includes(process.env.NEXT_PUBLIC_TUTOR_VISIVEL ?? "");

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
