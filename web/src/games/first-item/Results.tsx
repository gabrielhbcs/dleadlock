import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localName } from '../../shared/data';
import type { FirstItemPuzzle, Item } from '../../shared/types';
import type { FirstItemConfig } from './config';
import { formatPct } from './GuessCard';
import { rankIndex, shareText, type Guess } from './scoring';

interface Props {
  config: FirstItemConfig;
  puzzle: FirstItemPuzzle;
  guesses: Guess[];
  items: Map<number, Item>;
  heroName: string;
  score: number;
  max: number;
  distance: number;
}

export function Results({ config, puzzle, guesses, items, heroName, score, max, distance }: Props) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const g = config.id;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText(config, puzzle, guesses, heroName, distance));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section className="results panel">
      <h2>{t(`${g}.results.title`, { m: distance })}</h2>
      <p className="results-rank">{t(`${g}.results.rank.${rankIndex(score, max)}`)}</p>
      <p className="results-total">{t('firstItem.results.total', { souls: score })}</p>
      <button className="button" onClick={copy}>
        {copied ? t('firstItem.results.copied') : t('firstItem.results.copy')}
      </button>

      <h3>{t(`${g}.results.answers`)}</h3>
      <div className="answers">
        {puzzle.tiers.map((tier) => {
          const name = (id: number) => {
            const it = items.get(id);
            return it ? localName(it.names, i18n.language) : `#${id}`;
          };
          const guessed = (id: number) => guesses.some((x) => x.tier === tier.tier && x.itemId === id);
          // Items of the tier that nobody bought first (they score 0), after the ranking.
          const listed = new Set(tier.items.map((ti) => ti.id));
          const never = [...items.values()]
            .filter((it) => it.tier === tier.tier && !listed.has(it.id))
            .sort((a, b) => name(a.id).localeCompare(name(b.id), i18n.language));
          return (
            <div key={tier.tier} className="answer-tier">
              <h4>
                {t('firstItem.tier', { tier: tier.tier })} · {t(`${g}.layer.${tier.tier}`)}
              </h4>
              <ol tabIndex={0}>
                {tier.items.map((ti) => {
                  const image = items.get(ti.id)?.image;
                  return (
                    <li key={ti.id} className={`band-${ti.band} ${guessed(ti.id) ? 'guessed' : ''}`}>
                      <span className="answer-rank">{ti.rank}</span>
                      {image && <img src={image} alt="" />}
                      <span className="answer-name">{name(ti.id)}</span>
                      <small>{formatPct(ti.share, i18n.language)}</small>
                    </li>
                  );
                })}
                {never.map((it) => (
                  <li key={it.id} className={`never ${guessed(it.id) ? 'guessed' : ''}`} title={t('firstItem.never')}>
                    <span className="answer-rank">–</span>
                    {it.image && <img src={it.image} alt="" />}
                    <span className="answer-name">{name(it.id)}</span>
                    <small>0%</small>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <p className="muted">{t('firstItem.results.comeBack')}</p>
    </section>
  );
}
