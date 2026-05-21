from fastapi import APIRouter
from app.services.llm_service import check_llm_health

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    llm = await check_llm_health()
    return {"api": "ok", "llm": llm}
