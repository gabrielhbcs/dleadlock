import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface GameIntroProps {
  onClose: () => void;
}

// Every game on the site is registered here. The hub lists them and the router
// mounts each playable one at /<id>. To add a game, create src/games/<id>/ and
// add an entry below (translations go under "games.<id>" in the locale files).
// `intro` is the "how to play" modal the hub opens before starting the game.
export interface GameEntry {
  id: string;
  status: 'live' | 'soon';
  component?: LazyExoticComponent<ComponentType>;
  intro?: LazyExoticComponent<ComponentType<GameIntroProps>>;
}

export const GAMES: GameEntry[] = [
  {
    id: 'descent',
    status: 'live',
    component: lazy(() => import('./descent')),
    intro: lazy(() => import('./descent/Intro')),
  },
  {
    id: 'ascent',
    status: 'live',
    component: lazy(() => import('./ascent')),
    intro: lazy(() => import('./ascent/Intro')),
  },
];
