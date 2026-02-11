
import React from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { supabase } from '../lib/supabaseClient';

const Header: React.FC = () => {
  const { user, setPage } = useApp();
  const t = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage('home');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => setPage('home')} className="flex items-center">
               <img src="https://res.cloudinary.com/di7okmjsx/image/upload/v1769972834/alibaanahlogo_gw0pef.png" alt={t.brand} className="h-12" />
            </button>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <nav className="hidden md:flex space-x-1 rtl:space-x-reverse">
              <button onClick={() => setPage('home')} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">{t.home}</button>
              {user && (
                <button onClick={() => setPage('dashboard')} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">{t.dashboard}</button>
              )}
            </nav>
            <LanguageSwitcher />
            {user ? (
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                {t.logout}
              </button>
            ) : (
              <button onClick={() => setPage('auth')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                {t.login}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
