from fastapi import APIRouter
from app.models.schemas import DeliveryPointsUpdate
from app.services.delivery_points import save_sites, get_all_sites

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("/")
async def list_sites() -> list[str]:
    return get_all_sites()


@router.post("/")
async def update_sites(payload: DeliveryPointsUpdate) -> dict:
    save_sites(payload.sites)
    return {"count": len(payload.sites), "message": "Delivery sites updated successfully"}
