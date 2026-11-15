import type { StaticData } from './types';

const BASE = import.meta.env.BASE_URL;

export async function fetchJson<T>(path: string, bustCache = false): Promise<T> {
  const url = `${BASE}data/${path}${bustCache ? `?t=${Date.now()}` : ''}`;
  const res = await fetch(url, { cache: bustCache ? 'no-store' : 'default' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

let staticPromise: Promise<StaticData> | null = null;

export function loadStatic(): Promise<StaticData> {
  staticPromise ??= fetchJson<StaticData>('static.json');
  return staticPromise;
}

export function localName(names: Record<string, string>, lang: string): string {
  return names[lang] ?? names.en ?? Object.values(names)[0] ?? '?';
}
