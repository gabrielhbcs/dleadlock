import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FirstItemPuzzle } from '../../shared/types';
import type { FirstItemConfig } from './config';
import { TIMER_SECONDS } from './scoring';

interface Props {
  config: FirstItemConfig;
  puzzle: FirstItemPuzzle;
  heroName: string;
  timer: boolean;
  onClose: () => void;
  /** Main button. Defaults to the game's "start" label, which just closes. */
  actionLabel?: string;
  onAction?: () => void;
}

export function HowToPlay({ config, puzzle, heroName, timer, onClose, actionLabel, onAction }: Props) {
  const { t } = useTranslation();
  const g = config.id;
  const all = puzzle.tiers.flatMap((x) => x.items.map((i) => i.points));
  const pointRange = { max: Math.max(0, ...all), min: all.length ? Math.min(...all) : 0 };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label={t('firstItem.howTo.close')}>
          ×
        </button>
        <h2 id="howto-title">
          {t('firstItem.howTo.title')} · {t(`games.${g}.name`)}
        </h2>

        <ol className="howto-steps">
          <li>{t('firstItem.howTo.step1', { hero: heroName })}</li>
          <li>{t(`${g}.howTo.step2`, { n: puzzle.guesses_per_tier })}</li>
          <li>
            {t(`${g}.howTo.step3`)} {t('firstItem.howTo.typing')}
          </li>
          <li>
            {t(`${g}.howTo.step4`, { max: pointRange.max, min: pointRange.min })}
            <div className="howto-legend">
              {puzzle.bands.map((b) => (
                <span key={b.id} className={`legend-chip band-${b.id}`}>
                  {t(`firstItem.band.${b.id}`)}
                </span>
              ))}
            </div>
            <table className="howto-bands">
              <tbody>
                <tr className="band-legendary">
                  <td>{t(`${g}.howTo.topRow`)}</td>
                  <td>+{pointRange.max}</td>
                </tr>
                <tr className="band-common">
                  <td>{t(`${g}.howTo.bottomRow`)}</td>
                  <td>+{pointRange.min}</td>
                </tr>
                <tr className="band-legendary">
                  <td>{t(`${g}.howTo.bonusRow`, { n: puzzle.bonus_count })}</td>
                  <td>+{puzzle.bonus_points}</td>
                </tr>
                <tr className="band-none">
                  <td>{t('firstItem.howTo.zeroRow')}</td>
                  <td>0</td>
                </tr>
              </tbody>
            </table>
          </li>
          {timer && <li>{t('firstItem.howTo.step5', { s: TIMER_SECONDS })}</li>}
          <li>{t(`${g}.howTo.step6`)}</li>
        </ol>

        <p className="howto-example">{t(`${g}.howTo.example`)}</p>
        <div className="modal-actions">
          <button className="button" onClick={onAction ?? onClose}>
            {actionLabel ?? t(`${g}.howTo.start`)}
          </button>
        </div>
      </div>
    </div>
  );
}
