import { loadJson, saveJson } from './storage';

/** True only when running `npm run dev:debug` (Vite mode "debug"). */
export const DEBUG = import.meta.env.VITE_DEBUG === 'true';

export interface DebugSettings {
  timer: boolean;
  showAnswers: boolean;
  dateOverride: string | null;
}

const KEY = 'debug-settings';
const DEFAULTS: DebugSettings = { timer: true, showAnswers: false, dateOverride: null };

export function loadDebugSettings(): DebugSettings {
  if (!DEBUG) return DEFAULTS;
  return { ...DEFAULTS, ...(loadJson<Partial<DebugSettings>>(KEY) ?? {}) };
}

export function saveDebugSettings(s: DebugSettings): void {
  if (DEBUG) saveJson(KEY, s);
}

export async function runPipeline(params: { game: string; date: string; hero?: string; refresh?: boolean; mode: string }) {
  const q = new URLSearchParams({ game: params.game, date: params.date, mode: params.mode });
  if (params.hero) q.set('hero', params.hero);
  if (params.refresh) q.set('refresh', '1');
  const res = await fetch(`/__debug/pipeline?${q}`, { method: 'POST' });
  return (await res.json()) as { ok: boolean; log: string };
}
