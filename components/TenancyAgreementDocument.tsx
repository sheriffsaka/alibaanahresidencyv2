
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
    const name = aptName?.toLowerCase() || '';
    if (name.includes('2')) {
      return "24 Saqaliyyah Street, off Makram Ebeid, Nasr City, Cairo, Egypt";
    }
    if (name.includes('1')) {
      return "11, Samir Moursey Street, Nasr City, Cairo";
    }
    if (name.includes('3')) {
      return "2 Ezzat Salaam St, off Kaabool St, Makram Ebeid, Nasr City";
    }
    return '';
  };

  const apartmentAddress = getApartmentAddress(formData.apartment);
  const formattedRoomType = formData.roomType ? 
    (formData.roomType.toLowerCase().includes('private') ? 'Private Room' : 'Shared Room') 
    : '';

  return (
    <div ref={ref} className="bg-white text-gray-900 p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto font-serif leading-relaxed print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-brand-800 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-800 uppercase tracking-tighter">Al-Ibaanah Arabic Center</h1>
          <p className="text-sm font-medium text-brand-600 tracking-widest mt-1">— STUDENT HOUSING —</p>
        </div>
        <div className="text-right text-[10px] text-gray-500 font-sans">
          <p>Master Tenancy Agreement Template</p>
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-brand-800 mb-2">TENANCY AGREEMENT</h2>
        <p className="text-lg font-bold text-yellow-600 italic">Al-Ibaanah Arabic Center — Student Housing</p>
        <p className="text-sm text-gray-600">Nasr City, Cairo, Egypt</p>
      </div>

      <p className="mb-6 text-sm">This Rental Agreement is made between the following parties:</p>

      {/* Parties */}
      <div className="grid grid-cols-1 gap-6 mb-10">
        {/* Landlord */}
        <div className="bg-brand-50/50 p-6 border border-brand-100 rounded-lg">
          <h3 className="text-brand-800 font-bold uppercase text-sm mb-3 border-b border-brand-200 pb-1">LANDLORD</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-bold">Name:</span> Jimoh Bolakale Ajao (Al-Ibaanah Arabic Center)</p>
            <p><span className="font-bold">Office Address:</span> 9, Mahmood Tawfeeq Street off Kaabool Street, Makram Ebeid, Nasr City, Cairo, Egypt</p>
            <p><span className="font-bold">WhatsApp:</span> +201030072440</p>
          </div>
        </div>

        {/* Tenant */}
        <div className="bg-yellow-50/50 p-6 border border-yellow-100 rounded-lg">
          <h3 className="text-yellow-800 font-bold uppercase text-sm mb-3 border-b border-yellow-200 pb-1">TENANT</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-bold">Full Name:</span> <span className="border-b border-gray-400 px-2">{formData.fullName || '_____________________________'}</span></p>
            <p><span className="font-bold">Nationality:</span> <span className="border-b border-gray-400 px-2">{formData.nationality || '_____________________________'}</span></p>
            <p><span className="font-bold">Passport Number:</span> <span className="border-b border-gray-400 px-2">{formData.passportNumber || '_____________________________'}</span></p>
            <p><span className="font-bold">Home Address:</span> <span className="border-b border-gray-400 px-2">{formData.homeAddress || '_____________________________'}</span></p>
            <p><span className="font-bold">WhatsApp Number:</span> <span className="border-b border-gray-400 px-2">{formData.whatsappNumber || '_____________________________'}</span></p>
            <p><span className="font-bold">Email Address:</span> <span className="border-b border-gray-400 px-2">{formData.email || '_____________________________'}</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* Section A */}
        <section>
          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4">SECTION A: RENTAL PROPERTY & ROOM SELECTION</h3>
          <div className="space-y-4 text-sm">
            <p><span className="font-bold">Accommodation Category Selected:</span> <span className="border-b border-gray-400 px-2">{formData.category || '___________________________'}</span></p>
            <div>
              <p className="font-bold mb-1">Apartment Selected, and Address:</p>
              <div className="border-b border-gray-400 pb-1 italic text-gray-700 min-h-[1.5rem]">
                {formData.apartment ? `${formData.apartment}: ${apartmentAddress}` : '______________________________________'}
              </div>
              {!apartmentAddress && (
                <>
                  <div className="border-b border-gray-400 h-6"></div>
                  <div className="border-b border-gray-400 h-6"></div>
                </>
              )}
            </div>
            <p><span className="font-bold">Room Type Selected:</span> <span className="border-b border-gray-400 px-2">{formattedRoomType || '_________________'}</span></p>
          </div>
        </section>

        {/* Section B */}
        <section className="print:break-before-page">
          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4">SECTION B: LEASE TERMS</h3>
          
          <div className="mb-6">
            <h4 className="font-bold underline mb-3">Term of Lease</h4>
            <table className="w-full border-collapse border border-gray-200">
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold w-1/3">Start Date</td>
                  <td className="border border-gray-200 p-3">{startDate || '_____________________________'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">End Date</td>
                  <td className="border border-gray-200 p-3">{endDate || '_____________________________'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">Duration</td>
                  <td className="border border-gray-200 p-3">{formData.duration ? `${formData.duration} months` : '_____________________________'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h4 className="font-bold underline mb-3">Rent</h4>
            <table className="w-full border-collapse border border-gray-200">
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold w-1/3">Monthly Rent</td>
                  <td className="border border-gray-200 p-3 text-brand-700 font-black">$ {monthlyRate || '_________'} USD per month</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">Payment Method</td>
                  <td className="border border-gray-200 p-3">Cash at Al-Ibaanah Arabic Center</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">Payment Due</td>
                  <td className="border border-gray-200 p-3">Upon arrival (2 months' advance required)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h4 className="font-bold underline mb-3">Security Deposit</h4>
            <table className="w-full border-collapse border border-gray-200">
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold w-1/3">Deposit Amount</td>
                  <td className="border border-gray-200 p-3 text-brand-700 font-black">$ {monthlyRate || '_________'} USD (one month's rent)</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">Payment Method</td>
                  <td className="border border-gray-200 p-3">Remitly app (international transfer)</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">Payment Due</td>
                  <td className="border border-gray-200 p-3">Upon signing this agreement</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 bg-gray-50 font-bold">Refund Conditions</td>
                  <td className="border border-gray-200 p-3 text-sm">Refundable at end of lease — no damages, all terms met</td>
                </tr>
              </tbody>
            </table>
            <ul className="mt-4 list-disc list-inside text-xs text-red-600 font-medium space-y-1">
              <li>If the tenant terminates the agreement before the end date, the deposit is non-refundable.</li>
              <li>In the event of a no-show after signing, the deposit is non-refundable.</li>
            </ul>
          </div>

          <div className="bg-brand-50 p-6 border-l-4 border-brand-600 rounded-r-lg">
            <h4 className="font-black text-brand-800 uppercase text-xs tracking-widest mb-2">Exclusive Benefit: Distance Enrolment</h4>
            <h5 className="font-bold text-green-700 text-sm mb-2">Housing Students Only — Remote Enrolment Privilege</h5>
            <p className="text-xs leading-relaxed text-gray-700">
              Students who have signed this tenancy agreement and paid their deposit are eligible for distance (remote) enrolment at Al-Ibaanah Arabic Center. All other students must be physically present in Cairo to enrol. This benefit is activated upon deposit confirmation.
            </p>
          </div>
        </section>

        {/* Section 1 */}
        <section className="print:break-before-page">
          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4">SECTION 1: USE AND OCCUPANCY</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold underline text-sm mb-2">Use of Property</h4>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>The property shall be used exclusively as student accommodation (shared hostel/dormitory).</li>
                <li>All residents must follow the terms of this agreement and the house rules provided by the landlord.</li>
                <li>The landlord retains the right to oversee the use of the property to ensure it is operated in a clean, safe, and lawful manner.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold underline text-sm mb-2">Occupancy</h4>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Each resident must provide a valid passport copy and sign an internal occupancy form upon arrival.</li>
                <li>Subletting or reassignment of the room is strictly prohibited under any circumstances.</li>
                <li>The number of residents per apartment shall not exceed the agreed occupancy limit.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="print:break-before-page">
          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4">SECTION 2: CLEANING, MAINTENANCE, SAFETY, AND SECURITY</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold underline text-sm mb-2">Cleaning</h4>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>The landlord is responsible for professional cleaning of all shared areas three times per week.</li>
                <li>Each resident is responsible for maintaining daily cleanliness in their private room.</li>
                <li>A designated person collects trash daily — residents must place waste in appropriate containers.</li>
                <li>Trash must never be left in corridors, stairways, or on balconies.</li>
                <li>Any shared area or item used must be left clean and in the condition it was found.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold underline text-sm mb-2">Maintenance and Repairs</h4>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>All maintenance is the responsibility of the landlord.</li>
                <li>Damage caused by resident misuse or negligence will result in a fine charged to that resident.</li>
                <li>Maintenance issues must be reported promptly via the apartment WhatsApp group.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold underline text-sm mb-2">Safety</h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>No open flames or candles.</li>
                    <li>Two fire extinguishers installed.</li>
                    <li>First aid kit available on-site.</li>
                    <li>Familiarize with emergency exits.</li>
                    <li>Report emergencies immediately.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold underline text-sm mb-2">Security</h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>Doors and windows must be secured.</li>
                    <li>Residents responsible for unsecured loss.</li>
                  </ul>
                </div>
            </div>
          </div>
        </section>

        {/* Section 3 & 4 */}
        <section className="print:break-before-page">
          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4">SECTION 3: VISITORS, HOUSE RULES, AND ENTRY</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold underline text-sm mb-2">Visitor Policy</h4>
                <ul className="list-disc list-inside text-[10px] space-y-1">
                  <li>Visitors: 10:00 AM to 8:00 PM only.</li>
                  <li>No overnight stays.</li>
                  <li>Non-family: No private rooms.</li>
                  <li>No women inside the apartment.</li>
                  <li>Tenant accountable for visitors.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold underline text-sm mb-2">House Rules</h4>
                <ul className="list-disc list-inside text-[10px] space-y-1">
                  <li>No smoking.</li>
                  <li>No pets.</li>
                  <li>No music at any time.</li>
                  <li>Food in kitchen/dining only.</li>
                  <li>No modifications to apartment.</li>
                  <li>Respect all neighbors.</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4 mt-8">SECTION 4: COMMUNICATION, CONDUCT, AND ISLAMIC VALUES</h3>
          <div className="space-y-4">
              <div>
                <h4 className="font-bold underline text-sm mb-2">Islamic Environment</h4>
                <p className="text-[10px] italic mb-2">The apartment is maintained as an Islamic environment. All residents must observe Islamic etiquette and manners.</p>
                <ul className="list-disc list-inside text-[10px] space-y-1">
                  <li>Behavior, speech, dress, and interactions must reflect modesty and respect as taught in Islam.</li>
                  <li>All residents are expected to attend the masjid for the five daily congregational prayers.</li>
                  <li>Remaining behind from congregational prayer without a valid legislated excuse is not permitted.</li>
                  <li>Violations may result in corrective measures or termination of this agreement.</li>
                </ul>
              </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="print:break-before-page">
          <h3 className="text-brand-800 font-black uppercase text-base border-b-2 border-gray-200 pb-1 mb-4">SECTION 5: TERMINATION AND UNDERTAKING</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold underline text-sm mb-2">Termination</h4>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>All parties agree to strictly abide by terms for full duration.</li>
                <li>Tenant forfeits deposit if vacating before end date.</li>
                <li>Landlord reserves right to terminate for serious misconduct without refund.</li>
              </ul>
            </div>
            <div className="mt-8 border-2 border-brand-200 p-6 rounded-xl">
              <h4 className="font-bold uppercase text-brand-800 mb-4">Tenant Undertaking</h4>
              <p className="text-sm italic leading-relaxed">
                I, <span className="font-bold border-b border-gray-400 px-4">{formData.fullName || '________________________________'}</span>, the tenant, commit to respecting the property, maintaining its condition, and preserving the trust placed in me by the landlord.
              </p>
              <p className="text-sm mt-4">I acknowledge and confirm the following:</p>
              <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                <li>I will report any pre-existing damages within one week.</li>
                <li>I will return the apartment in original condition.</li>
                <li>I am not affiliated with any extremist group (including Takfir, Khawarij, Daesh, Tabligh, Ikhwan).</li>
                <li>I have read, understood, and agree to all terms.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Signatures */}
        <section className="mt-12 bg-gray-50 p-8 rounded-2xl border border-gray-200 print:bg-white print:border-none">
          <h3 className="text-xl font-black text-brand-800 mb-6 uppercase tracking-tight">SIGNATURES</h3>
          <p className="text-sm italic mb-8">By signing below, all parties confirm they have read and agreed to the full terms of this agreement.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
            <div className="space-y-6">
              <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest">TENANT</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Name:</p>
                  <p className="text-lg font-black border-b border-gray-300 pb-1">{formData.fullName || '________________'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Signature:</p>
                  <div className="border-b border-gray-300 h-24 flex items-center justify-center overflow-hidden bg-white/50">
                    {signature && <img src={signature} alt="Signature" className="max-h-full max-w-full" />}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Date:</p>
                  <p className="text-lg font-black border-b border-gray-300 pb-1">{today}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-end">
              <div className="bg-brand-50 p-4 border border-brand-100 rounded-lg text-center">
                <IconCheckCircle className="w-12 h-12 text-brand-600 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-brand-800 uppercase">Awaited Admin Approval</p>
                <p className="text-[10px] text-brand-600 mt-1">Verification of deposit payment required</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 border-t pt-4 text-center text-[8px] text-gray-400 font-sans flex justify-between items-center opacity-70">
        <p>9, Mahmood Tawfeeq Street, Nasr City, Cairo, Egypt | +201030072440</p>
        <p>Confidential — Al-Ibaanah Administration</p>
      </div>
    </div>
  );
};

export default React.forwardRef(TenancyAgreementDocument);
