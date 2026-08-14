import React from 'react';
import { Activity } from '../../types';
import { IconClose } from '../Icon';

interface AdminActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
}

export const AdminActivityDrawer: React.FC<AdminActivityDrawerProps> = ({
  isOpen,
  onClose,
  activities = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-100 dark:border-gray-800 flex flex-col animate-slide-left">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔔</span>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Notifications & Audit Log
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recent activities and automated system triggers
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activities.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <span className="text-3xl block">📋</span>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No activities recorded yet</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Audit events such as payment verifications, bookings, and agreement signings will populate here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-6 relative">
                {activities.map((act) => {
                  const isPayment = act.type === 'payment';
                  const isBooking = act.type === 'booking';
                  return (
                    <div key={act.id} className="flex gap-4 relative group">
                      <div 
                        className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 z-10 ring-4 ring-white dark:ring-gray-900 ${
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

          {/* Drawer Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex items-center justify-between text-xs text-gray-500">
            <span>Showing last {activities.length} entries</span>
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
