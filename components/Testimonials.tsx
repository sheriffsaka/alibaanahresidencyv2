import React, { useState } from 'react';
import { IconStar, IconQuote, IconCheckCircle, IconBuilding } from './Icon';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';

interface Testimonial {
  id: string;
  name: string;
  countryKey: string;
  flag: string;
  courseKey: string;
  roomCategory: string;
  roomType: 'Shared' | 'Private';
  stayDurationKey: string;
  rating: number;
  quoteKey: string;
  verified: boolean;
  avatarColor: string;
}

const TESTIMONIALS_CONFIG: Testimonial[] = [
  {
    id: '1',
    name: 'Abdullah K.',
    countryKey: 'testimonial_1_country',
    flag: '🇬🇧',
    courseKey: 'testimonial_1_course',
    roomCategory: 'Premium 1',
    roomType: 'Shared',
    stayDurationKey: 'testimonial_1_duration',
    rating: 5,
    quoteKey: 'testimonial_1_quote',
    verified: true,
    avatarColor: 'from-amber-600 to-amber-700',
  },
  {
    id: '2',
    name: 'Ibrahim M.',
    countryKey: 'testimonial_2_country',
    flag: '🇺🇸',
    courseKey: 'testimonial_2_course',
    roomCategory: 'Premium 2',
    roomType: 'Private',
    stayDurationKey: 'testimonial_2_duration',
    rating: 5,
    quoteKey: 'testimonial_2_quote',
    verified: true,
    avatarColor: 'from-brand-600 to-indigo-700',
  },
  {
    id: '3',
    name: 'Yusuf T.',
    countryKey: 'testimonial_3_country',
    flag: '🇫🇷',
    courseKey: 'testimonial_3_course',
    roomCategory: 'Premium 3',
    roomType: 'Shared',
    stayDurationKey: 'testimonial_3_duration',
    rating: 5,
    quoteKey: 'testimonial_3_quote',
    verified: true,
    avatarColor: 'from-emerald-600 to-teal-700',
  },
  {
    id: '4',
    name: 'Zayd R.',
    countryKey: 'testimonial_4_country',
    flag: '🇨🇦',
    courseKey: 'testimonial_4_course',
    roomCategory: 'Premium 1',
    roomType: 'Private',
    stayDurationKey: 'testimonial_4_duration',
    rating: 5,
    quoteKey: 'testimonial_4_quote',
    verified: true,
    avatarColor: 'from-purple-600 to-indigo-800',
  },
];

const Testimonials: React.FC = () => {
  const t = useTranslation();
  const { accommodationCategories } = useApp();
  const [filter, setFilter] = useState<string>('All');

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
    ? TESTIMONIALS_CONFIG
    : TESTIMONIALS_CONFIG.filter(item => item.roomCategory.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-8 animate-fade-in text-start">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/60">
          <IconStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{t.testimonials_badge || 'Verified Student Reviews'}</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {t.testimonials_title || 'Student Testimonials & Experiences'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {t.testimonials_sub || 'Authentic reflections and feedback from international students pursuing Arabic and Islamic studies at Al-Ibaanah in Nasr City, Cairo.'}
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
              {cat === 'All' ? (t.testimonials_filter_all || 'All Accommodations') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTestimonials.map((testimonial) => {
          const quote = (t as any)[testimonial.quoteKey] || '';
          const course = (t as any)[testimonial.courseKey] || '';
          const country = (t as any)[testimonial.countryKey] || '';
          const stayDuration = (t as any)[testimonial.stayDurationKey] || '';
          const roomTypeLabel = testimonial.roomType === 'Shared' 
            ? (t.room_type_shared || 'Shared Room') 
            : (t.room_type_private || 'Private Room');

          return (
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
                      {testimonial.roomCategory} &bull; {roomTypeLabel}
                    </span>
                  </div>
                </div>

                {/* Quote text */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  &ldquo;{quote}&rdquo;
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
                      <span title={country} className="text-sm">{testimonial.flag}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      {course}
                    </p>
                  </div>
                </div>

                <div className="text-end flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    <IconCheckCircle className="w-3 h-3" />
                    {stayDuration}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cohort Verification Note */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-start">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {t.testimonials_verified_note || 'All reviews are submitted by verified enrolled residents.'}
          </span>
        </div>
        <span className="text-[11px] font-medium">{t.testimonials_footer_sub || 'Al-Ibaanah Student Residences • 7th District, Nasr City'}</span>
      </div>
    </div>
  );
};

export default Testimonials;

