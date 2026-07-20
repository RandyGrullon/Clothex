"""Klozet ai-server — IA local 100% gratis.

- rembg (u2net) quita el fondo de la prenda.
- Ollama (gemma3:12b, visión) analiza tipo, tela, colores y estilo,
  y combina outfits por color/estilo.

Ejecutar:  uvicorn main:app --host 0.0.0.0 --port 8000
"""

import base64
import io
import json
import re

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from rembg import new_session, remove

OLLAMA = "http://127.0.0.1:11434"
VISION_MODEL = "gemma3:12b"

app = FastAPI(title="Klozet AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Cargando modelo de segmentación (u2net)…")
REMBG_SESSION = new_session("u2net")
print("Listo.")

# Modelo específico para recortar personas (mejor que u2net para siluetas
# humanas). Se carga la primera vez que se usa, para no retrasar el arranque.
_HUMAN_SESSION = None


def human_session():
    global _HUMAN_SESSION
    if _HUMAN_SESSION is None:
        print("Cargando modelo de segmentación humana (u2net_human_seg)…")
        _HUMAN_SESSION = new_session("u2net_human_seg")
    return _HUMAN_SESSION


class ProcessIn(BaseModel):
    image_b64: str


class CutoutIn(BaseModel):
    image_b64: str
    human: bool = False


class OutfitsIn(BaseModel):
    garments: list[dict]
    style: str
    profile: dict | None = None


def _downscale(img: Image.Image, max_side: int = 1024) -> Image.Image:
    w, h = img.size
    if max(w, h) <= max_side:
        return img
    scale = max_side / max(w, h)
    return img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)


