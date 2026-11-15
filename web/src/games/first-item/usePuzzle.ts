import { useCallback, useEffect, useState } from 'react';
import { fetchJson, loadStatic } from '../../shared/data';
import type { FirstItemPuzzle, PuzzleIndex, StaticData } from '../../shared/types';
import { MODE } from './config';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'missing'; date: string }
  | {
      status: 'ready';
      puzzle: FirstItemPuzzle;
      static: StaticData;
      index: PuzzleIndex | null;
      fallbackFrom: string | null; // requested date when an older puzzle is shown
    };

/** Loads `game`'s puzzle for `date`, falling back to the latest earlier one. */
export function usePuzzle(game: string, date: string) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const bust = reloadKey > 0;
    setState({ status: 'loading' });
    (async () => {
      try {
        const [stat, index] = await Promise.all([
          loadStatic(),
          fetchJson<PuzzleIndex>(`${game}/${MODE}/index.json`, bust).catch(() => null),
        ]);
        let target = date;
        let fallbackFrom: string | null = null;
        if (index && !index.dates.includes(date)) {
          const earlier = index.dates.filter((d) => d <= date).sort();
          const pick = earlier[earlier.length - 1] ?? index.dates[index.dates.length - 1];
          if (!pick) {
            if (!cancelled) setState({ status: 'missing', date });
            return;
          }
          fallbackFrom = date;
          target = pick;
        }
        const puzzle = await fetchJson<FirstItemPuzzle>(`${game}/${MODE}/${target}.json`, bust);
        if (!cancelled) setState({ status: 'ready', puzzle, static: stat, index, fallbackFrom });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game, date, reloadKey]);

  return { state, reload };
}
