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

  test("abre no tema claro e alterna para o escuro", async ({ page }) => {
    await abrirHoje(page);
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await expect(html).toHaveCSS("color-scheme", "light");
    await page.getByRole("button", { name: "Mudar para o modo escuro" }).click();
    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Mudar para o modo claro" })).toBeVisible();
    // O escuro é o mesmo sistema em azul, não o grafite com âmbar: o botão principal continua azul.
    const corBotao = await page.getByTestId("comecar").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(corBotao).toBe("rgb(10, 132, 255)");
  });

  test("usa o design system original: fundo claro, sidebar branca de 210px, card branco com raio 20px", async ({ page }) => {
    await abrirHoje(page);
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(245, 247, 250)");
    const nav = page.getByRole("navigation", { name: "Principal" }).first();
    await expect(nav).toHaveCSS("width", "210px");
    await expect(nav).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(nav.getByRole("link", { name: "Hoje" })).toHaveCSS("background-color", "rgb(229, 241, 255)");
    const card = page.getByTestId("card-sprint");
    await expect(card).toHaveCSS("border-radius", "20px");
    await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.getByTestId("comecar")).toHaveCSS("border-radius", /3\.35544e\+07px|9999px|999px/);
    await expect(page.getByTestId("stat-cards").getByTestId("stat")).toHaveCount(4);
    await expect(page.getByTestId("plano-hoje")).toBeVisible();
    await expect(page.getByText(/nota TRI sempre estimada/)).toBeVisible();
  });
});
