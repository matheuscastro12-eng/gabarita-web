// Contraste WCAG 2.x entre pares de cores.
// Uso 1: node design/scripts/contraste.mjs "#texto/#fundo[:min]" ...            (pares avulsos)
// Uso 2: node design/scripts/contraste.mjs --tokens src/app/globals.css          (pares do design system, claro e escuro)
import { readFileSync } from "node:fs";

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (hex) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? [...h].map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255);
};
const lum = (hex) => {
  const [r, g, b] = rgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Pares conferidos no design system: [texto, fundo, mínimo, o que é]. */
const PARES = [
  ["--cor-texto", "--cor-fundo", 4.5, "texto / fundo"],
  ["--cor-texto", "--cor-muted", 4.5, "texto / muted"],
  ["--cor-texto-2", "--cor-fundo", 4.5, "texto 2 / fundo"],
  ["--cor-texto-2", "--cor-muted", 4.5, "texto 2 / muted"],
  ["--cor-texto-suave", "--cor-fundo", 4.5, "texto suave / fundo"],
  ["--cor-texto-suave", "--cor-superficie", 4.5, "texto suave / superfície"],
  ["--cor-texto-suave", "--cor-muted", 4.5, "texto suave / muted"],
  ["--cor-primaria-contraste", "--cor-primaria", 4.5, "texto do botão primário"],
  ["--cor-primaria-contraste", "--cor-primaria-hover", 4.5, "texto do botão primário (hover)"],
  ["--cor-primaria-texto", "--cor-fundo", 4.5, "primária como texto / fundo"],
  ["--cor-primaria-texto", "--cor-superficie", 4.5, "primária como texto / superfície"],
  ["--cor-primaria-texto", "--cor-muted", 4.5, "primária como texto / muted"],
  ["--cor-primaria-texto", "--cor-primaria-suave", 4.5, "primária como texto / primária suave"],
  ["--cor-texto", "--cor-primaria-suave", 4.5, "texto / primária suave"],
  ["--cor-primaria", "--cor-fundo", 3, "primária como UI (bolha, barra, foco) / fundo"],
  ["--cor-primaria", "--cor-superficie", 3, "primária como UI / superfície"],
  ["--cor-borda-campo", "--cor-fundo", 3, "borda de campo / fundo"],
  ["--cor-borda-campo", "--cor-superficie", 3, "borda de campo / superfície"],
  ["--cor-sucesso", "--cor-fundo", 4.5, "sucesso (texto) / fundo"],
  ["--cor-sucesso", "--cor-sucesso-suave", 4.5, "sucesso (texto) / sucesso suave"],
  ["--cor-aviso", "--cor-fundo", 4.5, "aviso (texto) / fundo"],
  ["--cor-aviso", "--cor-aviso-suave", 4.5, "aviso (texto) / aviso suave"],
  ["--cor-erro", "--cor-fundo", 4.5, "erro (texto) / fundo"],
  ["--cor-erro", "--cor-erro-suave", 4.5, "erro (texto) / erro suave"],
  ["--cor-espera", "--cor-fundo", 4.5, "espera (texto) / fundo"],
  ["--cor-espera", "--cor-espera-suave", 4.5, "espera (texto) / espera suave"],
  ["--cor-sucesso-contraste", "--cor-sucesso-forte", 4.5, "texto sobre sucesso cheio"],
  ["--cor-erro-contraste", "--cor-erro-forte", 4.5, "texto sobre erro cheio"],
  ["--cor-texto", "--cor-marca-texto", 4.5, "texto / marca-texto"],
];

function lerBloco(css, seletor) {
  const i = css.indexOf(seletor);
  if (i < 0) return {};
  const fim = css.indexOf("\n}", i);
  const vars = {};
  for (const m of css.slice(i, fim).matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) vars[m[1]] = m[2];
  return vars;
}

const args = process.argv.slice(2);
let falhas = 0;
if (args[0] === "--tokens") {
  const css = readFileSync(args[1], "utf8");
  const claro = lerBloco(css, ":root {");
  const escuro = { ...claro, ...lerBloco(css, "\n.dark {") };
  for (const [nome, vars] of [["claro", claro], ["escuro", escuro]]) {
    console.log(`\n## ${nome}\n| Par | Cores | Contraste | Mínimo | |\n|---|---|---|---|---|`);
    for (const [a, b, min, rotulo] of PARES) {
      if (!vars[a] || !vars[b]) continue;
      const c = contraste(vars[a], vars[b]);
      if (c < min) falhas++;
      console.log(`| ${rotulo} | \`${vars[a]}\` em \`${vars[b]}\` | ${c.toFixed(2).replace(".", ",")}:1 | ${String(min).replace(".", ",")}:1 | ${c >= min ? "passa" : "**FALHA**"} |`);
    }
  }
} else {
  for (const par of args) {
    const [cores, min = "4.5"] = par.split(":");
    const [a, b] = cores.split("/");
    const c = contraste(a, b);
    if (c < Number(min)) falhas++;
    console.log(`${a} em ${b}: ${c.toFixed(2)}:1 (mín. ${min}) ${c >= Number(min) ? "passa" : "FALHA"}`);
  }
}
process.exit(falhas === 0 ? 0 : 1);
