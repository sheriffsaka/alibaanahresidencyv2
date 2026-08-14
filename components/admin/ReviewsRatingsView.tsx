import React, { useState } from 'react';

interface Review {
  id: number;
  student_name: string;
  room_category: string;
  rating: number;
  date: string;
  comment: string;
  status: 'Published' | 'Pending Moderation' | 'Archived';
  is_featured: boolean;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    student_name: 'Zayd Al-Otaibi',
    room_category: 'Premium 1 Private Room',
    rating: 5,
    date: '2026-03-01',
    comment: 'The proximity to the Al-Ibaanah center is unbeatable. Clean room, super fast Wi-Fi, and excellent study quietness.',
    status: 'Published',
    is_featured: true
  },
  {
    id: 2,
    student_name: 'Bilal Khan',
    room_category: 'Standard Shared',
    rating: 5,
    date: '2026-02-15',
    comment: 'Very supportive administration and smooth booking process with honest deposit rollover policy.',
    status: 'Published',
    is_featured: true
  },
  {
    id: 3,
    student_name: 'Ibrahim Diallo',
    room_category: 'Premium 2 Private Room',
    rating: 4,
    date: '2026-02-10',
    comment: 'Great facilities and very clean kitchen. AC works wonderfully.',
    status: 'Published',
    is_featured: false
  }
];

export const ReviewsRatingsView: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const toggleFeatured = (id: number) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, is_featured: !r.is_featured } : r))
    );
  };

  const toggleStatus = (id: number) => {
    setReviews(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'Published' ? 'Archived' : 'Published'
            }
          : r
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Student Rating</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-amber-500">{averageRating}</span>
            <span className="text-sm font-bold text-gray-400">/ 5.0 ⭐</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Published Testimonials</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {reviews.filter(r => r.status === 'Published').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Featured on Landing Page</p>
          <p className="text-2xl font-black text-brand-600 mt-1">
            {reviews.filter(r => r.is_featured).length}
          </p>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ⭐ Student Reviews & Feedback
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage residency student ratings, testimonials, and landing page showcase features.
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {reviews.map(review => (
            <div key={review.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{review.student_name}</span>
                  <span className="text-xs text-amber-500 font-bold">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-bold px-2 py-0.5 rounded">
                    {review.room_category}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{review.comment}"
                </p>
                <p className="text-[10px] text-gray-400 font-mono">Date: {review.date}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFeatured(review.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    review.is_featured
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {review.is_featured ? '★ Featured on Web' : '☆ Not Featured'}
                </button>

                <button
                  onClick={() => toggleStatus(review.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    review.status === 'Published'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-600'
                  }`}
                >
                  {review.status}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsRatingsView;
