import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { localName } from '../../shared/data';
import { localToday } from '../../shared/date';
import { DEBUG, loadDebugSettings, saveDebugSettings, type DebugSettings } from '../../shared/debug';
import { loadJson, removeKey, saveJson } from '../../shared/storage';
import type { FirstItemPuzzle, Item } from '../../shared/types';
import { MODE, tutorialSeenKey, type FirstItemConfig } from './config';
import { DebugPanel } from './DebugPanel';
import { GuessCard } from './GuessCard';
import { GuessInput } from './GuessInput';
import { HowToPlay } from './HowToPlay';
import { Parallax } from './Parallax';
import { Results } from './Results';
import {
  distanceFor,
  evaluate,
  matchesAnalyzed,
  maxScore,
  TIMER_SECONDS,
  tierForStep,
  totalGuesses,
  type Guess,
} from './scoring';
import { Timer } from './Timer';
import { usePuzzle } from './usePuzzle';
import './first-item.css';

// Includes the hero so a rebuilt puzzle (debug) never mixes with old guesses.
const storageKey = (p: FirstItemPuzzle) => `${p.game}:${p.mode}:${p.date}:${p.hero_id}`;

export function FirstItemGame({ config }: { config: FirstItemConfig }) {
  const { t, i18n } = useTranslation();
  const [debug, setDebug] = useState<DebugSettings>(loadDebugSettings);
  const today = localToday();
  const date = debug.dateOverride ?? today;
  const { state, reload } = usePuzzle(config.id, date);

  const updateDebug = (s: DebugSettings) => {
    setDebug(s);
    saveDebugSettings(s);
  };

  if (state.status === 'loading') return <p className="center muted">{t('firstItem.loading')}</p>;
  if (state.status === 'error') return <p className="center">{t('firstItem.error', { message: state.message })}</p>;
  if (state.status === 'missing') return <p className="center">{t('firstItem.noPuzzle', { date: state.date })}</p>;

  const hero = state.static.heroes.find((h) => h.id === state.puzzle.hero_id);
  return (
    <Board
      key={storageKey(state.puzzle)}
      config={config}
      puzzle={state.puzzle}
      items={state.static.items}
      heroName={hero ? localName(hero.names, i18n.language) : `#${state.puzzle.hero_id}`}
      heroImage={hero?.image ?? null}
      fallbackNotice={state.fallbackFrom ? t('firstItem.showingLatest', { date: state.puzzle.date }) : null}
      debug={debug}
      debugPanel={(onReset) =>
        DEBUG && (
          <DebugPanel
            game={config.id}
            settings={debug}
            onChange={updateDebug}
            dates={state.index?.dates ?? []}
            today={today}
            currentDate={date}
            mode={MODE}
            onReset={onReset}
            onRebuilt={reload}
          />
        )
      }
    />
  );
}

interface BoardProps {
  config: FirstItemConfig;
  puzzle: FirstItemPuzzle;
  items: Item[];
  heroName: string;
  heroImage: string | null;
  fallbackNotice: string | null;
  debug: DebugSettings;
  debugPanel: (onReset: () => void) => ReactNode;
}

