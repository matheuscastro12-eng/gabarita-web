#!/usr/bin/env python3
"""Importa as explicações geradas por IA do app antigo (Gabarita macOS) para as
questões de matemática do gabarita-web. Idempotente; abre o SQLite SOMENTE LEITURA.

Uso: python3 scripts/explicacoes/importar.py [/caminho/enem.sqlite]
Saída: src/data/explicacoes-ia.json ({ "enem-2023-142": {texto, divergente, modelo} })

Mapeamento: ano + número da questão (question.year/idx) e gabarito igual
(question.correct == gabarito do banco). Ignora linhas com erro do CLI.
"""
import json, sqlite3, sys
from pathlib import Path
from urllib.parse import quote

RAIZ = Path(__file__).resolve().parents[2]
PADRAO = "/Users/matheuscastro/orca/workspaces/ENEM/FATO-1/data/enem.sqlite"
ERROS = ("You've hit your", "API Error:")

def main(caminho):
    con = sqlite3.connect(f"file:{quote(caminho)}?mode=ro", uri=True)
    linhas = con.execute(
        "select q.year, q.idx, q.correct, e.body_md, e.model, e.flagged "
        "from question q join explanation e on e.question_id = q.id "
        "where q.discipline = 'matematica' and q.language is null").fetchall()
    origem = {(a, n): (g, b, m, f) for a, n, g, b, m, f in linhas}
    saida, sem, gab_diferente, erro_cli = {}, [], [], []
    for arq in sorted((RAIZ / "src/data/provas").glob("[0-9][0-9][0-9][0-9].json")):
        for q in json.loads(arq.read_text()):
            k = (q["ano"], q["numero"])
            if k not in origem: sem.append(q["id"]); continue
            g, body, modelo, flag = origem[k]
            body = (body or "").strip()
            if not body or body.startswith(ERROS): erro_cli.append(q["id"]); continue
            if g != q["gabarito"]: gab_diferente.append(q["id"]); continue
            saida[q["id"]] = {"texto": body, "divergente": bool(flag), "modelo": modelo}
    total = len(saida) + len(sem) + len(gab_diferente) + len(erro_cli)
    dest = RAIZ / "src/data/explicacoes-ia.json"
    dest.write_text(json.dumps(dict(sorted(saida.items())), ensure_ascii=False, indent=0) + "\n")
    print(f"{len(saida)}/{total} com explicação; divergentes: {sum(v['divergente'] for v in saida.values())}")
    print("sem linha no banco antigo:", sem)
    print("gabarito diferente:", gab_diferente)
    print("erro do CLI:", erro_cli)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else PADRAO)
