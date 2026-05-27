import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslations from './locales/es/translation.json';
import enTranslations from './locales/en/translation.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations }
};

export const getSystemLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.toLowerCase().includes('es') ? 'es' : 'en';
};

export const getAppLanguage = () => {
  const savedPreference = localStorage.getItem('appLanguagePreference');
  if (savedPreference && savedPreference !== 'default') {
    return savedPreference;
  }
  return getSystemLanguage();
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getAppLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
