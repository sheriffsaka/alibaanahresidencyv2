
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { Booking, BookingStatus, Room, AccommodationType, User, Language } from '../types';
import { IconEdit, IconClose, IconBuilding, IconCheckCircle, IconPlus, IconTrash, IconUpload } from '../components/Icon';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RoomEditorModal from '../components/RoomEditorModal';
import { uploadFile, generateFileName } from '../lib/storage';

// A simple, animated SVG Bar Chart component created for this page
const OccupancyChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartHeight = 200;
    const barWidth = 50;
    const barMargin = 30;
    const chartWidth = data.length * (barWidth + barMargin);

    return (
        <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} aria-label="Occupancy by Room Type Chart">
            {data.map((d, i) => {
                const barHeight = (d.value / maxValue) * chartHeight;
                return (
                    <g key={d.name} transform={`translate(${i * (barWidth + barMargin)}, 0)`}>
                        <title>{`${d.name}: ${d.value} occupied`}</title>
                        <rect 
                            y={chartHeight - barHeight} 
                            width={barWidth} 
                            height={barHeight} 
                            fill="url(#gradient)"
                            rx="4"
                        >
                           <animate attributeName="height" from="0" to={barHeight} dur="0.5s" fill="freeze" begin={`${i * 0.1}s`} />
                           <animate attributeName="y" from={chartHeight} to={chartHeight - barHeight} dur="0.5s" fill="freeze" begin={`${i * 0.1}s`} />
                        </rect>
                        <text x={barWidth / 2} y={chartHeight - barHeight - 10} textAnchor="middle" className="fill-current text-gray-800 dark:text-white font-bold text-sm">
                            {d.value}
                        </text>
                        <text x={barWidth / 2} y={chartHeight + 20} textAnchor="middle" className="fill-current text-gray-500 dark:text-gray-400 text-xs font-bold">
                            {d.name}
                        </text>
                    </g>
                );
            })}
            <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
            </defs>
        </svg>
    );
};

interface SummaryCardProps {
    label: string;
    value: string | number;
    icon: string;
    trend?: string;
    colorClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, trend, colorClass }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-xl transition-shadow">
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <span className="text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</h3>
            {trend && <p className="text-[10px] font-bold text-green-600 mt-1">↑ {trend}</p>}
        </div>
    </div>
);


