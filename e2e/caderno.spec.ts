import { expect, test } from "@playwright/test";

test.describe("Caderno de erros", () => {
  test("vazio no começo; depois de um erro mostra a entrada com alternativa, equívoco, refazer e gêmea", async ({ page }) => {
    await page.goto("/caderno");
    await expect(page.getByRole("heading", { name: "Nenhum erro ainda" })).toBeVisible({ timeout: 20_000 });

    // Erra de propósito a questão curada (gabarito C).
    await page.goto("/estudar?questao=enem-2022-154");
    await expect(page.getByRole("heading", { name: "ENEM 2022 · Q154" })).toBeVisible();
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").first()).toContainText("O gabarito é C");

    await page.goto("/caderno");
    const entrada = page.getByTestId("entrada-caderno").filter({ hasText: "ENEM 2022 · Q154" });
    await expect(entrada).toBeVisible({ timeout: 20_000 });
    await expect(entrada).toContainText("ENEM 2022 · Q154");
    await expect(entrada.getByTestId("marcou")).toContainText("B");
    await expect(entrada).toContainText("Gabarito");
    await expect(entrada.getByTestId("equivoco")).toContainText(/Multiplicou 28 900 por 3/i);
    await expect(page.getByText("1 erro aberto")).toBeVisible();

    // Gêmea em diálogo: responder registra a tentativa (origem gêmea).
    await entrada.getByTestId("gemea-caderno").click();
    const dialogo = page.getByRole("dialog", { name: "Questão gêmea" });
    await expect(dialogo).toBeVisible();
    const gemea = dialogo.getByTestId("gemea");
    await gemea.getByRole("radio").first().click();
    await gemea.getByTestId("confirmar-gemea").click();
    await expect(gemea.getByRole("status")).toContainText(/Acertou a gêmea|O gabarito é/);
    await page.keyboard.press("Escape");
    await expect(dialogo).toBeHidden();

    // Se a gêmea foi errada, ela também entra no caderno (com refazer pela mesma semente).
    const entradasGemea = page.getByTestId("entrada-caderno").filter({ hasText: "Gêmea ·" });
    const errouGemea = (await entradasGemea.count()) === 1;
    if (errouGemea) await expect(entradasGemea.getByTestId("refazer")).toHaveText(/Refazer/);

    // Filtro "Todos" e por habilidade.
    await page.getByRole("radio", { name: "Todos" }).click();
    await expect(entrada).toHaveCount(1);
    await page.getByLabel("Habilidade").selectOption("H3");
    await expect(entrada).toHaveCount(1);

    // Refazer leva para a IDE com a mesma questão na frente.
    await entrada.getByTestId("refazer").click();
    await expect(page).toHaveURL(/\/estudar\?questao=enem-2022-154$/);
    await expect(page.getByRole("heading", { name: "ENEM 2022 · Q154" })).toBeVisible();
    // Acertar fecha a entrada.
    await page.keyboard.press("c");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").first()).toContainText("Acertou");
    await page.goto("/caderno");
    await expect(page.getByText(errouGemea ? "1 erro aberto" : "0 erros abertos")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("radio", { name: "Todos" }).click();
    await expect(page.getByTestId("entrada-caderno").filter({ hasText: "ENEM 2022 · Q154" })).toHaveAttribute("data-resolvida", "true");
  });
});
