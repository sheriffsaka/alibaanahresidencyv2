
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

const AppContent: React.FC = () => {
  const { page, language, user, selectedRoom } = useApp();

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
