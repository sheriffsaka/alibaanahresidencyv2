import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { DEFAULT_ACCOMMODATION_ADDRESSES, DEFAULT_SUPPORT_CONTENT } from '../../types';

type SettingsTab = 'general' | 'banking' | 'addresses' | 'support';

export const AdminSettingsView: React.FC = () => {
  const { cmsContent, updateCmsContent } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [currency, setCurrency] = useState('USD');
  const [depositAmount, setDepositAmount] = useState(100);
  const [isSaved, setIsSaved] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    recipientName: cmsContent?.landlordDetails?.recipientName || 'Jimoh Bolakale Ajao',
    bankName: cmsContent?.landlordDetails?.bankName || 'Commercial International Bank (CIB)',
    iban: cmsContent?.landlordDetails?.iban || 'EG98 0010 0109 0000 0100 0633 2816 7',
    swiftCode: cmsContent?.landlordDetails?.swiftCode || 'CIBEEGCXXXX',
    phone: cmsContent?.landlordDetails?.phone || '+20 1030072440',
    adminEmail: cmsContent?.landlordDetails?.adminEmail || 'sheriffdeenalade@gmail.com',
    enableEmailAlerts: true,
    enableSmsAlerts: false,
    autoHoldWaitlistDays: 3,
    premium1Address: cmsContent?.accommodationAddresses?.['Premium 1'] || DEFAULT_ACCOMMODATION_ADDRESSES['Premium 1'],
    premium2Address: cmsContent?.accommodationAddresses?.['Premium 2'] || DEFAULT_ACCOMMODATION_ADDRESSES['Premium 2'],
    premium3Address: cmsContent?.accommodationAddresses?.['Premium 3'] || cmsContent?.accommodationAddresses?.['Standard'] || DEFAULT_ACCOMMODATION_ADDRESSES['Premium 3'] || DEFAULT_ACCOMMODATION_ADDRESSES['Standard'],
    supportTitle: cmsContent?.supportContent?.title || DEFAULT_SUPPORT_CONTENT.title || 'Al-Ibaanah Student Support & Help Desk',
    supportSubtitle: cmsContent?.supportContent?.subtitle || DEFAULT_SUPPORT_CONTENT.subtitle || 'We are here to assist with your student residency, inquiries, tenancy agreements, and stay in Cairo.',
    supportEmail: cmsContent?.supportContent?.contactEmail || DEFAULT_SUPPORT_CONTENT.contactEmail || 'al.ibaanah.housing4brothers@gmail.com',
    supportPhone: cmsContent?.supportContent?.contactPhone || DEFAULT_SUPPORT_CONTENT.contactPhone || '+20 1030072440',
    supportWhatsapp: cmsContent?.supportContent?.whatsappNumber || DEFAULT_SUPPORT_CONTENT.whatsappNumber || '+20 1030072440',
    supportOfficeHours: cmsContent?.supportContent?.officeHours || DEFAULT_SUPPORT_CONTENT.officeHours || 'Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo Time)',
    supportLocation: cmsContent?.supportContent?.locationAddress || DEFAULT_SUPPORT_CONTENT.locationAddress || 'Nasr City, Cairo, Egypt',
    supportFaqDesc: cmsContent?.supportContent?.faqDescription || DEFAULT_SUPPORT_CONTENT.faqDescription || 'Have questions about reservations, security deposits, contracts, or amenities? Check our comprehensive knowledge base.',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateCmsContent && cmsContent) {
      updateCmsContent({
        landlordDetails: {
          ...cmsContent.landlordDetails,
          recipientName: settingsForm.recipientName,
          bankName: settingsForm.bankName,
          iban: settingsForm.iban,
          swiftCode: settingsForm.swiftCode,
          phone: settingsForm.phone,
          adminEmail: settingsForm.adminEmail
        },
        accommodationAddresses: {
          'Premium 1': settingsForm.premium1Address,
          'Premium 2': settingsForm.premium2Address,
          'Premium 3': settingsForm.premium3Address,
          'Standard': settingsForm.premium3Address,
        },
        supportContent: {
          title: settingsForm.supportTitle,
          subtitle: settingsForm.supportSubtitle,
          contactEmail: settingsForm.supportEmail,
          contactPhone: settingsForm.supportPhone,
          whatsappNumber: settingsForm.supportWhatsapp,
          officeHours: settingsForm.supportOfficeHours,
          locationAddress: settingsForm.supportLocation,
          faqDescription: settingsForm.supportFaqDesc,
        }
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs: { id: SettingsTab; label: string; icon: string; desc: string }[] = [
    { id: 'general', label: 'Financial & System', icon: '⚙️', desc: 'Base currency, deposit rates, waitlist hold window' },
    { id: 'banking', label: 'Bank & Wire Details', icon: '🏦', desc: 'Recipient wire instruction, IBAN, and payment contact' },
    { id: 'addresses', label: 'Apartment Addresses', icon: '📍', desc: 'Physical residency unit locations and tenancy contracts' },
    { id: 'support', label: 'Support Page Content', icon: '🛠️', desc: 'Help desk contact, office hours, FAQ messaging' }
  ];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in pb-12">
      {/* Header with Title and Save Notification */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚙️ System & Residency Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure global operational parameters, financial deposit defaults, addresses, and student support CMS.
          </p>
        </div>
        {isSaved && (
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold rounded-xl animate-fade-in flex items-center gap-1.5 shadow-xs">
            ✓ Settings Successfully Saved
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100/80 dark:bg-gray-850 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700/60">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center sm:text-left ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm border border-gray-200/80 dark:border-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <div className="min-w-0">
                <span className="block truncate">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content Box */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* TAB 1: GENERAL & FINANCIAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⚙️</span> Financial & Operational Defaults
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Manage global currency representations, security deposit baseline amounts, and waitlist reservation expiration timers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Base System Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold text-gray-800 dark:text-gray-100"
                  >
                    <option value="USD">USD ($ United States Dollar)</option>
                    <option value="EGP">EGP (Egyptian Pound)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Default billing currency across all student invoices.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Standard Deposit Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full text-xs p-3 pl-7 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold text-gray-800 dark:text-gray-100"
                      min={0}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Mandatory security bond collected during initial booking.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Waitlist Reservation Hold</label>
                  <select
                    value={settingsForm.autoHoldWaitlistDays}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, autoHoldWaitlistDays: Number(e.target.value) }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100"
                  >
                    <option value={2}>48 Hours (2 Calendar Days)</option>
                    <option value={3}>72 Hours (3 Calendar Days)</option>
                    <option value={5}>5 Calendar Days</option>
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">Time allowed for waitlisted students to accept vacated beds.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANK & WIRE TRANSFER */}
          {activeTab === 'banking' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🏦</span> Bank Account & Wire Transfer Receiver Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  These payment instructions are automatically sent to students during the booking confirmation step and rendered on offline payment invoices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Recipient / Account Holder Name</label>
                  <input
                    type="text"
                    value={settingsForm.recipientName}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100"
                    placeholder="e.g. Jimoh Bolakale Ajao"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    value={settingsForm.bankName}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100"
                    placeholder="e.g. Commercial International Bank (CIB)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">IBAN Number</label>
                  <input
                    type="text"
                    value={settingsForm.iban}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, iban: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono font-bold text-brand-600 dark:text-brand-400"
                    placeholder="EG98 0010 0109 0000 0100 0633 2816 7"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={settingsForm.swiftCode}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, swiftCode: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono font-bold text-brand-600 dark:text-brand-400"
                    placeholder="CIBEEGCXXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Official WhatsApp & Telephone</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                    placeholder="+20 1030072440"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Admin Notification Email</label>
                  <input
                    type="email"
                    value={settingsForm.adminEmail}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                    placeholder="sheriffdeenalade@gmail.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APARTMENT ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📍</span> Residency Apartment Physical Addresses
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Official physical addresses automatically populate tenancy contracts, student profiles, and reservation summaries.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Premium 1 Apartment Physical Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.premium1Address}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, premium1Address: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100"
                    placeholder="e.g. Building 14, Makram Ebeid St, 6th Zone, Nasr City, Cairo, Egypt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Premium 2 Apartment Physical Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.premium2Address}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, premium2Address: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100"
                    placeholder="e.g. Building 8, Abbas El Akkad St, 1st Zone, Nasr City, Cairo, Egypt"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Premium 3 Apartment Physical Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.premium3Address}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, premium3Address: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-100"
                    placeholder="e.g. 24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo, Egypt"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT & HELP DESK CMS */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🛠️</span> Support Page Content & Contact CMS
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Customize support desk contact information, office hours, location address, and help messaging shown directly to students.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Support Page Title</label>
                  <input
                    type="text"
                    value={settingsForm.supportTitle}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportTitle: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold"
                    placeholder="e.g. Al-Ibaanah Student Support & Help Desk"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Support Page Subtitle</label>
                  <textarea
                    value={settingsForm.supportSubtitle}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportSubtitle: e.target.value }))}
                    rows={2}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                    placeholder="e.g. We are here to assist with your student residency, inquiries, tenancy agreements, and stay in Cairo."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Primary Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportEmail: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                    placeholder="al.ibaanah.housing4brothers@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Support Telephone Number</label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportPhone: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                    placeholder="+20 1030072440"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Official WhatsApp Support Line</label>
                  <input
                    type="text"
                    value={settingsForm.supportWhatsapp}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportWhatsapp: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                    placeholder="+20 1030072440"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Residency Help Desk Physical Location</label>
                  <input
                    type="text"
                    value={settingsForm.supportLocation}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportLocation: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                    placeholder="Nasr City, Cairo, Egypt"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Office / Working Hours</label>
                  <input
                    type="text"
                    value={settingsForm.supportOfficeHours}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportOfficeHours: e.target.value }))}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                    placeholder="Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo Time)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">FAQ Section Card Description</label>
                  <textarea
                    value={settingsForm.supportFaqDesc}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, supportFaqDesc: e.target.value }))}
                    rows={2}
                    className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                    placeholder="Have questions about reservations, security deposits, contracts, or amenities? Check our comprehensive knowledge base."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Persistent Action Footer */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500 font-medium">
              Changes made to {tabs.find(t => t.id === activeTab)?.label} will be saved immediately.
            </span>
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>💾</span> Save All Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsView;

