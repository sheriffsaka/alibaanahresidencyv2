import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';

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
    autoHoldWaitlistDays: 3
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
