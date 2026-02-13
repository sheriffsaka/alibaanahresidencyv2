
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import BookingStatusBadge from '../components/BookingStatusBadge';
import { Booking, BookingStatus } from '../types';
import { useApp } from '../hooks/useApp';
import InvoiceView from '../components/InvoiceView';
import { IconBuilding } from '../components/Icon';

const DashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, activities, setPage } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);
  
  const userBookings = bookings.filter(b => b.student_id === user?.id);
  const userActivities = activities.filter(a => a.user_id === user?.id).slice(0, 5);

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboardTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your residency and stay updated.</p>
        </div>
        <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
            Welcome back, <span className="font-semibold text-blue-600">{user?.full_name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings Section */}
        <div className="lg:col-span-2 space-y-6">
          {userBookings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-inner border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">{t.noBookings}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.bookingId}</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.room}</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.status}</th>
                      <th scope="col" className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {userBookings.map((booking: Booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">BK{booking.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.rooms.type}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Room {booking.rooms.room_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3 rtl:space-x-reverse">
                                {booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.OCCUPIED ? (
                                    <button 
                                      onClick={() => setSelectedInvoice(booking)}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-bold underline decoration-dotted"
                                    >
                                      {t.viewInvoice}
                                    </button>
                                ) : (
                                    <span className="text-gray-400 text-xs italic">Awaiting Conf.</span>
                                )}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
           {/* Book New Accommodation Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <IconBuilding className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">{t.bookNewAccommodation}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.bookNewDescription}</p>
              <button onClick={() => setPage('home')} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                {t.heroCTA}
              </button>
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <span className="mr-2">🕒</span> {t.recentActivities}
              </h3>
              <div className="space-y-6">
                {userActivities.map(activity => (
                  <div key={activity.id} className="flex gap-4 relative">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2 z-10"></div>
                    <div className="absolute left-[3px] top-4 w-full h-[2px] bg-gray-100 dark:bg-gray-700 last:hidden"></div>
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-tight">{activity.description}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                        {new Date(activity.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
                {userActivities.length === 0 && (
                  <p className="text-sm text-gray-500 text-center italic">No recent activities found.</p>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceView 
          booking={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          isReceipt={selectedInvoice.status === BookingStatus.CONFIRMED || selectedInvoice.status === BookingStatus.OCCUPIED} 
        />
      )}
    </div>
  );
};

export default DashboardPage;