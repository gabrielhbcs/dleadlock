import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localName } from '../../shared/data';
import { normalize } from '../../shared/text';
import type { Item } from '../../shared/types';

interface Props {
  items: Item[]; // every item; items of other tiers can be picked but score 0
  currentTier: number;
  excluded: Set<number>; // already guessed in this tier
  onGuess: (itemId: number) => void;
  disabled?: boolean;
}

const MAX_SUGGESTIONS = 8;

/** Free-text input with autocomplete. Matches the item name in the current
 * language and always in English too. */
export function GuessInput({ items, currentTier, excluded, onGuess, disabled }: Props) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, items]);

  const suggestions = useMemo(() => {
    let q = normalize(query);
    if (!q) return [];
    // "t2" lists every T2 item; "t2 mys" filters them by name too.
    const tierMatch = /^t(\d)(?:\s+(.*))?$/.exec(q);
    const tierFilter = tierMatch ? Number(tierMatch[1]) : null;
    if (tierMatch) q = tierMatch[2] ?? '';
    return items
      .filter((it) => !excluded.has(it.id) && (tierFilter == null || it.tier === tierFilter))
      .map((it) => {
        const local = normalize(localName(it.names, i18n.language));
        const en = normalize(it.names.en ?? '');
        const score = !q || local.startsWith(q) || en.startsWith(q) ? 0 : local.includes(q) || en.includes(q) ? 1 : -1;
        return { it, score, otherTier: it.tier === currentTier ? 0 : 1 };
      })
      .filter((x) => x.score >= 0)
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.otherTier - b.otherTier ||
          localName(a.it.names, i18n.language).localeCompare(localName(b.it.names, i18n.language)),
      )
      .slice(0, tierFilter == null ? MAX_SUGGESTIONS : undefined)
      .map((x) => x.it);
  }, [query, items, currentTier, excluded, i18n.language]);

  useEffect(() => setActive(0), [query]);

  // Keep the keyboard selection visible in long lists (e.g. "t3").
  useEffect(() => {
    listRef.current?.querySelector('li.active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function pick(item: Item | undefined) {
    if (!item || disabled) return;
    onGuess(item.id);
    setQuery('');
  }

  return (
    <div className="guess-input">
      <input
        ref={inputRef}
        value={query}
        disabled={disabled}
        placeholder={t('firstItem.placeholder')}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(suggestions[active]);
          }
        }}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
      />
      {query && (
        <ul ref={listRef} className="suggestions" role="listbox">
          {suggestions.length === 0 && <li className="empty">{t('firstItem.noMatch')}</li>}
          {suggestions.map((it, i) => {
            const local = localName(it.names, i18n.language);
            const en = it.names.en;
            return (
              <li
                key={it.id}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : ''}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(it);
                }}
              >
                {it.image && <img src={it.image} alt="" />}
                <span className="sugg-name">{local}</span>
                <small className={it.tier === currentTier ? '' : 'other-tier'}>
                  {en && en !== local ? `${en} ` : ''}(T{it.tier})
                </small>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
