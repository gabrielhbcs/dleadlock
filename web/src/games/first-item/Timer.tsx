import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Countdown that restarts whenever `resetKey` changes. */
export function Timer({ seconds, resetKey, onExpire }: { seconds: number; resetKey: unknown; onExpire: () => void }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(seconds);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    const end = Date.now() + seconds * 1000;
    setLeft(seconds);
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        window.clearInterval(id);
        expire.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [seconds, resetKey]);

  return (
    <div className={`timer ${left <= 5 ? 'low' : ''}`}>
      <div className="timer-bar" style={{ width: `${(left / seconds) * 100}%` }} />
      <span>{t('firstItem.timeLeft', { s: left })}</span>
    </div>
  );
}
