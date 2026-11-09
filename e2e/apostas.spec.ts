import { expect, test } from "@playwright/test";
import { abrirEstudar, abrirHoje } from "./apoio";

test.describe("Apostas 2026", () => {
  test("abre pelo Hoje, treina uma questão e vê a resolução do autor", async ({ page }) => {
    await abrirHoje(page);
    await page.getByTestId("abrir-apostas").click();
    await expect(page).toHaveURL(/\/apostas$/, { timeout: 20_000 });
    await expect(page.getByTestId("credito-apostas")).toContainText("Apostas do curso Edcley Teixeira (questões inéditas, não oficiais)");

    await page.getByTestId("filtro-matematica").click();
    await page.getByTestId("apostas-treino").click();
    await expect(page.getByRole("radiogroup", { name: "Alternativas" }).first()).toBeVisible();
    await expect(page.getByTestId("selo-nao-oficial").filter({ visible: true })).toBeVisible();
    await expect(page.getByTestId("fonte").filter({ visible: true })).toContainText("Edcley Teixeira");

    // Q02 (primeira de matemática): gabarito E
    await page.keyboard.press("e");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").first()).toHaveText("Acertou.");
    await page.getByTestId("ver-resolucao").filter({ visible: true }).click();
    await expect(page.getByText("Resolução do autor").filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Explicação detalhada").filter({ visible: true })).toBeVisible();
  });

  test("simulado por matéria: responde, encerra e corrige no fim", async ({ page }) => {
    await page.goto("/apostas");
    await page.getByTestId("filtro-linguagens").click();
    await page.getByTestId("apostas-simulado").click();
    await expect(page.getByTestId("cronometro-apostas")).toBeVisible();
    await page.keyboard.press("a");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("progresso-apostas")).toHaveText(/^2\//);
    await page.getByTestId("encerrar-apostas").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^\d+ de 8$/);
    await expect(page.getByTestId("correcao-aposta")).toHaveCount(8);
    await page.getByTestId("ver-resolucao").first().click();
    await expect(page.getByText("Resolução do autor").first()).toBeVisible();
  });

  test("questão oficial mostra a explicação de IA recolhida depois de confirmar", async ({ page }) => {
    await abrirEstudar(page);
    await expect(page.getByTestId("ver-resolucao")).toHaveCount(0);
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");
    await page.getByTestId("ver-resolucao").filter({ visible: true }).click();
    await expect(page.getByTestId("resolucao-conteudo").or(page.getByTestId("resolucao-ausente")).filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });
  });
});
