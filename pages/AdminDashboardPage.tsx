
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { BookingStatus, Room } from '../types';
import { IconEdit, IconEye, IconClose, IconCheckCircle, IconBuilding } from '../components/Icon';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RoomEditorModal from '../components/RoomEditorModal';

const AdminDashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, updateBookingStatus, cmsContent, updateCmsContent, rooms, addRoom, updateRoom, activities, addActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'analytics' | 'pending' | 'rooms' | 'students' | 'cms'>('analytics');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | 'occupied' | 'available'>('all');
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);

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

  const handleSaveRoom = (roomData: Room) => {
    if (roomData.id && rooms.some(r => r.id === roomData.id)) { // Editing existing
        updateRoom(roomData);
        addActivity({ user_id: user!.id, type: 'system', description: `Updated details for Room ${roomData.room_number}`, timestamp: new Date().toISOString() });
    } else { // Adding new
        const newRoomWithId = { ...roomData, id: Date.now(), property_id: 'p1', created_at: new Date().toISOString(), is_available: true };
        addRoom(newRoomWithId);
        addActivity({ user_id: user!.id, type: 'system', description: `Added new room: ${newRoomWithId.room_number}`, timestamp: new Date().toISOString() });
    }
    setIsRoomModalOpen(false);
  };

  const handleOpenRoomModal = (room: Room | null) => {
    setSelectedRoomForEdit(room);
    setIsRoomModalOpen(true);
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
              {/* Analytics Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* KPI Cards */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-600">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</h3>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">${analytics.totalRevenue.toLocaleString()}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Occupancy</h3>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{analytics.occupancyRate}%</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Residents</h3>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{analytics.currentlyOccupiedRooms}</p>
                 </div>
              </div>
            </>
          )}

          {activeTab === 'pending' && (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Pending Content */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700"><h2 className="text-xl font-bold">Payment Verifications</h2></div>
                {analytics.pendingVerifications.length > 0 ? (
                  <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{analytics.pendingVerifications.map(item => (<tr key={item.id}>
                          <td className="px-6 py-4 font-medium">{item.student_name}</td>
                          <td className="px-6 py-4 font-bold text-blue-600">${item.total_price}</td>
                          <td className="px-6 py-4"><div className="flex gap-2">
                              <button onClick={() => handleApprove(item.id)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold">Approve</button>
                              {item.payment_proof_url && <button onClick={() => setSelectedProof(item.payment_proof_url!)} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-bold">View Proof</button>}
                          </div></td>
                      </tr>))}</tbody>
                  </table></div>
                ) : <div className="p-12 text-center text-gray-500">No pending verifications.</div>}
             </div>
          )}

          {activeTab === 'rooms' && (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                   <h2 className="text-xl font-bold">{t.manageRooms}</h2>
                   <div className="flex items-center gap-4">
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                         {['all', 'occupied', 'available'].map(f => <button key={f} onClick={() => setRoomFilter(f as any)} className={`px-3 py-1 text-xs font-bold rounded-md capitalize ${roomFilter === f ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}>{f}</button>)}
                      </div>
                      <button onClick={() => handleOpenRoomModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ Add Room</button>
                   </div>
                </div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Room</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{filteredRooms.map(room => {
                        const isOccupied = analytics.occupiedRoomIds.has(room.id);
                        return (<tr key={room.id}>
                            <td className="px-6 py-4 font-bold">{room.room_number} <span className="text-xs font-normal text-gray-500">({room.type})</span></td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 text-[10px] rounded-full font-bold ${isOccupied ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{isOccupied ? t.occupied : t.unoccupied}</span></td>
                            <td className="px-6 py-4 text-sm font-bold text-blue-600">${room.price_per_month}</td>
                            <td className="px-6 py-4"><button onClick={() => handleOpenRoomModal(room)} className="text-blue-600 text-xs font-bold underline">Edit</button></td>
                        </tr>);
                    })}</tbody>
                </table></div>
             </div>
          )}

          {activeTab === 'students' && (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold">{t.studentsList}</h2></div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Room</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{bookings.map(booking => (<tr key={booking.id}>
                        <td className="px-6 py-4 font-bold">{booking.student_name}</td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600">Room {booking.rooms.room_number}</td>
                        <td className="px-6 py-4"><BookingStatusBadge status={booking.status} /></td>
                    </tr>))}</tbody>
                </table></div>
             </div>
          )}

          {activeTab === 'cms' && (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                 <div className="flex items-center mb-6"><IconEdit className="w-6 h-6 text-blue-600 mr-2" /><h2 className="text-xl font-bold">Landing Page Content</h2></div>
                 <div className="space-y-4">
                    <div><label className="block text-sm font-bold mb-1">Hero Title</label><input type="text" value={cmsContent.heroTitle} onChange={(e) => updateCmsContent({ heroTitle: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-bold mb-1">Hero Subtitle</label><textarea value={cmsContent.heroSubtitle} onChange={(e) => updateCmsContent({ heroSubtitle: e.target.value })} className="w-full p-2 border rounded-lg h-24 dark:bg-gray-700 dark:border-gray-600" /></div>
                    <div><label className="block text-sm font-bold mb-1">Hero Image URL</label><input type="text" value={cmsContent.heroImageUrl} onChange={(e) => updateCmsContent({ heroImageUrl: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                    <button onClick={() => alert("CMS changes staged for preview.")} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Save Changes</button>
                 </div>
             </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border"><h3 className="text-lg font-bold mb-6">🕒 {t.recentActivities}</h3><div className="space-y-6">{activities.map(act => <div key={act.id} className="flex gap-4 relative">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 z-10 ${act.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <div className="absolute left-[3px] top-4 w-[2px] h-full bg-gray-100 dark:bg-gray-700 last:hidden"></div>
              <div><p className="text-sm font-medium">{act.description}</p><p className="text-[10px] text-gray-500 mt-1 uppercase">{new Date(act.timestamp).toLocaleString()}</p></div>
           </div>)}</div></div>
        </div>
      </div>

      {/* Modals */}
      {isRoomModalOpen && (
        <RoomEditorModal
            room={selectedRoomForEdit}
            onClose={() => setIsRoomModalOpen(false)}
            onSave={handleSaveRoom}
        />
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"><div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-2 shadow-2xl">
            <button onClick={() => setSelectedProof(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full"><IconClose className="w-6 h-6" /></button>
            <div className="p-4 border-b dark:border-gray-800"><h3 className="text-lg font-bold">Payment Proof</h3></div>
            <div className="p-4"><img src={selectedProof} alt="Proof of Payment" className="w-full h-auto rounded-lg max-h-[70vh] object-contain" /></div>
            <div className="p-4 flex gap-4">
              <button onClick={() => { const target = analytics.pendingVerifications.find(v => v.payment_proof_url === selectedProof); if (target) handleApprove(target.id); setSelectedProof(null); }} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Accept Payment</button>
              <button onClick={() => setSelectedProof(null)} className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-xl font-bold">Close</button>
            </div>
        </div></div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
