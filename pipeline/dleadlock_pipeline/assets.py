"""Hero and item metadata (names in every site language, images, tiers)."""

from datetime import datetime, timezone

from . import config
from .api import DeadlockApi
from .models import Hero, Item, StaticData


def _by_language(api: DeadlockApi, path: str, params: dict | None = None) -> dict[str, list[dict]]:
    out = {}
    for code, api_lang in config.LANGUAGES.items():
        out[code] = api.get_json(path, {**(params or {}), "language": api_lang})
    return out


def _names(rows_by_lang: dict[str, list[dict]], obj_id: int) -> dict[str, str]:
    names = {}
    for code, rows in rows_by_lang.items():
        for r in rows:
            if r["id"] == obj_id:
                names[code] = r["name"]
                break
    return names


def build_static(api: DeadlockApi) -> StaticData:
    heroes_raw = _by_language(api, "/v1/assets/heroes", {"only_active": "true"})
    items_raw = _by_language(api, "/v1/assets/items/by-type/upgrade")

    heroes = []
    for h in heroes_raw["en"]:
        images = h.get("images") or {}
        heroes.append(Hero(
            id=h["id"],
            names=_names(heroes_raw, h["id"]),
            image=images.get("icon_hero_card_webp") or images.get("icon_hero_card"),
        ))

    items = []
    for it in items_raw["en"]:
        # disabled is None/False for items currently in the shop
        if not it.get("shopable") or it.get("disabled"):
            continue
        if it.get("item_tier") not in config.DESCENT_TIERS:
            continue
        items.append(Item(
            id=it["id"],
            tier=it["item_tier"],
            names=_names(items_raw, it["id"]),
            image=it.get("shop_image_webp") or it.get("shop_image") or it.get("image"),
        ))

    heroes.sort(key=lambda h: h.names.get("en", ""))
    items.sort(key=lambda i: (i.tier, i.names.get("en", "")))
    return StaticData(
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        heroes=heroes,
        items=items,
    )
