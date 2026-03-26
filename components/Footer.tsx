
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';

const Footer: React.FC = () => {
  const t = useTranslation();
  const { setPage, cmsContent } = useApp();
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <img src={cmsContent.logoUrl} alt={t.brand} className="h-12 object-contain" />
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} {t.brand}. All rights reserved.</p>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button onClick={() => setPage('support')} className="hover:text-brand-600 dark:hover:text-brand-400 font-medium">
                {t.support}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
