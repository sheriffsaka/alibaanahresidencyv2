import React, { useMemo } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import FAQ from '../components/FAQ';
import { IconMapPin, IconShieldCheck, IconSofa } from '../components/Icon';
import RoomGallery from '../components/RoomGallery';
import { useApp } from '../hooks/useApp';
import { INITIAL_CMS } from '../contexts/AppContext';

const HomePage: React.FC = () => {
  const t = useTranslation();
  const { cmsContent, rooms, user, language, loading, setPage } = useApp();

  const currentHero = (cmsContent.hero || {})[language] || (cmsContent.hero || {})['en'] || { title: '', subtitle: '' };
  const currentFeatures = (cmsContent.features?.[language] && cmsContent.features[language]!.length > 0) 
    ? cmsContent.features[language]! 
    : (cmsContent.features?.['en'] && cmsContent.features['en']!.length > 0) 
        ? cmsContent.features['en']! 
        : INITIAL_CMS.features.en;
        
  const currentFaqs = (cmsContent.faqs?.[language] && cmsContent.faqs[language]!.length > 0) 
    ? cmsContent.faqs[language]! 
    : (cmsContent.faqs?.['en'] && cmsContent.faqs['en']!.length > 0) 
        ? cmsContent.faqs['en']! 
        : INITIAL_CMS.faqs.en;

  const visibleRooms = useMemo(() => {
    if (user?.role === 'student' && user.gender) {
      const userGender = user.gender.toLowerCase();
      return rooms.filter(room => {
        const roomGender = (room.gender_restriction || 'Any').toLowerCase();
        return roomGender === 'any' || roomGender === userGender;
      });
    }
    return rooms;
  }, [rooms, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading residency details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* 100% Expanded Hero Section */}
      <div className="relative min-h-[500px] sm:min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img className="h-full w-full object-cover" src={cmsContent.heroImageUrl} alt="Student residence" />
          <div className="absolute inset-0 bg-gray-900/40"></div>
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl uppercase">
            {currentHero.title}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-gray-200">
            {currentHero.subtitle}
          </p>
          
          {/* Distance Enrolment Advantage Highlight */}
          <div className="mt-8 bg-brand-600/90 backdrop-blur-sm border border-brand-400/30 p-4 rounded-xl max-w-xl mx-auto shadow-lg">
            <p className="text-white font-bold text-sm">
              ✨ Distance Enrolment Advantage: Secure your residency and activate your enrolment eligibility instantly!
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setPage('booking')}
              className="w-full sm:w-auto rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-brand-505 transition-all hover:scale-105 active:scale-95"
            >
              Book Your Room
            </button>
          </div>
        </div>
      </div>

      {/* Structured rest of the landing page in container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Ratings & Key Benefits Section */}
        <section className="bg-white dark:bg-gray-800 py-10 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-black text-brand-600">4.9/5</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cleanliness Rating</p>
            </div>
            <div>
              <p className="text-3xl font-black text-brand-600">5.0/5</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Safety Rating</p>
            </div>
            <div>
              <p className="text-3xl font-black text-brand-600">5 mins</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">From Centre</p>
            </div>
            <div>
              <p className="text-3xl font-black text-brand-600">100%</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enrolment Success</p>
            </div>
          </div>
        </section>

        {/* Room Gallery Section */}
        <section className="rounded-2xl overflow-hidden shadow-sm">
          <RoomGallery rooms={visibleRooms} />
        </section>
        
        {/* Why Choose Us Features Section */}
        <section className="space-y-12">
          <div className="text-center">
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white sm:text-3xl">Why Students Choose Al-Ibaanah</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {currentFeatures.map((feat, idx) => (
                <div key={feat.id} className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-50 dark:border-gray-750 shadow-sm">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-300 mb-4">
                        {idx === 0 && <IconMapPin className="h-6 w-6" />}
                        {idx === 1 && <IconSofa className="h-6 w-6" />}
                        {idx === 2 && <IconShieldCheck className="h-6 w-6" />}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{feat.title}</h3>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-gray-50/50 dark:bg-gray-800/20 p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
            <FAQ faqs={currentFaqs} />
        </section>
      </div>
    </div>
  );
};

export default HomePage;
