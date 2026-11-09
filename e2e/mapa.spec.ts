import { expect, test } from "@playwright/test";

test.describe("Mapa", () => {
  test("mostra o calor H1–H30 por competência, a nota como estimativa e o que falta para pronto", async ({ page }) => {
    await page.goto("/mapa");
    await expect(page.getByRole("heading", { name: "Mapa", exact: true })).toBeVisible();
    await expect(page.getByTestId("celula-calor")).toHaveCount(30, { timeout: 20_000 });
    await expect(page.getByRole("group", { name: /Competência C6/ })).toBeVisible();

    const nota = page.getByTestId("card-nota");
    await expect(nota.getByText("estimativa", { exact: true })).toBeVisible();
    await expect(nota.getByText(/Ainda sem itens oficiais com TRI/)).toBeVisible();

    const pronto = page.getByTestId("card-pronto");
    await expect(pronto.getByTestId("nivel-pronto")).toHaveCount(3);
    await expect(pronto.getByText(/^H24: domínio efetivo 0,30/)).toBeVisible();
    await expect(pronto.getByText(/falta 1 simulado de 15 fáceis/)).toBeVisible();
    await expect(pronto.getByText(/faltam 2 simulados completos de 45 itens/)).toBeVisible();

    // Clicar numa habilidade da lista seleciona a célula e mostra todos os critérios.
    await pronto.getByRole("button", { name: /^H16:/ }).click();
    const detalhe = page.getByTestId("detalhe-habilidade");
    await expect(detalhe.getByRole("heading", { name: /H16/ })).toBeVisible();
    await expect(detalhe.getByTestId("faltas-habilidade").getByRole("listitem")).toHaveCount(4);
    await expect(detalhe.getByText("falta 1 acerto em outro dia")).toBeVisible();

    // Célula do calor também seleciona.
    await page.getByRole("button", { name: /^H1, Sistemas de numeração/ }).click();
    await expect(detalhe.getByRole("heading", { name: /H1/ })).toBeVisible();

    await expect(page.getByTestId("mapa-assuntos").getByText("Porcentagem")).toBeVisible();
  });

  test("simulado de 15 fáceis inéditos pelo teclado, com cronômetro, e o resultado entra no Mapa", async ({ page }) => {
    await page.goto("/mapa");
    await page.getByTestId("ir-simulado").click();
    await expect(page).toHaveURL(/\/simulado$/);
    await expect(page.getByTestId("disponiveis-simulado")).toContainText("15 questões prontas", { timeout: 20_000 });
    await page.getByTestId("comecar-simulado").click();

    for (let i = 1; i <= 15; i++) {
      await expect(page.getByTestId("progresso-simulado")).toHaveText(`${i}/15`);
      await expect(page.getByTestId("cronometro")).toHaveText(/^0[23]:\d\d$/);
      await expect(page.getByTestId("fonte")).toContainText(/Fonte: INEP, ENEM \d{4}, questão \d+/);
      await page.keyboard.press("a");
      await expect(page.getByRole("radio", { checked: true })).toHaveAttribute("data-letra", "A");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status")).toBeVisible();
      await page.keyboard.press("n");
    }

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^\d+ de 15$/);
    await expect(page.getByTestId("resultado-simulado")).toHaveCount(15);
    await expect(page.getByTestId("simulado-vale")).toBeVisible();

    await page.getByRole("link", { name: "Ver o Mapa" }).click();
    await expect(page).toHaveURL(/\/mapa$/);
    await expect(page.getByTestId("historico-simulados").getByRole("listitem")).toHaveCount(1);
    await expect(page.getByTestId("historico-simulados")).toContainText(/\d+ de 15/);
    // 15 itens oficiais com TRI: a nota estimada aparece.
    await expect(page.getByTestId("card-nota")).toContainText("15 itens oficiais com TRI");
  });
});
