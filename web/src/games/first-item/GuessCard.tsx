import { useTranslation } from 'react-i18next';
import { localName } from '../../shared/data';
import type { Item } from '../../shared/types';
import type { FirstItemConfig } from './config';
import { missReason, type Guess } from './scoring';

export function formatPct(share: number, lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: share < 0.01 ? 2 : 1 }).format(share);
}

interface Props {
  config: FirstItemConfig;
  guess: Guess;
  item: Item | undefined;
  bonusCount: number;
}

export function GuessCard({ config, guess, item, bonusCount }: Props) {
  const { t, i18n } = useTranslation();

  function missText() {
    switch (missReason(guess)) {
      case 'wrong-tier':
        return t('firstItem.wrongTier', { itemTier: guess.itemTier ?? item?.tier, tier: guess.tier });
      case 'never':
        return t('firstItem.never');
      default:
        return '';
    }
  }

  const name =
    guess.itemId == null ? t('firstItem.timeout') : item ? localName(item.names, i18n.language) : `#${guess.itemId}`;
  return (
    <li className={`guess-card band-${guess.band ?? 'none'}`}>
      {item?.image ? <img src={item.image} alt="" /> : <div className="img-placeholder" />}
      <div className="guess-info">
        <strong>{name}</strong>
        <span className="guess-detail">
          {guess.band ? t(`firstItem.band.${guess.band}`) : missText()}
          {guess.share != null && ` · ${t('firstItem.share', { pct: formatPct(guess.share, i18n.language) })}`}
        </span>
        {guess.bonus && <span className="bonus">{t(`${config.id}.bonus`, { n: bonusCount })}</span>}
      </div>
      <span className={`guess-points ${guess.points === 0 ? 'zero' : ''}`}>+{guess.points}</span>
    </li>
  );
}
