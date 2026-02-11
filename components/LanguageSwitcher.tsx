
import React from 'react';
import { useApp } from '../hooks/useApp';
import { Language } from '../types';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useApp();

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
    { code: 'ru', label: 'RU' },
    { code: 'fr', label: 'FR' },
    { code: 'uz', label: 'UZ' },
    { code: 'zh', label: 'ZH' },
  ];

  return (
    <div className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-200 dark:bg-gray-700 rounded-full p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
            language === lang.code
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
