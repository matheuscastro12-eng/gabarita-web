import { expect, test } from "@playwright/test";

test.describe("Laboratório", () => {
  test("abre com editor Python realçado, exemplos e gráfico com sliders", async ({ page }) => {
    await page.goto("/laboratorio");
    await expect(page.getByRole("heading", { name: "Laboratório", exact: true })).toBeVisible();
    await expect(page.getByTestId("rodar-python")).toBeVisible();
    await expect(page.getByTestId("status-pyodide")).toContainText("não carregado");
    await page.getByTestId("exemplo-probabilidade").click();
    await expect(page.getByLabel("Código Python")).toHaveValue(/Rational\(len\(favoraveis\)/);
    await expect(page.getByTestId("realce-python").locator(".tok-builtin").first()).toBeVisible();
    await expect(page.getByTestId("realce-python").locator(".tok-palavra").first()).toHaveText("from");

    const grafico = page.getByTestId("grafico");
    await expect(grafico.getByRole("slider", { name: "parâmetro a" })).toBeVisible();
    await page.getByLabel("Função de x").fill("2x + 3");
    await page.getByTestId("desenhar").click();
    await expect(grafico.getByText("y = 2x + 3")).toBeVisible();
  });

  test("dentro da IDE, L abre a gaveta do Laboratório e digitar no editor não marca alternativa", async ({ page }) => {
    await page.goto("/estudar?questao=enem-2022-154");
    await expect(page.getByRole("radiogroup", { name: "Alternativas" }).first()).toBeVisible();
    await page.keyboard.press("l");
    const gaveta = page.getByTestId("gaveta-laboratorio");
    await expect(gaveta).toBeVisible();
    await gaveta.getByTestId("exemplo-simplificar").click();
    const editor = gaveta.getByLabel("Código Python");
    await expect(editor).toHaveValue(/simplify/);
    await editor.focus();
    await page.keyboard.type("abc");
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
    await gaveta.getByRole("tab", { name: "Gráfico" }).click();
    await expect(gaveta.getByTestId("grafico").getByRole("slider", { name: "parâmetro a" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(gaveta).toBeHidden();
    // Botão da barra também abre.
    await page.getByTestId("abrir-laboratorio").first().click();
    await expect(page.getByTestId("gaveta-laboratorio")).toBeVisible();
  });
});
