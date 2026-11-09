import { expect, test } from "@playwright/test";
import { abrirEstudar, abrirHoje } from "./apoio";

test.describe("Aprender o básico", () => {
  test("o menu leva aos visuais, o passo a passo avança e o teste dá retorno", async ({ page }) => {
    await abrirHoje(page);
    await page.getByRole("navigation", { name: "Principal" }).first().getByRole("link", { name: "Aprender" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aprender o básico");

    const visual = page.getByTestId("visual-porcentagem");
    await expect(visual.getByTestId("texto-passo")).toContainText("R$ 80");
    await expect(visual.getByText("Passo 1 de 3")).toBeVisible();
    await visual.getByTestId("avancar-passo").click();
    await expect(visual.getByText("Passo 2 de 3")).toBeVisible();
    await expect(visual.getByTestId("texto-passo")).toContainText("R$ 20");
    await expect(visual.getByTestId("truque")).toContainText("Truque do ENEM");

    const teste = visual.getByTestId("mini-exercicio");
    await teste.getByRole("radio", { name: "R$ 200" }).click();
    await expect(teste.getByRole("status")).toContainText("Ainda não");
    await teste.getByRole("radio", { name: "R$ 198" }).click();
    await expect(teste.getByRole("status")).toContainText("Isso.");
  });

  test("troca de tema pelo hash e mostra a mediana", async ({ page }) => {
    await page.goto("/aprender#estatistica");
    const visual = page.getByTestId("visual-estatistica");
    await expect(visual).toBeVisible({ timeout: 20_000 });
    await visual.getByTestId("avancar-passo").click();
    await visual.getByTestId("avancar-passo").click();
    await expect(visual.getByTestId("texto-passo")).toContainText("Mediana é o do meio da lista ordenada: 5");
    await page.getByRole("button", { name: /Área e perímetro/ }).click();
    await expect(page).toHaveURL(/#area$/);
    await expect(page.getByTestId("visual-area")).toBeVisible();
  });

  test("a IDE oferece Ver visualmente numa questão de gráfico", async ({ page }) => {
    await abrirEstudar(page);
    const botao = page.getByTestId("ver-visualmente").first();
    await expect(botao).toBeVisible();
    await botao.click();
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toBeVisible();
    await expect(dialogo.locator("[data-testid^=visual-]")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialogo).toHaveCount(0);
  });

  test("com prefers-reduced-motion, a entrada dos cards não anima", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await abrirHoje(page);
    const duracao = await page.getByTestId("card-sprint").evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duracao)).toBeLessThan(0.001);
  });
});
