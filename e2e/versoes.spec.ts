import { expect, test, type Page } from "@playwright/test";

/** Screenshots das 3 versões (SHOTS=/tmp/natureza-shots para gravar). */
const SHOTS = process.env.SHOTS;
async function foto(page: Page, nome: string) {
  if (!SHOTS) return;
  await page.waitForTimeout(900); // fim das animações de entrada
  await page.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true });
}

async function esperarHoje(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite), /, { timeout: 20_000 });
  await expect(page.getByText(/^Próximas:/)).toBeVisible();
}

test.describe("Versões do Gabarita", () => {
  // Sem a versão salva: primeira abertura.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("escolhe Natureza na entrada, faz um sprint de CN e vê o mapa da matriz CN", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("tela-entrada")).toBeVisible({ timeout: 20_000 });
    await foto(page, "0-entrada");
    await page.getByTestId("entrada-natureza").click();
    await esperarHoje(page);
    await expect(page.getByTestId("seletor-versao").first()).toHaveValue("natureza");
    await expect(page.getByRole("link", { name: /Resumos/ })).toHaveCount(0);
    await expect(page.getByText("Nota estimada · CN")).toBeVisible();
    await expect(page.getByText("14 questões de natureza")).toBeVisible();
    await foto(page, "1-natureza-hoje");

    await page.getByTestId("comecar").click();
    await expect(page).toHaveURL(/\/estudar$/);
    for (let i = 0; i < 5; i++) {
      await expect(page.getByRole("img", { name: `questão ${i + 1} de 5` })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId("enunciado")).toBeVisible();
      // Toda questão do sprint é de natureza (habilidade CN).
      await expect(page.locator("header").getByText(/^CN H\d+/).first()).toBeVisible();
      if (i === 0) await foto(page, "2-natureza-sprint");
      await page.keyboard.press("a");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("status").first()).toBeVisible();
      await page.keyboard.press("n");
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^\d de 5$/);

    await page.goto("/mapa");
    const mapa = page.getByTestId("mapa-area-natureza");
    await expect(mapa).toBeVisible({ timeout: 20_000 });
    await expect(mapa.getByTestId("celula-calor")).toHaveCount(30);
    await expect(mapa.getByText("Física")).toBeVisible();
    expect(await mapa.locator('[data-testid="celula-calor"]:not([data-nivel="0"])').count()).toBeGreaterThan(0);
    await expect(page.getByTestId("mapa-area-matematica")).toHaveCount(0);
    await foto(page, "3-natureza-mapa");

    // Resumos de natureza: estado honesto.
    await page.goto("/resumos");
    await expect(page.getByText("Resumos de Natureza ainda não existem")).toBeVisible();
  });

  test("troca para Geral pela sidebar: mapa com as duas áreas e prova do 2º dia com progresso salvo", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("entrada-matematica").click();
    await esperarHoje(page);
    await expect(page.getByTestId("seletor-versao").first()).toHaveValue("matematica");
    await foto(page, "4-matematica-hoje");

    await page.getByTestId("seletor-versao").first().selectOption("geral");
    await expect(page.getByTestId("seletor-versao").first()).toHaveValue("geral");
    await expect(page.getByText("Treino misto de 5 questões")).toBeVisible();
    await foto(page, "5-geral-hoje");

    await page.goto("/mapa");
    await expect(page.getByTestId("mapa-area-natureza")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("mapa-area-matematica")).toBeVisible();

    await page.goto("/simulado");
    await page.getByTestId("ano-prova").selectOption("2019");
    await expect(page.getByTestId("contagem-prova-dia2")).toHaveText(/^86 questões \(42 de natureza e 44 de matemática\): faltam questões na fonte/);
    await page.getByTestId("ano-prova").selectOption("2010");
    await expect(page.getByTestId("contagem-prova-dia2")).toHaveText(/^90 questões \(45 de natureza e 45 de matemática\)$/);
    await foto(page, "6-geral-simulados");
    await page.getByTestId("comecar-prova-dia2").click();
    await expect(page.getByTestId("prova-longa")).toBeVisible();
    await expect(page.getByTestId("progresso-simulado")).toHaveText("1/90");
    await page.keyboard.press("b");
    await page.keyboard.press("n");
    await page.keyboard.press("c");
    await page.getByTestId("abrir-folha").click();
    await expect(page.getByTestId("folha-respostas")).toBeVisible();
    await foto(page, "7-geral-prova");

    // Recarregar não perde nada.
    await page.reload();
    await expect(page.getByTestId("card-andamento")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("card-andamento")).toContainText("2 de 90 marcadas");
    await page.getByTestId("continuar-andamento").click();
    await expect(page.getByTestId("progresso-simulado")).toHaveText("2/90");

    page.once("dialog", (d) => void d.accept());
    await page.getByTestId("entregar").click();
    await expect(page.getByTestId("correcao-prova")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("correcao-natureza")).toBeVisible();
    await expect(page.getByTestId("correcao-matematica")).toBeVisible();
    await page.getByTestId("ver-resolucao").first().click();
    await expect(page.getByText(/explicação|resolução/i).first()).toBeVisible();
    await foto(page, "8-geral-correcao");
  });
});
