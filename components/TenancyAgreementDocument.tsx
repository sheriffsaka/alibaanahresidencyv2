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
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={ref} className="bg-white text-gray-900 p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto font-sans leading-relaxed print:shadow-none print:p-8 print:max-w-none text-xs">
      
      {/* PAGE 1 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">TENANCY AGREEMENT <span className="font-normal text-gray-400">| Al-Ibaanah Arabic Center</span></span>
            <span>Page 1 of 4</span>
          </div>

          <div className="text-center my-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">TENANCY AGREEMENT</h1>
            <p className="text-xs text-gray-500 mt-2 font-medium italic">This agreement is made on the {today}</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider">1. PARTIES TO THE AGREEMENT</h2>
            
            <div className="space-y-4">
              {/* Landlord Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-brand-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-center">
                  LANDLORD
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 divide-y divide-gray-100 text-xs">
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Name</div>
                  <div className="p-3 col-span-2 font-medium text-gray-900">Jimoh Bolakale Ajao (Al-Ibaanah Arabic Center)</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Address</div>
                  <div className="p-3 col-span-2 text-gray-700 leading-normal">9, Mahmood Tawfeeq Street, off Kaabool Street, Makram Ebeid, Nasr City, Egypt</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Phone</div>
                  <div className="p-3 col-span-2 text-gray-700 font-mono">+20 103 007 2440</div>
                </div>
              </div>

              {/* Tenant Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-brand-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-center">
                  TENANT
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 divide-y divide-gray-100 text-xs">
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Name</div>
                  <div className="p-3 col-span-2 font-medium text-gray-900">{formData.fullName || '_____________________________________'}</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Nationality</div>
                  <div className="p-3 col-span-2 text-gray-700">{formData.nationality || '_____________________________________'}</div>
                  
                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Passport No.</div>
                  <div className="p-3 col-span-2 text-gray-700 font-mono">{formData.passportNumber || '_____________________________________'}</div>

                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Address</div>
                  <div className="p-3 col-span-2 text-gray-700 leading-normal">{formData.homeAddress || '__________________________________________________________________________'}</div>

                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Phone</div>
                  <div className="p-3 col-span-2 text-gray-700 font-mono">{formData.whatsappNumber || '_____________________________________'}</div>

                  <div className="p-3 font-bold bg-gray-50 text-gray-600">Email</div>
                  <div className="p-3 col-span-2 text-gray-700">{formData.email || '_____________________________________'}</div>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">2. RENTAL PROPERTY</h2>
            <p className="text-xs text-gray-700">
              The property subject to this Agreement is located at:<br />
              <strong className="text-sm text-gray-900 block mt-2 px-4 py-2 border border-brand-100 bg-brand-50/20 rounded-lg text-center font-bold">11, Samir Moursey Street, Nasr City, Cairo, Egypt</strong>
            </p>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">3. TERM OF LEASE</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p><span className="font-bold text-gray-600">Commencement:</span> <span className="font-medium">{startDate || '1st July 2026'}</span></p>
                <p><span className="font-bold text-gray-600">Expiry:</span> <span className="font-medium">{endDate || '31st August 2026'} ({formData.duration || '2'} Months)</span></p>
              </div>
              <div className="space-y-2 col-span-1">
                <p><span className="font-bold text-gray-600">Renewal:</span> <span className="text-gray-700 font-medium">Upon mutual agreement between both parties</span></p>
                <p><span className="font-bold text-gray-600">Overstay:</span> <span className="text-gray-700 font-medium">USD 15 per night beyond the agreed period, subject to landlord approval</span></p>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">4. RENT</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p><span className="font-bold text-gray-600">Monthly Rent:</span> <span className="font-bold text-brand-800">USD {monthlyRate || '200'} per month ({formData.roomType?.toLowerCase().includes('private') ? 'private room' : 'shared room in shared apartment'})</span></p>
              <p><span className="font-bold text-gray-600">Payment:</span> <span className="text-gray-700 font-medium">Two months' rent paid in advance upon arrival</span></p>
              <p className="col-span-2"><span className="font-bold text-gray-600">Method:</span> <span className="text-gray-700 font-medium">Cash — payable at Al-Ibaanah Arabic Center</span></p>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-10">5. SECURITY DEPOSIT</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p><span className="font-bold text-gray-600">Amount:</span> <span className="font-bold">USD {monthlyRate || '200'} (one month's rent)</span></p>
              <p><span className="font-bold text-gray-600">Payment:</span> <span className="text-gray-700 font-medium">Due upon signing of this Agreement</span></p>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          Al-Ibaanah Arabic Center - Official Student Residency Agreement
        </div>
      </div>

      <div className="page-break my-12 border-t border-dashed border-gray-300 print:hidden"></div>

      {/* PAGE 2 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between print:break-before-page">
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">TENANCY AGREEMENT <span className="font-normal text-gray-400">| Al-Ibaanah Arabic Center</span></span>
            <span>Page 2 of 4</span>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <p><span className="font-bold text-gray-600 col-span-1">Refund:</span> <span className="text-gray-700">Refundable at end of lease, provided no damages and full compliance with all terms</span></p>
              <p><span className="font-bold text-gray-600 col-span-1">Early Termination:</span> <span className="text-gray-700">The landlord reserves the right to withhold the deposit if the tenant vacates before the agreed end date</span></p>
              <p className="col-span-2"><span className="font-bold text-gray-600">No-Show:</span> <span className="text-gray-700">The deposit is non-refundable if the tenant fails to arrive after signing this Agreement</span></p>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider">6. UTILITIES</h2>
            <p className="text-xs text-gray-700 leading-relaxed">
              All utility expenses — including electricity, gas, water, and internet — are covered by the landlord and included in the monthly rent. Tenants are expected to use all utilities responsibly and in moderation. Excessive or unreasonable consumption may result in the landlord revising the rental terms or imposing usage limits.
            </p>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">SECTION 1 — USE AND OCCUPANCY</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">1.1 Use of Property</h3>
                <p className="text-gray-700 mt-1">Reflects hostel accommodation: The property shall be used exclusively as shared hostel/dormitory accommodation. All residents must adhere to the terms of this Agreement and House Rules provided by the landlord. The landlord retains the right to oversee the property and ensure it is kept in clean, safe and lawful conditions at all times.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">1.2 Occupancy</h3>
                <p className="text-gray-700 mt-1">The apartment will accommodate up to {formData?.category === 'Standard' ? 7 : 4} residents.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 pl-2">
                  <li>Each resident must provide a valid passport copy and sign an internal occupancy form.</li>
                  <li>Subletting or reassignment of any kind is strictly prohibited under any circumstances.</li>
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">SECTION 2 — CLEANING, MAINTENANCE, SAFETY & SECURITY</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">2.1 Cleaning and Maintenance</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>The landlord shall ensure cleaning of all shared areas (kitchen, living room, hallways, bathrooms) three times per week.</li>
                  <li>Each resident is responsible for maintaining hygienic conditions in their private room and keeping a cleaning log.</li>
                  <li>A designated person will collect trash daily; residents must deposit their waste in the appropriate bins.</li>
                  <li>No trash or waste may be left in corridors, stairways, or on balconies at any time.</li>
                  <li>Any shared area, appliance, or item used must be left clean and in the condition it was found.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">2.2 Maintenance and Repairs</h3>
                <p className="text-gray-700 mt-1">General maintenance of the property is the responsibility of the landlord. However, any damage resulting from misuse or negligence by a resident shall be the financial responsibility of that resident and may result in a fine. Residents must report any maintenance issues promptly and treat all property and facilities with care.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">2.3 Safety and Emergency Procedures</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>Open flames, candles, and tampering with fire safety equipment are strictly prohibited.</li>
                  <li>Two fire extinguishers are installed and accessible within the apartment at all times.</li>
                  <li>A first aid kit and emergency contact list are available on-site.</li>
                  <li>All residents must familiarise themselves with emergency exits and evacuation procedures.</li>
                  <li>Any emergency must be reported to the landlord immediately.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          Al-Ibaanah Arabic Center - Official Student Residency Agreement
        </div>
      </div>

      <div className="page-break my-12 border-t border-dashed border-gray-300 print:hidden"></div>

      {/* PAGE 3 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between print:break-before-page">
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">TENANCY AGREEMENT <span className="font-normal text-gray-400">| Al-Ibaanah Arabic Center</span></span>
            <span>Page 3 of 4</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">2.4 Security</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>All doors, windows, and the balcony must remain closed and secured at all times, and opened only when in use.</li>
                  <li>Any resident who fails to properly secure a door or window shall be held fully responsible for any resulting theft or damage.</li>
                  <li>All residents are expected to remain vigilant and actively contribute to the safety and security of the property.</li>
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">SECTION 3 — VISITORS, HOUSE RULES & ENTRY</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">3.1 Visitor Policy</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2 col-span-1">
                  <li>Visitors are permitted between 10:00 AM and 8:00 PM only.</li>
                  <li>No overnight stays are allowed under any circumstances.</li>
                  <li>Family visits must comply with visiting hours and all house rules.</li>
                  <li>Non-family visitors are not permitted in any private rooms.</li>
                  <li>Family members may only enter the room of the specific tenant they are visiting.</li>
                  <li><strong className="text-brand-800">Women are not permitted in the apartment under any circumstances, including family members of the tenant.</strong></li>
                  <li>The resident receiving visitors is fully accountable for the behaviour of their guests.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">3.2 House Rules</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>Smoking inside the apartment is strictly prohibited.</li>
                  <li>No pets are allowed.</li>
                  <li>Music is not permitted inside the apartment.</li>
                  <li>Trash must be disposed of daily in the compound bin. No waste may be left in stairways, corridors, or balconies.</li>
                  <li>No modifications of any kind may be made to the apartment without prior written approval from the landlord.</li>
                  <li>Tenants must maintain cleanliness throughout their stay.</li>
                  <li>Residents must respect neighbours and observe building regulations.</li>
                  <li>Any damage caused by a resident is their sole financial responsibility.</li>
                  <li>Food and eating are strictly limited to the kitchen or dining area. No food is permitted in the rooms.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">3.3 Inspection and Entry</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-750 pl-2">
                  <li>The landlord or a representative may inspect shared areas bi-weekly with 48 hours' prior notice.</li>
                  <li>The landlord may not enter private rooms without the tenant's consent, except in cases of emergency or with prior notice for scheduled inspection or repair.</li>
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">SECTION 4 — COMMUNICATION, CONDUCT & ISLAMIC VALUES</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">4.1 Communication</h3>
                <p className="text-gray-700 mt-1">A WhatsApp group shall be created for the apartment. Every tenant is required to join and remain active in the group to receive important updates, notices, and communications from the landlord or their representative.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">4.2 Conflict Resolution and Conduct</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-750 pl-2">
                  <li>Any disagreement or dispute among residents must be escalated to the landlord for resolution.</li>
                  <li>Fighting, keeping malice, gossiping, or backbiting is strictly prohibited.</li>
                  <li>All tenants are expected to uphold a respectful and cooperative environment at all times.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">4.3 Islamic Environment and Ethics</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>The apartment shall be maintained as an Islamic environment. All residents are expected to observe etiquette and conduct in accordance with the Qur'an and the Sunnah.</li>
                  <li>Behaviour, speech, dress, and interactions among residents must reflect the values of modesty, respect, and cooperation as taught in Islam.</li>
                  <li><strong className="text-brand-800">All residents are expected to attend the masjid for the five daily prayers (salawat).</strong></li>
                  <li>No resident may absent themselves from congregational prayer without a valid legislated excuse as defined by the Shari'ah.</li>
                  <li>Any conduct contradicting these Islamic principles may result in corrective measures or termination of this Agreement by the landlord.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          Al-Ibaanah Arabic Center - Official Student Residency Agreement
        </div>
      </div>

      <div className="page-break my-12 border-t border-dashed border-gray-300 print:hidden"></div>

      {/* PAGE 4 */}
      <div className="space-y-6 min-h-[950px] flex flex-col justify-between print:break-before-page">
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-6 text-gray-400 text-[10px]">
            <span className="font-bold tracking-wider text-brand-800 uppercase">TENANCY AGREEMENT <span className="font-normal text-gray-400">| Al-Ibaanah Arabic Center</span></span>
            <span>Page 4 of 4</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider">SECTION 5 — TERMINATION AND TENANT UNDERTAKING</h2>
            
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-gray-900">5.1 Termination</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>All parties agree to strictly abide by the terms and conditions of this Agreement for its full duration.</li>
                  <li>The tenant shall forfeit the entire security deposit if they vacate before the stipulated end date, unless otherwise approved in writing by the landlord under exceptional circumstances.</li>
                  <li>In the event of serious misconduct or repeated violation of house rules, the landlord reserves the right to terminate this Agreement or request the removal of the resident(s) involved, without refund of rent or deposit for the period in question.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">5.2 Tenant Undertaking</h3>
                <p className="text-gray-700 mt-1 italic">
                  I, <strong className="border-b border-gray-400 px-1 text-gray-950">{formData.fullName || '_________________________________'}</strong>, the tenant, commit to respecting the property, maintaining its condition, and preserving the landlord's trust and privacy.
                </p>
                <p className="text-gray-750 mt-2">I acknowledge and undertake the following:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 pl-2">
                  <li>I will report any pre-existing or new damage within one (1) week of receiving the keys.</li>
                  <li>I will return the apartment in the same condition as it was handed over to me.</li>
                  <li>I will notify the landlord of any incidents occurring on the property.</li>
                  <li><strong className="text-gray-950 font-bold">I am not affiliated with any extremist group or movement, including Takfir, Khawarij, Daesh, Tabligh, Ikhwan, or any similar organisation.</strong></li>
                </ul>
              </div>
            </div>

            <h2 className="text-sm font-bold border-b border-brand-800 text-brand-800 pb-1 uppercase tracking-wider mt-8">SIGNATURES</h2>
            <p className="text-xs text-gray-600">By signing below, both parties confirm that they have read, understood, and agreed to all the terms and conditions set forth in this Tenancy Agreement.</p>

            <div className="grid grid-cols-2 gap-8 text-xs mt-4">
              <div className="space-y-4 border border-gray-100 p-4 rounded-xl">
                <span className="font-bold text-gray-500 block uppercase tracking-widest text-[9px]">LANDLORD</span>
                <div className="pt-8 border-b border-gray-300 font-medium text-gray-900 text-center text-sm font-serif">
                  Jimoh Bolakale Ajao
                </div>
                <div>
                  <span className="font-bold text-gray-400 block text-[9px] uppercase">Date</span>
                  <span className="font-medium">{today}</span>
                </div>
              </div>

              <div className="space-y-4 border-2 border-brand-100 bg-brand-50/10 p-4 rounded-xl">
                <span className="font-bold text-brand-800 block uppercase tracking-widest text-[9px]">TENANT</span>
                <div className="h-14 border-b border-gray-300 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                  {signature ? (
                    <img src={signature} alt="Client Signature" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-300 text-[10px] italic">Awaiting Student Digital Signature</span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-gray-400 block text-[9px] uppercase">Date</span>
                  <span className="font-medium">{today}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="border-t pt-3 text-center text-[9px] text-gray-400 font-mono uppercase tracking-wider">
          Al-Ibaanah Arabic Center - Official Student Residency Agreement
        </div>
      </div>

    </div>
  );
};

export default React.forwardRef(TenancyAgreementDocument);
