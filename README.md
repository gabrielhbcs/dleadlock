# dleadlock

Daily browser games built on public [Deadlock](https://store.steampowered.com/app/1422450/Deadlock/) statistics.
Fan project, not affiliated with Valve. Data comes from the community [Deadlock API](https://deadlock-api.com).

## Games

Both games share one engine (`web/src/games/first-item/`) and one dataset: for every
player-match of the hero of the day, the first item bought in each tier (T1–T4).

| Game | Idea |
|---|---|
| **Descent** | Name items the hero of the day RARELY buys first. Rarer answers earn more souls and take you deeper below the city. |
| **Ascent** | Name items the hero of the day buys first MOST OFTEN. More popular answers earn more souls and carry you back up to the sky. |

Each game picks a different hero every day.

## Layout

```
pipeline/   Python: queries the Deadlock API and writes static JSON for the site
web/        React + Vite + TypeScript site (hub + one route per game)
  public/data/         generated JSON (static.json, <game>/<mode>/<date>.json)
  public/backgrounds/  background painting shared by Descent and Ascent
```

The site is fully static: a scheduled job runs the pipeline and publishes the JSON
next to the site (e.g. GitHub Pages). Nothing is computed in the browser.

## Running locally

Pipeline (Python 3.12+):

```sh
cd pipeline
python -m venv .venv
.venv/Scripts/python -m pip install -e .   # on macOS/Linux: .venv/bin/python
.venv/Scripts/python -m dleadlock_pipeline all   # static data + every game
```

API responses are cached in `pipeline/.cache/`, so re-running does not hit the API
again (use `--refresh` to ignore the cache). The SQL endpoint allows about 2 queries
per minute; the pipeline waits between queries automatically.

Site (Node 20+):

```sh
cd web
npm install
npm run dev          # normal mode, reads the JSON in public/data
npm run dev:debug    # adds a debug panel: toggle the timer, show answers,
                     # pick a date, reset progress, rebuild a puzzle from the API
```

## Adding a game

1. Create `web/src/games/<id>/` with a default-exported component.
2. Register it in `web/src/games/registry.ts`.
3. Add `games.<id>.name` / `games.<id>.description` to every file in `web/src/i18n/locales/`.
4. If it needs data, add a builder in `pipeline/dleadlock_pipeline/` and a CLI command.

## Adding a language

1. Add `web/src/i18n/locales/<code>.json` and register it in `web/src/i18n/index.ts`.
2. Add the code to `LANGUAGES` in `pipeline/dleadlock_pipeline/config.py` so item and
   hero names are fetched in that language. Players can always type English item names.
