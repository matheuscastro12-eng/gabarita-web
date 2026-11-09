# Monta design/capturas/comparar/<tela>-<largura>.png com antes | depois lado a lado.
# Uso: python3 design/scripts/comparar.py
import glob, os
from PIL import Image, ImageDraw

BASE = "design/capturas"
os.makedirs(f"{BASE}/comparar", exist_ok=True)
for depois in sorted(glob.glob(f"{BASE}/depois/*.png")):
    nome = os.path.basename(depois)
    antes = f"{BASE}/antes/{nome}"
    if not os.path.exists(antes):
        continue
    a, d = Image.open(antes).convert("RGB"), Image.open(depois).convert("RGB")
    faixa, vao = 28, 16
    folha = Image.new("RGB", (a.width + d.width + vao, max(a.height, d.height) + faixa), "#3a3a3c")
    folha.paste(a, (0, faixa))
    folha.paste(d, (a.width + vao, faixa))
    lapis = ImageDraw.Draw(folha)
    lapis.text((8, 8), "ANTES (origin/main)", fill="#ffffff")
    lapis.text((a.width + vao + 8, 8), "DEPOIS (esta branch)", fill="#ffffff")
    folha.save(f"{BASE}/comparar/{nome}")
    print(nome, folha.size)
