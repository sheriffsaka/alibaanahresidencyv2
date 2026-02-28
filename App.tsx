
import React, { useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useApp } from './hooks/useApp';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AuthPage from './pages/AuthPage';
import SupportPage from './pages/SupportPage';
import Chatbot from './components/Chatbot';

const DashboardLoadingFallback: React.FC<{ setPage: (page: any) => void }> = ({ setPage }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn("Dashboard loading timeout reached, redirecting to auth...");
      setPage('auth');
    }, 8000);
    return () => clearTimeout(timer);
  }, [setPage]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 animate-pulse">Loading your profile...</p>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { page, language, user, selectedRoom, setPage } = useApp();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const renderPage = () => {
    // Publicly accessible pages
    if (page === 'home') return <HomePage />;
    if (page === 'support') return <SupportPage />;
    
    // Auth guard for protected pages
    if (!user) {
      // If we are on a protected page but user is not yet loaded, 
      // show a small loading indicator instead of immediately redirecting to AuthPage.
      // This prevents the "flicker" back to login right after a successful signIn.
      if (page === 'dashboard' || page === 'booking') {
          return <DashboardLoadingFallback setPage={setPage} />;
      }
      return <AuthPage />;
    }
    
    switch (page) {
      case 'booking':
        return selectedRoom ? <BookingPage room={selectedRoom} /> : <HomePage />;
      case 'dashboard':
        if (user.role === 'staff' || user.role === 'proprietor') {
            return <AdminDashboardPage />;
        }
        return <DashboardPage />;
      case 'auth':
         // If user is already logged in and tries to go to auth, redirect to dashboard
        return <DashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
