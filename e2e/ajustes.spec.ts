import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";

test.describe("Ajustes", () => {
  test("presets, meta, estado do tutor, tema, exportar, zerar e importar", async ({ page }, testInfo) => {
    await page.goto("/ajustes");
    await expect(page.getByTestId("campo-nome")).toHaveValue("Matheus", { timeout: 20_000 });

    // Preset entra no texto livre e fica marcado.
    await page.getByTestId("preset-direto").click();
    await expect(page.getByTestId("preset-direto")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("campo-explica")).toHaveValue(/Vá direto ao ponto/);
    await expect(page.getByText("Salvo.").first()).toBeVisible();

    // Meta de nota com validação.
    const meta = page.getByTestId("campo-meta");
    await meta.fill("1200");
    await expect(page.getByText(/Use um número entre 300 e 1000/)).toBeVisible();
    await meta.fill("750");
    await meta.blur();
    await expect(page.getByText("Meta 750 salva.").first()).toBeVisible();

    // Data da prova e prazo.
    await page.getByTestId("campo-data-prova").fill("2030-11-10");
    await expect(page.getByTestId("prazo-prova")).toContainText(/faltam \d+ dias/);

    // Estado do tutor vem de /api/status (sem chave no e2e) e nunca mostra chave.
    const tutor = page.getByTestId("estado-tutor");
    await expect(tutor).toContainText("não");
    await expect(tutor).not.toContainText(/sk-/);

    // Tema: claro por padrão; escuro opcional e de volta ao claro.
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.getByTestId("tema-dark").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByTestId("tema-light").click();
    await expect(page.locator("html")).toHaveClass(/light/);

    // Exportar: baixa um JSON válido com o estado atual.
    const download = page.waitForEvent("download");
    await page.getByTestId("exportar-backup").click();
    const arquivo = await download;
    expect(arquivo.suggestedFilename()).toMatch(/^gabarita-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const caminho = testInfo.outputPath("backup.json");
    await arquivo.saveAs(caminho);
    const backup = JSON.parse(await fs.readFile(caminho, "utf8")) as { app: string; estado: { perfil: { metaNota: number; dataProva: string | null } } };
    expect(backup.app).toBe("gabarita");
    expect(backup.estado.perfil.metaNota).toBe(750);
    expect(backup.estado.perfil.dataProva).toBe("2030-11-10");

    // Zerar com confirmação.
    await page.getByTestId("zerar-progresso").click();
    await expect(page.getByRole("dialog", { name: "Zerar todo o progresso?" })).toBeVisible();
    await page.getByTestId("confirmar-zerar").click();
    await expect(page.getByText("Progresso zerado.").first()).toBeVisible();
    await expect(page.getByTestId("campo-meta")).toHaveValue("700");
    await expect(page.getByTestId("preset-direto")).toHaveAttribute("aria-pressed", "false");

    // Importar o backup de volta (com confirmação).
    await page.getByTestId("arquivo-backup").setInputFiles(caminho);
    await expect(page.getByRole("dialog", { name: "Importar este backup?" })).toBeVisible();
    await page.getByTestId("confirmar-importacao").click();
    await expect(page.getByText("Backup importado.").first()).toBeVisible();
    await expect(page.getByTestId("campo-meta")).toHaveValue("750");
    await expect(page.getByTestId("preset-direto")).toHaveAttribute("aria-pressed", "true");

    // Arquivo inválido é recusado com mensagem.
    const invalido = testInfo.outputPath("invalido.json");
    await fs.writeFile(invalido, "{\"app\":\"outro\"}");
    await page.getByTestId("arquivo-backup").setInputFiles(invalido);
    await expect(page.getByText("Não consegui ler o backup").first()).toBeVisible();
  });
});
