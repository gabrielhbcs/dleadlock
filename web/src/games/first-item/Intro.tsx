import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { localName } from '../../shared/data';
import { localToday } from '../../shared/date';
import { loadDebugSettings } from '../../shared/debug';
import { saveJson } from '../../shared/storage';
import { tutorialSeenKey, type FirstItemConfig } from './config';
import { HowToPlay } from './HowToPlay';
import { usePuzzle } from './usePuzzle';
import './first-item.css';

/** "How to play" opened from the hub; its main button starts the game. */
export function FirstItemIntro({ config, onClose }: { config: FirstItemConfig; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const debug = loadDebugSettings();
  const { state } = usePuzzle(config.id, debug.dateOverride ?? localToday());

  const play = () => {
    saveJson(tutorialSeenKey(config), true);
    navigate(`/${config.id}`);
  };

  if (state.status !== 'ready') {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal panel" onClick={(e) => e.stopPropagation()}>
          <p className="muted">
            {state.status === 'loading' ? t('firstItem.loading') : t('firstItem.noPuzzleShort')}
          </p>
          <div className="modal-actions">
            <button className="button" onClick={play}>
              {t('site.play')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hero = state.static.heroes.find((h) => h.id === state.puzzle.hero_id);
  return (
    <HowToPlay
      config={config}
      puzzle={state.puzzle}
      heroName={hero ? localName(hero.names, i18n.language) : `#${state.puzzle.hero_id}`}
      timer={debug.timer}
      onClose={onClose}
      actionLabel={t('site.play')}
      onAction={play}
    />
  );
}
