import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadJson, saveJson } from '../shared/storage';
import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';

// To add a language: create locales/<code>.json, register it here, and add the
// code to LANGUAGES in pipeline/dleadlock_pipeline/config.py for item names.
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (BR)' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const KEY = 'language';

function detect(): LanguageCode {
  const saved = loadJson<string>(KEY);
  if (saved && LANGUAGES.some((l) => l.code === saved)) return saved as LanguageCode;
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, 'pt-BR': { translation: ptBR } },
  lng: detect(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  saveJson(KEY, lng);
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language;

export default i18n;
