
import React, { createContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppContextType, Language, Page, User, Room, Booking, BookingStatus, CmsContent, Activity, AcademicTerm, BookingPackage, AccommodationType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const INITIAL_CMS: CmsContent = {
  logoUrl: 'https://res.cloudinary.com/di7okmjsx/image/upload/v1771428370/alibaanahlogo1_iprhyj.png',
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
  const hasData = (obj: any) => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
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
            // Fallback: Create a temporary user object so the app doesn't stay stuck on the loader
            // This allows the user to at least see the dashboard, though some features might be limited.
            const fallbackUser = { 
                id: session.user.id, 
                email: session.user.email, 
                full_name: session.user.user_metadata?.full_name || 'Student', 
                role: 'student' as const, 
                gender: session.user.user_metadata?.gender as any
            };
            setUser(fallbackUser);
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
    const fetchPublicData = async () => {
        try {
            console.log("Fetching public data...");
            const [roomsRes, termsRes, packagesRes, cmsRes, activitiesRes] = await Promise.all([
                supabase.from('rooms').select('*'),
                supabase.from('academic_terms').select('*').eq('is_active', true),
                supabase.from('booking_packages').select('*').eq('is_active', true),
                supabase.from('cms_content').select('*').limit(1).maybeSingle(),
                supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(20)
            ]);
            
            if (roomsRes.error) console.error('Error fetching rooms:', roomsRes.error.message);
            else setRooms(roomsRes.data || []);
            
            if (termsRes.error) console.error('Error fetching academic terms:', termsRes.error.message);
            else setAcademicTerms(termsRes.data || []);
            
            if (packagesRes.error) console.error('Error fetching booking packages:', packagesRes.error.message);
            else setBookingPackages(packagesRes.data || []);

            if (activitiesRes.data) {
                const mappedActivities = activitiesRes.data.map((act: any) => ({
                    id: act.id,
                    user_id: act.user_id,
                    type: act.action as any,
                    description: act.details?.description || act.action,
                    timestamp: act.created_at
                }));
                setActivities(mappedActivities);
            }
            
            if (cmsRes.data) {
              const dbCms = cmsRes.data;
              const normalizeCmsData = (data: any, fallback: any) => {
                if (!hasData(data)) return fallback;
                if (Array.isArray(data)) return { ...fallback, en: data };
                return { ...fallback, ...data };
              };

              setCmsContent({
                ...INITIAL_CMS,
                logoUrl: dbCms.logo_url || dbCms.logoUrl || INITIAL_CMS.logoUrl,
                heroImageUrl: dbCms.hero_image_url || dbCms.heroImageUrl || INITIAL_CMS.heroImageUrl,
                hero: hasData(dbCms.hero) ? {
                    ...INITIAL_CMS.hero,
                    ...dbCms.hero,
                    en: { 
                        title: dbCms.hero_title || dbCms.hero?.en?.title || INITIAL_CMS.hero.en?.title || '', 
                        subtitle: dbCms.hero_subtitle || dbCms.hero?.en?.subtitle || INITIAL_CMS.hero.en?.subtitle || '' 
                    }
                } : {
                    ...INITIAL_CMS.hero,
                    en: {
                        title: dbCms.hero_title || INITIAL_CMS.hero.en?.title || '',
                        subtitle: dbCms.hero_subtitle || INITIAL_CMS.hero.en?.subtitle || ''
                    }
                },
                features: normalizeCmsData(dbCms.features, INITIAL_CMS.features),
                faqs: normalizeCmsData(dbCms.faqs, INITIAL_CMS.faqs),
                contractTemplates: hasData(dbCms.contract_templates || dbCms.contractTemplates) 
                    ? (dbCms.contract_templates || dbCms.contractTemplates) 
                    : INITIAL_CMS.contractTemplates
              });
            }
        } catch (err) {
            console.error('Unexpected error fetching public data:', err);
        }
    };

    const initializeApp = async () => {
        try {
            // 1. Fetch public data
            await fetchPublicData();
            
            // 2. Check session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await updateUserSession(session);
            }
        } catch (err) {
            console.error("App initialization failed:", err);
        } finally {
            if (!isInitialized.current) {
                setLoading(false);
                isInitialized.current = true;
            }
        }
    };

    initializeApp();

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (!isInitialized.current) {
        console.warn("Initialization safety timeout reached.");
        setLoading(false);
        isInitialized.current = true;
      }
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserSession(session);
    });

    return () => {
        subscription.unsubscribe();
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

  const addBooking = async (newBooking: Booking) => {
    try {
        // Remove the 'rooms' and 'profiles' objects before inserting into Supabase
        const { rooms, profiles, student_name, ...bookingToInsert } = newBooking as any;
        
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingToInsert])
            .select('*, rooms(room_number, type), profiles:student_id(full_name)')
            .single();

        if (error) throw error;
        
        const mappedBooking = {
            ...data,
            student_name: data.profiles?.full_name,
        };
        setBookings(prev => [mappedBooking, ...prev]);
    } catch (err: any) {
        console.error("Error adding booking to Supabase:", err.message);
        // Fallback to local state if DB insert fails (for demo purposes, though ideally we should show an error)
        setBookings(prev => [newBooking, ...prev]);
    }
  };

  const updateBookingStatus = async (id: number, status: BookingStatus) => {
    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (err: any) {
        console.error("Error updating booking status in Supabase:", err.message);
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  const updateBooking = async (id: number, updates: Partial<Booking>) => {
    try {
        const { error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (err: any) {
        console.error("Error updating booking in Supabase:", err.message);
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    }
  };

  const updateCmsContent = async (content: Partial<CmsContent>) => {
    try {
        const updatedCms = { ...cmsContent, ...content };
        setCmsContent(updatedCms);

        // Get the property ID (assume the first one for now)
        const { data: propData } = await supabase.from('properties').select('id').limit(1).single();
        if (!propData) return;

        // Map CmsContent object back to DB columns
        const dbCms = {
            property_id: propData.id,
            logo_url: updatedCms.logoUrl,
            hero_image_url: updatedCms.heroImageUrl,
            hero_title: updatedCms.hero.en?.title,
            hero_subtitle: updatedCms.hero.en?.subtitle,
            features: updatedCms.features,
            faqs: updatedCms.faqs,
            contract_templates: updatedCms.contractTemplates,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('cms_content')
            .upsert(dbCms, { onConflict: 'property_id' });

        if (error) throw error;
    } catch (err: any) {
        console.error("Error updating CMS content in Supabase:", err.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBookings([]);
    setPage('home');
  };

  const addRoom = async (newRoom: Room) => {
    try {
        const { data: propData } = await supabase.from('properties').select('id').limit(1).single();
        if (!propData) throw new Error("No property found");

        const roomToInsert = {
            ...newRoom,
            property_id: propData.id,
        };
        // Remove ID if it's 0 or temporary
        if (roomToInsert.id === 0 || roomToInsert.id > 1000000000) {
            delete (roomToInsert as any).id;
        }

        const { data, error } = await supabase
            .from('rooms')
            .insert([roomToInsert])
            .select()
            .single();

        if (error) throw error;
        setRooms(prev => [...prev, data]);
    } catch (err: any) {
        console.error("Error adding room to Supabase:", err.message);
        setRooms(prev => [...prev, newRoom]);
    }
  };

  const updateRoom = async (updatedRoom: Room) => {
    try {
        const { error } = await supabase
            .from('rooms')
            .update(updatedRoom)
            .eq('id', updatedRoom.id);

        if (error) throw error;
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    } catch (err: any) {
        console.error("Error updating room in Supabase:", err.message);
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    }
  };

  const addActivity = async (activity: Omit<Activity, 'id'>) => {
    try {
        const { error } = await supabase
            .from('admin_audit_log')
            .insert([{
                user_id: activity.user_id,
                action: activity.type,
                details: { description: activity.description },
                created_at: activity.timestamp
            }]);

        if (error) throw error;
        setActivities(prev => [{ ...activity, id: Date.now() }, ...prev].slice(0, 20));
    } catch (err: any) {
        console.error("Error adding audit log to Supabase:", err.message);
        setActivities(prev => [{ ...activity, id: Date.now() }, ...prev].slice(0, 20));
    }
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
