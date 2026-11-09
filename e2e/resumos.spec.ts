import { expect, test } from "@playwright/test";
import { abrirHoje } from "./apoio";

test.describe("Resumos", () => {
  test("o menu abre o índice; a busca filtra; o mapa geral abre ramos com links", async ({ page }) => {
    await abrirHoje(page);
    await page.getByRole("navigation", { name: "Principal" }).first().getByRole("link", { name: "Resumos" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resumos");
    await expect(page.getByTestId("card-resumo")).toHaveCount(18);
    await expect(page.getByRole("heading", { name: /C7 Estatística e probabilidade/ })).toBeVisible();

    await page.getByTestId("busca-resumos").fill("mediana");
    await expect(page.getByTestId("card-resumo")).toHaveCount(1);
    await expect(page.getByTestId("card-resumo")).toContainText("Média, moda, mediana");
    await page.getByTestId("busca-resumos").fill("zzzz");
    await expect(page.getByText("Nenhum resumo com esse termo")).toBeVisible();
    await page.getByTestId("busca-resumos").fill("");

    const mapa = page.getByTestId("mapa-mental").first();
    const ramo = mapa.getByRole("button", { name: /C7 · Estatística/ });
    await expect(ramo).toHaveAttribute("aria-expanded", "false");
    await ramo.click();
    await expect(ramo).toHaveAttribute("aria-expanded", "true");
    await mapa.locator('svg a[href="/resumos/probabilidade"]').click();
    await expect(page).toHaveURL(/\/resumos\/probabilidade$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Probabilidade");
  });

  test("o resumo tem mapa, fórmulas, exemplo, pegadinhas, truque e questões; estudado fica salvo", async ({ page }) => {
    await page.goto("/resumos/estatistica");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Média, moda, mediana/, { timeout: 20_000 });
    await expect(page.getByTestId("habilidade-resumo").first()).toContainText("H27");
    await expect(page.getByTestId("selo-incidencia").first()).toHaveText("cai muito");
    await expect(page.getByTestId("formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("resposta-exemplo")).toContainText("desvio 2");
    await expect(page.getByTestId("pegadinhas").locator("strong").first()).toBeVisible();
    await expect(page.getByTestId("truque")).toContainText("Truque de prova");
    await expect(page.getByTestId("questao-resumo").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("link-aprender")).toHaveAttribute("href", "/aprender#estatistica");

    // mapa: o primeiro ramo começa aberto; clicar em outro troca
    const ramos = page.getByTestId("mapa-ramo");
    await expect(ramos.first()).toHaveAttribute("aria-expanded", "true");
    await ramos.nth(1).press("Enter");
    await expect(ramos.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(ramos.first()).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("mapa-filhos")).toContainText("Ordene primeiro");

    await page.getByTestId("marcar-estudado").click();
    await expect(page.getByTestId("marcar-estudado")).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByTestId("marcar-estudado")).toHaveAttribute("aria-pressed", "true");
    await page.goto("/resumos");
    await expect(page.getByTestId("progresso-resumos")).toContainText("1 de 18");
    await expect(page.getByTestId("card-resumo").filter({ hasText: "Média, moda" }).getByTestId("selo-estudado")).toBeVisible();

    // treinar leva à questão na IDE
    await page.goto("/resumos/estatistica");
    await page.getByTestId("questao-resumo").first().click();
    await expect(page).toHaveURL(/\/estudar\?questao=/);
  });

  test("a IDE mostra Ver resumo numa questão com resumo", async ({ page }) => {
    await page.goto("/estudar?questao=enem-2022-154");
    await expect(page.getByRole("heading", { name: "ENEM 2022 · Q154" })).toBeVisible({ timeout: 20_000 });
    const link = page.getByTestId("ver-resumo").first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /^\/resumos\//);
  });

  test("com prefers-reduced-motion, os ramos do mapa não animam", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/resumos/porcentagem");
    const filho = page.getByTestId("mapa-filhos").locator(".anim-mapa").first();
    await expect(filho).toBeVisible({ timeout: 20_000 });
    const duracao = await filho.evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duracao)).toBeLessThan(0.001);
  });
});
