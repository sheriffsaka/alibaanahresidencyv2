
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  IconClose, 
  IconBell, 
  IconUser, 
  IconCreditCard, 
  IconLogout, 
  IconFile, 
  IconMessage, 
  IconCalendar, 
  IconChevronDown 
} from './Icon';

const Header: React.FC = () => {
  const { user, page, setPage, cmsContent, logout, bookings } = useApp();
  const t = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate unread notifications or upcoming items for student
  const activeStudentBookings = (bookings || []).filter(
    b => b.student_id === user?.id && b.status !== 'Cancelled' && b.status !== 'Completed'
  );
  const pendingActionsCount = activeStudentBookings.filter(
    b => b.status === 'Pending Contract' || b.status === 'Pending Payment' || b.status === 'Pending Verification'
  ).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsAvatarDropdownOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      alert(`Logout failed: ${error.message}`);
    }
  };

  const navigate = (targetPage: any) => {
    setPage(targetPage);
    setIsMobileMenuOpen(false);
    setIsAvatarDropdownOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isStudent = user && user.role === 'student';
  const isAdmin = user && (user.role === 'staff' || user.role === 'proprietor');

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 border-b border-gray-100 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate(user ? 'dashboard' : 'home')} 
              className="flex items-center focus:outline-none transition-transform hover:scale-105"
            >
              <img src={cmsContent.logoUrl} alt={t.brand} className="h-10 sm:h-11 object-contain" />
            </button>
          </div>
          
          {/* Primary Nav Links */}
          <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
            <nav className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
              {!user ? (
                <>
                  <button 
                    onClick={() => navigate('home')} 
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      page === 'home' 
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-900/30' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {t.home}
                  </button>
                  <button 
                    onClick={() => navigate('support')} 
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      page === 'support' 
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-900/30' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {t.support}
                  </button>
                </>
              ) : isStudent ? (
                <>
                  {/* Restructured Student Navigation */}
                  <button 
                    onClick={() => navigate('dashboard')} 
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      page === 'dashboard' || page === 'home'
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 font-black' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {t.dashboard || 'Dashboard'}
                  </button>

                  <button 
                    onClick={() => navigate('my-bookings')} 
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      page === 'my-bookings' 
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 font-black' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <IconCalendar className="w-3.5 h-3.5" />
                    My Bookings
                  </button>

                  <button 
                    onClick={() => navigate('documents')} 
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      page === 'documents' 
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 font-black' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <IconFile className="w-3.5 h-3.5" />
                    Documents
                  </button>

                  <button 
                    onClick={() => navigate('messages')} 
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      page === 'messages' 
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 font-black' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <IconMessage className="w-3.5 h-3.5" />
                    Messages
                  </button>

                  {/* Notifications Bell Icon */}
                  <button 
                    onClick={() => navigate('notifications')} 
                    className={`relative p-2 rounded-lg text-xs font-bold transition-all ${
                      page === 'notifications'
                        ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/40' 
                        : 'text-gray-500 hover:text-brand-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    title="Notifications"
                  >
                    <IconBell className="w-5 h-5" />
                    {pendingActionsCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
                    )}
                  </button>
                </>
              ) : (
                /* Admin Nav */
                <button 
                  onClick={() => navigate('dashboard')} 
                  className="px-3.5 py-2 rounded-lg text-xs font-black text-brand-600 bg-brand-50 dark:bg-brand-900/40"
                >
                  Admin Control Panel
                </button>
              )}
            </nav>
            
            {/* Language Switcher Dropdown */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Account / Avatar Dropdown or Login Button */}
            {user ? (
              <div className="relative" ref={avatarDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:outline-none"
                  aria-expanded={isAvatarDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {getInitials(user.full_name || user.email)}
                  </div>
                  <div className="hidden lg:flex flex-col text-left rtl:text-right">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight truncate max-w-[110px]">
                      {user.full_name?.split(' ')[0] || 'Account'}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">{user.role || 'Student'}</span>
                  </div>
                  <IconChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isAvatarDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown Menu */}
                {isAvatarDropdownOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fade-in">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/80">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{user.full_name || 'Al-Ibaanah Student'}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 border border-brand-200/50">
                        {user.role === 'staff' || user.role === 'proprietor' ? 'Admin Staff' : 'Residency Student'}
                      </span>
                    </div>

                    {/* Account Links */}
                    <div className="py-1">
                      {isStudent && (
                        <>
                          <button
                            onClick={() => navigate('profile')}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left rtl:text-right"
                          >
                            <IconUser className="w-4 h-4 text-brand-500" />
                            <span className="font-semibold">My Profile</span>
                          </button>

                          <button
                            onClick={() => navigate('billing')}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left rtl:text-right"
                          >
                            <IconCreditCard className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold">Payment & Billing</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => navigate('support')}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left rtl:text-right"
                      >
                        <span className="text-sm">🎧</span>
                        <span className="font-semibold">{t.support}</span>
                      </button>
                    </div>

                    {/* Logout Option */}
                    <div className="border-t border-gray-100 dark:border-gray-700/80 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left rtl:text-right font-bold"
                      >
                        <IconLogout className="w-4 h-4" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigate('auth')} 
                className="hidden sm:inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>{t.login}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-xl animate-fade-in">
          <div className="px-4 pt-3 pb-6 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Al-Ibaanah</span>
               <LanguageSwitcher />
            </div>

            {user ? (
              <>
                {/* User Info Bar in Mobile */}
                <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center">
                    {getInitials(user.full_name || user.email)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">{user.full_name || 'Student'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                <button onClick={() => navigate('dashboard')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t.dashboard}</button>
                {isStudent && (
                  <>
                    <button onClick={() => navigate('my-bookings')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Bookings</button>
                    <button onClick={() => navigate('documents')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Documents</button>
                    <button onClick={() => navigate('messages')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Messages</button>
                    <button onClick={() => navigate('notifications')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Notifications</button>
                    <button onClick={() => navigate('profile')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</button>
                    <button onClick={() => navigate('billing')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Payment & Billing</button>
                  </>
                )}
                <button onClick={() => navigate('support')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t.support}</button>
                <div className="pt-2">
                  <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow">
                    {t.logout}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => navigate('home')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t.home}</button>
                <button onClick={() => navigate('support')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">{t.support}</button>
                <div className="pt-2">
                  <button onClick={() => navigate('auth')} className="w-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow">
                    {t.login}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
