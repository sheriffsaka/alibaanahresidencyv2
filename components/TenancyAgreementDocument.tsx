
import React from 'react';
import { IconCheckCircle } from './Icon';

interface TenancyAgreementDocumentProps {
  formData: any;
  monthlyRate: number;
  startDate: string;
  endDate: string;
  signature?: string;
}

const TenancyAgreementDocument: React.ForwardRefRenderFunction<HTMLDivElement, TenancyAgreementDocumentProps> = (
  { formData, monthlyRate, startDate, endDate, signature },
  ref
) => {
  const today = new Date().toLocaleDateString();

  const getApartmentAddress = (aptName: string) => {
    if (!aptName) return '';
    const name = aptName.toLowerCase();
    
    // Exact addresses provided by user
    if (name.includes('1')) return '11, Samir Moursey Street, Nasr City, Cairo, Egypt';
    if (name.includes('2')) return '24 Saqaliyyah Street, off Makram Ebeid, Nasr City, Cairo, Egypt';
    if (name.includes('3')) return '2 Ezzat Salaam St, off Kaabool St, Makram Ebeid, Nasr City, Cairo, Egypt';
    
    // Generic fallback based on category
    if (name.includes('premium')) return '11, Samir Moursey Street, Nasr City, Cairo, Egypt';
    if (name.includes('standard')) return '24 Saqaliyyah Street, off Makram Ebeid, Nasr City, Cairo, Egypt';
    
    return '';
  };

  const apartmentAddress = getApartmentAddress(formData.apartment);
  const formattedRoomType = formData.roomType ? 
    (formData.roomType.toLowerCase().includes('private') ? 'Private Room' : 'Shared Room') 
    : '';

  return (
    <div ref={ref} className="bg-white text-gray-900 p-4 sm:p-6 shadow-2xl max-w-4xl mx-auto font-serif leading-tight print:shadow-none print:p-8 print:max-w-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-brand-800 pb-1 mb-2">
        <div>
          <h1 className="text-lg font-bold text-brand-800 uppercase tracking-tighter">Al-Ibaanah Arabic Center</h1>
          <p className="text-[9px] font-medium text-brand-600 tracking-widest mt-0.5">— STUDENT HOUSING —</p>
        </div>
        <div className="text-right text-[7px] text-gray-400 font-sans">
          <p>Tenancy Agreement | Cairo, Egypt</p>
        </div>
      </div>

      <div className="text-center mb-2">
        <h2 className="text-xl font-extrabold text-brand-800 mb-0.1 uppercase tracking-tight">TENANCY AGREEMENT</h2>
        <p className="text-xs font-bold text-yellow-600 italic">Official Student Housing Terms & Conditions</p>
      </div>

      <p className="mb-2 text-[10px]">This Rental Agreement is made between the following parties:</p>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 print:gap-2">
        {/* Landlord */}
        <div className="bg-brand-50/50 p-2.5 border border-brand-100 rounded-lg">
          <h3 className="text-brand-800 font-bold uppercase text-[8px] mb-1 border-b border-brand-200 pb-0.5">LANDLORD (LESSOR)</h3>
          <div className="space-y-0.5 text-[10px]">
            <p><span className="font-bold">Name:</span> Jimoh Bolakale Ajao (Al-Ibaanah Center)</p>
            <p className="leading-tight"><span className="font-bold">Address:</span> 9, Mahmood Tawfeeq Street, Nasr City, Cairo</p>
            <p><span className="font-bold">WhatsApp:</span> +201030072440</p>
          </div>
        </div>

        {/* Tenant */}
        <div className="bg-yellow-50/50 p-2.5 border border-yellow-100 rounded-lg text-[10px]">
          <h3 className="text-yellow-800 font-bold uppercase text-[8px] mb-1 border-b border-yellow-200 pb-0.5">TENANT (LESSEE)</h3>
          <div className="space-y-0.5">
            <p><span className="font-bold">Full Name:</span> <span className="border-b border-gray-400 font-medium">{formData.fullName || '____________________'}</span></p>
            <p><span className="font-bold">Passport:</span> <span className="border-b border-gray-400">{formData.passportNumber || '__________'}</span> | <span className="font-bold">Nationality:</span> <span className="border-b border-gray-400">{formData.nationality || '_______'}</span></p>
            <p className="leading-tight"><span className="font-bold">WhatsApp:</span> <span className="border-b border-gray-400">{formData.whatsappNumber || '_______'}</span> | <span className="font-bold">Email:</span> <span className="border-b border-gray-400">{formData.email || '_______'}</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 font-sans">
        {/* Section A */}
        <section className="print:break-inside-avoid">
          <h3 className="text-brand-800 font-black uppercase text-[10px] border-b border-gray-200 pb-0.5 mb-1.5">SECTION A: PROPERTY & ACCOMMODATION</h3>
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div className="space-y-1">
              <p><span className="font-bold uppercase tracking-wider text-[8px] text-gray-500 mr-2">Category:</span> <span className="border-b border-gray-400 px-2 font-bold">{formData.category || '___________________'}</span></p>
              <p><span className="font-bold uppercase tracking-wider text-[8px] text-gray-500 mr-2">Room Type:</span> <span className="border-b border-gray-400 px-2 font-bold">{formattedRoomType || '_________________'}</span></p>
            </div>
            <div className="bg-gray-50/50 p-2 border border-gray-100 rounded">
              <p className="font-bold mb-0.5 text-[8px] uppercase text-gray-500">Apartment & Address:</p>
              <div className="italic text-gray-700 font-serif text-[10px] leading-tight">
                {formData.apartment ? `${formData.apartment}: ${apartmentAddress || 'Address on file'}` : '______________________________________'}
              </div>
            </div>
          </div>
        </section>

        {/* Section B */}
        <section className="print:break-inside-avoid">
          <h3 className="text-brand-800 font-black uppercase text-[10px] border-b border-gray-200 pb-0.5 mb-1.5">SECTION B: LEASE TERMS & FINANCIALS</h3>
          <div className="grid grid-cols-2 gap-4">
            <table className="w-full border-collapse border border-gray-200 text-[10px]">
              <tbody>
                <tr><td className="border border-gray-200 p-1 bg-gray-50 font-bold">Start Date</td><td className="border border-gray-200 p-1">{startDate || '__________'}</td></tr>
                <tr><td className="border border-gray-200 p-1 bg-gray-50 font-bold">End Date</td><td className="border border-gray-200 p-1">{endDate || '__________'}</td></tr>
                <tr><td className="border border-gray-200 p-1 bg-gray-50 font-bold">Duration</td><td className="border border-gray-200 p-1">{formData.duration ? `${formData.duration} mos` : '______'}</td></tr>
              </tbody>
            </table>
            <table className="w-full border-collapse border border-gray-200 text-[10px]">
              <tbody>
                <tr><td className="border border-gray-200 p-1 bg-gray-50 font-bold">Monthly Rent</td><td className="border border-gray-200 p-1 text-brand-700 font-black uppercase">$ {monthlyRate || '___'} USD</td></tr>
                <tr><td className="border border-gray-200 p-1 bg-gray-50 font-bold">Security Deposit</td><td className="border border-gray-200 p-1 text-brand-700 font-black uppercase">$ {monthlyRate || '___'} USD</td></tr>
                <tr><td className="border border-gray-200 p-1 bg-gray-50 font-bold">Payment Status</td><td className="border border-gray-200 p-1 font-bold uppercase italic text-brand-600">Arrival Cash</td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-1 text-[9px] text-gray-700 bg-brand-50/40 p-1 border border-brand-100 italic leading-none rounded">
            * Signing this agreement and paying the deposit entitles the student to distance enrolment at Al-Ibaanah Arabic Center.
          </div>
        </section>

        {/* House Rules & Maintenance */}
        <div className="grid grid-cols-2 gap-4 print:gap-2">
          <div className="space-y-2.5">
            <section className="print:break-inside-avoid">
              <h3 className="text-brand-800 font-black uppercase text-[9px] border-b border-gray-200 pb-0.5 mb-1 uppercase tracking-tighter">SECTION 1: OCCUPANCY & MAINTENANCE</h3>
              <ul className="list-disc list-inside text-[9px] space-y-0.1 text-gray-700 font-serif leading-tight">
                <li>Exclusive student hostel. No subletting.</li>
                <li>Cleaning provided 3x weekly for shared areas.</li>
                <li>Pre-existing damages must be reported in week 1.</li>
                <li>Modifications to flat or furniture are forbidden.</li>
                <li>Repairs must be coordinated via official group.</li>
              </ul>
            </section>
            <section className="print:break-inside-avoid">
              <h3 className="text-brand-800 font-black uppercase text-[9px] border-b border-gray-200 pb-0.5 mb-1 uppercase tracking-tighter">SECTION 2: HOUSE RULES</h3>
              <ul className="list-disc list-inside text-[9px] space-y-0.1 text-gray-700 font-serif leading-tight">
                <li>Visitors: 10AM – 8PM; No overnight stays.</li>
                <li>Women are strictly forbidden from entering.</li>
                <li>Modesty in behavior, speech, dress required.</li>
                <li>No smoking, pets, or loud music at any time.</li>
                <li>Masjid attendance for 5 prayers expected.</li>
              </ul>
            </section>
          </div>
          <div className="bg-gray-50/50 p-2.5 border border-gray-200 rounded-xl flex flex-col justify-between">
            <section className="print:break-inside-avoid">
              <h3 className="text-brand-800 font-black uppercase text-[9px] border-b border-gray-200 pb-0.5 mb-1.5 uppercase tracking-tighter">SECTION 3: LEGAL UNDERTAKING</h3>
              <div className="text-[9px] italic text-gray-800 font-serif leading-tight bg-white p-2 border border-gray-100 rounded shadow-sm">
                I, <span className="font-bold border-b border-gray-400 px-1">{formData.fullName || '________________'}</span>, declare I have no affiliation with extremist groups (Takfir, Khawarij, Daesh, etc.). I agree to the conservative Islamic values of Al-Ibaanah Center. Deposit is non-refundable upon early termination.
              </div>
            </section>

            <div className="mt-2 pt-2 border-t border-gray-200">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none">TENANT SIGNATURE</p>
                    <div className="border-b border-gray-300 h-8 flex items-center justify-center overflow-hidden bg-white/50 border-dashed">
                      {signature && <img src={signature} alt="Signature" className="max-h-full max-w-full" />}
                    </div>
                    <p className="text-[7px] font-bold text-gray-500 uppercase leading-none">{today}</p>
                  </div>
                  <div className="flex flex-col justify-end text-center opacity-30 grayscale items-center">
                    <IconCheckCircle className="w-5 h-5 mb-0.5 text-brand-600" />
                    <p className="text-[7px] font-bold uppercase tracking-widest leading-none">ADMIN VERIFIED</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t pt-1 flex justify-between items-center text-[7px] text-gray-400 font-sans tracking-tight opacity-50">
        <p>Al-Ibaanah Arabic Center | Nasr City, Cairo | +201030072440</p>
        <p className="font-bold uppercase tracking-widest">BK{formData.bookingId || '______'} - OFFICIAL DOCUMENT</p>
      </div>
    </div>
  );
};

export default React.forwardRef(TenancyAgreementDocument);
