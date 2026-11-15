"""Command line entry point.

Examples:
  python -m dleadlock_pipeline static
  python -m dleadlock_pipeline games                   # every game, UTC yesterday/today/tomorrow
  python -m dleadlock_pipeline descent --date 2026-11-15 --hero 13
  python -m dleadlock_pipeline ascent
  python -m dleadlock_pipeline all --refresh           # static + games, ignoring the API cache
"""

import argparse
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from . import config
from .api import DeadlockApi
from .assets import build_static
from .first_item import build_puzzle
from .models import PuzzleIndex, StaticData


def _write(path: Path, model) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(model.model_dump_json(indent=None), encoding="utf-8")
    print(f"wrote {path.relative_to(config.REPO_ROOT)}")


def _static_path(out: Path) -> Path:
    return out / "static.json"


def cmd_static(api: DeadlockApi, out: Path) -> StaticData:
    static = build_static(api)
    _write(_static_path(out), static)
    return static


def _load_static(api: DeadlockApi, out: Path) -> StaticData:
    p = _static_path(out)
    if p.exists():
        return StaticData.model_validate_json(p.read_text(encoding="utf-8"))
    return cmd_static(api, out)


def cmd_game(game: str, api: DeadlockApi, out: Path, dates: list[date], mode: str, hero: int | None) -> None:
    static = _load_static(api, out)
    mode_dir = out / game / mode
    for d in dates:
        _write(mode_dir / f"{d.isoformat()}.json", build_puzzle(game, api, static, d, mode, hero))
    available = sorted(p.stem for p in mode_dir.glob("????-??-??.json"))
    _write(mode_dir / "index.json", PuzzleIndex(mode=mode, dates=available))


def default_dates() -> list[date]:
    # Players switch days at their local midnight, so UTC yesterday..tomorrow
    # covers every time zone.
    today = datetime.now(timezone.utc).date()
    return [today - timedelta(days=1), today, today + timedelta(days=1)]


def main() -> None:
    p = argparse.ArgumentParser(prog="dleadlock_pipeline", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("command", choices=["static", "games", "all", *config.GAMES])
    p.add_argument("--date", action="append", type=date.fromisoformat,
                   help="puzzle date (repeatable); default: UTC yesterday, today and tomorrow")
    p.add_argument("--mode", default=config.DEFAULT_MODE, choices=sorted(config.RANK_MODES))
    p.add_argument("--hero", type=int, help="force a hero id instead of the daily pick")
    p.add_argument("--refresh", action="store_true", help="ignore the local API cache")
    p.add_argument("--out", type=Path, default=config.WEB_DATA_DIR)
    a = p.parse_args()

    api = DeadlockApi(refresh=a.refresh)
    if a.command in ("static", "all"):
        cmd_static(api, a.out)
    games = list(config.GAMES) if a.command in ("games", "all") else [a.command] if a.command in config.GAMES else []
    for game in games:
        cmd_game(game, api, a.out, a.date or default_dates(), a.mode, a.hero)
    print(json.dumps({"ok": True}))


if __name__ == "__main__":
    main()
