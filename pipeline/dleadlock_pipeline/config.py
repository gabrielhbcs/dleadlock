"""Central configuration. Game tuning lives here so it is easy to tweak."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
WEB_DATA_DIR = REPO_ROOT / "web" / "public" / "data"
CACHE_DIR = Path(__file__).resolve().parents[1] / ".cache"

API_BASE = "https://api.deadlock-api.com"
# The SQL endpoint allows roughly 2 requests per minute.
SQL_MIN_INTERVAL_S = 31.0

# Site language code -> language name expected by the Deadlock assets API.
LANGUAGES = {
    "en": "english",
    "pt-BR": "brazilian",
}

# First-item games. Order matters: earlier games pick their daily hero first,
# later ones avoid it. "order" is which answers score best.
GAMES = {
    "descent": {"order": "rarest"},
    "ascent": {"order": "common"},
}

# Item tiers used by the first-item games (T5 items are excluded).
FIRST_ITEM_TIERS = (1, 2, 3, 4)

# Rank filters ("modes"). Display rank = tier * 10 + subrank; Ascendant is tier 10.
RANK_MODES = {
    "ascendant-plus": {"min_display_rank": 101},
}
DEFAULT_MODE = "ascendant-plus"

# Days of matches used for each daily puzzle. Puzzle date D uses the
# WINDOW_DAYS full UTC days ending WINDOW_LAG_DAYS before D (D-15 .. D-9).
# The lag must be DAYS_AHEAD + 2: the furthest puzzle a run builds (run day +
# DAYS_AHEAD) then still uses complete days only, ending two days before the run.
WINDOW_DAYS = 7
WINDOW_LAG_DAYS = 9

# Puzzle dates built by default, relative to today in UTC. Players switch days
# at their local midnight, so yesterday is still being played somewhere. The
# workflow runs on Mondays and Thursdays (at most 4 days apart), so 7 days ahead
# leaves three spare days in case a run fails.
DAYS_BEFORE = 1
DAYS_AHEAD = 7

# A hero picked for any game is not picked again (by any game) for this many
# days. If every eligible hero was used in that period, the one used longest ago
# is picked instead.
HERO_COOLDOWN_DAYS = 10

# A hero needs at least this many player-matches in a full window to be picked
# (scaled down for the shorter windows used right after a patch).
MIN_HERO_SAMPLES = 1500

# After a balance patch (see web/public/data/patch.json, set with --patch-date),
# a puzzle never mixes matches from before the patch: it uses only the complete
# days after it, and if its normal window has fewer than MIN_PATCH_DAYS of them,
# the freshest complete days at build time instead (two days before the run).
MIN_PATCH_DAYS = 2

# Bands (label and color only). Items bought first at least once in a tier are
# sorted from best to worst answer (rarest first in Descent, most common first
# in Ascent); each band takes `share` of that list, rounded up. The last band
# takes whatever is left.
BANDS = [
    {"id": "legendary", "share": 0.10},
    {"id": "epic", "share": 0.15},
    {"id": "rare", "share": 0.25},
    {"id": "uncommon", "share": 0.25},
    {"id": "common", "share": None},
]

# Points come from the ranking position, not the band: the best answer of a
# tier scores POINTS_MAX, the worst POINTS_MIN, and POINTS_CURVE > 1 makes the
# score drop fast after the first positions. Tied items share a position.
POINTS_MAX = 100
POINTS_MIN = 10
POINTS_CURVE = 1.6
# Extra points when a guess is one of the N best answers of its tier.
BONUS_COUNT = 2
BONUS_POINTS = 50
