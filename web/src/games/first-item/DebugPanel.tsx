import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { runPipeline, type DebugSettings } from '../../shared/debug';

interface Props {
  game: string;
  settings: DebugSettings;
  onChange: (s: DebugSettings) => void;
  dates: string[];
  today: string;
  currentDate: string;
  mode: string;
  onReset: () => void;
  onRebuilt: () => void;
}

/** Only rendered in `npm run dev:debug`. */
export function DebugPanel({ game, settings, onChange, dates, today, currentDate, mode, onReset, onRebuilt }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [hero, setHero] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [log, setLog] = useState('');

  async function rebuild() {
    setStatus(t('debug.running'));
    setLog('');
    try {
      const r = await runPipeline({ game, date: currentDate, hero: hero || undefined, refresh, mode });
      setStatus(r.ok ? t('debug.done') : t('debug.failed'));
      setLog(r.log);
      if (r.ok) onRebuilt();
    } catch (e) {
      setStatus(t('debug.failed'));
      setLog(String(e));
    }
  }

  const allDates = Array.from(new Set([...dates, today])).sort();

  return (
    <aside className={`debug-panel ${open ? 'open' : ''}`}>
      <button className="debug-toggle" onClick={() => setOpen(!open)}>
        {t('debug.title')}
      </button>
      {open && (
        <div className="debug-body">
          <label>
            <input type="checkbox" checked={settings.timer} onChange={(e) => onChange({ ...settings, timer: e.target.checked })} />
            {t('debug.timer')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.showAnswers}
              onChange={(e) => onChange({ ...settings, showAnswers: e.target.checked })}
            />
            {t('debug.showAnswers')}
          </label>
          <label>
            {t('debug.date')}
            <select
              value={settings.dateOverride ?? today}
              onChange={(e) => onChange({ ...settings, dateOverride: e.target.value === today ? null : e.target.value })}
            >
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                  {d === today ? ` (${t('debug.today')})` : ''}
                </option>
              ))}
            </select>
          </label>
          <button onClick={onReset}>{t('debug.reset')}</button>
          <hr />
          <label>
            {t('debug.hero')}
            <input value={hero} onChange={(e) => setHero(e.target.value.replace(/\D/g, ''))} size={6} />
          </label>
          <label>
            <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} />
            {t('debug.refresh')}
          </label>
          <button onClick={rebuild}>
            {t('debug.rebuild')} ({currentDate})
          </button>
          {status && <p className="debug-status">{status}</p>}
          {log && <pre className="debug-log">{log}</pre>}
        </div>
      )}
    </aside>
  );
}
