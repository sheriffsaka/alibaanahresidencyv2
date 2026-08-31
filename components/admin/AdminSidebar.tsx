import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export type AdminNavSection =
  | 'dashboard'
  | 'bookings'
  | 'students'
  | 'rooms_inventory'
  | 'waitlist'
  | 'email_logs'
  | 'maintenance'
  | 'transactions'
  | 'payments_credits'
  | 'messages'
  | 'reviews'
  | 'landing_branding'
  | 'contracts'
  | 'student_documents'
  | 'faqs_announcements'
  | 'admin_users'
  | 'settings';

interface AdminSidebarProps {
  currentSection: AdminNavSection;
  onSelectSection: (section: AdminNavSection) => void;
  pendingVerificationsCount?: number;
  totalStudentsCount?: number;
  pendingWaitlistCount?: number;
  unreadMessagesCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavGroup {
  label: string;
  items: {
    id: AdminNavSection;
    label: string;
    icon: string;
    badge?: number | string;
    badgeColor?: string;
  }[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onSelectSection,
  pendingVerificationsCount = 0,
  totalStudentsCount = 0,
  pendingWaitlistCount = 0,
  unreadMessagesCount = 0,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const t = useTranslation();

  const navGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' }
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        { id: 'bookings', label: 'Bookings', icon: '🛏️' },
        { 
          id: 'students', 
          label: 'Students', 
          icon: '🎓',
          badge: totalStudentsCount > 0 ? totalStudentsCount : undefined,
          badgeColor: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
        },
        { id: 'rooms_inventory', label: 'Rooms & Inventory', icon: '🚪' },
        { 
          id: 'waitlist', 
          label: 'Waitlist', 
          icon: '⏳',
          badge: pendingWaitlistCount > 0 ? pendingWaitlistCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        }
      ]
    },
    {
      label: 'FINANCE',
      items: [
        { 
          id: 'transactions', 
          label: 'Transactions', 
          icon: '💳',
          badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        { id: 'payments_credits', label: 'Payments & Credits', icon: '🔄' }
      ]
    },
    {
      label: 'ENGAGEMENT',
      items: [
        { 
          id: 'messages', 
          label: 'Messages / Inbox', 
          icon: '💬',
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
          badgeColor: 'bg-red-500 text-white'
        },
        { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐' }
      ]
    },
    {
      label: 'CONTENT',
      items: [
        { id: 'landing_branding', label: 'Landing Page & Branding', icon: '🎨' },
        { id: 'contracts', label: 'Contract Templates', icon: '📜' },
        { id: 'student_documents', label: 'Student Documents', icon: '📁' },
        { id: 'faqs_announcements', label: 'FAQs & Announcements', icon: '📢' }
      ]
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { id: 'email_logs', label: 'Email Delivery Logs', icon: '✉️' },
        { id: 'admin_users', label: 'Admin Users', icon: '👥' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
      ]
    }
  ];

  const handleItemClick = (id: AdminNavSection) => {
    onSelectSection(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="admin-sidebar"
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
              AI
            </span>
            <div>
              <span className="text-xs font-black tracking-tight text-gray-900 dark:text-white uppercase block leading-none">
                Al-Ibaanah
              </span>
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-0.5 block">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h4 className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                {group.label}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`admin-nav-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex-shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Live Operations</p>
              <p className="text-[10px] text-gray-400 truncate font-mono">sharedhousing.ibaanah.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
