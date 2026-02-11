
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
import Chatbot from './components/Chatbot';

const AppContent: React.FC = () => {
  const { page, language, user, selectedRoom } = useApp();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const renderPage = () => {
    if (!user) {
      // Force auth page if not logged in, except for the home page
      if (page !== 'home' && page !== 'auth') {
        return <AuthPage />;
      }
    }
    
    switch (page) {
      case 'home':
        return <HomePage />;
      case 'booking':
        if (selectedRoom) {
            return <BookingPage room={selectedRoom} />;
        }
        return <HomePage />; // Fallback to home if no room is selected
      case 'dashboard':
        if (!user) {
            return <AuthPage />;
        }
        if (user.role === 'staff' || user.role === 'proprietor') {
            return <AdminDashboardPage />;
        }
        return <DashboardPage />;
      case 'auth':
        return <AuthPage />;
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