const AdminDashboardPage: React.FC = () => {
  const t = useTranslation();
  const { user, bookings, updateBookingStatus, cmsContent, updateCmsContent, rooms, addRoom, updateRoom, activities, addActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'analytics' | 'pending' | 'rooms' | 'students' | 'cms'>('analytics');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<'all' | 'occupied' | 'available'>('all');
  const [studentSort, setStudentSort] = useState<{ field: keyof Booking; direction: 'asc' | 'desc' }>({ field: 'full_name', direction: 'asc' });
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);

  const [editingContract, setEditingContract] = useState<{ roomType: AccommodationType; lang: Language } | null>(null);
  const [isUploadingCms, setIsUploadingCms] = useState(false);

  const handleCmsFileUpload = async (e: ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroImageUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingCms(true);
      try {
        const fileName = generateFileName(file.name);
        const publicUrl = await uploadFile('cms', fileName, file);
        updateCmsContent({ [field]: publicUrl });
        alert(`${field === 'logoUrl' ? 'Logo' : 'Hero Image'} updated successfully!`);
      } catch (err) {
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingCms(false);
      }
    }
  };

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const valA = a[studentSort.field] || '';
      const valB = b[studentSort.field] || '';
      if (valA < valB) return studentSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return studentSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [bookings, studentSort]);

  const exportToCSV = () => {
    const headers = ['ID', 'Student Name', 'Email', 'Nationality', 'Room', 'Status', 'Booked At'];
    const rows = sortedBookings.map(b => [
      `BK${b.id}`,
      b.full_name,
      b.email,
      b.nationality,
      b.rooms.room_number,
      b.status,
      new Date(b.booked_at).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analytics = useMemo(() => {
    const safeBookings = bookings || [];
    const occupiedBookings = safeBookings.filter(b => b.status === BookingStatus.OCCUPIED || b.status === BookingStatus.CONFIRMED);
    const occupiedRoomIds = new Set(occupiedBookings.map(b => b.room_id));
    const occupiedRooms = (rooms || []).filter(r => occupiedRoomIds.has(r.id));
    
    return {
      pendingVerifications: safeBookings.filter(b => b.status === BookingStatus.PENDING_VERIFICATION),
      occupiedRoomIds,
      occupancyByType: Object.values(AccommodationType).map(type => ({
        name: type,
        value: occupiedRooms.filter(r => r.type === type).length
      })),
      totalRevenue: occupiedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
      occupancyRate: (rooms || []).length > 0 ? Math.round((occupiedRoomIds.size / (rooms || []).length) * 100) : 0,
      totalRooms: (rooms || []).length,
      availableRooms: (rooms || []).length - occupiedRoomIds.size
    };
  }, [bookings, rooms]);

  const filteredRooms = useMemo(() => {
    // Also filter rooms by admin's gender scope if they are a staff member
    const visibleRooms = user?.role === 'staff' && user.gender
        ? rooms.filter(r => r.gender_restriction === 'Any' || r.gender_restriction === user.gender)
        : rooms;

    switch(roomFilter) {
      case 'occupied': return visibleRooms.filter(r => analytics.occupiedRoomIds.has(r.id));
      case 'available': return visibleRooms.filter(r => !analytics.occupiedRoomIds.has(r.id));
      default: return visibleRooms;
    }
  }, [rooms, roomFilter, analytics.occupiedRoomIds, user]);

  const handleApprove = (id: number) => {
    updateBookingStatus(id, BookingStatus.CONFIRMED);
    addActivity({ user_id: user?.id || 'admin', type: 'payment', description: `Staff verified payment for BK${id}`, timestamp: new Date().toISOString() });
    alert("Booking approved successfully!");
  };

  const handleSaveRoom = (roomData: Room) => {
    if (roomData.id && rooms.some(r => r.id === roomData.id)) {
        updateRoom(roomData);
        addActivity({ user_id: user!.id, type: 'system', description: `Updated details for Room ${roomData.room_number}`, timestamp: new Date().toISOString() });
    } else {
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
  
  const handleFaqChange = (index: number, field: 'q' | 'a', value: string) => {
    const updatedFaqs = [...(cmsContent.faqs.en || [])];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    updateCmsContent({ faqs: { ...cmsContent.faqs, en: updatedFaqs } });
  };
  
  const handleAddFaq = () => {
    const newFaq = { id: Date.now(), q: 'New Question', a: 'New Answer' };
    updateCmsContent({ faqs: { ...cmsContent.faqs, en: [...(cmsContent.faqs.en || []), newFaq] } });
  };

  const handleRemoveFaq = (id: number) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
        updateCmsContent({ faqs: { ...cmsContent.faqs, en: (cmsContent.faqs.en || []).filter(f => f.id !== id) } });
    }
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
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>
              {tab === 'analytics' ? 'Dashboard' : tab === 'pending' ? `Pending (${analytics.pendingVerifications.length})` : tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          {activeTab === 'analytics' && (
            <>
              {/* Summary Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard 
                    label="Total Revenue" 
                    value={`$${analytics.totalRevenue.toLocaleString()}`} 
                    icon="💰" 
                    trend="12% vs last month"
                    colorClass="bg-green-100 dark:bg-green-900/30 text-green-600"
                  />
                  <SummaryCard 
                    label="Occupancy Rate" 
                    value={`${analytics.occupancyRate}%`} 
                    icon="🏠" 
                    trend="3% growth"
                    colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                  />
                  <SummaryCard 
                    label="Total Rooms" 
                    value={analytics.totalRooms} 
                    icon="🚪" 
                    colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                  />
                  <SummaryCard 
                    label="Pending Verif." 
                    value={analytics.pendingVerifications.length} 
                    icon="⏳" 
                    colorClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                  />
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4">{t.quickActions}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={() => handleOpenRoomModal(null)} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                          {t.addNewRoom}
                      </button>
                      <button onClick={() => setActiveTab('pending')} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center font-bold text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 relative">
                          {t.reviewPayments}
                          {analytics.pendingVerifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 text-white text-[10px] items-center justify-center">{analytics.pendingVerifications.length}</span></span>}
                      </button>
                  </div>
              </div>
              {/* Occupancy Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-4">{t.occupancyByType}</h2>
                  <div className="overflow-x-auto py-2">
                     <div className="mx-auto min-w-max">
                        <OccupancyChart data={analytics.occupancyByType} />
                     </div>
                  </div>
              </div>
            </>
          )}

          {activeTab === 'pending' && (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold">Payment Verifications</h2></div>
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
                      <button onClick={() => handleOpenRoomModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ {t.addNewRoom}</button>
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
                <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold">{t.studentsList}</h2>
                  <button 
                    onClick={exportToCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    📥 Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-blue-600"
                          onClick={() => setStudentSort({ field: 'full_name', direction: studentSort.field === 'full_name' && studentSort.direction === 'asc' ? 'desc' : 'asc' })}
                        >
                          Name {studentSort.field === 'full_name' && (studentSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Room</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-blue-600"
                          onClick={() => setStudentSort({ field: 'status', direction: studentSort.field === 'status' && studentSort.direction === 'asc' ? 'desc' : 'asc' })}
                        >
                          Status {studentSort.field === 'status' && (studentSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{sortedBookings.map(booking => (<tr key={booking.id}>
                        <td className="px-6 py-4 font-bold">{booking.full_name}</td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600">Room {booking.rooms.room_number}</td>
                        <td className="px-6 py-4"><BookingStatusBadge status={booking.status} /></td>
                    </tr>))}</tbody>
                </table></div>
             </div>
          )}

          {activeTab === 'cms' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center mb-6"><IconEdit className="w-6 h-6 text-blue-600 mr-2" /><h2 className="text-xl font-bold">Landing Page Content (English)</h2></div>
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="block text-sm font-bold mb-1">Logo</label>
                           <div className="flex items-center gap-4">
                              <img src={cmsContent.logoUrl} alt="Logo" className="h-12 w-auto object-contain bg-gray-100 rounded p-1" />
                              <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2">
                                 <IconUpload className="w-4 h-4" />
                                 {isUploadingCms ? 'Uploading...' : 'Change Logo'}
                                 <input type="file" className="hidden" onChange={(e) => handleCmsFileUpload(e, 'logoUrl')} accept="image/*" disabled={isUploadingCms} />
                              </label>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="block text-sm font-bold mb-1">Hero Image</label>
                           <div className="flex items-center gap-4">
                              <img src={cmsContent.heroImageUrl} alt="Hero" className="h-12 w-20 object-cover bg-gray-100 rounded" />
                              <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2">
                                 <IconUpload className="w-4 h-4" />
                                 {isUploadingCms ? 'Uploading...' : 'Change Hero Image'}
                                 <input type="file" className="hidden" onChange={(e) => handleCmsFileUpload(e, 'heroImageUrl')} accept="image/*" disabled={isUploadingCms} />
                              </label>
                           </div>
                        </div>
                     </div>
                     <div><label className="block text-sm font-bold mb-1">Hero Title (EN)</label><input type="text" value={cmsContent.hero.en?.title} onChange={(e) => updateCmsContent({ hero: { ...cmsContent.hero, en: { ...cmsContent.hero.en!, title: e.target.value } } })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" /></div>
                     <div><label className="block text-sm font-bold mb-1">Hero Subtitle (EN)</label><textarea value={cmsContent.hero.en?.subtitle} onChange={(e) => updateCmsContent({ hero: { ...cmsContent.hero, en: { ...cmsContent.hero.en!, subtitle: e.target.value } } })} className="w-full p-2 border rounded-lg h-24 dark:bg-gray-700 dark:border-gray-600" /></div>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <IconEdit className="w-6 h-6 text-purple-600 mr-2" />
                      <h2 className="text-xl font-bold">Contract Templates</h2>
                    </div>
                    <button 
                      onClick={() => setEditingContract({ roomType: AccommodationType.STANDARD_SHARED, lang: 'en' })}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      + Add/Edit Template
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Room Type</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Languages</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {Object.values(AccommodationType).map(type => (
                          <tr key={type}>
                            <td className="px-6 py-4 font-bold text-sm">{type}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {['en', 'fr', 'ru', 'ar', 'uz', 'zh'].map(lang => {
                                  const exists = cmsContent.contractTemplates[type]?.[lang as Language];
                                  return (
                                    <span 
                                      key={lang} 
                                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${exists ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                      {lang}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => setEditingContract({ roomType: type, lang: 'en' })}
                                className="text-blue-600 text-xs font-bold underline"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>

              {editingContract && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">Edit Contract Template</h3>
                        <p className="text-xs text-gray-500">{editingContract.roomType} - {editingContract.lang.toUpperCase()}</p>
                      </div>
                      <button onClick={() => setEditingContract(null)}><IconClose className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold mb-1">Language</label>
                          <select 
                            value={editingContract.lang} 
                            onChange={(e) => setEditingContract({ ...editingContract, lang: e.target.value as Language })}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                          >
                            {['en', 'fr', 'ru', 'ar', 'uz', 'zh'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Contract Text</label>
                        <textarea 
                          value={cmsContent.contractTemplates[editingContract.roomType]?.[editingContract.lang] || ''} 
                          onChange={(e) => {
                            const newTemplates = { ...cmsContent.contractTemplates };
                            if (!newTemplates[editingContract.roomType]) newTemplates[editingContract.roomType] = {};
                            newTemplates[editingContract.roomType]![editingContract.lang] = e.target.value;
                            updateCmsContent({ contractTemplates: newTemplates });
                          }}
                          className="w-full p-2 border rounded-lg h-64 dark:bg-gray-700 dark:border-gray-600 font-serif text-sm"
                          placeholder="Enter contract text here..."
                        />
                      </div>
                    </div>
                    <div className="p-6 border-t dark:border-gray-800 flex justify-end">
                      <button 
                        onClick={() => setEditingContract(null)}
                        className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold mb-6">Manage FAQs (English)</h2>
                  <div className="space-y-6">
                      {(cmsContent.faqs.en || []).map((faq, index) => (
                          <div key={faq.id} className="p-4 border rounded-lg dark:border-gray-700 space-y-3 relative">
                              <button onClick={() => handleRemoveFaq(faq.id)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><IconTrash className="w-4 h-4" /></button>
                              <div>
                                  <label className="text-xs font-bold">Question</label>
                                  <input type="text" value={faq.q} onChange={(e) => handleFaqChange(index, 'q', e.target.value)} className="w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold">Answer</label>
                                  <textarea value={faq.a} onChange={(e) => handleFaqChange(index, 'a', e.target.value)} rows={3} className="w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                              </div>
                          </div>
                      ))}
                      <button onClick={handleAddFaq} className="w-full flex items-center justify-center gap-2 border-2 border-dashed p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 dark:border-gray-600">
                          <IconPlus className="w-5 h-5" /> Add FAQ
                      </button>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border"><h3 className="text-lg font-bold mb-6">🕒 {t.recentActivities}</h3><div className="space-y-6">{(activities || []).map(act => <div key={act.id} className="flex gap-4 relative">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 z-10 ${act.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <div className="absolute left-[3px] top-4 w-[2px] h-full bg-gray-100 dark:bg-gray-700 last:hidden"></div>
              <div><p className="text-sm font-medium">{act.description}</p><p className="text-[10px] text-gray-500 mt-1 uppercase">{new Date(act.timestamp).toLocaleString()}</p></div>
           </div>)}</div></div>
        </div>
      </div>

      {/* Modals */}
      {isRoomModalOpen && (
        <RoomEditorModal room={selectedRoomForEdit} onClose={() => setIsRoomModalOpen(false)} onSave={handleSaveRoom} />
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