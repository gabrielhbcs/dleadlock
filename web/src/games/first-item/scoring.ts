import type { BandId, FirstItemPuzzle, TierItem } from '../../shared/types';
import type { FirstItemConfig } from './config';

export type MissReason = 'timeout' | 'wrong-tier' | 'never';

export interface Guess {
  tier: number;
  itemId: number | null; // null = time ran out
  points: number;
  band: BandId | null; // null = scored 0 (see `miss`)
  rank: number | null;
  share: number | null;
  bonus: boolean;
  miss?: MissReason | null; // optional: guesses saved before this field existed
  itemTier?: number; // the guessed item's real tier
}

export const TIMER_SECONDS = 30;

export function totalGuesses(p: FirstItemPuzzle): number {
  return p.tiers.length * p.guesses_per_tier;
}

export function tierForStep(p: FirstItemPuzzle, step: number): number {
  return p.tiers[Math.floor(step / p.guesses_per_tier)]?.tier ?? p.tiers[p.tiers.length - 1].tier;
}

function itemPoints(p: FirstItemPuzzle, item: TierItem): { points: number; bonus: boolean } {
  const bonus = item.rank <= p.bonus_count;
  return { points: item.points + (bonus ? p.bonus_points : 0), bonus };
}

/** Player-matches of the hero in the window (every match buys some T1 item). */
export function matchesAnalyzed(p: FirstItemPuzzle): number {
  return Math.max(0, ...p.tiers.map((t) => t.total));
}

export function evaluate(p: FirstItemPuzzle, tier: number, itemId: number | null, itemTier?: number): Guess {
  const zero = { tier, itemId, points: 0, band: null, rank: null, share: null, bonus: false, itemTier };
  if (itemId == null) return { ...zero, miss: 'timeout' };
  if (itemTier != null && itemTier !== tier) return { ...zero, miss: 'wrong-tier' };
  const entry = p.tiers.find((t) => t.tier === tier)?.items.find((i) => i.id === itemId);
  if (!entry) return { ...zero, miss: 'never' };
  const { points, bonus } = itemPoints(p, entry);
  return { tier, itemId, points, band: entry.band, rank: entry.rank, share: entry.share, bonus, miss: null, itemTier };
}

export function missReason(g: Guess): MissReason | null {
  if (g.band) return null;
  return g.miss ?? (g.itemId == null ? 'timeout' : 'never');
}

/** Best possible score: the top-scoring distinct items of every tier. */
export function maxScore(p: FirstItemPuzzle): number {
  return p.tiers.reduce((sum, t) => {
    const best = t.items
      .map((i) => itemPoints(p, i).points)
      .sort((a, b) => b - a)
      .slice(0, p.guesses_per_tier);
    return sum + best.reduce((a, b) => a + b, 0);
  }, 0);
}

/** Distance in meters shown to the player (cosmetic). */
export const MAX_DISTANCE_M = 666;

export function distanceFor(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * MAX_DISTANCE_M) : 0;
}

/** 0..5 title index from the share of the max score. */
export function rankIndex(score: number, max: number): number {
  const r = max > 0 ? score / max : 0;
  return [0.05, 0.2, 0.35, 0.5, 0.7].filter((x) => r >= x).length;
}

const BAND_EMOJI: Record<BandId, string> = {
  legendary: '🟧',
  epic: '🟪',
  rare: '🟦',
  uncommon: '🟩',
  common: '⬜',
};

export function shareText(c: FirstItemConfig, p: FirstItemPuzzle, guesses: Guess[], heroName: string, distance: number): string {
  const lines = p.tiers.map((t) => {
    const cells = guesses.filter((g) => g.tier === t.tier).map((g) => (g.band ? BAND_EMOJI[g.band] : '⬛'));
    return `${c.tierEmoji[t.tier] ?? `T${t.tier}`} ${cells.join('')}`;
  });
  const arrow = c.direction === 'down' ? '⬇' : '⬆';
  return [`dleadlock · ${c.shareName} ${p.date}`, `${heroName} — ${distance} m ${arrow}`, ...lines].join('\n');
}
