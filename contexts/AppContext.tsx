
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
  },
  howToVideos: {
    en: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    ar: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
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
  const [students, setStudents] = useState<User[]>([]);
  const bookingsSubscriptionRef = useRef<any>(null);

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
            console.warn("Could not fetch user profile after retries, attempting to create one...");
            
            // Try to create the profile if it's missing (self-healing)
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: session.user.id,
                    full_name: session.user.user_metadata?.full_name || 'User',
                    role: (session.user.user_metadata?.role as any) || 'student',
                    gender: session.user.user_metadata?.gender
                })
                .select()
                .maybeSingle();

            if (newProfile) {
                console.log("Profile created successfully via self-healing.");
                profile = newProfile;
            } else {
                console.error("Failed to create profile via self-healing:", insertError?.message);
                // Fallback: Create a temporary user object so the app doesn't stay stuck on the loader
                const fallbackUser = { 
                    id: session.user.id, 
                    email: session.user.email, 
                    full_name: session.user.user_metadata?.full_name || 'Student', 
                    role: 'student' as const, 
                    gender: session.user.user_metadata?.gender as any
                };
                setUser(fallbackUser);
                setBookings([]);
                return; // Exit early as we don't have a real profile to fetch bookings for
            }
        }

        // If we reach here, we have a profile (either fetched or created)
        const loggedInUser = { id: profile.id, email: session.user.email, full_name: profile.full_name, role: profile.role, gender: profile.gender };
        setUser(loggedInUser);

        // Role-aware booking query
        let query = supabase
            .from('bookings')
            .select('*, rooms(room_number, type), profiles:student_id(full_name)')
            .order('booked_at', { ascending: false });
        
        if (profile.role === 'student') {
            query = query.eq('student_id', session.user.id);
        } else {
            // If admin, fetch all students for the booking form
            const { data: studentsData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student');
            
            if (studentsData) {
                setStudents(studentsData.map((p: any) => ({
                    id: p.id,
                    email: '', // Email is not in profiles
                    full_name: p.full_name,
                    role: p.role,
                    gender: p.gender
                })));
            }
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
      } catch (err) {
        console.error("Unexpected error in updateUserSession:", err);
        setUser(null);
        setBookings([]);
        setStudents([]);
      }
    } else {
      setUser(null);
      setBookings([]);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    if (user) {
        // Real-time subscription for bookings
        if (bookingsSubscriptionRef.current) {
            supabase.removeChannel(bookingsSubscriptionRef.current);
        }

        bookingsSubscriptionRef.current = supabase
            .channel('bookings-changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'bookings' 
            }, async (payload) => {
                console.log('Real-time booking update:', payload);
                
                if (payload.eventType === 'INSERT') {
                    // Fetch the full booking with joins
                    const { data, error } = await supabase
                        .from('bookings')
                        .select('*, rooms(room_number, type), profiles:student_id(full_name)')
                        .eq('id', payload.new.id)
                        .single();
                    
                    if (data && !error) {
                        const mapped = { ...data, student_name: data.profiles?.full_name };
                        // Only add if it belongs to the student or if user is admin
                        if (user.role !== 'student' || data.student_id === user.id) {
                            setBookings(prev => {
                                if (prev.some(b => b.id === mapped.id)) return prev;
                                return [mapped, ...prev];
                            });
                        }
                    }
                } else if (payload.eventType === 'UPDATE') {
                    // Fetch updated data to get joins
                    const { data, error } = await supabase
                        .from('bookings')
                        .select('*, rooms(room_number, type), profiles:student_id(full_name)')
                        .eq('id', payload.new.id)
                        .single();
                    
                    if (data && !error) {
                        const mapped = { ...data, student_name: data.profiles?.full_name };
                        setBookings(prev => prev.map(b => b.id === mapped.id ? mapped : b));
                    }
                } else if (payload.eventType === 'DELETE') {
                    setBookings(prev => prev.filter(b => b.id !== payload.old.id));
                }
            })
            .subscribe();
    } else {
        if (bookingsSubscriptionRef.current) {
            supabase.removeChannel(bookingsSubscriptionRef.current);
            bookingsSubscriptionRef.current = null;
        }
    }

    return () => {
        if (bookingsSubscriptionRef.current) {
            supabase.removeChannel(bookingsSubscriptionRef.current);
            bookingsSubscriptionRef.current = null;
        }
    };
  }, [user]);

  const fetchPublicData = useCallback(async () => {
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
                    : INITIAL_CMS.contractTemplates,
                howToVideos: hasData(dbCms.how_to_videos || dbCms.howToVideos)
                    ? (dbCms.how_to_videos || dbCms.howToVideos)
                    : INITIAL_CMS.howToVideos
              });
            }
        } catch (err) {
            console.error('Unexpected error fetching public data:', err);
        }
  }, []);

  const initializeApp = useCallback(async () => {
        try {
            // 1. Fetch public data
            await fetchPublicData();
            
            // 2. Check session
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            
            if (authError) {
                console.error("Auth session error:", authError.message);
                // If the refresh token is invalid or not found, clear the local session
                if (authError.message.toLowerCase().includes('refresh token') || authError.message.includes('refresh_token_not_found')) {
                    console.warn("Stale refresh token detected. Clearing session...");
                    await supabase.auth.signOut();
                }
            }

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
  }, [fetchPublicData, updateUserSession]);

  useEffect(() => {
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
  }, [initializeApp, updateUserSession]);

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
        // Remove the 'rooms', 'profiles', and 'id' objects before inserting into Supabase
        // We let Supabase generate the ID
        const { rooms, profiles, student_name, id, ...bookingToInsert } = newBooking as any;
        
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
        return { success: true, data: mappedBooking };
    } catch (err: any) {
        console.error("Error adding booking to Supabase:", err.message);
        return { success: false, error: err.message };
    }
  };

  const updateBookingStatus = async (id: number, status: BookingStatus) => {
    try {
        const booking = bookings.find(b => b.id === id);
        if (!booking) throw new Error("Booking not found");

        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;

        // If status changed to CONFIRMED or OCCUPIED, increment occupied_slots
        if (status === BookingStatus.CONFIRMED || status === BookingStatus.OCCUPIED) {
            const room = rooms.find(r => r.id === booking.room_id);
            if (room) {
                const newOccupied = (room.occupied_slots || 0) + 1;
                await supabase.from('rooms').update({ occupied_slots: newOccupied }).eq('id', room.id);
                setRooms(prev => prev.map(r => r.id === room.id ? { ...r, occupied_slots: newOccupied } : r));
            }
        }

        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        return { success: true };
    } catch (err: any) {
        console.error("Error updating booking status in Supabase:", err.message);
        return { success: false, error: err.message };
    }
  };

  const updateBooking = async (id: number, updates: Partial<Booking>) => {
    try {
        // Strip joined fields that might be in the updates object
        const { rooms, profiles, ...dbUpdates } = updates as any;
        
        const { error } = await supabase
            .from('bookings')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        return { success: true };
    } catch (err: any) {
        console.error("Error updating booking in Supabase:", err.message);
        return { success: false, error: err.message };
    }
  };

  const updateCmsContent = async (content: Partial<CmsContent>) => {
    try {
        const updatedCms = { ...cmsContent, ...content };
        setCmsContent(updatedCms);

        // Get the property ID (assume the first one for now)
        const { data: propData } = await supabase.from('properties').select('id').limit(1).single();
        if (!propData) throw new Error("No property found");

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
            how_to_videos: updatedCms.howToVideos,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('cms_content')
            .upsert(dbCms, { onConflict: 'property_id' });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error("Error updating CMS content in Supabase:", err.message);
        return { success: false, error: err.message };
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
        console.log("Adding room to Supabase:", newRoom);
        const { data: propData } = await supabase.from('properties').select('id').limit(1).single();
        if (!propData) throw new Error("No property found");

        // Strip fields that shouldn't be in the insert payload
        const { id, created_at, ...roomData } = newRoom as any;
        
        const roomToInsert = {
            ...roomData,
            property_id: propData.id,
        };

        const { data, error } = await supabase
            .from('rooms')
            .insert([roomToInsert])
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            throw error;
        }
        
        console.log("Room added successfully:", data);
        setRooms(prev => [...prev, data]);
        return { success: true };
    } catch (err: any) {
        console.error("Error adding room to Supabase:", err);
        return { success: false, error: err.message || JSON.stringify(err) };
    }
  };

  const updateRoom = async (updatedRoom: Room) => {
    try {
        console.log("Updating room in Supabase:", updatedRoom.id, updatedRoom);
        // Strip fields that shouldn't be in the update payload
        const { id, created_at, property_id, ...updateData } = updatedRoom as any;

        const { error, data } = await supabase
            .from('rooms')
            .update(updateData)
            .eq('id', updatedRoom.id)
            .select();

        if (error) {
            console.error("Supabase update error:", error);
            throw error;
        }
        
        console.log("Room updated successfully:", data);
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updateData } : r));
        return { success: true };
    } catch (err: any) {
        console.error("Error updating room in Supabase:", err);
        return { success: false, error: err.message || JSON.stringify(err) };
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
    students,
    academicTerms,
    bookingPackages,
  };

  return (
    <AppContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="relative inline-flex">
                <div className="w-16 h-16 bg-brand-600 rounded-full opacity-20 animate-ping absolute"></div>
                <svg className="h-16 w-16 text-brand-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
