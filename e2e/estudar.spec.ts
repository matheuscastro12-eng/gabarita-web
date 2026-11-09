import { expect, test } from "@playwright/test";
import { abrirEstudar, abrirHoje } from "./apoio";

test.describe("Estudar", () => {
  test("faz um sprint inteiro só pelo teclado e o estado persiste", async ({ page }) => {
    await abrirHoje(page);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/estudar$/);

    for (let i = 0; i < 5; i++) {
      await expect(page.getByRole("radiogroup", { name: "Alternativas" }).first()).toBeVisible();
      await expect(page.getByRole("img", { name: `questão ${i + 1} de 5` })).toBeVisible();
      await page.keyboard.press("h"); // pede um degrau de dica
      await page.keyboard.press("b");
      await expect(page.getByRole("radio", { checked: true }).first()).toHaveAttribute("data-letra", "B");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").first()).toBeVisible();
      await page.keyboard.press("n");
    }

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^\d de 5$/);
    await expect(page.getByTestId("resultado-questao")).toHaveCount(5);
    expect(await page.getByTestId("delta-habilidade").count()).toBeGreaterThan(0);

    // O estado persistiu no IndexedDB: a tela Hoje mostra o sprint de hoje.
    await abrirHoje(page);
    await expect(page.getByText(/Hoje: 1 sprint/)).toBeVisible();
  });

  test("modo foco esconde a navegação", async ({ page }) => {
    await abrirEstudar(page);
    await expect(page.getByRole("navigation", { name: "Principal" }).first()).toBeVisible();
    await page.keyboard.press("f");
    await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);
    await page.keyboard.press("f");
    await expect(page.getByRole("navigation", { name: "Principal" }).first()).toBeVisible();
  });

  test("painéis são redimensionáveis", async ({ page }) => {
    await abrirEstudar(page);
    const separador = page.getByRole("separator", { name: "Redimensionar painéis" });
    await expect(separador).toBeVisible();
    const caixa = await separador.boundingBox();
    if (!caixa) throw new Error("separador sem caixa");
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await page.mouse.down();
    await page.mouse.move(caixa.x - 150, caixa.y + caixa.height / 2, { steps: 8 });
    await page.mouse.up();
    const depois = await separador.boundingBox();
    expect((depois?.x ?? 0) < caixa.x - 50).toBe(true);
  });

  test("no celular, questão e tutor viram abas e a navegação é a barra superior", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrirEstudar(page);
    const nav = page.getByRole("navigation", { name: "Principal" }).first();
    await expect(nav).toBeVisible();
    const caixaNav = await nav.boundingBox();
    expect(caixaNav?.y).toBe(0);
    await expect(page.getByRole("tab", { name: "Questão" })).toBeVisible();
    await page.getByRole("tab", { name: "Tutor" }).click();
    await expect(page.getByRole("button", { name: /Próximo degrau/ })).toBeVisible();
  });

  test("a questão usa fonte serifada e as alternativas têm a letra em círculo", async ({ page }) => {
    await abrirEstudar(page);
    const enunciado = page.getByTestId("enunciado").first().locator("p").first();
    await expect(enunciado).toHaveCSS("font-family", /New York|Times New Roman|Georgia|serif/);
    const alternativa = page.getByRole("radio").first();
    await expect(alternativa).toHaveCSS("border-radius", "14px");
    await expect(alternativa).toHaveCSS("border-top-width", "1.5px");
    await page.keyboard.press("a");
    await expect(alternativa).toHaveCSS("border-top-color", "rgb(10, 132, 255)");
  });
});
