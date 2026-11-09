// Capturas de revisão do design (Playwright/Chromium headless).
// Uso: node design/scripts/capturar.mjs [--base http://localhost:3100] [--dir design/capturas] [--prefixo 2026-11-09] [--so hoje,estudar] [--semear]
// Gera <dir>/<prefixo>-<tela>-{375,1440}.png e imprime o overflow horizontal de cada tela.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : padrao;
};
const BASE = arg("base", "http://localhost:3100");
const DIR = arg("dir", "design/capturas");
const PREFIXO = arg("prefixo", "2026-11-09");
const SO = arg("so", "")?.split(",").filter(Boolean) ?? [];
const SEMEAR = args.includes("--semear");
const LARGURAS = (arg("larguras", "375,1440") ?? "375,1440").split(",").map(Number);
mkdirSync(DIR, { recursive: true });

const esperarQuestao = async (page) => {
  await page.getByRole("radiogroup", { name: "Alternativas" }).first().waitFor({ timeout: 30000 });
};

/** Telas: nome, rota, tema e uma preparação opcional antes do print. */
const TELAS = [
  { nome: "hoje", rota: "/" },
  { nome: "estudar", rota: "/estudar", preparar: esperarQuestao },
  {
    nome: "estudar-marcada",
    rota: "/estudar",
    preparar: async (page) => {
      await esperarQuestao(page);
      await page.getByRole("radiogroup", { name: "Alternativas" }).first().getByRole("radio").nth(1).click();
    },
  },
  {
    nome: "estudar-confirmada",
    rota: "/estudar",
    preparar: async (page) => {
      await esperarQuestao(page);
      await page.getByRole("radiogroup", { name: "Alternativas" }).first().getByRole("radio").nth(1).click();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(900);
    },
  },
  { nome: "mapa", rota: "/mapa" },
  { nome: "simulado", rota: "/simulado" },
  { nome: "caderno", rota: "/caderno" },
  { nome: "laboratorio", rota: "/laboratorio" },
  { nome: "aprender", rota: "/aprender" },
  { nome: "ajustes", rota: "/ajustes" },
  { nome: "404", rota: "/rota-que-nao-existe" },
  { nome: "design-system", rota: "/design-system" },
  { nome: "hoje-escuro", rota: "/", tema: "dark" },
  { nome: "estudar-escuro", rota: "/estudar", tema: "dark", preparar: esperarQuestao },
  {
    nome: "paleta",
    rota: "/",
    preparar: async (page) => {
      await page.keyboard.press("Control+k");
      await page.waitForTimeout(400);
    },
  },
  {
    nome: "atalhos",
    rota: "/",
    preparar: async (page) => {
      await page.keyboard.press("Shift+Slash");
      await page.waitForTimeout(400);
    },
  },
];

/** Responde algumas questões (erra de propósito parte delas) para o Mapa e o Caderno terem dados. */
async function semear(page) {
  await page.goto(`${BASE}/estudar`);
  for (let i = 0; i < 5; i++) {
    try {
      await esperarQuestao(page);
      await page.getByRole("radiogroup", { name: "Alternativas" }).first().getByRole("radio").nth(i % 5).click();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(700);
      await page.keyboard.press("n");
      await page.waitForTimeout(700);
    } catch {
      break;
    }
  }
}

const browser = await chromium.launch();
let falhas = 0;
for (const largura of LARGURAS) {
  for (const tema of ["light", "dark"]) {
    const telas = TELAS.filter((t) => (t.tema ?? "light") === tema && (SO.length === 0 || SO.includes(t.nome)));
    if (telas.length === 0) continue;
    const ctx = await browser.newContext({
      viewport: { width: largura, height: largura < 700 ? 812 : 900 },
      locale: "pt-BR",
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    await ctx.addInitScript((t) => {
      try {
        window.localStorage.setItem("theme", t);
      } catch {}
    }, tema);
    const page = await ctx.newPage();
    if (SEMEAR) await semear(page);
    for (const tela of telas) {
      try {
        await page.goto(`${BASE}${tela.rota}`, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(600);
        if (tela.preparar) await tela.preparar(page);
        await page.waitForTimeout(400);
        const medida = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
          // elementos que passam da borda direita da janela (fora de áreas com rolagem horizontal própria)
          vazando: [...document.querySelectorAll("body *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.right <= window.innerWidth + 1) return false;
              for (let p = el.parentElement; p; p = p.parentElement) {
                const o = getComputedStyle(p).overflowX;
                if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return false;
              }
              return true;
            })
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
        }));
        const arquivo = join(DIR, `${PREFIXO}-${tela.nome}-${largura}.png`);
        // O conteúdo rola dentro do <main> (a casca tem altura da janela): cresce a janela até caber tudo.
        const alturaBase = largura < 700 ? 812 : 900;
        const extra = await page.evaluate(() =>
          Math.max(0, ...[...document.querySelectorAll("body *")].map((el) => {
            const o = getComputedStyle(el).overflowY;
            return (o === "auto" || o === "scroll") && el.clientHeight > 200 ? el.scrollHeight - el.clientHeight : 0;
          })),
        );
        if (extra > 0 && !tela.semCrescer) {
          await page.setViewportSize({ width: largura, height: Math.min(alturaBase + extra, 6000) });
          await page.waitForTimeout(250);
        }
        await page.screenshot({ path: arquivo, fullPage: true });
        await page.setViewportSize({ width: largura, height: alturaBase });
        const overflow = medida.sw > medida.iw || medida.vazando.length > 0;
        if (overflow) falhas++;
        console.log(`${overflow ? "OVERFLOW" : "ok      "} ${tela.nome}@${largura} scrollWidth=${medida.sw} innerWidth=${medida.iw} ${medida.vazando.join(" | ")}`);
      } catch (e) {
        falhas++;
        console.log(`ERRO     ${tela.nome}@${largura}: ${String(e).split("\n")[0]}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(falhas === 0 ? "Sem overflow horizontal." : `${falhas} tela(s) com problema.`);
process.exit(0);
