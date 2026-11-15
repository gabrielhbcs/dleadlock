import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GAMES } from '../games/registry';

export function Hub() {
  const { t } = useTranslation();
  const [introFor, setIntroFor] = useState<string | null>(null);
  const Intro = GAMES.find((g) => g.id === introFor)?.intro;

  return (
    <div className="hub">
      <h1 className="hub-title">dleadlock</h1>
      <p className="hub-tagline">{t('site.tagline')}</p>
      <ul className="game-list">
        {GAMES.map((g) => (
          <li key={g.id} className={`game-card ${g.status}`}>
            <h2>{t(`games.${g.id}.name`)}</h2>
            <p>{t(`games.${g.id}.description`)}</p>
            {g.status !== 'live' ? (
              <span className="badge">{t('site.comingSoon')}</span>
            ) : g.intro ? (
              <button className="button" onClick={() => setIntroFor(g.id)}>
                {t('site.play')}
              </button>
            ) : (
              <Link to={`/${g.id}`} className="button">
                {t('site.play')}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {Intro && (
        <Suspense fallback={null}>
          <Intro onClose={() => setIntroFor(null)} />
        </Suspense>
      )}
    </div>
  );
}
