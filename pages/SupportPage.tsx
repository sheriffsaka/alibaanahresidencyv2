
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useApp } from '../hooks/useApp';
import { IconBuilding, IconMail, IconChat, IconCalendar, IconMapPin } from '../components/Icon';
import { DEFAULT_SUPPORT_CONTENT } from '../types';

const SupportPage: React.FC = () => {
  const t = useTranslation();
  const { setPage, cmsContent } = useApp();

  const support = {
    title: cmsContent?.supportContent?.title || t.supportTitle || DEFAULT_SUPPORT_CONTENT.title,
    subtitle: cmsContent?.supportContent?.subtitle || t.supportSubtitle || DEFAULT_SUPPORT_CONTENT.subtitle,
    contactEmail: cmsContent?.supportContent?.contactEmail || 'al.ibaanah.housing4brothers@gmail.com',
    contactPhone: cmsContent?.supportContent?.contactPhone || '+20 1030072440',
    whatsappNumber: cmsContent?.supportContent?.whatsappNumber || '+20 1030072440',
    officeHours: cmsContent?.supportContent?.officeHours || DEFAULT_SUPPORT_CONTENT.officeHours || 'Sunday – Thursday: 9:00 AM – 6:00 PM (Cairo Time)',
    locationAddress: cmsContent?.supportContent?.locationAddress || DEFAULT_SUPPORT_CONTENT.locationAddress || 'Nasr City, Cairo, Egypt',
    faqDescription: cmsContent?.supportContent?.faqDescription || t.visitFAQDescription || DEFAULT_SUPPORT_CONTENT.faqDescription,
  };

  const cleanWhatsapp = support.whatsappNumber.replace(/[^0-9]/g, '');

  const handleOpenFaq = () => {
    setPage('home');
    setTimeout(() => {
      const el = document.getElementById('faq');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex p-3 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4 shadow-sm">
          <IconBuilding className="w-12 h-12" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {support.title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {support.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Methods */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white pb-3 border-b dark:border-gray-700 flex items-center gap-2">
            <span>📞</span> Direct Support Channels
          </h2>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 mt-0.5">
                <IconMail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  Support Email
                </h3>
                <a 
                  href={`mailto:${support.contactEmail}`} 
                  className="text-brand-600 dark:text-brand-400 font-semibold text-sm hover:underline block mt-0.5 break-all"
                >
                  {support.contactEmail}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <IconChat className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  Official WhatsApp & Call
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <a 
                    href={`https://wa.me/${cleanWhatsapp}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Chat on WhatsApp ↗
                  </a>
                  <a 
                    href={`tel:${support.contactPhone}`} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all"
                  >
                    {support.contactPhone}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mt-0.5">
                <IconCalendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  Office & Help Desk Hours
                </h3>
                <p className="text-gray-800 dark:text-gray-200 text-sm font-medium mt-0.5">
                  {support.officeHours}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mt-0.5">
                <IconMapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  Residency Location
                </h3>
                <p className="text-gray-800 dark:text-gray-200 text-sm font-medium mt-0.5">
                  {support.locationAddress}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Self-Service & FAQ Portal */}
        <div className="bg-gradient-to-br from-brand-50/80 to-blue-50/50 dark:from-brand-950/30 dark:to-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-brand-100/80 dark:border-brand-900/40 flex flex-col justify-between space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300 uppercase tracking-wider">
              Self-Service Knowledge Base
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {t.visitFAQ || 'Frequently Asked Questions'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 leading-relaxed">
              {support.faqDescription}
            </p>

            <div className="mt-6 space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-brand-600 font-bold">✓</span> How to submit passport & visa documents
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-600 font-bold">✓</span> Security deposit rollover and receipt guidance
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-600 font-bold">✓</span> Room keys, check-in, and tenancy agreements
              </div>
            </div>
          </div>

          <button 
            onClick={handleOpenFaq}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
          >
            Open FAQ Knowledge Base ↗
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
