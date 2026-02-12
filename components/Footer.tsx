
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';

const Footer: React.FC = () => {
  const t = useTranslation();
  const { setPage } = useApp();
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex justify-center items-center space-x-4">
            <p>&copy; {new Date().getFullYear()} {t.brand}. All rights reserved.</p>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button onClick={() => setPage('support')} className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                {t.support}
            </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
