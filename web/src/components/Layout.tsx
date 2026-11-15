import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { GAMES } from '../games/registry';
import { LANGUAGES } from '../i18n';

export function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  // Browser tab title: "Dleadlock" on the hub, "<Game> · Dleadlock" in a game.
  useEffect(() => {
    const game = GAMES.find((g) => pathname === `/${g.id}`);
    document.title = game ? `${t(`games.${game.id}.name`)} · Dleadlock` : 'Dleadlock';
  }, [pathname, t, i18n.language]);

  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="logo">
          dleadlock
        </Link>
        {pathname !== '/' && (
          <Link to="/" className="back-link" aria-label={t('site.back')}>
            ← <span className="back-text">{t('site.back')}</span>
          </Link>
        )}
        <label className="lang-select">
          <span className="sr-only">{t('site.language')}</span>
          <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">{t('site.disclaimer')}</footer>
    </div>
  );
}
