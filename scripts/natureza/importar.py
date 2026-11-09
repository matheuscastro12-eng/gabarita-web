#!/usr/bin/env python3
"""Importa as questões de Ciências da Natureza (2009 a 2023) do banco do app antigo
(Gabarita macOS), aberto SOMENTE LEITURA. Idempotente.

Uso: python3 scripts/natureza/importar.py [/caminho/enem.sqlite]
Saída:
  src/data/provas/natureza/{ano}.json   questões no schema do app (area "natureza")
  src/data/explicacoes-ia-natureza.json { "enem-2020-100": {texto, divergente, modelo} }
  public/questoes/natureza/*            imagens usadas pelas questões

A coluna `discipline` do banco vem errada em ~200 questões; a área sai da posição
(idx) em blocos de 45: 2009 = CN, CH, LC, MT; 2010 a 2016 = CH, CN, LC, MT;
2017 em diante = LC, CH, CN, MT.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path
from urllib.parse import quote

RAIZ = Path(__file__).resolve().parents[2]
PADRAO = "/Users/matheuscastro/orca/workspaces/ENEM/FATO-1/data/enem.sqlite"
ERROS = ("You've hit your", "API Error:")
PUBLICO = "/questoes/natureza/"

ORDEM_2009 = ["CN", "CH", "LC", "MT"]
ORDEM_2010_2016 = ["CH", "CN", "LC", "MT"]
ORDEM_2017 = ["LC", "CH", "CN", "MT"]

# Competência de cada habilidade da Matriz de Referência de Ciências da Natureza (INEP).
COMP_CN = {1: range(1, 5), 2: range(5, 8), 3: range(8, 13), 4: range(13, 17),
           5: range(17, 20), 6: range(20, 24), 7: range(24, 28), 8: range(28, 31)}


def area_da_posicao(ano, idx):
    ordem = ORDEM_2009 if ano == 2009 else ORDEM_2010_2016 if ano <= 2016 else ORDEM_2017
    return ordem[(idx - 1) // 45]


def competencia(h):
    return next(f"C{c}" for c, r in COMP_CN.items() if h in r)


def main(caminho):
    con = sqlite3.connect(f"file:{quote(caminho)}?mode=ro", uri=True)
    pasta_img = Path(caminho).parent
    linhas = con.execute(
        "select id, year, idx, context_md, intro, correct, image_paths, annulled, tri_a, tri_b, tri_c, habilidade "
        "from question where language is null order by year, idx").fetchall()
    cn = [l for l in linhas if area_da_posicao(l[1], l[2]) == "CN"]
    alts = {}
    for qid, letra, texto, img in con.execute("select question_id, letter, text_md, image_path from alternative order by letter"):
        alts.setdefault(qid, []).append((letra, texto, img))
    expl = {qid: (b, m, f) for qid, b, m, f in con.execute("select question_id, body_md, model, flagged from explanation")}

    # Tercis de b dentro de natureza (todos os anos) para a dificuldade estimada.
    bs = sorted(l[9] for l in cn if l[9] is not None)
    t1, t2 = bs[len(bs) // 3], bs[2 * len(bs) // 3]

    destino_img = RAIZ / "public" / PUBLICO.strip("/")
    if destino_img.exists():
        shutil.rmtree(destino_img)
    destino_img.mkdir(parents=True)
    usadas = set()

    def local(caminho_img):
        nome = caminho_img.split("/")[-1]
        usadas.add(caminho_img)
        return PUBLICO + nome

    def reescrever(md):
        return re.sub(r"\]\((images/[^)\s]+)\)", lambda m: "](" + local(m.group(1)) + ")", md or "")

    por_ano, saida_expl, ignoradas = {}, {}, []
    for qid, ano, idx, ctx, intro, correta, imgs, anul, a, b, c, hab in cn:
        enunciado = "\n\n".join(p for p in (reescrever(ctx).strip(), reescrever(intro).strip()) if p)
        imagens = [local(p) for p in json.loads(imgs)]
        alternativas = [{"letra": l, "texto": reescrever(t).strip(), "imagem": local(i) if i else None}
                        for l, t, i in alts.get(qid, [])]
        tri = None if a is None or anul else {
            "a": a, "b": b, "c": c, "fonte": f"INEP, microdados do ENEM {ano} (ITENS_PROVA), caderno azul"}
        dif = None if tri is None else ("facil" if b < t1 else "media" if b < t2 else "dificil")
        id_ = f"enem-{ano}-{idx}"
        q = {
            "id": id_, "ano": ano, "dia": 2, "caderno": "azul", "numero": idx, "area": "natureza",
            "enunciado": enunciado, "imagens": imagens, "alternativas": alternativas, "gabarito": correta,
            # O banco antigo descartou o TRI quando o gabarito divergia do INEP: com TRI, o gabarito confere.
            "gabarito_fonte": "inep" if tri else "transcricao", "anulada": bool(anul),
            "habilidade": f"CN-H{hab}" if hab else None, "habilidade_origem": "inep" if hab else None,
            "competencia": competencia(hab) if hab else None, "assuntos": [], "classificacao": "heuristica",
            "tri": tri, "dificuldade_estimada": dif,
            "fonte": {
                "orgao": "INEP", "prova": f"ENEM {ano}, caderno azul (aplicação regular), questão {idx}",
                "url_oficial": "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
                "transcricao": "enem.dev", "transcricao_url": f"https://api.enem.dev/v1/exams/{ano}/questions/{idx}",
                "microdados_url": f"https://download.inep.gov.br/microdados/microdados_enem_{ano}.zip",
            },
            "qualidade": {"enunciado_vazio": not enunciado, "alternativas_incompletas": len(alternativas) < 5,
                          "depende_de_imagem": bool(imagens) or any(x["imagem"] for x in alternativas)},
        }
        por_ano.setdefault(ano, []).append(q)
        e = expl.get(qid)
        corpo = (e[0] or "").strip() if e else ""
        if not corpo or corpo.startswith(ERROS):
            ignoradas.append(id_)
        else:
            saida_expl[id_] = {"texto": corpo, "divergente": bool(e[2]), "modelo": e[1]}

    for p in usadas:
        shutil.copy2(pasta_img / p, destino_img / p.split("/")[-1])
    pasta = RAIZ / "src/data/provas/natureza"
    pasta.mkdir(parents=True, exist_ok=True)
    for ano, qs in por_ano.items():
        (pasta / f"{ano}.json").write_text(json.dumps(qs, ensure_ascii=False, indent=0) + "\n")
    (RAIZ / "src/data/explicacoes-ia-natureza.json").write_text(
        json.dumps(dict(sorted(saida_expl.items())), ensure_ascii=False, indent=0) + "\n")
    total = sum(len(v) for v in por_ano.values())
    print(f"natureza: {total} questões;", {a: len(v) for a, v in sorted(por_ano.items())})
    print(f"com TRI: {sum(1 for v in por_ano.values() for q in v if q['tri'])}; imagens copiadas: {len(usadas)}")
    print(f"explicações: {len(saida_expl)}/{total}; divergentes: {sum(v['divergente'] for v in saida_expl.values())}; ignoradas: {ignoradas}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else PADRAO)
