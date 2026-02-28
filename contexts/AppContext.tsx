
import React, { createContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppContextType, Language, Page, User, Room, Booking, BookingStatus, CmsContent, Activity, AcademicTerm, BookingPackage, AccommodationType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_CMS: CmsContent = {
  logoUrl: 'https://res.cloudinary.com/di7okmjsx/image/upload/v1740321960/al-ibaanah-logo_new.png',
  hero: {
    en: { title: 'Your Home for Knowledge and Comfort', subtitle: 'Secure, comfortable, and studious living, just moments away from the Al-Ibaanah Arabic Center.' },
    ar: { title: 'بيتك للمعرفة والراحة', subtitle: 'سكن آمن، مريح، ومناسب للدراسة، على بعد لحظات من مركز الإبانة للغة العربية.' }
  },
  heroImageUrl: 'https://res.cloudinary.com/di7okmjsx/image/upload/v1770400290/heroalibaanah_ghqtok.jpg',
  features: {
    en: [
      { id: 1, title: 'Prime Location', desc: 'Located minutes from campus, making your commute to classes quick and easy.' },
      { id: 2, title: 'Fully Furnished', desc: 'Our rooms come equipped with all the essentials for a comfortable and productive stay.' },
      { id: 3, title: 'Safe & Secure', desc: '24/7 security and a supportive environment, so you can focus on your studies with peace of mind.' }
    ],
    ar: [
      { id: 1, title: 'موقع متميز', desc: 'يقع على بعد دقائق من المركز، مما يجعل وصولك إلى الفصول الدراسية سريعًا وسهلاً.' },
      { id: 2, title: 'مفروشة بالكامل', desc: 'غرفنا مجهزة بجميع الأساسيات لإقامة مريحة ومنتجة.' },
      { id: 3, title: 'آمن ومضمون', desc: 'أمن على مدار 24 ساعة وبيئة داعمة، حتى تتمكن من التركيز على دراستك براحة بال.' }
    ]
  },
  faqs: {
    en: [
      { id: 1, q: 'What booking packages are available?', a: 'We offer flexible booking packages for 3, 6 and 12 months.' },
      { id: 2, q: 'Are the rooms furnished?', a: 'Yes, all our rooms are fully furnished.' }
    ],
    ar: [
      { id: 1, q: 'ما هي باقات الحجز المتاحة؟', a: 'نحن نقدم باقات حجز مرنة لمدة 3، 6، و 12 شهرًا.' },
      { id: 2, q: 'هل الغرف مفروشة؟', a: 'نعم، جميع غرفنا مفروشة بالكامل.' }
    ]
  },
  contractTemplates: {
    [AccommodationType.STANDARD_SHARED]: {
      en: 'This is the English contract for Standard Shared rooms...',
      fr: 'Ceci est le contrat français pour les chambres Standard Shared...',
      ru: 'Это русский контракт для комнат Standard Shared...'
    }
  }
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
      try {
        // Retry logic for profile fetching (useful right after registration)
        let profile = null;
        let profileError = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (data) {
                profile = data;
                break;
            }
            
            profileError = error;
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
        }

        if (!profile) {
            console.warn("Could not fetch user profile after retries:", profileError?.message || "Not found");
            setUser(null);
            setBookings([]);
        } else {
            const loggedInUser = { id: profile.id, email: session.user.email, full_name: profile.full_name, role: profile.role, gender: profile.gender };
            setUser(loggedInUser);

            // Role-aware booking query
            let query = supabase
                .from('bookings')
                .select('*, rooms(room_number, type), profiles:student_id(full_name)');
            
            if (profile.role === 'student') {
                query = query.eq('student_id', session.user.id);
            }

            const { data: bookingsData, error: bookingsError } = await query;

            if (bookingsError) {
                console.error("Error fetching bookings:", bookingsError.message);
                setBookings([]);
            } else {
                const mappedBookings = (bookingsData || []).map((b: any) => ({
                    ...b,
                    student_name: b.profiles?.full_name,
                }));
                setBookings(mappedBookings);
            }
        }
      } catch (err) {
        console.error("Unexpected error in updateUserSession:", err);
        setUser(null);
        setBookings([]);
      }
    } else {
      setUser(null);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    // Fetch public data that everyone can see. This runs once on mount.
    const fetchPublicData = async () => {
        try {
            console.log("Fetching public data...");
            const [roomsRes, termsRes, packagesRes, cmsRes] = await Promise.all([
                supabase.from('rooms').select('*'),
                supabase.from('academic_terms').select('*').eq('is_active', true),
                supabase.from('booking_packages').select('*').eq('is_active', true),
                supabase.from('cms_content').select('*').limit(1).maybeSingle()
            ]);
            
            if (roomsRes.error) console.error('Error fetching rooms:', roomsRes.error.message);
            else {
                console.log(`Fetched ${roomsRes.data?.length || 0} rooms`);
                setRooms(roomsRes.data || []);
            }
            
            if (termsRes.error) console.error('Error fetching academic terms:', termsRes.error.message);
            else setAcademicTerms(termsRes.data || []);
            
            if (packagesRes.error) console.error('Error fetching booking packages:', packagesRes.error.message);
            else setBookingPackages(packagesRes.data || []);
            
            if (cmsRes.data) {
              const dbCms = cmsRes.data;
              console.log("Fetched CMS content from DB");
              setCmsContent({
                ...INITIAL_CMS,
                logoUrl: dbCms.logo_url || dbCms.logoUrl || INITIAL_CMS.logoUrl,
                heroImageUrl: dbCms.hero_image_url || dbCms.heroImageUrl || INITIAL_CMS.heroImageUrl,
                hero: {
                    en: { 
                        title: dbCms.hero_title || (dbCms.hero?.en?.title) || INITIAL_CMS.hero.en?.title || '', 
                        subtitle: dbCms.hero_subtitle || (dbCms.hero?.en?.subtitle) || INITIAL_CMS.hero.en?.subtitle || '' 
                    },
                    ar: dbCms.hero?.ar || INITIAL_CMS.hero.ar
                },
                features: dbCms.features || INITIAL_CMS.features,
                faqs: dbCms.faqs || INITIAL_CMS.faqs,
                contractTemplates: dbCms.contract_templates || dbCms.contractTemplates || INITIAL_CMS.contractTemplates
              });
            } else if (cmsRes.error) {
                console.warn('CMS content not found or error:', cmsRes.error.message);
            }
        } catch (err) {
            console.error('Unexpected error fetching public data:', err);
        }
    };
    fetchPublicData();

    // Safety timeout: If initialization takes more than 10 seconds, force dismiss the loader
    const safetyTimeout = setTimeout(() => {
      if (!isInitialized.current) {
        console.warn("Initialization safety timeout reached. Forcing loader dismissal.");
        setLoading(false);
        isInitialized.current = true;
      }
    }, 10000);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check complete");
      updateUserSession(session);
      
      // Dismiss loader as soon as we have the initial auth state
      if (!isInitialized.current) {
        setLoading(false);
        isInitialized.current = true;
        clearTimeout(safetyTimeout);
      }
    }).catch(err => {
      console.error("Error getting initial session:", err);
      if (!isInitialized.current) {
        setLoading(false);
        isInitialized.current = true;
        clearTimeout(safetyTimeout);
      }
    });

    // Set up the single source of truth for auth state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state change detected:", _event);
        await updateUserSession(session);
        
        if (!isInitialized.current) {
            setLoading(false);
            isInitialized.current = true;
            clearTimeout(safetyTimeout);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
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

  const updateBooking = (id: number, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const updateCmsContent = (content: Partial<CmsContent>) => {
    setCmsContent(prev => ({ ...prev, ...content }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBookings([]);
    setPage('home');
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
    logout,
    bookings,
    addBooking,
    updateBookingStatus,
    updateBooking,
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

  return (
    <AppContext.Provider value={value}>
      {loading ? (
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
      ) : children}
    </AppContext.Provider>
  );
};
