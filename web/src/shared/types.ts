// Mirrors pipeline/dleadlock_pipeline/models.py. Keep both in sync.

export type LocalizedNames = Record<string, string>;

export interface Hero {
  id: number;
  names: LocalizedNames;
  image: string | null;
}

export interface Item {
  id: number;
  tier: number;
  names: LocalizedNames;
  image: string | null;
}

export interface StaticData {
  version: number;
  generated_at: string;
  heroes: Hero[];
  items: Item[];
}

export type BandId = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

export interface Band {
  id: BandId;
}

export interface TierItem {
  id: number;
  count: number;
  share: number;
  rank: number; // 1 = best answer; tied counts share a rank
  band: BandId;
  points: number; // from the rank, before the bonus
}

export interface TierResult {
  tier: number;
  total: number;
  items: TierItem[]; // best answer first
}

export interface FirstItemPuzzle {
  game: 'descent' | 'ascent';
  version: number;
  order: 'rarest' | 'common';
  date: string;
  mode: string;
  hero_id: number;
  window_start: string;
  window_end: string;
  bands: Band[];
  bonus_count: number;
  bonus_points: number;
  guesses_per_tier: number;
  tiers: TierResult[];
}

export interface PuzzleIndex {
  mode: string;
  dates: string[];
}
