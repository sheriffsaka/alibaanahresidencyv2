import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { IconFile, IconCheckCircle, IconBuilding, IconInfo } from '../components/Icon';
import AgreementModal from '../components/AgreementModal';
import { Booking } from '../types';

const DocumentsPage: React.FC = () => {
  const { user, bookings, landlordDetails } = useApp();
  const [viewingAgreement, setViewingAgreement] = useState<Booking | null>(null);
  const [viewingDocumentModal, setViewingDocumentModal] = useState<{ title: string; content: string } | null>(null);

  const signedBookings = (bookings || []).filter(
    b => b.student_id === user?.id && b.signature_data
  );

  const staticDocuments = [
    {
      id: 'house-rules',
      title: 'Student Residency Rules & Code of Conduct',
      category: 'Policy & Safety',
      updated: 'Academic Term 2026',
      description: 'Comprehensive guidelines covering quiet hours (11 PM - 6 AM), visitor policies, prayer hall etiquette, kitchen cleanliness, and community standards.',
      content: `AL-IBAANAH STUDENT RESIDENCY CODE OF CONDUCT & HOUSE RULES

1. GENERAL OBJECTIVE
The student residency operates in harmony with the educational mission of Al-Ibaanah Arabic Center. All residents are expected to maintain an Islamic atmosphere of mutual respect, cleanliness, and dedication to study.

2. QUIET HOURS & STUDY ENVIRONMENT
- Quiet hours are strictly observed from 11:00 PM to 06:00 AM daily.
- Audio playback without headphones is prohibited in shared rooms and hallways.

3. VISITOR POLICY
- Visitors of the same gender are permitted between 10:00 AM and 09:00 PM in common reception areas.
- Overnight guests are strictly prohibited without prior written authorization from administration.

4. APARTMENT & ROOM CLEANLINESS
- Residents must clean up after themselves immediately in communal kitchens and bathrooms.
- Weekly room inspections are conducted to ensure maintenance of equipment, bedding, and air conditioning units.

5. SAFETY & APPLIANCES
- Tampering with electrical wiring or using unauthorized high-wattage heating elements is strictly prohibited.
- Turn off air conditioners, lights, and water taps when leaving the room.

6. KEYS & ACCESS
- Door keys and keycards are non-transferable. Lost keys incur a replacement fee of 150 EGP.`
    },
    {
      id: 'check-in-protocol',
      title: 'Check-In, Key Collection & Inventory Protocol',
      category: 'Arrival & Logistics',
      updated: 'Active Guide',
      description: 'Step-by-step instructions for arriving at the residency building in Nasr City, collecting keys from the superintendent, and verifying room inventory.',
      content: `CHECK-IN & KEY COLLECTION INSTRUCTIONS

1. ARRIVAL NOTIFICATION
Please notify residency administration via WhatsApp (+20 1030062440) at least 24 hours prior to your scheduled Cairo arrival with your estimated time of arrival (ETA).

2. KEY COLLECTION
- Reception / Superintendent Desk is located on the Ground Floor of the respective Building.
- Present your valid Passport / National ID and your Booking Confirmation (BK ID).

3. ROOM INVENTORY CHECK
Upon room entry, you will receive an Inventory Checklist covering:
- Bed, mattress, and fresh linen set
- Study desk, chair, and wardrobe
- Air conditioner remote and room keys
- Refrigerator and kitchen appliances (communal)

Please report any pre-existing maintenance defects within 48 hours of check-in.`
    },
    {
      id: 'cairo-transit-guide',
      title: 'Cairo Arrival, Transit & Neighborhood Orientation',
      category: 'Orientation',
      updated: 'Active Guide',
      description: 'Essential orientation for international students: Cairo Airport taxi advice, local SIM cards, nearest mosques, grocery stores, and walking routes to Al-Ibaanah Center.',
      content: `CAIRO ARRIVAL & NEIGHBORHOOD GUIDE

1. CAIRO INTERNATIONAL AIRPORT (CAI) TRANSIT
- We recommend using official app-based rides (Uber or Careem) from the designated airport terminal pickup zones.
- Destination: Set destination to "Al-Ibaanah Arabic Center, Nasr City, Cairo" or your assigned Building address.

2. LOCAL SIM CARDS & CURRENCY
- SIM card kiosks (Vodafone, Orange, WE, Etisalat) are located immediately outside baggage claim at Terminal 3 and Terminal 2.
- Official bank ATMs are available at the airport for currency exchange (EGP).

3. PROXIMITY TO AL-IBAANAH ARABIC CENTER
- All residency apartments are situated within 3 to 7 minutes walking distance to the Al-Ibaanah teaching facility in District 7 / 8, Nasr City.
- Local grocery markets, pharmacies, and traditional bakeries are located within 100 meters of the residential entrances.`
    },
    {
      id: 'distance-enrolment-letter',
      title: 'Distance Enrolment & Visa Accommodation Certificate',
      category: 'Official Records',
      updated: 'Term 2026',
      description: 'Official proof of residence address format required for Egyptian visa renewals and embassy educational paperwork.',
      content: `TO WHOM IT MAY CONCERN

RESIDENTIAL ADDRESS VERIFICATION CERTIFICATE

This document certifies that the enrolled student registered in the Al-Ibaanah Student Residency System holds an authorized accommodation reservation at the Al-Ibaanah Student Residences located in Nasr City, Cairo, Arab Republic of Egypt.

Address of Building:
Al-Ibaanah Student Housing Facilities,
Nasr City, Cairo, Egypt.

Contact: admin@alibaanah.com | +20 1030062440
Authorized Property Management: ${landlordDetails?.recipientName || 'Al-Ibaanah Housing Administration'}`
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
          <IconFile className="w-4 h-4" /> Official Residency Records
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Residency Documents & Agreements</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Access your executed tenancy contracts, house rules, arrival check-in guides, and orientation records.
        </p>
      </div>

      {/* Signed Agreements Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
          <IconCheckCircle className="w-5 h-5 text-emerald-500" />
          <span>Your Executed Tenancy Contracts</span>
        </h2>

        {signedBookings.length === 0 ? (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-xs text-gray-500 space-y-2">
            <p>You have not signed a tenancy contract yet.</p>
            <p className="text-gray-400">Contracts are generated automatically upon completing a room booking submission.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signedBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50">
                      Signed & Legally Executed
                    </span>
                    <span className="text-xs font-black text-brand-600">BK{b.id}</span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    Tenancy Agreement – {b.rooms?.apartment_name || 'Al-Ibaanah Residences'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Student: {b.full_name} | Signed on: {b.contract_signed_at ? new Date(b.contract_signed_at).toLocaleDateString() : 'Recorded'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Digital Signature Verified</span>
                  <button
                    onClick={() => setViewingAgreement(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400 text-xs font-bold transition-colors"
                  >
                    <IconFile className="w-3.5 h-3.5" />
                    <span>View Agreement</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Guides & House Policies */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
          <IconBuilding className="w-5 h-5 text-brand-600" />
          <span>Housing Policies & Arrival Guides</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staticDocuments.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {doc.category}
                  </span>
                  <span className="text-[11px] text-gray-400">{doc.updated}</span>
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">{doc.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setViewingDocumentModal({ title: doc.title, content: doc.content })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors"
                >
                  <span>Read Full Document</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Reader Modal */}
      {viewingDocumentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-black text-gray-900 dark:text-white">{viewingDocumentModal.title}</h3>
              <button 
                onClick={() => setViewingDocumentModal(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="py-4 overflow-y-auto flex-1 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              {viewingDocumentModal.content}
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setViewingDocumentModal(null)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenancy Agreement Modal */}
      {viewingAgreement && (
        <AgreementModal 
          booking={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
          isReadOnly={true}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
