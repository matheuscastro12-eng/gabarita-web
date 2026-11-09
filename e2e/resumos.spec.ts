import { expect, test } from "@playwright/test";
import { abrirHoje, TUTOR_VISIVEL } from "./apoio";

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

test.describe("Resumos: legendas e Tirar dúvida", () => {
  test("cada fórmula tem legenda com quando usar e símbolos", async ({ page }) => {
    await page.goto("/resumos/porcentagem");
    const legendas = page.getByTestId("legenda-formula");
    await expect(legendas).toHaveCount(3, { timeout: 20_000 });
    await expect(legendas.nth(1)).toContainText("Quando usar");
    await expect(legendas.nth(1)).toContainText("valor inicial (antes do aumento ou desconto)");
    await expect(legendas.nth(1).locator("dt .katex").first()).toBeVisible();
  });

  test("sem o tutor, o resumo não tem chat nem pílula de dúvida", async ({ page }) => {
    test.skip(TUTOR_VISIVEL, "o tutor está ligado");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resumos/porcentagem");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("painel-duvida")).toHaveCount(0);
    await expect(page.getByTestId("abrir-duvida")).toHaveCount(0);
    await expect(page.getByTestId("mapa-mental")).toBeVisible();
  });

  test("desktop: o painel aparece ao lado e, sem IA, diz como ligar", async ({ page }) => {
    test.skip(!TUTOR_VISIVEL, "interface do tutor oculta; ligue com NEXT_PUBLIC_TUTOR_VISIVEL=1");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resumos/porcentagem");
    const painel = page.getByTestId("painel-duvida");
    await expect(painel).toBeVisible({ timeout: 20_000 });
    await expect(painel.getByRole("heading", { name: "Tirar dúvida" })).toBeVisible();
    await expect(page.getByTestId("duvida-desligada")).toContainText("O tutor de IA está desligado");
    await expect(page.getByTestId("duvida-desligada")).toContainText("TUTOR_PROVIDER=claude-local");
    await expect(page.getByTestId("abrir-duvida")).toHaveCount(0);
  });

  test("com IA: chips de sugestão mandam o contexto do resumo", async ({ page }) => {
    test.skip(!TUTOR_VISIVEL, "interface do tutor oculta; ligue com NEXT_PUBLIC_TUTOR_VISIVEL=1");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route("**/api/status", (r) => r.fulfill({ json: { ia: true, provedor: "claude-local", modelo: "teste" } }));
    let corpo: { contexto?: { tipo?: string; resumoId?: string } } = {};
    await page.route("**/api/tutor", async (r) => {
      corpo = r.request().postDataJSON() as typeof corpo;
      const partes = [
        { type: "start" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "O $p$ é a porcentagem." },
        { type: "text-end", id: "t" },
        { type: "finish" },
      ];
      await r.fulfill({
        headers: { "content-type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
        body: partes.map((p) => `data: ${JSON.stringify(p)}\n\n`).join("") + "data: [DONE]\n\n",
      });
    });
    await page.goto("/resumos/porcentagem");
    const painel = page.getByTestId("painel-duvida");
    for (const chip of ["Explica de outro jeito", "Me dá outro exemplo", "O que significa cada letra?", "Como isso cai no ENEM?"]) {
      await expect(painel.getByRole("button", { name: chip })).toBeVisible({ timeout: 20_000 });
    }
    await painel.getByRole("button", { name: "O que significa cada letra?" }).click();
    await expect(painel.getByTestId("conversa")).toContainText("é a porcentagem");
    expect(corpo.contexto).toMatchObject({ tipo: "resumo", resumoId: "porcentagem" });
  });

  test("celular: a pílula abre o chat numa gaveta", async ({ page }) => {
    test.skip(!TUTOR_VISIVEL, "interface do tutor oculta; ligue com NEXT_PUBLIC_TUTOR_VISIVEL=1");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/resumos/juros");
    await expect(page.getByTestId("painel-duvida")).toHaveCount(0, { timeout: 20_000 });
    await page.getByTestId("abrir-duvida").click();
    const gaveta = page.getByTestId("gaveta-duvida");
    await expect(gaveta).toBeVisible();
    await expect(gaveta.getByTestId("painel-duvida")).toBeVisible();
    await gaveta.getByRole("button", { name: "Fechar" }).click();
    await expect(gaveta).toBeHidden();
  });
});
