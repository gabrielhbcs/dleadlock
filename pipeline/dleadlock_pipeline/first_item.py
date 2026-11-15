"""First-item games: guess which item the hero of the day buys first in each tier.

- descent: the RAREST first buys score the most.
- ascent:  the MOST COMMON first buys score the most.

Both games share the same data (one cached query per UTC day) and differ only in
the ranking direction and in how the hero of the day is picked.
"""

import hashlib
import math
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from importlib import resources

from . import config
from .api import DeadlockApi
from .models import Band, FirstItemPuzzle, StaticData, TierItem, TierResult

# (hero_id, tier, item_id) -> number of times that item was the first one bought
Counts = dict[tuple[int, int, int], int]


def _query(name: str, **params) -> str:
    sql = resources.files("dleadlock_pipeline.queries").joinpath(name).read_text(encoding="utf-8")
    return sql.format(**params)


def window_days(puzzle_date: date) -> list[date]:
    """UTC days used by a puzzle: the WINDOW_DAYS days before yesterday."""
    last = puzzle_date - timedelta(days=2)
    return [last - timedelta(days=i) for i in range(config.WINDOW_DAYS)][::-1]


def daily_counts(api: DeadlockApi, static: StaticData, day: date, mode: str) -> Counts:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    tier_items = [i for i in static.items if i.tier in config.FIRST_ITEM_TIERS]
    rows = api.sql(_query(
        "daily_first_items.sql",
        tiers_values=",".join(f"({i.id},{i.tier})" for i in tier_items),
        day_start=start.strftime("%Y-%m-%d %H:%M:%S"),
        day_end=end.strftime("%Y-%m-%d %H:%M:%S"),
        min_rank=config.RANK_MODES[mode]["min_display_rank"],
    ))
    return {(r["hero_id"], r["tier"], r["item_id"]): r["n"] for r in rows}


def window_counts(api: DeadlockApi, static: StaticData, puzzle_date: date, mode: str) -> Counts:
    total: Counts = defaultdict(int)
    for day in window_days(puzzle_date):
        for key, n in daily_counts(api, static, day, mode).items():
            total[key] += n
    return dict(total)


def eligible_heroes(static: StaticData, counts: Counts) -> list[int]:
    # Samples per hero = player-matches that bought at least one T1 item.
    samples: dict[int, int] = defaultdict(int)
    for (hero, tier, _), n in counts.items():
        if tier == 1:
            samples[hero] += n
    known = {h.id for h in static.heroes}
    return sorted(h for h, n in samples.items() if n >= config.MIN_HERO_SAMPLES and h in known)


def pick_hero(game: str, eligible: list[int], puzzle_date: date, mode: str) -> int:
    """Deterministic daily pick. Games listed earlier in config.GAMES pick first;
    a later game skips heroes already taken that day, so games never share one."""
    if not eligible:
        raise RuntimeError(f"no hero has {config.MIN_HERO_SAMPLES}+ samples for {puzzle_date}")
    taken: set[int] = set()
    for g in config.GAMES:
        seed = int(hashlib.sha256(f"{g}:{mode}:{puzzle_date.isoformat()}".encode()).hexdigest(), 16)
        free = [h for h in eligible if h not in taken] or eligible
        hero = free[seed % len(free)]
        if g == game:
            return hero
        taken.add(hero)
    raise KeyError(game)


def assign_bands(counts: dict[int, int], order: str) -> list[tuple[int, int, int, str]]:
    """Return (item_id, count, rank, band) sorted best answer first.

    order="rarest": fewest first buys first. order="common": most first buys first.
    Band sizes are a share of the list, rounded up. Tied counts share a rank and
    always get the best band any of them reaches, so a tie never splits bands.
    """
    sign = 1 if order == "rarest" else -1
    ordered = sorted(counts.items(), key=lambda kv: (sign * kv[1], kv[0]))
    n = len(ordered)
    band_at: list[str] = []
    for b in config.BANDS:
        size = n - len(band_at) if b["share"] is None else math.ceil(b["share"] * n)
        band_at += [b["id"]] * size
    band_at = band_at[:n]

    first_pos: dict[int, int] = {}
    for pos, (_, c) in enumerate(ordered):
        first_pos.setdefault(c, pos)
    return [(item_id, c, first_pos[c] + 1, band_at[first_pos[c]]) for item_id, c in ordered]


def points_for(rank: int, n_items: int) -> int:
    """Rank 1 (best answer) -> POINTS_MAX, last rank -> POINTS_MIN, curved."""
    if n_items <= 1:
        return config.POINTS_MAX
    x = (n_items - rank) / (n_items - 1)  # 1 for the best answer, 0 for the worst
    return round(config.POINTS_MIN + (config.POINTS_MAX - config.POINTS_MIN) * x ** config.POINTS_CURVE)


def build_puzzle(game: str, api: DeadlockApi, static: StaticData, puzzle_date: date,
                 mode: str = config.DEFAULT_MODE, hero_id: int | None = None) -> FirstItemPuzzle:
    order = config.GAMES[game]["order"]
    counts = window_counts(api, static, puzzle_date, mode)
    if hero_id is None:
        hero_id = pick_hero(game, eligible_heroes(static, counts), puzzle_date, mode)

    tiers = []
    for tier in config.FIRST_ITEM_TIERS:
        per_item = {item: n for (h, t, item), n in counts.items() if h == hero_id and t == tier}
        total = sum(per_item.values())
        ranked = assign_bands(per_item, order)
        items = [
            TierItem(id=i, count=c, share=round(c / total, 6) if total else 0.0, rank=rank, band=band,
                     points=points_for(rank, len(ranked)))
            for i, c, rank, band in ranked
        ]
        tiers.append(TierResult(tier=tier, total=total, items=items))

    days = window_days(puzzle_date)
    return FirstItemPuzzle(
        game=game,
        order=order,
        date=puzzle_date.isoformat(),
        mode=mode,
        hero_id=hero_id,
        window_start=days[0].isoformat(),
        window_end=days[-1].isoformat(),
        bands=[Band(id=b["id"]) for b in config.BANDS],
        bonus_count=config.BONUS_COUNT,
        bonus_points=config.BONUS_POINTS,
        guesses_per_tier=2,
        tiers=tiers,
    )
