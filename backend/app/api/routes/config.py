import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/config", tags=["config"])

ENV_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")

ALLOWED_KEYS = {"GEMINI_API_KEY", "OPENROUTER_API_KEY", "LLM_PROVIDER", "LLM_MODEL", "OLLAMA_HOST"}


def _read_env() -> dict[str, str]:
    result: dict[str, str] = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    result[k.strip()] = v.strip()
    return result


def _write_env(data: dict[str, str]):
    lines = []
    for k, v in data.items():
        lines.append(f"{k}={v}")
    with open(ENV_FILE, "w") as f:
        f.write("\n".join(lines) + "\n")


class ConfigUpdate(BaseModel):
    key: str
    value: str


@router.get("/")
async def get_config():
    env = _read_env()
    # Return keys but mask secrets
    result = {}
    for k in ALLOWED_KEYS:
        v = env.get(k, os.getenv(k, ""))
        if "KEY" in k and v:
            result[k] = v[:8] + "..." + v[-4:] if len(v) > 12 else "****"
        else:
            result[k] = v
    return result


@router.post("/")
async def update_config(payload: ConfigUpdate):
    if payload.key not in ALLOWED_KEYS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unknown config key: {payload.key}")
    env = _read_env()
    env[payload.key] = payload.value
    _write_env(env)
    # Reload env var in current process
    os.environ[payload.key] = payload.value
    return {"ok": True, "key": payload.key}
