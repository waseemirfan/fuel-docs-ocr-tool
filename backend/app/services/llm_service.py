"""
LLM service supporting multiple providers:
  - gemini  (default) : Google Gemini API - free tier, no local install needed
  - ollama            : Local Ollama instance (requires ollama to be running)
  - openrouter        : OpenRouter.ai gateway (access to many models via one key)

Configure via environment variables:
  LLM_PROVIDER    = gemini | ollama | openrouter   (default: gemini)
  GEMINI_API_KEY  = your key from https://aistudio.google.com/apikey
  OPENROUTER_API_KEY = your key from https://openrouter.ai
  OLLAMA_HOST     = http://localhost:11434         (default)
  LLM_MODEL       = override the default model for the chosen provider
"""

import httpx
import base64
import json
import os
import re
from pathlib import Path

PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

# --- Per-provider defaults ---
PROVIDER_DEFAULTS = {
    "gemini":     {"model": "gemini-2.5-flash", "base_url": "https://generativelanguage.googleapis.com"},
    "ollama":     {"model": "qwen2.5vl:7b",     "base_url": os.getenv("OLLAMA_HOST", "http://localhost:11434")},
    "openrouter": {"model": "google/gemini-2.5-flash", "base_url": "https://openrouter.ai/api/v1"},
}

MODEL = os.getenv("LLM_MODEL", PROVIDER_DEFAULTS.get(PROVIDER, {}).get("model", "gemini-2.5-flash"))

EXTRACTION_PROMPT = """You are an expert OCR assistant specialising in fuel delivery documents.

Analyse this image carefully. It may contain:
- A delivery ticket (handwritten or printed)
- A Bill of Lading (BoL)
- Both documents side by side (delivery ticket on left, BoL on right)

Extract the following fields. For each field provide:
1. The extracted value (or null if not found / illegible)
2. A confidence score 0-100 (how certain you are the value is correct)

Return ONLY valid JSON in this exact format, no markdown:
{
  "document_type": "delivery_ticket" | "bol" | "combined" | "unknown",
  "fields": {
    "date":           {"value": "...", "confidence": 95},
    "manifest_no":    {"value": "...", "confidence": 90},
    "bol":            {"value": "...", "confidence": 85},
    "delivery_point": {"value": "...", "confidence": 88},
    "regular":        {"value": "...", "confidence": 92},
    "super":          {"value": "...", "confidence": 80},
    "diesel":         {"value": "...", "confidence": 75}
  }
}

Field descriptions:
- date: delivery or document date (capture exactly as written)
- manifest_no: manifest number or ticket number
- bol: Bill of Lading number
- delivery_point: delivery location or site name
- regular: regular gasoline gallons (numeric value only)
- super: super / premium gasoline gallons (numeric value only)
- diesel: diesel fuel gallons (numeric value only)

Rules:
- If a field is not present in the document: value = null, confidence = 0
- If a value is illegible or ambiguous: set confidence below 80
- Do NOT guess or fabricate values
"""


def _load_image(image_path: str) -> tuple[bytes, str]:
    data = Path(image_path).read_bytes()
    suffix = Path(image_path).suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                ".tiff": "image/tiff", ".tif": "image/tiff", ".bmp": "image/bmp"}
    mime = mime_map.get(suffix, "image/jpeg")
    return data, mime


def _parse_json(raw: str) -> dict:
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r"```\s*$", "", raw.strip(), flags=re.MULTILINE)
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in LLM response: {raw[:400]}")
    return json.loads(match.group())


async def _call_gemini(image_path: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey")

    image_bytes, mime_type = _load_image(image_path)
    b64 = base64.b64encode(image_bytes).decode()

    payload = {
        "contents": [{
            "parts": [
                {"text": EXTRACTION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": b64}},
            ]
        }],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
        },
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()

    raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_json(raw)


async def _call_ollama(image_path: str) -> dict:
    base_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    image_bytes, mime_type = _load_image(image_path)
    b64 = base64.b64encode(image_bytes).decode()

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": EXTRACTION_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
            ],
        }],
        "stream": False,
        "options": {"temperature": 0.0},
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{base_url}/api/chat", json=payload)
        resp.raise_for_status()

    raw = resp.json()["message"]["content"]
    return _parse_json(raw)


async def _call_openrouter(image_path: str) -> dict:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set. Get a key at https://openrouter.ai")

    image_bytes, mime_type = _load_image(image_path)
    b64 = base64.b64encode(image_bytes).decode()

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": EXTRACTION_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
            ],
        }],
        "temperature": 0.0,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "HTTP-Referer": "http://localhost:5173"},
            json=payload,
        )
        resp.raise_for_status()

    raw = resp.json()["choices"][0]["message"]["content"]
    return _parse_json(raw)


async def extract_document(image_path: str) -> dict:
    if PROVIDER == "gemini":
        return await _call_gemini(image_path)
    elif PROVIDER == "ollama":
        return await _call_ollama(image_path)
    elif PROVIDER == "openrouter":
        return await _call_openrouter(image_path)
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {PROVIDER!r}. Choose: gemini, ollama, openrouter")


async def check_llm_health() -> dict:
    """Returns provider name and connectivity status."""
    if PROVIDER == "gemini":
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return {"provider": "gemini", "status": "missing_api_key", "model": MODEL}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}?key={api_key}"
                )
                ok = resp.status_code == 200
            return {"provider": "gemini", "status": "ok" if ok else "error", "model": MODEL}
        except Exception as e:
            return {"provider": "gemini", "status": "unreachable", "model": MODEL}

    elif PROVIDER == "ollama":
        base_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{base_url}/api/tags")
                ok = resp.status_code == 200
            return {"provider": "ollama", "status": "ok" if ok else "error", "model": MODEL}
        except Exception:
            return {"provider": "ollama", "status": "unreachable", "model": MODEL}

    elif PROVIDER == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            return {"provider": "openrouter", "status": "missing_api_key", "model": MODEL}
        return {"provider": "openrouter", "status": "ok", "model": MODEL}

    return {"provider": PROVIDER, "status": "unknown", "model": MODEL}
