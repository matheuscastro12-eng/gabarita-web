import { expect, test } from "@playwright/test";
import { abrirHoje } from "./apoio";

test.describe("Hoje", () => {
  test("abre com o botão Começar e a navegação", async ({ page }) => {
    await abrirHoje(page);
    await expect(page.getByTestId("comecar")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Estudar" })).toBeVisible();
    await expect(page.getByText(/questões oficiais do INEP|Dados de desenvolvimento/)).toBeVisible();
  });

  test("paleta de comandos abre com Ctrl+K e navega", async ({ page }) => {
    await abrirHoje(page);
    await page.keyboard.press("Control+k");
    const input = page.getByPlaceholder("O que você quer fazer?");
    await expect(input).toBeVisible();
    await input.fill("mapa");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/mapa$/);
    await expect(page.getByRole("heading", { name: "Mapa", exact: true })).toBeVisible();
  });

  test("ajuda de atalhos abre com ? e fecha com Esc", async ({ page }) => {
    await abrirHoje(page);
    await page.keyboard.press("Shift+?");
    await expect(page.getByRole("heading", { name: "Atalhos de teclado" })).toBeVisible();
    await expect(page.getByText("Começar um sprint")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Atalhos de teclado" })).toBeHidden();
  });

  test("Alt+2 vai para Estudar", async ({ page }) => {
    await abrirHoje(page);
    await page.keyboard.press("Alt+2");
    await expect(page).toHaveURL(/\/estudar$/);
  });

  test("alterna o tema", async ({ page }) => {
    await abrirHoje(page);
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Mudar para o modo claro" }).click();
    await expect(html).not.toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Mudar para o modo escuro" })).toBeVisible();
  });
});
