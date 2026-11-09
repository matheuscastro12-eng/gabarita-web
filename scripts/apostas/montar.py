#!/usr/bin/env python3
"""Monta src/data/apostas-2026.json a partir de bruto.json (extração do PDF) e
curadoria-a/b.json (matéria, assunto, flags e explicação detalhada conferida).

Uso: python3 scripts/apostas/montar.py   (rode antes extrair.py). Idempotente.
O gabarito é SEMPRE o do autor (folha de respostas do PDF); a curadoria só sinaliza.
"""
import json, re
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]

# Tabelas que no PDF são desenho vetorial: viram tabela em markdown (legível pelo tutor).
TABELAS = {
    27: ("Tipo de biodiesel", "| Tipo de biodiesel | Poder calorífico (kcal/kg) | Eficiência (%) | Emissão de CO₂ (g/kg) |\n|---|---|---|---|\n| Soja | 9.200 | 82 | 2.800 |\n| Milho | 8.700 | 90 | 2.700 |\n| Mamona | 8.600 | 88 | 2.500 |\n| Dendê | 8.800 | 86 | 2.900 |"),
    36: ("Vão Largura", "| Vão | Largura (m) | Profundidade (m) |\n|---|---|---|\n| 1 | 0,70 | 1,00 |\n| 2 | 0,68 | 1,05 |\n| 3 | 0,80 | 0,90 |"),
}
# Esquema (figura) recortado como PNG; os rótulos soltos da figura saem do texto.
FIGURAS = {35: ("20 − x R x", "Esquema do quadrilátero inscrito (sem escala).")}
# Dados da figura em texto, para o tutor (que não vê imagem local).
DADOS_FIGURA = {35: "Retângulo 20 cm × 14 cm. P na base a x do canto inferior esquerdo (resta 20 − x); Q no lado direito a 14 − x do canto inferior direito (resta x até o topo); R no topo a x do canto superior direito (resta 20 − x); S no lado esquerdo a x do canto inferior esquerdo (resta 14 − x)."}

# Flags adicionais da revisão do coordenador (conferidas à mão).
FLAGS_EXTRA = {
    16: ["Hora normal: 40h + 10h × 1,5 = 55 horas-equivalentes, logo R$ 400 ÷ 55 ≈ R$ 7,27; o autor usa 400 ÷ 50 = R$ 8,00, ignorando o acréscimo de 50% no cálculo."],
}

def esc(t):
    """Escapa $ (R$) para o remark-math não abrir fórmula."""
    return re.sub(r"(?<!\\)\$", r"\\$", t)

def main():
    bruto = {q["numero"]: q for q in json.loads((AQUI / "bruto.json").read_text())}
    cur = {}
    for f in ("curadoria-a.json", "curadoria-b.json"):
        for c in json.loads((AQUI / f).read_text()):
            cur[c["numero"]] = c
    assert sorted(bruto) == list(range(1, 51)) and sorted(cur) == list(range(1, 51))
    usadas = set()
    out = []
    for n in range(1, 51):
        b, c = bruto[n], cur[n]
        assert b["gabarito_resolucao"] == b["gabarito_folha"], n
        apoio = list(b["apoio"])
        imagens = []
        if n in TABELAS:
            ini, tabela = TABELAS[n]
            i = next(k for k, p in enumerate(apoio) if p.startswith(ini) or ini in p)
            apoio = [esc(p) for p in apoio[:i]] + [tabela]
        elif n in FIGURAS:
            ini, legenda = FIGURAS[n]
            i = apoio.index(ini); j = apoio.index(legenda)
            img = b["imagem"]; imagens = [img]; usadas.add(img)
            apoio = [esc(p) for p in apoio[:i]] + [f"![Esquema do quadrilátero PQRS inscrito no retângulo]({img})", f"*{legenda}*"] + [esc(p) for p in apoio[j + 1:]]
        else:
            apoio = [esc(p) for p in apoio]
        apoio = [("**" + p + "**") if re.fullmatch(r"TEXTO \d", p) else p for p in apoio]
        enunciado = "\n\n".join(apoio + [esc(b["comando"])])
        flags = list(c["flags"]) + FLAGS_EXTRA.get(n, [])
        # flags de extração que já foram resolvidas aqui (tabela/figura conferida) saem
        flags = [f for f in flags if not re.search(r"saiu bagun|bagunçad|conferir (se ela|a figura|na tela)", f, re.I)]
        q = {
            "id": f"apostas-2026-{n:02d}",
            "ano": 2026,
            "dia": 2 if c["materia"] in ("matematica", "natureza") else 1,
            "caderno": "azul",
            "numero": n,
            "area": c["materia"],
            "enunciado": enunciado,
            "imagens": imagens,
            "alternativas": [{"letra": a["letra"], "texto": esc(a["texto"]), "imagem": None} for a in b["alternativas"]],
            "gabarito": b["gabarito_folha"],
            "anulada": False,
            "habilidade": None,
            "habilidade_origem": None,
            "competencia": None,
            "assuntos": [c["assunto"]],
            "classificacao": "revisada",
            "tri": None,
            "dificuldade_estimada": None,
            "fonte": {"orgao": "Curso Edcley Teixeira", "prova": "Apostas de Edcley Teixeira ENEM 2026", "autor": "Edcley Teixeira", "referencia": b["fonte"]},
            "colecao": "apostas-2026",
            "resolucao_autor": {"topico": b["topico"], "texto": "\n\n".join(esc(p) for p in b["resolucao"])},
            "explicacao_detalhada": c["explicacao_detalhada"],
        }
        if n in DADOS_FIGURA:
            q["qualidade"] = {"depende_de_imagem": True, "observacoes": [DADOS_FIGURA[n]]}
        if flags:
            q["flags"] = flags
        out.append(q)
    for png in (RAIZ / "public" / "apostas-2026").glob("*.png"):
        if f"/apostas-2026/{png.name}" not in usadas:
            png.unlink()
    dest = RAIZ / "src" / "data" / "apostas-2026.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    from collections import Counter
    print(len(out), dict(Counter(q["area"] for q in out)), "flags:", [q["numero"] for q in out if q.get("flags")])

if __name__ == "__main__":
    main()