function Board({ config, puzzle, items, heroName, heroImage, fallbackNotice, debug, debugPanel }: BoardProps) {
  const { t, i18n } = useTranslation();
  const g = config.id;
  const key = storageKey(puzzle);
  const [guesses, setGuesses] = useState<Guess[]>(() => loadJson<Guess[]>(key) ?? []);

  useEffect(() => saveJson(key, guesses), [key, guesses]);

  // "intro": shown before the first guess to players who never saw it (e.g. a
  // direct link); the timer has not started yet. "ingame": opened from the
  // button; it does not stop or reset the timer.
  const [help, setHelp] = useState<'intro' | 'ingame' | null>(() =>
    !loadJson<boolean>(tutorialSeenKey(config)) && guesses.length === 0 ? 'intro' : null,
  );
  const closeHelp = useCallback(() => {
    setHelp(null);
    saveJson(tutorialSeenKey(config), true);
  }, [config]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const total = totalGuesses(puzzle);
  const step = guesses.length;
  const finished = step >= total;
  const tier = tierForStep(puzzle, step);
  const excluded = useMemo(
    () => new Set(guesses.filter((x) => x.tier === tier && x.itemId != null).map((x) => x.itemId!)),
    [guesses, tier],
  );

  const max = useMemo(() => maxScore(puzzle), [puzzle]);
  const score = guesses.reduce((s, x) => s + x.points, 0);
  const distance = distanceFor(score, max);
  const progress = max ? score / max : 0;
  // Descent sinks from the sky; Ascent starts deep and climbs back up.
  const depth = config.direction === 'down' ? progress : 1 - progress;

  // Side glow after each guess, colored by the band of the answer (red for 0).
  const [flash, setFlash] = useState<{ id: number; band: string } | null>(null);

  const guess = useCallback(
    (itemId: number | null) => {
      setGuesses((prev) => {
        if (prev.length >= total) return prev;
        const itemTier = itemId != null ? itemById.get(itemId)?.tier : undefined;
        const x = evaluate(puzzle, tierForStep(puzzle, prev.length), itemId, itemTier);
        setFlash({ id: prev.length + 1, band: x.band ?? 'miss' });
        return [...prev, x];
      });
    },
    [puzzle, total, itemById],
  );

  const reset = () => {
    removeKey(key);
    setGuesses([]);
  };

  const answers = puzzle.tiers.find((x) => x.tier === tier)?.items.slice(0, 5) ?? [];

  return (
    <div className={`first-item ${config.id}`}>
      <Parallax depth={depth} />
      {flash && <div key={flash.id} className={`guess-flash flash-${flash.band}`} aria-hidden="true" />}

      <div className="first-item-content">
        {fallbackNotice && <p className="notice">{fallbackNotice}</p>}

        <section className="panel hero-panel">
          <div className="hero-main">
            {heroImage && <img src={heroImage} alt="" className="hero-img" />}
            <div className="hero-title">
              <span className="eyebrow">
                {t(`games.${g}.name`)} · {t('firstItem.heroOfTheDay')}
              </span>
              <h1>{heroName}</h1>
            </div>
            <div className="score-box">
              <div className="score-line">
                <strong>{score}</strong>
                <span>{t('firstItem.souls')}</span>
              </div>
              <small>{t(`${g}.distance`, { m: distance })}</small>
            </div>
          </div>
          <div className="hero-footer">
            <ul className="meta-chips">
              <li>{t('firstItem.modeAscendant')}</li>
              <li>{t('firstItem.window')}</li>
              <li>{t('firstItem.matches', { n: new Intl.NumberFormat(i18n.language).format(matchesAnalyzed(puzzle)) })}</li>
            </ul>
            <button className="howto-button" onClick={() => setHelp('ingame')}>
              {t('firstItem.howTo.button')}
            </button>
          </div>
        </section>

        {!finished && (
          <section className="panel play-panel">
            <div className="tier-head">
              <h2>
                {t('firstItem.tier', { tier })} · {t(`${g}.layer.${tier}`)}
              </h2>
              <span className="muted">{t('firstItem.guessOf', { n: step + 1, total })}</span>
            </div>
            {step === 0 && <p className="rules">{t(`${g}.rules`)}</p>}
            {debug.timer && help !== 'intro' && (
              <Timer seconds={TIMER_SECONDS} resetKey={step} onExpire={() => guess(null)} />
            )}
            <GuessInput
              items={items}
              currentTier={tier}
              excluded={excluded}
              onGuess={(id) => guess(id)}
              disabled={help === 'intro'}
            />
            {debug.showAnswers && (
              <p className="debug-answers">
                {answers.map((a) => `${itemById.get(a.id)?.names.en ?? a.id} (${a.band}, ${a.count})`).join(' · ')}
              </p>
            )}
          </section>
        )}

        {guesses.length > 0 && (
          <section className="panel">
            <ul className="guess-list">
              {[...guesses].reverse().map((x, i) => (
                <GuessCard
                  key={guesses.length - i}
                  config={config}
                  guess={x}
                  item={x.itemId != null ? itemById.get(x.itemId) : undefined}
                  bonusCount={puzzle.bonus_count}
                />
              ))}
            </ul>
          </section>
        )}

        {finished && (
          <Results
            config={config}
            puzzle={puzzle}
            guesses={guesses}
            items={itemById}
            heroName={heroName}
            score={score}
            max={max}
            distance={distance}
          />
        )}
      </div>

      {help && (
        <HowToPlay config={config} puzzle={puzzle} heroName={heroName} timer={debug.timer} onClose={closeHelp} />
      )}

      {debugPanel(reset)}
    </div>
  );
}
