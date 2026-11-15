"""Small client for the public Deadlock API (https://deadlock-api.com).

Responses are cached on disk, so re-running the pipeline locally does not hit
the API again unless `refresh=True` is passed.
"""

import hashlib
import json
import time
from pathlib import Path
from typing import Any

import httpx

from . import config


class DeadlockApi:
    def __init__(self, cache_dir: Path = config.CACHE_DIR, refresh: bool = False, verbose: bool = True):
        self.cache_dir = cache_dir
        self.refresh = refresh
        self.verbose = verbose
        self.client = httpx.Client(base_url=config.API_BASE, timeout=180)
        self._last_sql_call = 0.0

    def _log(self, msg: str) -> None:
        if self.verbose:
            print(msg, flush=True)

    def _cache_path(self, kind: str, key: str) -> Path:
        digest = hashlib.sha256(key.encode()).hexdigest()[:24]
        return self.cache_dir / kind / f"{digest}.json"

    def _cached(self, kind: str, key: str, fetch) -> Any:
        path = self._cache_path(kind, key)
        if path.exists() and not self.refresh:
            return json.loads(path.read_text(encoding="utf-8"))
        data = fetch()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data), encoding="utf-8")
        return data

    def get_json(self, url: str, params: dict | None = None) -> Any:
        key = url + "?" + json.dumps(params or {}, sort_keys=True)

        def fetch():
            self._log(f"GET {url} {params or ''}")
            r = self.client.get(url, params=params)
            r.raise_for_status()
            return r.json()

        return self._cached("http", key, fetch)

    def sql(self, query: str, retries: int = 4) -> list[dict]:
        def fetch():
            for attempt in range(retries):
                wait = config.SQL_MIN_INTERVAL_S - (time.monotonic() - self._last_sql_call)
                if wait > 0:
                    self._log(f"rate limit: waiting {wait:.0f}s")
                    time.sleep(wait)
                self._last_sql_call = time.monotonic()
                self._log(f"SQL ({len(query)} chars)")
                r = self.client.get("/v1/sql", params={"query": query})
                if r.status_code in (429, 502, 503, 504):
                    self._log(f"HTTP {r.status_code}, retrying in 60s")
                    time.sleep(60)
                    continue
                r.raise_for_status()
                return r.json()
            raise RuntimeError("SQL query failed after retries")

        return self._cached("sql", query, fetch)
