import { expect, test } from "@playwright/test";
import { TUTOR_VISIVEL } from "./apoio";

/** Abre a IDE já numa questão curada (ENEM 2022, Q154: porcentagem). */
async function abrirCurada(page: import("@playwright/test").Page) {
  await page.goto("/estudar?questao=enem-2022-154");
  await expect(page.getByRole("heading", { name: "ENEM 2022 · Q154" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Alternativas" }).first()).toBeVisible();
}

test.describe("Tutor (modo guiado offline)", () => {
  test.skip(!TUTOR_VISIVEL, "interface do tutor oculta; ligue com NEXT_PUBLIC_TUTOR_VISIVEL=1");
  test("/api/status diz que a IA está desligada e /api/tutor responde 503 missing_key", async ({ request }) => {
    const status = await request.get("/api/status");
    expect(status.ok()).toBe(true);
    const json = (await status.json()) as { ia: boolean; modelo: string };
    expect(json.ia).toBe(false);
    expect(JSON.stringify(json)).not.toMatch(/sk-/);

    const tutor = await request.post("/api/tutor", {
      data: { messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "oi" }] }], contexto: { questaoId: "enem-2022-154", degrau: 0 } },
    });
    expect(tutor.status()).toBe(503);
    expect(((await tutor.json()) as { codigo: string }).codigo).toBe("missing_key");
  });

  test("conversa offline numa questão curada: aviso, dica, por que errei, resposta direta", async ({ page }) => {
    await abrirCurada(page);
    const tutor = page.getByRole("region", { name: "Tutor" }).first();
    await expect(tutor.getByText("modo guiado")).toBeVisible();
    await expect(tutor.getByRole("note")).toContainText("Tutor de IA desligado");
    await expect(tutor.getByText("Antes de calcular")).toBeVisible();

    // Escada de dicas pelo teclado (H) traz a dica curada do degrau 1.
    await page.keyboard.press("h");
    await expect(tutor.getByText("Se algo caiu 75%, o que sobrou é 25% do original")).toBeVisible();
    await expect(tutor.getByRole("img", { name: "degrau 1 de 4" })).toBeVisible();

    // Erra de propósito (B) e pergunta por que errou: vem o erro comum da alternativa B.
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").first()).toContainText("O gabarito é C");
    const campo = page.getByPlaceholder(/peça dica, resolução/).first();
    await campo.fill("por que errei?");
    await campo.press("Enter");
    await expect(tutor.getByText(/Multiplicou 28 900 por 3/i)).toBeVisible();
    await expect(tutor.getByTestId("selo-conferido").first()).toBeVisible();

    // Resposta direta pelo botão: resolução completa, conferida pela curadoria, e o pedido fica registrado.
    await tutor.getByTestId("resposta-direta").click();
    await expect(tutor.getByText("Resolução completa")).toBeVisible();
    await expect(tutor.getByText(/115\s?600/).first()).toBeVisible();
    await expect(tutor.getByRole("img", { name: "degrau 4 de 4" })).toBeVisible();
    await expect(tutor.getByTestId("resposta-direta")).toBeDisabled();
  });

  test("pedido de gráfico desenha um gráfico interativo com slider", async ({ page }) => {
    await abrirCurada(page);
    const tutor = page.getByRole("region", { name: "Tutor" }).first();
    const campo = page.getByPlaceholder(/peça dica, resolução/).first();
    await campo.fill("gráfico de y = a*x + 3");
    await campo.press("Enter");
    const grafico = tutor.getByTestId("grafico");
    await expect(grafico).toBeVisible();
    await expect(grafico.locator("svg.MafsView, .MafsView svg").first()).toBeVisible({ timeout: 15_000 });
    const slider = grafico.getByRole("slider", { name: "parâmetro a" });
    await expect(slider).toBeVisible();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(grafico.getByText(/a = 1,5/)).toBeVisible();
  });

  test("questão gêmea aparece no chat e dá para responder", async ({ page }) => {
    await abrirCurada(page);
    const tutor = page.getByRole("region", { name: "Tutor" }).first();
    await tutor.getByRole("button", { name: "Questão gêmea" }).click();
    const gemea = tutor.getByTestId("gemea");
    await expect(gemea).toBeVisible();
    await gemea.getByRole("radio").first().click();
    await gemea.getByTestId("confirmar-gemea").click();
    await expect(gemea.getByRole("status")).toContainText(/Acertou a gêmea|O gabarito é/);
  });

  test("seleção do enunciado vira contexto do chat", async ({ page }) => {
    await abrirCurada(page);
    const enunciado = page.getByTestId("enunciado").first();
    await enunciado.evaluate((el) => {
      const range = document.createRange();
      const p = el.querySelector("p");
      if (!p?.firstChild) throw new Error("sem texto");
      range.setStart(p.firstChild, 0);
      range.setEnd(p.firstChild, 24);
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await page.getByTestId("perguntar-sobre").click();
    await expect(page.getByTestId("chip-selecao").first()).toContainText("Em janeiro de 2013");
  });
});

test.describe("Tutor oculto no site", () => {
  test.skip(TUTOR_VISIVEL, "o tutor está ligado");

  test("as páginas públicas não mostram painel, aviso nem texto de tutor", async ({ page, request }) => {
    const status = await request.get("/api/status");
    expect(status.ok()).toBe(true);
    expect(((await status.json()) as { ia: boolean }).ia).toBe(false);
    const rota = await request.post("/api/tutor", { data: {} });
    expect(rota.status()).toBe(404);

    const proibido = /tutor|modo guiado|ANTHROPIC_API_KEY|inteligência artificial/i;
    for (const caminho of ["/", "/estudar?questao=enem-2012-148", "/ajustes", "/resumos/porcentagem", "/simulado", "/caderno", "/design-system"]) {
      await page.goto(caminho);
      await expect(page.locator("main, [role=main], body").first()).toBeVisible({ timeout: 20_000 });
      const visivel = await page.locator("body").innerText();
      expect(visivel, caminho).not.toMatch(proibido);
    }
  });
});
