
import { useApp } from './useApp';
import { en } from '../locales/en';
import { ar } from '../locales/ar';
import { ru } from '../locales/ru';
import { fr } from '../locales/fr';
import { uz } from '../locales/uz';
import { zh } from '../locales/zh';

export type TranslationKey = keyof typeof en;

const translations: Record<string, typeof en> = {
  en,
  ar: ar as typeof en,
  ru: ru as typeof en,
  fr: fr as typeof en,
  uz: uz as typeof en,
  zh: zh as typeof en
};

export const useTranslation = (): typeof en => {
  const { language } = useApp();
  const current = translations[language] || translations.en;

  return new Proxy(current, {
    get(target, prop: string) {
      if (prop in target && (target as any)[prop] !== undefined && (target as any)[prop] !== '') {
        return (target as any)[prop];
      }
      return (translations.en as any)[prop] || '';
    }
  });
};

