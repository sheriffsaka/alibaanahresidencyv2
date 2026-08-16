
import React, { createContext, useState, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { AppContextType, Language, Page, User, Room, BedSpace, Booking, BookingStatus, CmsContent, Activity, AcademicTerm, BookingPackage, AccommodationType, DEFAULT_CATEGORY_MEDIA, CategoryMediaConfig, PublicOccupancy, AccommodationAddresses, DEFAULT_ACCOMMODATION_ADDRESSES } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_ROOMS: Room[] = [
  {
    id: 1,
    property_id: 'prop_1',
    room_number: 'Room 1 A',
    type: AccommodationType.STANDARD_SHARED,
    apartment_name: 'Standard',
    category: 'Standard',
    price_per_month: 250,
    capacity: 2,
    occupied_slots: 0,
    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'Study Desk'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/shared_bathroom1_hlxjdg.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Male'
  },
  {
    id: 2,
    property_id: 'prop_1',
    room_number: 'Room 2',
    type: AccommodationType.STANDARD_PRIVATE,
    apartment_name: 'Standard',
    category: 'Standard',
    price_per_month: 300,
    capacity: 1,
    occupied_slots: 0,
    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'Private Desk'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room2_zhd9uo.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Male'
  },
  {
    id: 3,
    property_id: 'prop_1',
    room_number: 'Room 1 A',
    type: AccommodationType.PREMIUM_SHARED,
    apartment_name: 'Premium 1',
    category: 'Premium',
    price_per_month: 350,
    capacity: 2,
    occupied_slots: 0,
    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'En-suite Bathroom'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Male'
  },
  {
    id: 4,
    property_id: 'prop_1',
    room_number: 'Room 2',
    type: AccommodationType.PREMIUM_PRIVATE,
    apartment_name: 'Premium 1',
    category: 'Premium',
    price_per_month: 400,
    capacity: 1,
    occupied_slots: 0,
    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'Private Balcony'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Female'
  },
  {
    id: 5,
    property_id: 'prop_1',
    room_number: 'Room 1 A',
    type: AccommodationType.PREMIUM_SHARED,
    apartment_name: 'Premium 2',
    category: 'Premium',
    price_per_month: 380,
    capacity: 2,
    occupied_slots: 0,
    amenities: ['High-speed Wi-Fi', 'In-room AC', 'Modern Kitchenette'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Female'
  },
  {
    id: 6,
    property_id: 'prop_1',
    room_number: 'Room 2',
    type: AccommodationType.PREMIUM_PRIVATE,
    apartment_name: 'Premium 2',
    category: 'Premium',
    price_per_month: 450,
    capacity: 1,
    occupied_slots: 0,
    amenities: ['High-speed Wi-Fi', 'In-room AC', 'Resident Lounge Access'],
    image_urls: ['https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg'],
    is_available: true,
    created_at: new Date().toISOString(),
    gender_restriction: 'Any'
  }
];

export const DEFAULT_ACADEMIC_TERMS: AcademicTerm[] = [
  { id: 1, term_name: 'Autumn Term 2026', start_date: '2026-09-01', end_date: '2026-12-31' },
  { id: 2, term_name: 'Spring Term 2027', start_date: '2027-01-15', end_date: '2027-05-30' }
];

export const DEFAULT_BOOKING_PACKAGES: BookingPackage[] = [
  { id: 1, duration_months: 3, discount_percentage: 0, description: '3 Months Package' },
  { id: 2, duration_months: 6, discount_percentage: 5, description: '6 Months Package' },
  { id: 3, duration_months: 12, discount_percentage: 10, description: '12 Months Package' }
];

export const DEFAULT_LANDLORD_DETAILS = {
  recipientName: 'Jimoh Bolakale Ajao',
  bankName: 'Commercial International Bank (CIB)',
  iban: 'EG98 0010 0109 0000 0100 0633 2816 7',
  swiftCode: 'CIBEEGCXXXX',
  phone: '+20 1030072440',
  street: '71 Abou Dawood El Zahry Street, Off Makram Ebeid Street',
  city: 'Nasr City, Cairo',
  country: 'Egypt',
  poBox: '11341',
  remitlyIban: 'EG320010010900000100063328094',
  remitlyBankName: 'CIB',
  remitlyLocation: 'Cairo',
  adminEmail: 'sheriffdeenalade@gmail.com'
};

export const INITIAL_CMS: CmsContent = {
  logoUrl: 'https://res.cloudinary.com/di7okmjsx/image/upload/v1771428370/alibaanahlogo1_iprhyj.png',
  landlordDetails: DEFAULT_LANDLORD_DETAILS,
  categoryMedia: DEFAULT_CATEGORY_MEDIA,
  hero: {
    en: { title: 'Your Home for Knowledge and Comfort', subtitle: 'Secure, comfortable, and studious living, just moments away from the Al-Ibaanah Arabic Center.' },
    ar: { title: 'بيتك للمعرفة والراحة', subtitle: 'سكن آمن، مريح، ومناسب للدراسة، على بعد لحظات من مركز الإبانة للغة العربية.' }
  },
  heroImageUrl: 'https://res.cloudinary.com/di7okmjsx/image/upload/v1779441267/ibaanah_vean0s.jpg',
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
  },
  announcements: {
    en: [
      { id: 1, title: 'Welcome to Al-Ibaanah', content: 'We are excited to have you here. Please complete your registration and payment to secure your room.', date: new Date().toISOString() }
    ],
    ar: [
      { id: 1, title: 'مرحباً بكم في الإبانة', content: 'نحن سعداء بوجودكم هنا. يرجى إكمال التسجيل والدفع لتأمين غرفتك.', date: new Date().toISOString() }
    ]
  },
  accommodationAddresses: DEFAULT_ACCOMMODATION_ADDRESSES
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
  const [extendingBooking, setExtendingBooking] = useState<Booking | null>(null);
  const isInitialized = useRef(false);
  
  // App data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [publicOccupancy, setPublicOccupancy] = useState<PublicOccupancy[]>([]);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [bedSpaces, setBedSpaces] = useState<BedSpace[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>(DEFAULT_ACADEMIC_TERMS);
  const [bookingPackages, setBookingPackages] = useState<BookingPackage[]>(DEFAULT_BOOKING_PACKAGES);
  const [cmsContent, setCmsContent] = useState<CmsContent>(INITIAL_CMS);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [students, setStudents] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
        const loggedInUser: User = { 
          id: profile.id, 
          email: session.user.email, 
          full_name: profile.full_name, 
          role: profile.role, 
          gender: profile.gender,
          phone_number: profile.phone_number,
          passport_number: profile.passport_number,
          nationality: profile.nationality
        };
        setUser(loggedInUser);

        // Fetch all system bookings for global availability calculations
        const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*, rooms(room_number, type, apartment_name, category), profiles:student_id(full_name)')
            .order('booked_at', { ascending: false });

        if (profile.role !== 'student') {
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

            // Fetch all staff and proprietors for management
            const { data: adminUsers } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['staff', 'proprietor']);
            
            if (adminUsers) {
                setUsers(adminUsers.map((p: any) => ({
                    id: p.id,
                    email: p.email || '',
                    full_name: p.full_name,
                    role: p.role,
                    gender: p.gender
                })));
            }
        }

        if (bookingsError) {
            console.warn("Notice fetching bookings:", bookingsError.message);
        } else if (bookingsData) {
            const mappedBookings = bookingsData.map((b: any) => ({
                ...b,
                student_name: b.profiles?.full_name,
            }));
            setBookings(mappedBookings);
        }
      } catch (err) {
        console.warn("Notice in updateUserSession:", err);
        setUser(null);
        setStudents([]);
      }
    } else {
      setUser(null);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    // Real-time subscription for global bookings changes
    const bookingsChannel = supabase
        .channel('global-bookings-changes')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'bookings' 
        }, async (payload) => {
            console.log('Real-time booking update:', payload);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const { data, error } = await supabase
                    .from('bookings')
                    .select('*, rooms(room_number, type, apartment_name, category), profiles:student_id(full_name)')
                    .eq('id', payload.new.id)
                    .maybeSingle();
                
                if (data && !error) {
                    const mapped = { ...data, student_name: data.profiles?.full_name };
                    setBookings(prev => {
                        const exists = prev.some(b => b.id === mapped.id);
                        if (exists) {
                            return prev.map(b => b.id === mapped.id ? mapped : b);
                        }
                        return [mapped, ...prev];
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                setBookings(prev => prev.filter(b => b.id !== payload.old.id));
            }
        })
        .subscribe();

    // Real-time subscription for global rooms changes
    const roomsChannel = supabase
        .channel('global-rooms-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'rooms'
        }, async (payload) => {
            console.log('Real-time room update:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const { data, error } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('id', payload.new.id)
                    .maybeSingle();
                
                if (data && !error) {
                    setRooms(prev => {
                        const exists = prev.some(r => r.id === data.id);
                        if (exists) {
                            return prev.map(r => r.id === data.id ? data : r);
                        }
                        return [...prev, data];
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                setRooms(prev => prev.filter(r => r.id !== payload.old.id));
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(bookingsChannel);
        supabase.removeChannel(roomsChannel);
    };
  }, []);

  const safeFetch = async (query: PromiseLike<any>) => {
    try {
      return await query;
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const fetchPublicData = useCallback(async () => {
        try {
            console.log("Fetching public data...");
            const [roomsRes, bedSpacesRes, bookingsRes, termsRes, packagesRes, cmsRes, activitiesRes, publicOccupancyRes] = await Promise.all([
                safeFetch(supabase.from('rooms').select('*')),
                safeFetch(supabase.from('bed_spaces').select('*').order('id', { ascending: true })),
                safeFetch(supabase.from('bookings').select('*, rooms(room_number, type, apartment_name, category), profiles:student_id(full_name)').order('booked_at', { ascending: false })),
                safeFetch(supabase.from('academic_terms').select('*').eq('is_active', true)),
                safeFetch(supabase.from('booking_packages').select('*').eq('is_active', true)),
                safeFetch(supabase.from('cms_content').select('*').limit(1).maybeSingle()),
                safeFetch(supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(20)),
                safeFetch(supabase.rpc('get_public_occupancy'))
            ]);
            
            if (roomsRes && !roomsRes.error && roomsRes.data && roomsRes.data.length > 0) {
                setRooms(roomsRes.data);
            } else {
                setRooms(prev => prev && prev.length > 0 ? prev : DEFAULT_ROOMS);
            }

            if (bedSpacesRes && !bedSpacesRes.error && bedSpacesRes.data && bedSpacesRes.data.length > 0) {
                setBedSpaces(bedSpacesRes.data);
            }

            if (publicOccupancyRes && !publicOccupancyRes.error && publicOccupancyRes.data) {
                setPublicOccupancy(publicOccupancyRes.data);
            }

            if (bookingsRes && !bookingsRes.error && bookingsRes.data && bookingsRes.data.length > 0) {
                const mappedBookings = bookingsRes.data.map((b: any) => ({
                    ...b,
                    student_name: b.profiles?.full_name,
                }));
                setBookings(mappedBookings);
            }
            
            if (termsRes && !termsRes.error && termsRes.data && termsRes.data.length > 0) {
                setAcademicTerms(termsRes.data);
            } else {
                setAcademicTerms(prev => prev && prev.length > 0 ? prev : DEFAULT_ACADEMIC_TERMS);
            }
            
            if (packagesRes && !packagesRes.error && packagesRes.data && packagesRes.data.length > 0) {
                setBookingPackages(packagesRes.data);
            } else {
                setBookingPackages(prev => prev && prev.length > 0 ? prev : DEFAULT_BOOKING_PACKAGES);
            }

            if (activitiesRes && !activitiesRes.error && activitiesRes.data && activitiesRes.data.length > 0) {
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
                    : INITIAL_CMS.howToVideos,
                categoryMedia: (dbCms.how_to_videos || dbCms.howToVideos)?.categoryMedia || DEFAULT_CATEGORY_MEDIA,
                announcements: normalizeCmsData((dbCms.how_to_videos || dbCms.howToVideos)?.announcements || dbCms.announcements, INITIAL_CMS.announcements),
                landlordDetails: (dbCms.how_to_videos || dbCms.howToVideos)?.landlordDetails || DEFAULT_LANDLORD_DETAILS,
                accommodationAddresses: (dbCms.how_to_videos || dbCms.howToVideos)?.accommodationAddresses || dbCms.accommodationAddresses || DEFAULT_ACCOMMODATION_ADDRESSES
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

  const setPage = useCallback((page: Page, room?: Room, extendingBooking?: Booking) => {
    setPageState(page);
    if (page === 'booking') {
        setSelectedRoom(room || null);
        setExtendingBooking(extendingBooking || null);
    } else {
        setSelectedRoom(null);
        setExtendingBooking(null);
    }
  }, []);

  const addBooking = async (newBooking: Booking) => {
    try {
        // Remove the 'rooms', 'profiles', and 'id' objects before inserting into Supabase
        // We let Supabase generate the ID
        const { rooms: rObj, profiles, student_name, id, ...bookingToInsert } = newBooking as any;
        
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingToInsert])
            .select('*, rooms(room_number, type, apartment_name, category), profiles:student_id(full_name)')
            .single();

        if (error) throw error;
        
        const mappedBooking = {
            ...data,
            student_name: data.profiles?.full_name,
        };
        const updatedBookings = [mappedBooking, ...bookings];
        setBookings(updatedBookings);

        // Auto-sync passport_number, phone_number, nationality to the student's profile
        if (data.student_id) {
            const profileUpdates: Record<string, any> = {};
            if (data.full_name) profileUpdates.full_name = data.full_name;
            if (data.phone_number) profileUpdates.phone_number = data.phone_number;
            if (data.passport_number) profileUpdates.passport_number = data.passport_number;
            if (data.nationality) profileUpdates.nationality = data.nationality;

            if (Object.keys(profileUpdates).length > 0) {
                const { error: profileSyncError } = await supabase
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('id', data.student_id);

                if (!profileSyncError) {
                    setUser(prev => prev && prev.id === data.student_id ? { ...prev, ...profileUpdates } : prev);
                }
            }
        }

        // Recalculate room occupancy slots and availability in Supabase
        const room = rooms.find(r => r.id === data.room_id);
        if (room) {
            const activeRoomBookings = updatedBookings.filter(b => 
                b.room_id === room.id && 
                b.status !== BookingStatus.CANCELLED && 
                b.status !== BookingStatus.COMPLETED
            );
            const newOccupied = activeRoomBookings.length;
            const isNowAvailable = newOccupied < (room.capacity || 1);

            const { error: roomErr } = await supabase
                .from('rooms')
                .update({ occupied_slots: newOccupied, is_available: isNowAvailable })
                .eq('id', room.id);

            if (!roomErr) {
                setRooms(prev => prev.map(r => r.id === room.id ? { ...r, occupied_slots: newOccupied, is_available: isNowAvailable } : r));
            }
        }

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

        const updatedBookings = bookings.map(b => b.id === id ? { ...b, status } : b);
        setBookings(updatedBookings);

        // Recalculate room occupancy slots and availability in Supabase
        const room = rooms.find(r => r.id === booking.room_id);
        if (room) {
            const activeRoomBookings = updatedBookings.filter(b => 
                b.room_id === room.id && 
                b.status !== BookingStatus.CANCELLED && 
                b.status !== BookingStatus.COMPLETED
            );
            const newOccupied = activeRoomBookings.length;
            const isNowAvailable = newOccupied < (room.capacity || 1);

            const { error: roomErr } = await supabase
                .from('rooms')
                .update({ occupied_slots: newOccupied, is_available: isNowAvailable })
                .eq('id', room.id);

            if (!roomErr) {
                setRooms(prev => prev.map(r => r.id === room.id ? { ...r, occupied_slots: newOccupied, is_available: isNowAvailable } : r));
            }
        }

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

  const deleteBooking = async (id: number) => {
    try {
        const booking = bookings.find(b => b.id === id);
        if (!booking) throw new Error("Booking not found");

        console.log("Deleting student booking record with ID:", id);

        // 1. Remove parent_booking_id references in child bookings
        const { error: childError } = await supabase
            .from('bookings')
            .update({ parent_booking_id: null })
            .eq('parent_booking_id', id);
        if (childError) {
            console.error("Error clearing parent_booking_id references:", childError.message);
        }

        // 2. Delete the booking row from the database (cascade deletes payments & invoices)
        const { error: deleteError } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // 3. Update local state
        const remainingBookings = bookings.filter(b => b.id !== id);
        setBookings(remainingBookings);

        // 4. Update the room/bed occupancy slots and is_available status dynamically
        const room = rooms.find(r => r.id === booking.room_id);
        if (room) {
            const activeRoomBookings = remainingBookings.filter(b => 
                b.room_id === room.id && 
                b.status !== BookingStatus.CANCELLED && 
                b.status !== BookingStatus.COMPLETED
            );
            const newOccupied = activeRoomBookings.length;
            const isNowAvailable = newOccupied < (room.capacity || 1);

            const { error: roomUpdateError } = await supabase
                .from('rooms')
                .update({
                    occupied_slots: newOccupied,
                    is_available: isNowAvailable
                })
                .eq('id', room.id);

            if (roomUpdateError) {
                console.error("Error updating room slots after student deletion:", roomUpdateError.message);
            } else {
                setRooms(prev => prev.map(r => r.id === room.id ? { ...r, occupied_slots: newOccupied, is_available: isNowAvailable } : r));
            }
        }

        // 5. Clean up student profile if they have no other bookings
        const studentBookings = remainingBookings.filter(b => b.student_id === booking.student_id);
        if (studentBookings.length === 0) {
            const { error: profileDeleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', booking.student_id);

            if (profileDeleteError) {
                console.warn("Could not delete student profile (might be referenced elsewhere):", profileDeleteError.message);
            } else {
                setStudents(prev => prev.filter(s => s.id !== booking.student_id));
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("Error deleting student booking:", err.message);
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
            how_to_videos: {
                ...updatedCms.howToVideos,
                categoryMedia: updatedCms.categoryMedia,
                landlordDetails: updatedCms.landlordDetails,
                announcements: updatedCms.announcements
            },
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
            console.warn("Supabase insert error (trying fallback omitting next_available_date):", error);
            if (error.message?.includes('next_available_date') || error.code === 'P0002' || error.message?.includes('column')) {
                const { next_available_date, ...fallbackData } = roomToInsert;
                const fallbackRes = await supabase
                    .from('rooms')
                    .insert([fallbackData])
                    .select()
                    .single();
                if (fallbackRes.error) {
                    throw fallbackRes.error;
                }
                const insertedRoom = { ...fallbackRes.data, next_available_date: newRoom.next_available_date };
                setRooms(prev => [...prev, insertedRoom]);
                return { success: true };
            } else {
                throw error;
            }
        }
        
        console.log("Room added successfully:", data);
        setRooms(prev => [...prev, data]);
        return { success: true };
    } catch (err: any) {
        console.error("Error adding room to Supabase:", err);
        // Fallback for demo state
        const fallbackLocalRoom = { 
          ...newRoom, 
          id: Date.now(), 
          created_at: new Date().toISOString(),
          property_id: 'local_fallback_id'
        };
        setRooms(prev => [...prev, fallbackLocalRoom]);
        return { success: true };
    }
  };

  const updateRoom = async (updatedRoom: Room) => {
    try {
        console.log("Updating room in Supabase:", updatedRoom.id, updatedRoom);
        const { id, created_at, property_id, ...updateData } = updatedRoom as any;

        const { error, data } = await supabase
            .from('rooms')
            .update(updateData)
            .eq('id', updatedRoom.id)
            .select();

        if (error) {
            console.warn("Supabase update error (trying fallback omitting next_available_date):", error);
            if (error.message?.includes('next_available_date') || error.code === 'P0002' || error.message?.includes('column')) {
                const { next_available_date, ...fallbackData } = updateData;
                const fallbackRes = await supabase
                    .from('rooms')
                    .update(fallbackData)
                    .eq('id', updatedRoom.id)
                    .select();
                
                if (fallbackRes.error) {
                    throw fallbackRes.error;
                }
            } else {
                throw error;
            }
        }
        
        console.log("Room updated successfully:", data);
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updateData } : r));
        return { success: true };
    } catch (err: any) {
        console.error("Error updating room in Supabase:", err);
        // Fallback for demo state
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r));
        return { success: true };
    }
  };

  const deleteRoom = async (roomId: number) => {
    try {
        // 1. Check if there are active or historical bookings associated with this room
        const associatedBookings = bookings.filter(b => b.room_id === roomId);
        if (associatedBookings.length > 0) {
            return { 
                success: false, 
                error: `Cannot delete room: It has ${associatedBookings.length} booking(s) associated with it in Supabase. Please delete or reassign those bookings first.` 
            };
        }

        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (error) throw error;

        setRooms(prev => prev.filter(r => r.id !== roomId));
        return { success: true };
    } catch (err: any) {
        console.error("Error deleting room in Supabase:", err.message);
        return { success: false, error: err.message };
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

  const addUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      if (!userData.email || !userData.password) {
        throw new Error("Email and password are required for new users.");
      }

      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            gender: userData.gender,
            role: userData.role // This will be handled by the trigger or updated below
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create auth user.");

      // 2. Update the profile with the correct role (trigger defaults to student)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          gender: userData.gender
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (profileError) {
          // If update fails, maybe the profile wasn't created yet by the trigger
          // We can try to insert it or just wait
          console.warn("Profile update failed, maybe trigger hasn't finished:", profileError.message);
      }

      const newUser = {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name || '',
          role: userData.role || 'staff',
          gender: userData.gender
      };

      setUsers(prev => [...prev, newUser]);
      
      // Note: In some Supabase configs, signUp might sign the admin out.
      // We should warn the developer or handle the session appropriately.
      alert("Admin user created successfully! They will receive a confirmation email if enabled.");
      
      return { success: true };
    } catch (err: any) {
      console.error("Error adding user:", err.message);
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const profileUpdates: Record<string, any> = {};
      if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
      if (updates.role !== undefined) profileUpdates.role = updates.role;
      if (updates.gender !== undefined) profileUpdates.gender = updates.gender;
      if (updates.phone_number !== undefined) profileUpdates.phone_number = updates.phone_number;
      if (updates.passport_number !== undefined) profileUpdates.passport_number = updates.passport_number;
      if (updates.nationality !== undefined) profileUpdates.nationality = updates.nationality;

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      if (user && user.id === id) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
      return { success: true };
    } catch (err: any) {
      console.error("Error updating user profile:", err.message);
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting user:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Role-based occupancy bookings calculation:
  // For Admin / Staff: uses the full `bookings` array with student names, passport numbers, audit data.
  // For Students / Anonymous visitors: uses strictly the anonymized `publicOccupancy` list from get_public_occupancy() RPC.
  const effectiveOccupancyBookings = useMemo(() => {
    const isAdminOrStaff = user && (user.role === 'staff' || user.role === 'proprietor');
    if (isAdminOrStaff) {
      return bookings;
    }
    return publicOccupancy;
  }, [user, bookings, publicOccupancy]);

  const value = {
    language,
    setLanguage,
    page,
    setPage,
    user,
    selectedRoom,
    extendingBooking,
    session,
    logout,
    bookings,
    publicOccupancy,
    effectiveOccupancyBookings,
    addBooking,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    cmsContent,
    updateCmsContent,
    rooms,
    bedSpaces,
    addRoom,
    updateRoom,
    deleteRoom,
    activities,
    addActivity,
    students,
    users,
    addUser,
    updateUser,
    deleteUser,
    academicTerms,
    bookingPackages,
    loading,
    landlordDetails: cmsContent.landlordDetails || DEFAULT_LANDLORD_DETAILS,
    accommodationAddresses: cmsContent.accommodationAddresses || DEFAULT_ACCOMMODATION_ADDRESSES
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
