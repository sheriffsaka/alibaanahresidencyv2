
import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { supabase } from '../lib/supabaseClient';
import { IconClose } from './Icon';

const Header: React.FC = () => {
  const { user, setPage, cmsContent, logout } = useApp();
  const t = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      alert(`Logout failed: ${error.message}`);
    }
  };

  const navigate = (page: any) => {
    setPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => navigate('home')} className="flex items-center">
               <img src={cmsContent.logoUrl} alt={t.brand} className="h-10 sm:h-12" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
            <nav className="hidden md:flex space-x-1 rtl:space-x-reverse">
              <button onClick={() => navigate('home')} className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-2 rounded-md text-sm font-medium">{t.home}</button>
              {user && (
                <button onClick={() => navigate('dashboard')} className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-2 rounded-md text-sm font-medium">{t.dashboard}</button>
              )}
            </nav>
            
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {user ? (
              <button onClick={handleLogout} className="hidden sm:block bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                {t.logout}
              </button>
            ) : (
              <button onClick={() => navigate('auth')} className="hidden sm:block bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                {t.login}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isMobileMenuOpen ? <IconClose className="w-6 h-6" /> : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 animate-fade-in">
          <div className="px-4 pt-2 pb-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Menu</span>
               <LanguageSwitcher />
            </div>
            <button onClick={() => navigate('home')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t.home}</button>
            {user && (
              <button onClick={() => navigate('dashboard')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t.dashboard}</button>
            )}
            <div className="pt-4">
              {user ? (
                <button onClick={handleLogout} className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-bold">
                  {t.logout}
                </button>
              ) : (
                <button onClick={() => navigate('auth')} className="w-full bg-brand-600 text-white px-4 py-3 rounded-xl font-bold">
                  {t.login}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
