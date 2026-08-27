import React, { useState, useMemo } from 'react';
import { Activity, Booking, WaitlistEntry, BookingStatus } from '../../types';
import { IconClose } from '../Icon';

export interface AdminNotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'verification' | 'waitlist' | 'contract' | 'payment' | 'system';
  severity?: 'urgent' | 'warning' | 'info' | 'success';
  actionLabel?: string;
  onAction?: () => void;
  isRead?: boolean;
}

interface AdminActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  bookings?: Booking[];
  waitlist?: WaitlistEntry[];
  onNavigateSection?: (section: any) => void;
}

export const AdminActivityDrawer: React.FC<AdminActivityDrawerProps> = ({
  isOpen,
  onClose,
  activities = [],
  bookings = [],
  waitlist = [],
  onNavigateSection
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'audit_logs'>('notifications');
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('alibaanah_admin_read_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [auditFilter, setAuditFilter] = useState<'all' | 'payment' | 'booking' | 'system'>('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'unread'>('all');

  // Build live notification items
  const notifications: AdminNotificationItem[] = useMemo(() => {
    const items: AdminNotificationItem[] = [];

    // 1. Pending payment verifications
    const pendingVerifs = bookings.filter(b => b.status === BookingStatus.PENDING_VERIFICATION);
    pendingVerifs.forEach(b => {
      items.push({
        id: `verif-${b.id}`,
        title: `Payment Verification Needed: BK${b.id}`,
        description: `${b.full_name} submitted proof of payment ($${b.total_price || 0}) for ${b.rooms?.category || 'Residency Room'}. Needs staff review & approval.`,
        timestamp: b.payment_proof_uploaded_at || b.booked_at || new Date().toISOString(),
        type: 'verification',
        severity: 'urgent',
        actionLabel: 'Review & Verify',
        onAction: () => {
          if (onNavigateSection) onNavigateSection('transactions');
          onClose();
        }
      });
    });

    // 2. Active Waitlist applicants waiting in queue
    const waitingWaitlist = waitlist.filter(w => w.status === 'Waiting');
    waitingWaitlist.forEach(w => {
      const applicantName = w.profiles?.full_name || w.full_name || 'Applicant';
      items.push({
        id: `waitlist-${w.id}`,
        title: `Waitlist Applicant: ${applicantName}`,
        description: `Registered interest for ${w.category} (${w.accommodation_type}, ${w.duration_months || 6} mo stay). Waiting for space allocation.`,
        timestamp: w.created_at || new Date().toISOString(),
        type: 'waitlist',
        severity: 'warning',
        actionLabel: 'Attend to Waitlist',
        onAction: () => {
          if (onNavigateSection) onNavigateSection('waitlist');
          onClose();
        }
      });
    });

    // 3. Pending contract signatures
    const pendingContracts = bookings.filter(b => b.status === BookingStatus.PENDING_CONTRACT);
    pendingContracts.forEach(b => {
      items.push({
        id: `contract-${b.id}`,
        title: `Tenancy Agreement Awaiting Signature: BK${b.id}`,
        description: `${b.full_name} has not completed digital tenancy execution for ${b.rooms?.room_number ? `Room ${b.rooms.room_number}` : 'Room'}.`,
        timestamp: b.booked_at || new Date().toISOString(),
        type: 'contract',
        severity: 'info',
        actionLabel: 'View Booking',
        onAction: () => {
          if (onNavigateSection) onNavigateSection('bookings');
          onClose();
        }
      });
    });

    // 4. Important system activities from recent logs
    activities.slice(0, 10).forEach(act => {
      if (act.type === 'payment' || act.type === 'booking') {
        items.push({
          id: `act-${act.id}`,
          title: act.type === 'payment' ? 'Payment Event' : 'Booking Event',
          description: act.description,
          timestamp: act.timestamp,
          type: 'system',
          severity: act.type === 'payment' ? 'success' : 'info'
        });
      }
    });

    // Sort descending by timestamp
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [bookings, waitlist, activities, onNavigateSection, onClose]);

  // Mark all as read handler
  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNoticeIds(allIds);
    try {
      localStorage.setItem('alibaanah_admin_read_notices', JSON.stringify(allIds));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleToggleRead = (id: string) => {
    setReadNoticeIds(prev => {
      const isAlreadyRead = prev.includes(id);
      const next = isAlreadyRead ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem('alibaanah_admin_read_notices', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const unreadNoticesCount = useMemo(() => {
    return notifications.filter(n => !readNoticeIds.includes(n.id)).length;
  }, [notifications, readNoticeIds]);

  const filteredNotifications = useMemo(() => {
    if (noticeFilter === 'unread') {
      return notifications.filter(n => !readNoticeIds.includes(n.id));
    }
    return notifications;
  }, [notifications, noticeFilter, readNoticeIds]);

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesType = auditFilter === 'all' || act.type === auditFilter;
      const matchesSearch = !auditSearch || 
        act.description.toLowerCase().includes(auditSearch.toLowerCase()) || 
        act.type.toLowerCase().includes(auditSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [activities, auditFilter, auditSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-100 dark:border-gray-800 flex flex-col animate-slide-left">
          
          {/* Drawer Header with 2 Tabs */}
          <div className="px-6 pt-5 pb-0 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg font-bold">
                  🔔
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Operations Center
                  </h3>
                  <p className="text-xs text-gray-500">
                    Live notifications, alerts & audit trail
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Close drawer"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-2 -mb-px">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'notifications'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span>🔔 Notifications</span>
                {unreadNoticesCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                    {unreadNoticesCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'audit_logs'
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span>📜 Audit Logs</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {activities.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: NOTIFICATIONS CONTENT */}
          {activeTab === 'notifications' && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {/* Filter and Mark All Read controls */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setNoticeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      noticeFilter === 'all'
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNoticeFilter('unread')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      noticeFilter === 'unread'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Unread ({unreadNoticesCount})
                  </button>
                </div>

                {unreadNoticesCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-bold text-brand-600 hover:underline hover:text-brand-700 dark:text-brand-400"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="text-center py-16 space-y-3 my-auto">
                  <span className="text-3xl block">✨</span>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {noticeFilter === 'unread' ? 'All caught up! No unread notifications' : 'No notifications'}
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    New applicant actions, payment uploads, and waitlist joins will notify you immediately.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredNotifications.map((item) => {
                    const isRead = readNoticeIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all relative ${
                          isRead
                            ? 'bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 opacity-80'
                            : 'bg-gradient-to-r from-amber-500/5 via-transparent to-transparent border-amber-200 dark:border-amber-900/50 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                              item.type === 'verification'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : item.type === 'waitlist'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : item.type === 'contract'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}>
                              {item.type === 'verification' ? '💳' :
                               item.type === 'waitlist' ? '⏳' :
                               item.type === 'contract' ? '📝' : '⚡'}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                                  {item.title}
                                </h4>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Unread" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                                <span>
                                  {new Date(item.timestamp).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <button
                                  onClick={() => handleToggleRead(item.id)}
                                  className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                  {isRead ? 'Mark unread' : 'Mark read'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {item.actionLabel && (
                            <button
                              onClick={item.onAction}
                              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition-colors shrink-0 whitespace-nowrap self-center"
                            >
                              {item.actionLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT LOGS CONTENT */}
          {activeTab === 'audit_logs' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {/* Search & Filter Header */}
              <div className="space-y-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'payment', 'booking', 'system'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAuditFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        auditFilter === cat
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="text-center py-16 space-y-3 my-auto">
                  <span className="text-3xl block">📋</span>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No matching audit logs</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Administrative triggers, payment verifications, and room assignments will record here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 relative">
                  {filteredActivities.map((act) => {
                    const isPayment = act.type === 'payment';
                    const isBooking = act.type === 'booking';
                    return (
                      <div key={act.id} className="flex gap-3.5 relative group">
                        <div 
                          className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 z-10 ring-4 ring-white dark:ring-gray-900 ${
                            isPayment 
                              ? 'bg-emerald-500' 
                              : isBooking 
                                ? 'bg-purple-500' 
                                : 'bg-brand-500'
                          }`}
                        />
                        <div className="absolute left-[5px] top-4 w-[2px] h-full bg-gray-100 dark:bg-gray-800 last:hidden" />
                        <div className="flex-1 bg-gray-50/70 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/80 group-hover:border-brand-200 transition-colors">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                            {act.description}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                            <span className="font-mono uppercase">
                              {new Date(act.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="uppercase tracking-wider font-bold text-[9px] text-brand-600 dark:text-brand-400">
                              {act.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex items-center justify-between text-xs text-gray-500">
            <span>
              {activeTab === 'notifications'
                ? `${filteredNotifications.length} notification${filteredNotifications.length === 1 ? '' : 's'}`
                : `Showing ${filteredActivities.length} audit entries`}
            </span>
            <button 
              onClick={onClose}
              className="font-bold text-brand-600 hover:text-brand-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityDrawer;

