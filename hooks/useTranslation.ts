
import { useApp } from './useApp';
import { en } from '../locales/en';
import { ar } from '../locales/ar';
import { ru } from '../locales/ru';
import { fr } from '../locales/fr';
import { uz } from '../locales/uz';
import { zh } from '../locales/zh';

const translations = { en, ar, ru, fr, uz, zh };

export const useTranslation = () => {
  const { language } = useApp();
  return translations[language];
};
