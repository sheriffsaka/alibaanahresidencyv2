import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { DEFAULT_ACCOMMODATION_ADDRESSES, DEFAULT_SUPPORT_CONTENT } from '../../types';

export const AdminSettingsView: React.FC = () => {
  const { cmsContent, updateCmsContent } = useApp();
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
    standardAddress: cmsContent?.accommodationAddresses?.['Standard'] || DEFAULT_ACCOMMODATION_ADDRESSES['Standard'],
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
          'Standard': settingsForm.standardAddress,
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

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-6">
        <div className="border-b border-gray-100 dark:border-gray-700 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚙️ System & Residency Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure global operational parameters, financial deposit defaults, and payment receiver details.
            </p>
          </div>
          {isSaved && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fade-in">
              ✓ Settings Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Financial & Currency Defaults */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">Financial & Deposit Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold"
                >
                  <option value="USD">USD ($ United States Dollar)</option>
                  <option value="EGP">EGP (Egyptian Pound)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Standard Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 pl-7 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Waitlist Hold Window</label>
                <select
                  value={settingsForm.autoHoldWaitlistDays}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, autoHoldWaitlistDays: Number(e.target.value) }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                >
                  <option value={2}>48 Hours (2 Days)</option>
                  <option value={3}>72 Hours (3 Days)</option>
                  <option value={5}>5 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Landlord & Wire Instructions */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">Official Bank & Wire Payment Receiver Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient / Account Name</label>
                <input
                  type="text"
                  value={settingsForm.recipientName}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settingsForm.bankName}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IBAN Number</label>
                <input
                  type="text"
                  value={settingsForm.iban}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, iban: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={settingsForm.swiftCode}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, swiftCode: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Official WhatsApp / Phone</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Notification Email</label>
                <input
                  type="email"
                  value={settingsForm.adminEmail}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Residency Building & Apartment Addresses */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">Residency Apartment Physical Addresses</h3>
            <p className="text-xs text-gray-500">These official physical addresses automatically populate tenancy contracts, the student dashboard, booking wizards, and maintenance logs.</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Premium 1 Apartment Address</label>
                <input
                  type="text"
                  value={settingsForm.premium1Address}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, premium1Address: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Premium 2 Apartment Address</label>
                <input
                  type="text"
                  value={settingsForm.premium2Address}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, premium2Address: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Standard Apartment Address</label>
                <input
                  type="text"
                  value={settingsForm.standardAddress}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, standardAddress: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Manage Support Page Content */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">🛠️ Manage Support Page Content</h3>
                <p className="text-xs text-gray-500 mt-0.5">Customize support desk contact information, office hours, location address, and help messaging shown to students.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Page Title</label>
                <input
                  type="text"
                  value={settingsForm.supportTitle}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportTitle: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-bold"
                  placeholder="e.g. Al-Ibaanah Student Support & Help Desk"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Page Subtitle</label>
                <textarea
                  value={settingsForm.supportSubtitle}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportSubtitle: e.target.value }))}
                  rows={2}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="e.g. We are here to assist with your student residency, inquiries, tenancy agreements, and stay in Cairo."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Support Email</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                  placeholder="support@alibaanah.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Phone Number</label>
                <input
                  type="text"
                  value={settingsForm.supportPhone}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportPhone: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                  placeholder="+20 1030072440"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Official WhatsApp Support Line</label>
                <input
                  type="text"
                  value={settingsForm.supportWhatsapp}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportWhatsapp: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono"
                  placeholder="+20 1030072440"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Residency Help Desk Location</label>
                <input
                  type="text"
                  value={settingsForm.supportLocation}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportLocation: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="Nasr City, Cairo, Egypt"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Office / Working Hours</label>
                <input
                  type="text"
                  value={settingsForm.supportOfficeHours}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportOfficeHours: e.target.value }))}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo Time)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">FAQ Section Card Description</label>
                <textarea
                  value={settingsForm.supportFaqDesc}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, supportFaqDesc: e.target.value }))}
                  rows={2}
                  className="w-full text-xs p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                  placeholder="Have questions about reservations, security deposits, contracts, or amenities? Check our comprehensive knowledge base."
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsView;
