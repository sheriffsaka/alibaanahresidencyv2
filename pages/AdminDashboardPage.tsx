
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { BookingStatus, Room, Booking, Activity } from '../types';
import { IconSettings, IconEdit, IconEye, IconClose, IconCheckCircle, IconBuilding, IconMapPin } from '../components/Icon';
import BookingStatusBadge from '../components/BookingStatusBadge';

const AdminDashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, updateBookingStatus, cmsContent, updateCmsContent, rooms, updateRoom, activities, addActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'analytics' | 'pending' | 'rooms' | 'students' | 'cms'>('analytics');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | 'occupied' | 'available'>('all');
  
  // Analytics Calculations
  const analytics = useMemo(() => {
    const totalRev = bookings
      .filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED)
      .reduce((acc, b) => acc + b.total_price, 0);
    
    const pending = bookings.filter(b => b.status === BookingStatus.PENDING_VERIFICATION);
    const occupiedBookings = bookings.filter(b => b.status === BookingStatus.OCCUPIED || b.status === BookingStatus.CONFIRMED);
    const occupiedRoomIds = new Set(occupiedBookings.map(b => b.room_id));
    
    return {
      totalRevenue: totalRev,
      occupancyRate: Math.round((occupiedRoomIds.size / rooms.length) * 100) || 0,
      currentlyOccupiedRooms: occupiedRoomIds.size,
      totalRooms: rooms.length,
      upcomingCheckIns: bookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
      pendingVerifications: pending,
      occupiedRoomIds
    };
  }, [bookings, rooms]);

  const filteredRooms = useMemo(() => {
    switch(roomFilter) {
      case 'occupied': return rooms.filter(r => analytics.occupiedRoomIds.has(r.id));
      case 'available': return rooms.filter(r => !analytics.occupiedRoomIds.has(r.id));
      default: return rooms;
    }
  }, [rooms, roomFilter, analytics.occupiedRoomIds]);

  const handleApprove = (id: number) => {
    updateBookingStatus(id, BookingStatus.CONFIRMED);
    addActivity({
      user_id: user?.id || 'admin',
      type: 'payment',
      description: `Staff verified payment for BK${id}`,
      timestamp: new Date().toISOString()
    });
    alert("Booking approved successfully!");
  };

  return (
    <div className="pb-12 space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.adminDashboardTitle}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
              {t.adminWelcome.replace('Proprietor', user?.full_name || 'Administrator')}
          </p>
        </div>
        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner w-full xl:w-auto">
          {['analytics', 'pending', 'rooms', 'students', 'cms'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              {tab === 'analytics' ? 'Dashboard' : tab === 'pending' ? `Pending (${analytics.pendingVerifications.length})` : tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {activeTab === 'analytics' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-600">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</h3>
                        <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">${analytics.totalRevenue.toLocaleString()}</p>
                        <div className="mt-2 text-xs text-green-600 font-bold">↑ 12% growth</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Occupancy</h3>
                        <div className="flex items-center mt-2">
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{analytics.occupancyRate}%</p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-3 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${analytics.occupancyRate}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Residents</h3>
                        <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{analytics.currentlyOccupiedRooms}</p>
                        <p className="text-xs text-gray-500 mt-2 italic">Students living on-site</p>
                    </div>
              </div>

              {/* Quick Summary Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                 <h2 className="text-xl font-bold mb-6">Overview Status</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Rooms Availability</p>
                       <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                          <span className="font-medium">Total Rooms</span>
                          <span className="font-black text-xl">{analytics.totalRooms}</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg text-green-700 dark:text-green-400">
                          <span className="font-medium">Available Now</span>
                          <span className="font-black text-xl">{analytics.totalRooms - analytics.currentlyOccupiedRooms}</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pending Verification</p>
                       <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-orange-700 dark:text-orange-400">
                          <span className="font-medium">Unverified Payments</span>
                          <span className="font-black text-xl">{analytics.pendingVerifications.length}</span>
                       </div>
                       <button onClick={() => setActiveTab('pending')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all">
                          Action Required ({analytics.pendingVerifications.length})
                       </button>
                    </div>
                 </div>
              </div>
            </>
          )}

          {activeTab === 'pending' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Payment Verifications</h2>
                </div>
                {analytics.pendingVerifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No pending verifications at this time.</div>
                ) : (
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Student</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {analytics.pendingVerifications.map(item => (
                                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {item.student_name}
                                        <div className="text-[10px] text-gray-400">ID: BK{item.id}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">
                                        ${item.total_price}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <div className="flex gap-2">
                                              <button onClick={() => handleApprove(item.id)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-200">Approve</button>
                                              {item.payment_proof_url && (
                                                <button onClick={() => setSelectedProof(item.payment_proof_url!)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-200">View Proof</button>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                )}
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{t.manageRooms}</h2>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                       {['all', 'occupied', 'available'].map(filter => (
                         <button 
                           key={filter}
                           onClick={() => setRoomFilter(filter as any)}
                           className={`px-3 py-1 text-xs font-bold rounded-md transition-all capitalize ${roomFilter === filter ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}
                         >
                           {filter}
                         </button>
                       ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredRooms.map(room => {
                                const isOccupied = analytics.occupiedRoomIds.has(room.id);
                                return (
                                    <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-black text-gray-900 dark:text-white">{room.room_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">${room.price_per_month}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isOccupied ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {isOccupied ? t.occupied : t.unoccupied}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold">{t.studentsList}</h2>
               </div>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Room</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Booking Period</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {bookings.map(booking => (
                              <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-bold text-gray-900 dark:text-white">{booking.student_name}</div>
                                    <div className="text-xs text-gray-500 uppercase">{booking.student_id.slice(0,8)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">Room {booking.rooms.room_number}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                    {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <BookingStatusBadge status={booking.status} />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'cms' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Landing Page CMS */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center mb-6">
                    <IconEdit className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-bold">Landing Page Content</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Hero Title</label>
                      <input 
                        type="text" 
                        value={cmsContent.heroTitle} 
                        onChange={(e) => updateCmsContent({ heroTitle: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Hero Subtitle</label>
                      <textarea 
                        value={cmsContent.heroSubtitle} 
                        onChange={(e) => updateCmsContent({ heroSubtitle: e.target.value })}
                        className="w-full p-2 border rounded-lg h-24 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Hero Image URL</label>
                      <input 
                        type="text" 
                        value={cmsContent.heroImageUrl} 
                        onChange={(e) => updateCmsContent({ heroImageUrl: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <button 
                      onClick={() => alert("CMS changes staged for preview.")}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Hostel Management CMS */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center mb-6">
                    <IconBuilding className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-bold">Manage Hostel Rooms</h2>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {rooms.map(room => (
                      <div key={room.id} className="p-4 border rounded-lg dark:border-gray-700 flex justify-between items-center group hover:border-blue-300">
                        <div>
                          <div className="font-bold">{room.type} Room - {room.room_number}</div>
                          <div className="text-sm text-gray-500">${room.price_per_month}/mo</div>
                        </div>
                        <button 
                          onClick={() => {
                            const newPrice = prompt(`Enter new price for Room ${room.room_number}:`, room.price_per_month.toString());
                            if (newPrice) updateRoom({ ...room, price_per_month: parseFloat(newPrice) });
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IconEdit className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 rounded-lg text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-750">
                    + Add New Room
                  </button>
                </div>
            </div>
          )}
        </div>

        {/* Recent Activities Section (Right Sidebar) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6 flex items-center">
              <span className="mr-2">🕒</span> {t.recentActivities}
            </h3>
            <div className="space-y-6">
              {activities.map(activity => (
                <div key={activity.id} className="flex gap-4 relative">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 z-10 ${activity.type === 'payment' ? 'bg-green-500' : activity.type === 'booking' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                  <div className="absolute left-[3px] top-4 w-[2px] h-full bg-gray-100 dark:bg-gray-700 last:hidden"></div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-tight">{activity.description}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                      {new Date(activity.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold mb-4">Quick Links</h3>
             <ul className="space-y-2">
                <li><button onClick={() => setActiveTab('rooms')} className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 font-bold text-sm">🏨 Room Inventory</button></li>
                <li><button onClick={() => setActiveTab('students')} className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 font-bold text-sm">🎓 Student Records</button></li>
                <li><button onClick={() => setActiveTab('cms')} className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 font-bold text-sm">🌐 Website Settings</button></li>
             </ul>
          </div>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in backdrop-blur-md">
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-2 overflow-hidden shadow-2xl">
            <button onClick={() => setSelectedProof(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
              <IconClose className="w-6 h-6" />
            </button>
            <div className="p-4 border-b dark:border-gray-800">
              <h3 className="text-lg font-bold">Payment Proof Verification</h3>
            </div>
            <div className="p-4">
              <img src={selectedProof} alt="Proof of Payment" className="w-full h-auto rounded-lg max-h-[70vh] object-contain shadow-inner" />
            </div>
            <div className="p-4 flex gap-4">
              <button 
                onClick={() => {
                  const target = analytics.pendingVerifications.find(v => v.payment_proof_url === selectedProof);
                  if (target) handleApprove(target.id);
                  setSelectedProof(null);
                }}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg transition-all"
              >
                Accept Payment
              </button>
              <button onClick={() => setSelectedProof(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
