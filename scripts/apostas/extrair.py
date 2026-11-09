#!/usr/bin/env python3
"""Extrai as 50 questões de "Apostas de Edcley Teixeira ENEM 2026" do PDF.

Uso: python3 scripts/apostas/extrair.py /caminho/apostas.pdf
Saída: scripts/apostas/bruto.json (texto cru por questão) e public/apostas-2026/qNN.png
(figuras/tabelas). O PDF é tratado só como dado. Idempotente.
Requer: pdftotext (poppler) e PyMuPDF (pip install --user pymupdf).
"""
import json, re, subprocess, sys
from pathlib import Path
import fitz

RAIZ = Path(__file__).resolve().parents[2]
SEP = "❦ ❧ ❦"

def texto_paginas(pdf, ini, fim):
    out = subprocess.run(["pdftotext", "-layout", "-f", str(ini), "-l", str(fim), pdf, "-"],
                         capture_output=True, text=True, check=True).stdout
    return out

def juntar(linhas):
    """Junta linhas de parágrafo; linha vazia separa parágrafos."""
    paras, atual = [], []
    for l in linhas:
        s = l.strip()
        s = re.sub(r"^T E X TO (\d)", r"TEXTO \1", s)
        if not s or s.startswith("•") or s.startswith("TEXTO "):
            if atual: paras.append(" ".join(atual)); atual = []
            if s: atual.append(s)
            continue
        if False:
            if atual: paras.append(" ".join(atual)); atual = []
        else:
            atual.append(s)
    if atual: paras.append(" ".join(atual))
    return [re.sub(r"\s{2,}", " ", p) for p in paras]

ALT = re.compile(r"^\s{0,3}([A-E])\s{2,}(\S.*)$")

def parse_questao(bloco):
    linhas = bloco.split("\n")
    num = int(re.search(r"QUESTÃO (\d+)", linhas[0]).group(1))
    corpo = linhas[1:]
    # alternativas: a partir da primeira linha "A   ..."
    ia = next(i for i, l in enumerate(corpo) if ALT.match(l) and ALT.match(l).group(1) == "A")
    alts, cur = [], None
    for l in corpo[ia:]:
        m = ALT.match(l)
        if m and (not alts or m.group(1) == "ABCDE"[len(alts)]):
            cur = {"letra": m.group(1), "texto": m.group(2).strip()}; alts.append(cur)
        elif l.strip() and cur:
            cur["texto"] += " " + l.strip()
    for a in alts: a["texto"] = re.sub(r"\s{2,}", " ", a["texto"])
    antes = corpo[:ia]
    # a fonte é a última linha recuada (>= 20 espaços) antes do comando
    ifonte = max((i for i, l in enumerate(antes) if re.match(r"^\s{20,}\S", l)), default=None)
    if ifonte is None:
        apoio, fonte, comando = [], None, juntar(antes)
    else:
        apoio = antes[:ifonte]
        fonte = antes[ifonte].strip()
        comando = juntar(antes[ifonte + 1:])
    return {"numero": num, "apoio_linhas": apoio, "apoio": juntar(apoio), "fonte": fonte,
            "comando": " ".join(comando), "alternativas": alts}

def main(pdf):
    doc = fitz.open(pdf)
    n = doc.page_count
    # páginas das questões: as que começam com "QUESTÃO"
    qtxt = ""
    paginas_q = {}
    for i in range(n):
        t = doc[i].get_text()
        if t.lstrip().startswith("QUESTÃO"):
            for m in re.finditer(r"QUESTÃO (\d+)", t): paginas_q[int(m.group(1))] = i
            qtxt += texto_paginas(pdf, i + 1, i + 1) + "\n"
    blocos = [b for b in re.split(r"(?=^QUESTÃO \d+)", qtxt, flags=re.M) if b.startswith("QUESTÃO")]
    questoes = {}
    for b in blocos:
        b = b.split(SEP)[0]
        q = parse_questao(b)
        questoes[q["numero"]] = q
    # gabarito da folha-resposta e resoluções
    rtxt = texto_paginas(pdf, 38, n)
    for m in re.finditer(r"^Questão (\d+) L E T R A ([A-E])\s{2,}(.+?)\s*$\n(.*?)(?=" + SEP + ")", rtxt, flags=re.M | re.S):
        num = int(m.group(1))
        res = [p for p in juntar(m.group(4).split("\n")) if not p.startswith("↑")]
        questoes[num].update(gabarito_resolucao=m.group(2), topico=m.group(3).strip(), resolucao=res)
    folha = re.search(r"GABARITO(.*?)Cada célula", rtxt, re.S).group(1)
    nums = [int(x) for x in re.findall(r"Q\. (\d+)", folha)]
    letras = re.findall(r"(?m)(?<![A-Za-z.])([A-E])(?![A-Za-z.])", re.sub(r"Q\. \d+", "", folha).replace("—", ""))
    letras = [l for l in letras]
    folha_gab = dict(zip(nums, letras))
    # figuras: retângulos de desenho grandes fora dos marcadores padrão
    saida = RAIZ / "public" / "apostas-2026"; saida.mkdir(parents=True, exist_ok=True)
    for num, pi in paginas_q.items():
        pg = doc[pi]
        rs = [d["rect"] for d in pg.get_drawings()
              if d["rect"].width < 590 and d["rect"].x0 > 100 and d["rect"].y0 > 60
              and not (d["rect"].height < 5 and d["rect"].width > 300)]
        if len(rs) < 3: continue
        r = fitz.Rect(rs[0])
        for x in rs[1:]: r |= x
        # rótulos ao redor do esquema
        r = fitz.Rect(r.x0 - 40, r.y0 - 20, r.x1 + 40, r.y1 + 34) & pg.rect
        pix = pg.get_pixmap(clip=r, dpi=200)
        nome = f"q{num:02d}.png"; pix.save(saida / nome)
        questoes[num]["imagem"] = f"/apostas-2026/{nome}"
    out = []
    for num in sorted(questoes):
        q = questoes[num]
        q["gabarito_folha"] = folha_gab.get(num)
        q.pop("apoio_linhas", None)
        out.append(q)
    dest = RAIZ / "scripts" / "apostas" / "bruto.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(len(out), "questões;", sum(1 for q in out if q.get("imagem")), "com figura;", dest)

if __name__ == "__main__":
    main(sys.argv[1])