def _extract_json(text: str) -> dict:
    """Ollama con format=json devuelve JSON, pero por si acaso limpiamos."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            raise HTTPException(502, f"El modelo no devolvió JSON: {text[:300]}")
        return json.loads(m.group(0))


async def _ollama_chat(prompt: str, images_b64: list[str] | None = None) -> dict:
    msg: dict = {"role": "user", "content": prompt}
    if images_b64:
        msg["images"] = images_b64
    async with httpx.AsyncClient(timeout=300) as client:
        try:
            res = await client.post(
                f"{OLLAMA}/api/chat",
                json={
                    "model": VISION_MODEL,
                    "messages": [msg],
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.4},
                },
            )
        except httpx.HTTPError as e:
            raise HTTPException(502, f"Ollama no responde: {e}")
    if res.status_code != 200:
        raise HTTPException(502, f"Ollama error {res.status_code}: {res.text[:300]}")
    return _extract_json(res.json()["message"]["content"])


ANALYZE_PROMPT = """Eres un experto en moda. Analiza la prenda de ropa de la imagen.
Responde SOLO con JSON válido, con exactamente estas claves:
{
  "name": "nombre corto y natural en español, ej: 'Camisa oxford azul'",
  "category": "una de: top | bottom | outerwear | dress | shoes | accessory",
  "subtype": "tipo específico en español, ej: camiseta, camisa, jeans, chinos, blazer, sneakers",
  "material": "tela/material estimado en español, ej: algodón, lino, mezclilla, lana, cuero, poliéster",
  "pattern": "patrón en español: liso, rayas, cuadros, estampado, logo…",
  "fit": "corte: slim, regular, oversize, recto…",
  "colors": [{"name": "nombre del color en español", "hex": "#RRGGBB"}] (1 a 4 colores dominantes de la prenda, ignora el fondo),
  "styles": lista con los estilos que le quedan a la prenda, solo de: ["casual","formal","semiformal","estetico","old_money","streetwear","deportivo"],
  "seasons": lista de: ["primavera","verano","otoño","invierno"],
  "description": "1-2 frases en español sobre la prenda y con qué combina"
}"""


@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{OLLAMA}/api/tags")
        ollama_ok = r.status_code == 200
        has_model = ollama_ok and any(
            m["name"].startswith(VISION_MODEL.split(":")[0]) for m in r.json().get("models", [])
        )
    except Exception:
        ollama_ok = has_model = False
    return {"ok": True, "ollama": ollama_ok and has_model, "model": VISION_MODEL}


@app.post("/cutout")
async def cutout(body: CutoutIn):
    """Quita el fondo de una imagen (persona o prenda) y devuelve el PNG.
    Con human=True usa el modelo de segmentación humana."""
    try:
        raw = base64.b64decode(body.image_b64)
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Imagen inválida")

    # Las fotos de persona conservan más detalle (cuerpo completo).
    img = _downscale(img, 1280 if body.human else 1024)
    session = human_session() if body.human else REMBG_SESSION
    out = remove(img, session=session)
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    return {"cutout_b64": base64.b64encode(buf.getvalue()).decode()}


@app.post("/process")
async def process(body: ProcessIn):
    try:
        raw = base64.b64decode(body.image_b64)
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Imagen inválida")

    img = _downscale(img)

    # 1) Quitar fondo
    cutout = remove(img, session=REMBG_SESSION)
    buf = io.BytesIO()
    cutout.save(buf, format="PNG", optimize=True)
    cutout_b64 = base64.b64encode(buf.getvalue()).decode()

    # 2) Analizar con el modelo de visión (imagen reducida para velocidad)
    small = _downscale(img, 768)
    sbuf = io.BytesIO()
    small.save(sbuf, format="JPEG", quality=85)
    analysis = await _ollama_chat(ANALYZE_PROMPT, [base64.b64encode(sbuf.getvalue()).decode()])

    # Saneamos el resultado para que la app nunca reciba campos rotos
    valid_cats = {"top", "bottom", "outerwear", "dress", "shoes", "accessory"}
    valid_styles = {"casual", "formal", "semiformal", "estetico", "old_money", "streetwear", "deportivo"}
    colors = [
        {"name": str(c.get("name", "color")), "hex": str(c.get("hex", "#888888"))}
        for c in analysis.get("colors", [])
        if isinstance(c, dict)
    ][:4]
    clean = {
        "name": str(analysis.get("name") or "Prenda"),
        "category": analysis.get("category") if analysis.get("category") in valid_cats else "top",
        "subtype": str(analysis.get("subtype") or ""),
        "material": str(analysis.get("material") or ""),
        "pattern": str(analysis.get("pattern") or ""),
        "fit": str(analysis.get("fit") or ""),
        "colors": colors or [{"name": "gris", "hex": "#888888"}],
        "styles": [s for s in analysis.get("styles", []) if s in valid_styles] or ["casual"],
        "seasons": [str(s) for s in analysis.get("seasons", [])][:4],
        "description": str(analysis.get("description") or ""),
    }
    return {"cutout_b64": cutout_b64, "analysis": clean}


@app.post("/outfits")
async def outfits(body: OutfitsIn):
    garments_txt = json.dumps(body.garments, ensure_ascii=False)
    profile_txt = json.dumps(body.profile or {}, ensure_ascii=False)
    prompt = f"""Eres un estilista experto. Este es el closet del usuario (JSON):
{garments_txt}

Perfil del usuario: {profile_txt}

Crea de 1 a 3 outfits de estilo "{body.style}" combinando SOLO prendas del closet (usa sus "id" exactos).
Reglas:
- Combina por teoría del color (armonía, contraste, neutros) y coherencia de material/estilo.
- Un outfit ideal: 1 top + 1 bottom + 1 shoes (opcional outerwear y accessory), o 1 dress + shoes.
- Si faltan categorías, arma lo mejor posible con lo que hay (mínimo 2 prendas).
- No inventes ids.

Responde SOLO JSON:
{{"outfits": [{{"name": "nombre corto en español", "style": "{body.style}", "garment_ids": ["id1","id2"], "reason": "por qué combinan estos colores/telas, en español, 1-2 frases", "score": 1-10}}]}}"""
    result = await _ollama_chat(prompt)
    outs = result.get("outfits", [])
    if isinstance(outs, dict):
        outs = [outs]
    valid_ids = {g.get("id") for g in body.garments}
    clean = []
    for o in outs:
        ids = [i for i in o.get("garment_ids", []) if i in valid_ids]
        if len(ids) < 2:
            continue
        clean.append(
            {
                "name": str(o.get("name") or "Outfit"),
                "style": body.style,
                "garment_ids": ids,
                "reason": str(o.get("reason") or ""),
                "score": int(o.get("score") or 7),
            }
        )
    return {"outfits": clean}
