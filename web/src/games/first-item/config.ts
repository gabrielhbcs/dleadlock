// A first-item game is "guess the item the hero of the day buys first in each
// tier". Descent rewards the rarest answers, Ascent the most common ones; the
// engine is shared and each game is just one of these configs.
//
// Translations: shared texts live under "firstItem.*", game-specific texts
// under "<id>.*" (rules, layer names, tutorial steps, result titles).

export interface FirstItemConfig {
  id: 'descent' | 'ascent';
  /** "down": the background starts at the top and sinks; "up": the reverse. */
  direction: 'down' | 'up';
  /** Emoji per tier in the shareable result. */
  tierEmoji: Record<number, string>;
  /** Name in the shareable result (kept in English on purpose). */
  shareName: string;
}

export const DESCENT: FirstItemConfig = {
  id: 'descent',
  direction: 'down',
  tierEmoji: { 1: '🏙️', 2: '🚇', 3: '🕯️', 4: '👻' },
  shareName: 'Descent',
};

export const ASCENT: FirstItemConfig = {
  id: 'ascent',
  direction: 'up',
  tierEmoji: { 1: '🕯️', 2: '🚇', 3: '🏙️', 4: '🌆' },
  shareName: 'Ascent',
};

export const MODE = 'ascendant-plus';

export const tutorialSeenKey = (c: FirstItemConfig) => `${c.id}:tutorial-seen`;
