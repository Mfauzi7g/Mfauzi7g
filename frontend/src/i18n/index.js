import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import frTranslation from './locales/fr.json';
import esTranslation from './locales/es.json';
import nlTranslation from './locales/nl.json';

const resources = {
  en: { translation: enTranslation },
  ar: { translation: arTranslation },
  fr: { translation: frTranslation },
  es: { translation: esTranslation },
  nl: { translation: nlTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;