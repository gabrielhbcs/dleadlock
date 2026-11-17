"""Command line entry point.

Examples:
  python -m dleadlock_pipeline static
  python -m dleadlock_pipeline games                   # every game, UTC yesterday .. today+7
  python -m dleadlock_pipeline descent --date 2026-11-15 --hero 13
  python -m dleadlock_pipeline ascent
  python -m dleadlock_pipeline all --refresh           # static + games, ignoring the API cache
  python -m dleadlock_pipeline descent --date 2026-11-15 --overwrite
  python -m dleadlock_pipeline all --patch-date 2026-11-20   # after a balance patch

Puzzles that already exist are kept as they are (players may be in the middle of
them); pass --overwrite to build them again.

--patch-date saves the date of the latest balance patch (web/public/data/patch.json).
From then on no puzzle mixes matches from before it (see config.MIN_PATCH_DAYS), and
future puzzles (after today, UTC) that were built with older matches are rebuilt.
"""

import argparse
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from . import config
from .api import DeadlockApi
from .assets import build_static
from .first_item import build_puzzle, window_days
from .models import PuzzleIndex, StaticData


def _show(path: Path) -> Path:
    """Path for log lines: relative to the repo when it is inside it."""
    try:
        return path.resolve().relative_to(config.REPO_ROOT)
    except ValueError:
        return path


def _write(path: Path, model) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(model.model_dump_json(indent=None), encoding="utf-8")
    print(f"wrote {_show(path)}")


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


def _puzzle_path(out: Path, game: str, mode: str, d: date) -> Path:
    return out / game / mode / f"{d.isoformat()}.json"


def _hero_of(path: Path) -> int | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))["hero_id"]


def _hero_history(out: Path, game: str, mode: str, d: date) -> tuple[dict[int, date], set[int]]:
    """From the puzzles already written: (hero -> last day any game used it in
    the HERO_COOLDOWN_DAYS before d, heroes the other games have on d)."""
    last_used: dict[int, date] = {}
    for back in range(config.HERO_COOLDOWN_DAYS, 0, -1):
        day = d - timedelta(days=back)
        for g in config.GAMES:
            hero = _hero_of(_puzzle_path(out, g, mode, day))
            if hero is not None:
                last_used[hero] = day
    same_day = {h for g in config.GAMES if g != game
                if (h := _hero_of(_puzzle_path(out, g, mode, d))) is not None}
    return last_used, same_day


def _patch_path(out: Path) -> Path:
    return out / "patch.json"


def _load_patch(out: Path) -> date | None:
    p = _patch_path(out)
    if not p.exists():
        return None
    return date.fromisoformat(json.loads(p.read_text(encoding="utf-8"))["date"])


def _save_patch(out: Path, patch: date) -> None:
    p = _patch_path(out)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps({"date": patch.isoformat()}), encoding="utf-8")
    print(f"wrote {_show(p)}")


def _stale_after_patch(path: Path, d: date, today: date, patch: date | None) -> bool:
    """A puzzle nobody can be playing yet (after today, UTC) that was built with
    matches from before the patch, while matches after it are now available."""
    if patch is None or d <= today:
        return False
    built_from = date.fromisoformat(json.loads(path.read_text(encoding="utf-8"))["window_start"])
    return built_from < patch <= window_days(d, today, patch)[0]


def cmd_games(games: list[str], api: DeadlockApi, out: Path, dates: list[date], mode: str,
              hero: int | None, overwrite: bool = False) -> None:
    static = _load_static(api, out)
    today = _today()
    patch = _load_patch(out)
    # Day by day, every game on each day: the hero history of a day must include
    # all the days before it, from every game.
    for d in sorted(dates):
        for game in games:
            path = _puzzle_path(out, game, mode, d)
            if path.exists() and not overwrite:
                if not _stale_after_patch(path, d, today, patch):
                    print(f"kept {_show(path)} (already exists)")
                    continue
                print(f"rebuilding {_show(path)} with matches after the {patch} patch")
            last_used, same_day = _hero_history(out, game, mode, d)
            _write(path, build_puzzle(game, api, static, d, mode, hero, last_used, same_day,
                                      run_day=today, patch=patch))
    for game in games:
        mode_dir = out / game / mode
        available = sorted(p.stem for p in mode_dir.glob("????-??-??.json"))
        _write(mode_dir / "index.json", PuzzleIndex(mode=mode, dates=available))


def _today() -> date:
    return datetime.now(timezone.utc).date()


def default_dates() -> list[date]:
    today = _today()
    return [today + timedelta(days=i) for i in range(-config.DAYS_BEFORE, config.DAYS_AHEAD + 1)]


def main() -> None:
    p = argparse.ArgumentParser(prog="dleadlock_pipeline", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("command", choices=["static", "games", "all", *config.GAMES])
    p.add_argument("--date", action="append", type=date.fromisoformat,
                   help="puzzle date (repeatable); default: UTC yesterday up to today + DAYS_AHEAD")
    p.add_argument("--mode", default=config.DEFAULT_MODE, choices=sorted(config.RANK_MODES))
    p.add_argument("--hero", type=int, help="force a hero id instead of the daily pick")
    p.add_argument("--refresh", action="store_true", help="ignore the local API cache")
    p.add_argument("--overwrite", action="store_true", help="rebuild puzzles that already exist")
    p.add_argument("--patch-date", type=date.fromisoformat,
                   help="UTC day a balance patch went live: later puzzles only use matches after it")
    p.add_argument("--out", type=Path, default=config.WEB_DATA_DIR)
    a = p.parse_args()

    if a.patch_date is not None:
        if a.patch_date > _today():
            p.error("--patch-date cannot be in the future")
        _save_patch(a.out, a.patch_date)

    api = DeadlockApi(refresh=a.refresh)
    if a.command in ("static", "all"):
        cmd_static(api, a.out)
    games = list(config.GAMES) if a.command in ("games", "all") else [a.command] if a.command in config.GAMES else []
    if games:
        dates = a.date
        if dates is None:
            # Also every future puzzle built earlier, so all of them get the
            # post-patch check (some may be further ahead than DAYS_AHEAD).
            future = {date.fromisoformat(p.stem) for g in games
                      for p in (a.out / g / a.mode).glob("????-??-??.json")
                      if date.fromisoformat(p.stem) > _today()}
            dates = sorted(set(default_dates()) | future)
        cmd_games(games, api, a.out, dates, a.mode, a.hero, a.overwrite)
    print(json.dumps({"ok": True}))


if __name__ == "__main__":
    main()
