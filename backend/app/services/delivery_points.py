from typing import Optional
from rapidfuzz import process, fuzz
import json
import os

SITES_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "delivery_sites.json")
MATCH_SCORE_THRESHOLD = 70

_sites: list[str] = []


def load_sites():
    global _sites
    if os.path.exists(SITES_FILE):
        with open(SITES_FILE) as f:
            _sites = json.load(f)


def save_sites(sites: list[str]):
    global _sites
    _sites = sites
    os.makedirs(os.path.dirname(SITES_FILE), exist_ok=True)
    with open(SITES_FILE, "w") as f:
        json.dump(sites, f, indent=2)


async def get_suggested_match(extracted_value: str) -> Optional[str]:
    if not _sites or not extracted_value:
        return None
    result = process.extractOne(extracted_value, _sites, scorer=fuzz.WRatio)
    if result and result[1] >= MATCH_SCORE_THRESHOLD:
        return result[0]
    return None


def get_all_sites() -> list:
    return _sites
