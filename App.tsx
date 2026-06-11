
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
import { sendEmail } from './lib/email';

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
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 animate-pulse">Loading your profile...</p>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { page, language, user, selectedRoom, setPage, bookings, landlordDetails } = useApp();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Automated student reminders: arrival 1 day prior, rent payment 1 week prior
  useEffect(() => {
    if (!bookings || bookings.length === 0) return;

    // To prevent redundant trigger logs during the same session
    const triggeredKey = 'alibaanah_automated_reminders_sent';
    const alreadyTriggered = sessionStorage.getItem(triggeredKey);
    if (alreadyTriggered) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    bookings.forEach(booking => {
      // Skip completed or inactive bookings
      if (booking.status === 'Cancelled' || booking.status === 'Completed') return;

      // 1. One Day Before expected_arrival_date
      if (booking.expected_arrival_date) {
        const arrivalDate = new Date(booking.expected_arrival_date);
        arrivalDate.setHours(0, 0, 0, 0);
        const timeDiff = arrivalDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff === 1) {
          sendEmail({
            to: booking.email,
            subject: `⏰ Reminder: Your Arrival at Al-Ibaanah Student Residency is Tomorrow!`,
            body: `Dear ${booking.full_name},

This is a friendly reminder that your scheduled arrival at Al-Ibaanah Student Residency is tomorrow (${booking.expected_arrival_date})!

Please make sure you have paid and uploaded the receipt of your "Deposit of one month (Due Now)" to your student dashboard. This security deposit is what secures and assigns your bed space officially.

If you have any last-minute coordinates, please reach out to us at ${landlordDetails?.phone || '+20 1030062440'}.

Safe travels, and we look forward to welcoming you!

Warm regards,
Al-Ibaanah Student Residency Team`
          }).then(() => {
            console.log(`[Auto Reminder] Scheduled arrival email sent to ${booking.email} (1 day before arrival)`);
          }).catch(err => console.error("Failed to send auto-arrival reminder:", err));
        }
      }

      // 2. One Week Before payment_expiry_date (monthly subscription payment rent run)
      if (booking.payment_expiry_date) {
        const dueDate = new Date(booking.payment_expiry_date);
        dueDate.setHours(0, 0, 0, 0);
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff === 7) {
          sendEmail({
            to: booking.email,
            subject: `💰 Rent Reminder: Your Monthly Residency Payment is due in 1 week`,
            body: `Dear ${booking.full_name},

This is a timely reminder that your next monthly residency stay payment for Room ${booking.rooms?.room_number || 'your room'} is due in exactly 1 week on ${booking.payment_expiry_date}.

Kindly prepare to make this monthly subscription payment via Bank Transfer or Remitly, and upload the proof of remittance onto your dashboard.

Recipient Bank details & Remitly options are fully detailed inside your student dashboard.

Thank you for your cooperation and for being a valued resident.

Warm regards,
Al-Ibaanah Student Residency Team`
          }).then(() => {
            console.log(`[Auto Reminder] Monthly rent subscription reminder sent to ${booking.email} (1 week prior to expiration)`);
          }).catch(err => console.error("Failed to send auto-rent reminder:", err));
        }
      }
    });

    sessionStorage.setItem(triggeredKey, 'true');
  }, [bookings, landlordDetails]);

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
        return <BookingPage />;
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
      <main className={`flex-grow ${page === 'home' ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {renderPage()}
      </main>
      <Footer />
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
