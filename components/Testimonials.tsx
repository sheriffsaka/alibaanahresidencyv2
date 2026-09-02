import React, { useState } from 'react';
import { IconStar, IconQuote, IconCheckCircle, IconBuilding } from './Icon';
import { useApp } from '../hooks/useApp';

interface Testimonial {
  id: string;
  name: string;
  country: string;
  flag: string;
  course: string;
  roomCategory: string;
  roomType: 'Shared' | 'Private';
  stayDuration: string;
  rating: number;
  quote: string;
  verified: boolean;
  avatarColor: string;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: '1',
    name: 'Abdullah K.',
    country: 'United Kingdom',
    flag: '🇬🇧',
    course: 'Arabic Language Immersion',
    roomCategory: 'Premium 1',
    roomType: 'Shared',
    stayDuration: '6 Months Stay',
    rating: 5,
    quote: 'The location is unbeatable — literally a 5-minute walk to Al-Ibaanah center. The high-speed Wi-Fi and air conditioning made long revision hours during the summer term very comfortable. Management is responsive whenever maintenance is requested.',
    verified: true,
    avatarColor: 'from-amber-600 to-amber-700',
  },
  {
    id: '2',
    name: 'Ibrahim M.',
    country: 'United States',
    flag: '🇺🇸',
    course: 'Advanced Nahw & Sarf Cohort',
    roomCategory: 'Premium 2',
    roomType: 'Private',
    stayDuration: '12 Months Stay',
    rating: 5,
    quote: 'Moving to Cairo from abroad was daunting, but having the tenancy verified and executed online prior to landing gave me complete peace of mind. The apartment is quiet, clean, and shared with serious fellow students.',
    verified: true,
    avatarColor: 'from-brand-600 to-indigo-700',
  },
  {
    id: '3',
    name: 'Yusuf T.',
    country: 'France',
    flag: '🇫🇷',
    course: 'Islamic Studies & Tajweed',
    roomCategory: 'Premium 3',
    roomType: 'Shared',
    stayDuration: '1 Academic Year',
    rating: 5,
    quote: 'Super clean accommodation with regular weekly cleaning included in the monthly rent. Having reliable utilities and a peaceful environment allowed me to focus fully on my Qur\'an and Arabic studies in Nasr City.',
    verified: true,
    avatarColor: 'from-emerald-600 to-teal-700',
  },
  {
    id: '4',
    name: 'Zayd R.',
    country: 'Canada',
    flag: '🇨🇦',
    course: 'Intensive Fiqh & Arabic',
    roomCategory: 'Premium 1',
    roomType: 'Private',
    stayDuration: '4 Months Stay',
    rating: 5,
    quote: 'The direct tenancy agreement download and payment verification workflow made securing distance enrolment straightforward. The landlord team is very welcoming and supportive of international students.',
    verified: true,
    avatarColor: 'from-purple-600 to-indigo-800',
  },
];

const Testimonials: React.FC = () => {
  const { language, accommodationCategories } = useApp();
  const [filter, setFilter] = useState<string>('All');

  const isArabic = language === 'ar';

  const filterCategories = React.useMemo(() => {
    const cats = new Set<string>(['All']);
    if (accommodationCategories && accommodationCategories.length > 0) {
      accommodationCategories.filter(c => c.status !== 'Inactive').forEach(c => cats.add(c.name));
    } else {
      ['Premium 1', 'Premium 2', 'Premium 3'].forEach(c => cats.add(c));
    }
    return Array.from(cats);
  }, [accommodationCategories]);

  const filteredTestimonials = filter === 'All'
    ? TESTIMONIALS_DATA
    : TESTIMONIALS_DATA.filter(t => t.roomCategory.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-8 animate-fade-in text-start">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/60">
          <IconStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{isArabic ? 'تقييمات وتجارب الطلاب' : 'Verified Student Reviews'}</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {isArabic ? 'آراء طلاب مركز الإبانة' : 'Student Testimonials & Experiences'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {isArabic 
            ? 'تجارب وانطباعات حقيقية من الطلاب الدوليين المقيمين في سكن الإبانة أثناء دراستهم في مدينة نصر بالقاهرة.'
            : 'Authentic reflections and feedback from international students pursuing Arabic and Islamic studies at Al-Ibaanah in Nasr City, Cairo.'}
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {filterCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-300'
              }`}
            >
              {cat === 'All' ? (isArabic ? 'جميع السكنات' : 'All Accommodations') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-7 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Background Decorative Quote Mark */}
            <IconQuote className="absolute -right-4 -bottom-4 w-28 h-28 text-gray-100 dark:text-gray-700/20 pointer-events-none group-hover:scale-105 transition-transform" />

            <div className="space-y-4 relative z-10">
              {/* Top Row: Stars & Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <IconStar key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/60">
                    <IconBuilding className="w-3 h-3" />
                    {testimonial.roomCategory} &bull; {testimonial.roomType}
                  </span>
                </div>
              </div>

              {/* Quote text */}
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </div>

            {/* Student Info Footer */}
            <div className="pt-5 mt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${testimonial.avatarColor} text-white font-black text-xs flex items-center justify-center shadow-sm flex-shrink-0`}>
                  {testimonial.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </span>
                    <span title={testimonial.country} className="text-sm">{testimonial.flag}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    {testimonial.course}
                  </p>
                </div>
              </div>

              <div className="text-end flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <IconCheckCircle className="w-3 h-3" />
                  {testimonial.stayDuration}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cohort Verification Note */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-start">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {isArabic ? 'جميع المراجعات والتقييمات معتمدة وموثقة من طلاب السكن الفعليين.' : 'All reviews are submitted by verified enrolled residents.'}
          </span>
        </div>
        <span className="text-[11px] font-medium">Al-Ibaanah Student Residences &bull; 7th District, Nasr City</span>
      </div>
    </div>
  );
};

export default Testimonials;
