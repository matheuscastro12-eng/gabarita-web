import { expect, test } from "@playwright/test";

test.describe("Robustez", () => {
  test("IndexedDB bloqueado: o app segue em memória e avisa", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "indexedDB", {
        get() {
          throw new Error("SecurityError: acesso negado");
        },
      });
    });
    await page.goto("/");
    await expect(page.getByTestId("aviso-armazenamento")).toContainText("bloqueou o armazenamento local", { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite), /);
    // Um sprint ainda funciona (em memória).
    await page.keyboard.press("Enter");
    await expect(page.getByRole("radiogroup", { name: "Alternativas" }).first()).toBeVisible();
    await page.keyboard.press("a");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").first()).toBeVisible();
    await page.getByTestId("aviso-armazenamento").getByRole("button", { name: "Fechar o aviso" }).click();
    await expect(page.getByTestId("aviso-armazenamento")).toHaveCount(0);
  });

  test("imagem da questão fora do ar: bloco explicativo com link para a original", async ({ page }) => {
    await page.route(/enem\.dev\/.*\.(png|jpg|jpeg|gif|webp)/i, (rota) => rota.abort());
    // ENEM 2012, Q148 tem um gráfico no enunciado.
    await page.goto("/estudar?questao=enem-2012-148");
    await expect(page.getByRole("heading", { name: "ENEM 2012 · Q148" })).toBeVisible();
    const quebrada = page.getByTestId("imagem-quebrada").first();
    await expect(quebrada).toBeVisible({ timeout: 20_000 });
    await expect(quebrada).toContainText("não carregou");
    await expect(quebrada.getByRole("link", { name: "Abrir a imagem original" })).toHaveAttribute("href", /enem\.dev/);
    // A questão continua respondível.
    await page.keyboard.press("b");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").first()).toBeVisible();
  });

  test("CDN do Pyodide fora do ar: aviso, botão de tentar de novo e conta simples pelo mathjs", async ({ page }) => {
    await page.route(/cdn\.jsdelivr\.net/, (rota) => rota.abort());
    await page.goto("/laboratorio");
    const editor = page.getByLabel("Código Python");
    // O valor inicial vem do SSR antes da hidratação; digitar nessa janela concatena com o
    // estado inicial do React. Clicar num exemplo até o valor mudar prova que o React já reage.
    await expect(async () => {
      await page.getByTestId("exemplo-simplificar").click();
      await expect(editor).toHaveValue(/simplify/, { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    await editor.fill("# só a conta\n28900 / Rational(25, 100)");
    await expect(editor).toHaveValue("# só a conta\n28900 / Rational(25, 100)");
    await page.getByTestId("rodar-python").click();
    await expect(page.getByTestId("erro-pyodide")).toContainText("não carregou do CDN", { timeout: 30_000 });
    await expect(page.getByTestId("recarregar-pyodide")).toBeVisible();
    const saida = page.getByTestId("saida-python");
    await expect(saida).toContainText("115600");
    await expect(saida).toContainText("mathjs");
    await expect(page.getByTestId("status-pyodide")).toContainText("Pyodide não carregou");

    // Código que depende do SymPy não tem fallback: erro claro, sem travar.
    await editor.fill("x = symbols('x')\nsolve(x - 2, x)");
    await page.getByTestId("rodar-python").click();
    await expect(page.getByTestId("saida-python")).toContainText("Pyodide indisponível", { timeout: 30_000 });
  });

  test("questão sem curadoria: o modo guiado explica, dá o gabarito e aponta o Laboratório", async ({ page }) => {
    // ENEM 2012, Q148 não tem resolução curada.
    await page.goto("/estudar?questao=enem-2012-148");
    await expect(page.getByRole("heading", { name: "ENEM 2012 · Q148" })).toBeVisible();
    const tutor = page.getByRole("region", { name: "Tutor" }).first();
    await tutor.getByTestId("resposta-direta").click();
    await expect(tutor.getByText(/sem curadoria/).first()).toBeVisible();
    await expect(tutor.getByText(/O gabarito oficial é/)).toBeVisible();
    await expect(tutor.getByRole("link", { name: "Laboratório" })).toBeVisible();
  });

  test("página inexistente: 404 com a casca do app e ação principal", async ({ page }) => {
    const resposta = await page.goto("/nao-existe");
    expect(resposta?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Essa página não existe" })).toBeVisible();
    await page.getByRole("link", { name: "Ir para Hoje" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("manifest e ícones respondem", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    const json = (await manifest.json()) as { name: string; icons: { src: string }[] };
    expect(json.name).toBe("Gabarita");
    for (const icone of json.icons) {
      const r = await request.get(icone.src);
      expect(r.ok(), icone.src).toBe(true);
    }
    expect((await request.get("/apple-icon.png")).ok()).toBe(true);
  });
});
