
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconBuilding } from '../components/Icon';

const SupportPage: React.FC = () => {
  const t = useTranslation();
  const { setPage } = useApp();

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
        <IconBuilding className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{t.supportTitle}</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t.supportSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6">{t.contactUs}</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">{t.contactEmail}</h3>
              <a href="mailto:support@alibaanah.com" className="text-blue-600 dark:text-blue-400 text-lg hover:underline">
                support@alibaanah.com
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">{t.contactPhone}</h3>
              <p className="text-gray-900 dark:text-white text-lg">+20 123 456 7890</p>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900/30 flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-bold mb-3 text-blue-800 dark:text-blue-200">{t.visitFAQ}</h2>
          <p className="text-blue-700 dark:text-blue-300 mb-6">{t.visitFAQDescription}</p>
          <button 
            onClick={() => setPage('home')}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all shadow-md"
          >
            Go to FAQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
