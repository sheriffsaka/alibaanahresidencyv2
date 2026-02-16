
import React, { createContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppContextType, Language, Page, User, Room, Booking, BookingStatus, CmsContent, Activity, AcademicTerm, BookingPackage } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_CMS: CmsContent = {
  heroTitle: 'Your Home for Knowledge and Comfort',
  heroSubtitle: 'Secure, comfortable, and studious living, just moments away from the Al-Ibaanah Arabic Center.',
  heroImageUrl: 'https://res.cloudinary.com/di7okmjsx/image/upload/v1770400290/heroalibaanah_ghqtok.jpg',
  features: [
    { id: 1, title: 'Prime Location', desc: 'Located minutes from campus, making your commute to classes quick and easy.' },
    { id: 2, title: 'Fully Furnished', desc: 'Our rooms come equipped with all the essentials for a comfortable and productive stay.' },
    { id: 3, title: 'Safe & Secure', desc: '24/7 security and a supportive environment, so you can focus on your studies with peace of mind.' }
  ],
  faqs: [
    { id: 1, q: 'What booking packages are available?', a: 'We offer flexible booking packages for 3, 6 and 12 months to align with the academic terms of Al-Ibaanah Arabic Center. Discounts are available for longer stays.' },
    { id: 2, q: 'Are the rooms furnished?', a: 'Yes, all our rooms are fully furnished with a bed, desk, chair, wardrobe, and air conditioning. Suites include a private kitchenette and living area.' },
    { id: 3, q: 'What amenities are included?', a: 'All residents have access to high-speed Wi-Fi. Depending on the room type, amenities include private or shared bathrooms. Common areas are also available for all students.' },
    { id: 4, q: 'How do I make a payment?', a: 'We accept secure online payments via Stripe and direct bank transfers. For bank transfers, you will need to upload proof of payment for verification.' },
  ]
};

const MOCK_ACTIVITIES: Activity[] = [
  { id: 1, user_id: 's1', type: 'booking', description: 'Booked Room 101A (BK1045)', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, user_id: 's1', type: 'payment', description: 'Payment for BK1045 confirmed by staff', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 3, user_id: 'admin', type: 'system', description: 'Updated Landing Page Content', timestamp: new Date(Date.now() - 7200000).toISOString() }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [page, setPageState] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // This state is now ONLY for the very first app load.
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const isInitialized = useRef(false);
  
  // App data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [bookingPackages, setBookingPackages] = useState<BookingPackage[]>([]);
  const [cmsContent, setCmsContent] = useState<CmsContent>(INITIAL_CMS);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);

  const updateUserSession = useCallback(async (session: Session | null) => {
    setSession(session);

    if (session?.user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.warn("Could not fetch user profile:", profileError.message);
            setUser(null);
            setBookings([]);
        } else {
            const loggedInUser = { id: profile.id, email: session.user.email, full_name: profile.full_name, role: profile.role, gender: profile.gender };
            setUser(loggedInUser);

            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*, rooms(room_number, type), profiles:student_id(full_name)');

            if (bookingsError) {
                console.error("Error fetching bookings:", bookingsError.message);
                setBookings([]);
            } else {
                const mappedBookings = bookingsData.map((b: any) => ({
                    ...b,
                    student_name: b.profiles?.full_name,
                }));
                setBookings(mappedBookings || []);
            }
        }
    } else {
      setUser(null);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    // Fetch public data that everyone can see. This runs once on mount.
    const fetchPublicData = async () => {
        const [roomsRes, termsRes, packagesRes] = await Promise.all([
            supabase.from('rooms').select('*'),
            supabase.from('academic_terms').select('*').eq('is_active', true),
            supabase.from('booking_packages').select('*').eq('is_active', true)
        ]);
        if (roomsRes.error) console.error('Error fetching rooms:', roomsRes.error);
        else setRooms(roomsRes.data || []);
        if (termsRes.error) console.error('Error fetching academic terms:', termsRes.error);
        else setAcademicTerms(termsRes.data || []);
        if (packagesRes.error) console.error('Error fetching booking packages:', packagesRes.error);
        else setBookingPackages(packagesRes.data || []);
    };
    fetchPublicData();

    // Set up the single source of truth for auth state.
    // onAuthStateChange fires with the initial session, and on every subsequent change.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await updateUserSession(session);

        // On the very first auth event (INITIAL_SESSION), dismiss the loading screen.
        // The ref ensures this only happens once.
        if (!isInitialized.current) {
            setLoading(false);
            isInitialized.current = true;
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [updateUserSession]);

  const setPage = useCallback((page: Page, room?: Room) => {
    setPageState(page);
    if (page === 'booking' && room) {
        setSelectedRoom(room);
    } else if (page !== 'booking') {
        setSelectedRoom(null);
    }
  }, []);

  const addBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const updateBookingStatus = (id: number, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateCmsContent = (content: Partial<CmsContent>) => {
    setCmsContent(prev => ({ ...prev, ...content }));
  };

  const addRoom = (newRoom: Room) => {
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (updatedRoom: Room) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    setActivities(prev => [{ ...activity, id: Date.now() }, ...prev].slice(0, 20));
  };

  const value = {
    language,
    setLanguage,
    page,
    setPage,
    user,
    selectedRoom,
    session,
    bookings,
    addBooking,
    updateBookingStatus,
    cmsContent,
    updateCmsContent,
    rooms,
    addRoom,
    updateRoom,
    activities,
    addActivity,
    academicTerms,
    bookingPackages,
  };

  if (loading) {
      // This will now only appear on the very first application load.
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="relative inline-flex">
                <div className="w-16 h-16 bg-blue-600 rounded-full opacity-20 animate-ping absolute"></div>
                <svg className="h-16 w-16 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="mt-6 text-xl font-bold text-gray-800 dark:text-white tracking-tight animate-pulse">Initializing Portal...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Setting up your secure environment</p>
          </div>
        </div>
      );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
