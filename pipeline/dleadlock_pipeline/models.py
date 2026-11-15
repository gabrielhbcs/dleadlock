"""Pydantic models for every JSON file the pipeline writes.

These are the contract with the website (see web/src/shared/types.ts).
"""

from pydantic import BaseModel


class LocalizedNames(BaseModel):
    # language code (e.g. "en", "pt-BR") -> display name
    names: dict[str, str]


class Hero(LocalizedNames):
    id: int
    image: str | None


class Item(LocalizedNames):
    id: int
    tier: int
    image: str | None


class StaticData(BaseModel):
    version: int = 1
    generated_at: str
    heroes: list[Hero]
    items: list[Item]


class Band(BaseModel):
    id: str


class TierItem(BaseModel):
    id: int
    count: int  # times this item was the first one bought in its tier
    share: float  # count / total players in the window
    rank: int  # 1 = best answer; tied counts share a rank
    band: str
    points: int  # from the rank, before the rarest bonus


class TierResult(BaseModel):
    tier: int
    total: int  # player-matches that bought at least one item of this tier
    items: list[TierItem]  # only items bought first at least once, best answer first


class FirstItemPuzzle(BaseModel):
    game: str  # "descent" or "ascent"
    version: int = 3  # 3: shared by descent/ascent, generic bonus fields
    order: str  # "rarest" or "common": which answers score best
    date: str  # puzzle date, YYYY-MM-DD
    mode: str  # rank filter, e.g. "ascendant-plus"
    hero_id: int
    window_start: str
    window_end: str
    bands: list[Band]
    bonus_count: int  # guesses among the N best answers get bonus_points extra
    bonus_points: int
    guesses_per_tier: int
    tiers: list[TierResult]


class PuzzleIndex(BaseModel):
    mode: str
    dates: list[str]
