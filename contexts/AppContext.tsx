
import React, { createContext, useState, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { AppContextType, Language, Page, User, Room, BedSpace, Booking, BookingStatus, CmsContent, Activity, AcademicTerm, BookingPackage, AccommodationType, DEFAULT_CATEGORY_MEDIA, CategoryMediaConfig, PublicOccupancy, AccommodationAddresses, DEFAULT_ACCOMMODATION_ADDRESSES, DEFAULT_SUPPORT_CONTENT, WaitlistEntry, WaitlistStatus, EmailLogEntry, AccommodationCategory, DEFAULT_ACCOMMODATION_CATEGORIES, ConversationItem, MessageItem, CreditRecord, CreditTransaction } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { sendEmail, fetchRecentEmailLogs } from '../lib/email';
import { fetchConversationsList, fetchMessages, postMessage, markConversationAsRead as markConvAsRead, getOrCreateStudentConversation } from '../lib/messaging';
import { getParsedRoomSpaces } from '../lib/roomNaming';
import { DEFAULT_CONTRACT_TRANSLATIONS, ContractTranslationsStore, LegalContractTranslation } from '../lib/contractTranslations';

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
    status: 'Active',
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
    status: 'Active',
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
    status: 'Active',
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
    status: 'Active',
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
    status: 'Active',
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
    status: 'Active',
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
  accommodationAddresses: DEFAULT_ACCOMMODATION_ADDRESSES,
  supportContent: DEFAULT_SUPPORT_CONTENT,
  contractTranslations: DEFAULT_CONTRACT_TRANSLATIONS
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
  const [accommodationCategories, setAccommodationCategories] = useState<AccommodationCategory[]>(DEFAULT_ACCOMMODATION_CATEGORIES);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [students, setStudents] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [contractTranslations, setContractTranslations] = useState<ContractTranslationsStore>(DEFAULT_CONTRACT_TRANSLATIONS);
  const isUpdatingSessionRef = useRef(false);

  const unreadMessagesCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  }, [conversations]);

  const refreshConversations = useCallback(async (): Promise<ConversationItem[]> => {
    if (!user) {
      setConversations([]);
      return [];
    }
    try {
      const list = await fetchConversationsList(user);
      setConversations(list);
      return list;
    } catch (err) {
      console.warn("Error refreshing conversations:", err);
      return [];
    }
  }, [user]);

  const fetchConversationMessages = useCallback(async (conversationId: string, channel?: string): Promise<MessageItem[]> => {
    return await fetchMessages(conversationId, channel);
  }, []);

  const sendMessage = useCallback(async (params: {
    conversationId?: string;
    studentId?: string;
    message: string;
    channel?: string;
    recipientId?: string;
  }) => {
    if (!user) return { success: false, error: 'User not authenticated.' };
    const res = await postMessage({
      conversationId: params.conversationId,
      studentId: params.studentId || (user.role === 'student' ? user.id : undefined),
      senderId: user.id,
      senderRole: user.role,
      message: params.message,
      channel: params.channel || 'support',
      recipientId: params.recipientId
    });

    if (res.success) {
      await refreshConversations();
    }
    return res;
  }, [user, refreshConversations]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    await markConvAsRead(conversationId, user.id);
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c));
  }, [user]);

  // Load conversations when user state changes
  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      setConversations([]);
    }
  }, [user?.id, refreshConversations]);

  // Real-time subscription for messaging
  useEffect(() => {
    if (!user) return;

    const messagingChannel = supabase
      .channel(`realtime-messaging-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, async () => {
        refreshConversations();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, async () => {
        refreshConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagingChannel);
    };
  }, [user?.id, refreshConversations]);

  const updateUserSession = useCallback(async (session: Session | null) => {
    setSession(session);

    if (!session?.user) {
      setUser(null);
      setStudents([]);
      setUsers([]);
      setEmailLogs([]);
      setCredits([]);
      setCreditTransactions([]);
      return;
    }

    if (isUpdatingSessionRef.current) return;
    isUpdatingSessionRef.current = true;

    try {
      // 1. Fetch user profile fast
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      let activeProfile = profile;
      if (!activeProfile) {
        // Self-heal profile if missing
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'User',
            role: (session.user.user_metadata?.role as any) || 'student',
            gender: session.user.user_metadata?.gender
          })
          .select()
          .maybeSingle();
        activeProfile = newProfile;
      }

      if (!activeProfile) {
        const fallbackUser = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 'Student',
          role: 'student' as const,
          gender: session.user.user_metadata?.gender as any
        };
        setUser(fallbackUser);
        return;
      }

      const loggedInUser: User = {
        id: activeProfile.id,
        email: session.user.email,
        full_name: activeProfile.full_name,
        role: activeProfile.role,
        gender: activeProfile.gender,
        phone_number: activeProfile.phone_number,
        passport_number: activeProfile.passport_number,
        nationality: activeProfile.nationality
      };
      setUser(loggedInUser);

      // 2. Fetch role-dependent data in parallel
      const isStaffOrAdmin = activeProfile.role === 'staff' || activeProfile.role === 'proprietor';
      if (isStaffOrAdmin) {
        const [studentsRes, staffRes, emailLogsRes] = await Promise.all([
          safeFetch(supabase.from('profiles').select('*').eq('role', 'student')),
          safeFetch(supabase.from('profiles').select('*').in('role', ['staff', 'proprietor'])),
          safeFetch(fetchRecentEmailLogs())
        ]);

        if (studentsRes?.data) {
          setStudents(studentsRes.data.map((p: any) => ({
            id: p.id,
            email: p.email || '',
            full_name: p.full_name,
            role: p.role,
            gender: p.gender,
            phone_number: p.phone_number,
            passport_number: p.passport_number,
            nationality: p.nationality,
            created_at: p.created_at
          })));
        }

        if (staffRes?.data) {
          setUsers(staffRes.data.map((p: any) => ({
            id: p.id,
            email: p.email || '',
            full_name: p.full_name,
            role: p.role,
            gender: p.gender
          })));
        }

        if (Array.isArray(emailLogsRes)) {
          setEmailLogs(emailLogsRes);
        }
      }
    } catch (err) {
      console.warn("Notice in updateUserSession:", err);
    } finally {
      isUpdatingSessionRef.current = false;
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
                    const roomWithStatus: Room = {
                        ...data,
                        status: (data.status || 'Active') as 'Active' | 'Inactive'
                    };
                    setRooms(prev => {
                        const exists = prev.some(r => r.id === roomWithStatus.id);
                        if (exists) {
                            return prev.map(r => r.id === roomWithStatus.id ? roomWithStatus : r);
                        }
                        return [...prev, roomWithStatus];
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                setRooms(prev => prev.filter(r => r.id !== payload.old.id));
            }
        })
        .subscribe();

    // Real-time subscription for bed spaces changes
    const bedSpacesChannel = supabase
        .channel('global-bed-spaces-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'bed_spaces'
        }, async (payload) => {
            console.log('Real-time bed space update:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const { data, error } = await supabase
                    .from('bed_spaces')
                    .select('*')
                    .eq('id', payload.new.id)
                    .maybeSingle();
                
                if (data && !error) {
                    setBedSpaces(prev => {
                        const exists = prev.some(b => b.id === data.id);
                        if (exists) {
                            return prev.map(b => b.id === data.id ? data : b);
                        }
                        return [...prev, data];
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                setBedSpaces(prev => prev.filter(b => b.id !== payload.old.id));
            }
        })
        .subscribe();

    // Real-time subscription for waitlist changes
    const waitlistChannel = supabase
        .channel('global-waitlist-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'waitlist'
        }, async (payload) => {
            console.log('Real-time waitlist update:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                try {
                    const { data, error } = await supabase
                        .from('waitlist')
                        .select('*, profiles:student_id(full_name, phone_number, nationality)')
                        .eq('id', payload.new.id)
                        .maybeSingle();
                    
                    const itemToUse = ((!error && data) ? data : payload.new) as WaitlistEntry;
                    if (itemToUse && itemToUse.id) {
                        setWaitlist(prev => {
                            const exists = prev.some(w => w.id === itemToUse.id);
                            if (exists) {
                                return prev.map(w => w.id === itemToUse.id ? itemToUse : w);
                            }
                            return [itemToUse, ...prev];
                        });
                    }
                } catch (e) {
                    if (payload.new && (payload.new as any).id) {
                        const fallbackItem = payload.new as WaitlistEntry;
                        setWaitlist(prev => [fallbackItem, ...prev.filter(w => w.id !== fallbackItem.id)]);
                    }
                }
            } else if (payload.eventType === 'DELETE') {
                setWaitlist(prev => prev.filter(w => w.id !== payload.old.id));
            }
        })
        .subscribe();

    // Real-time subscription for email delivery logs
    const emailLogsChannel = supabase
        .channel('global-email-logs-changes')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'email_logs' 
        }, async () => {
            try {
                const freshLogs = await fetchRecentEmailLogs();
                setEmailLogs(freshLogs);
            } catch (err) {
                console.warn("Notice updating real-time email logs:", err);
            }
        })
        .subscribe();

    // Real-time subscription for accommodation categories changes
    const categoriesChannel = supabase
        .channel('global-categories-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'accommodation_categories'
        }, async (payload) => {
            console.log('Real-time category update:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const raw = payload.new as any;
                if (raw && raw.id) {
                    const mapped: AccommodationCategory = {
                        id: raw.id,
                        name: raw.name,
                        description: raw.description || '',
                        address: raw.address || '',
                        defaultPrice: raw.default_price !== null && raw.default_price !== undefined ? Number(raw.default_price) : undefined,
                        status: (raw.status || 'Active') as 'Active' | 'Inactive',
                        created_at: raw.created_at,
                        updated_at: raw.updated_at
                    };
                    setAccommodationCategories(prev => {
                        const exists = prev.some(c => c.id === mapped.id || c.name.toLowerCase() === mapped.name.toLowerCase());
                        if (exists) {
                            return prev.map(c => (c.id === mapped.id || c.name.toLowerCase() === mapped.name.toLowerCase()) ? mapped : c);
                        }
                        return [...prev, mapped];
                    });
                }
            } else if (payload.eventType === 'DELETE') {
                setAccommodationCategories(prev => prev.filter(c => c.id !== payload.old.id));
            }
        })
        .subscribe();

    // Real-time subscription for contract translations changes
    const contractTranslationsChannel = supabase
        .channel('global-contract-translations-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'contract_translations'
        }, async (payload) => {
            console.log('Real-time contract translation update:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const raw = payload.new as any;
                if (raw && raw.language_code) {
                    const lang = raw.language_code as Language;
                    setContractTranslations(prev => {
                        const existing = prev[lang] || DEFAULT_CONTRACT_TRANSLATIONS[lang];
                        if (!existing) return prev;
                        return {
                            ...prev,
                            [lang]: {
                                ...existing,
                                status: raw.status || existing.status,
                                approvedAt: raw.approved_at || existing.approvedAt,
                                approvedBy: raw.approved_by || existing.approvedBy,
                                version: raw.version || existing.version,
                                ...(raw.content_json || {})
                            }
                        };
                    });
                }
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(bookingsChannel);
        supabase.removeChannel(roomsChannel);
        supabase.removeChannel(bedSpacesChannel);
        supabase.removeChannel(waitlistChannel);
        supabase.removeChannel(emailLogsChannel);
        supabase.removeChannel(categoriesChannel);
        supabase.removeChannel(contractTranslationsChannel);
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
            const [roomsRes, bedSpacesRes, bookingsRes, termsRes, packagesRes, cmsRes, activitiesRes, publicOccupancyRes, waitlistRes, categoriesRes, contractTranslationsRes] = await Promise.all([
                safeFetch(supabase.from('rooms').select('*')),
                safeFetch(supabase.from('bed_spaces').select('*').order('id', { ascending: true })),
                safeFetch(supabase.from('bookings').select('*, rooms(room_number, type, apartment_name, category), profiles:student_id(full_name)').order('booked_at', { ascending: false })),
                safeFetch(supabase.from('academic_terms').select('*').eq('is_active', true)),
                safeFetch(supabase.from('booking_packages').select('*').eq('is_active', true)),
                safeFetch(supabase.from('cms_content').select('*').limit(1).maybeSingle()),
                safeFetch(supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(20)),
                safeFetch(supabase.rpc('get_public_occupancy')),
                safeFetch(supabase.from('waitlist').select('*, profiles:student_id(full_name, phone_number, nationality)').order('created_at', { ascending: false })),
                safeFetch(supabase.from('accommodation_categories').select('*').order('display_order', { ascending: true })),
                safeFetch(supabase.from('contract_translations').select('*'))
            ]);
            
            // Accommodation categories table data takes precedence
            let hasLoadedCategories = false;
            if (categoriesRes && !categoriesRes.error && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
                const mappedCategories: AccommodationCategory[] = categoriesRes.data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    description: c.description || '',
                    address: c.address || '',
                    defaultPrice: c.default_price !== null && c.default_price !== undefined ? Number(c.default_price) : undefined,
                    status: (c.status || 'Active') as 'Active' | 'Inactive',
                    created_at: c.created_at,
                    updated_at: c.updated_at
                }));
                setAccommodationCategories(mappedCategories);
                hasLoadedCategories = true;
            }

            if (waitlistRes && !waitlistRes.error && waitlistRes.data) {
                setWaitlist(waitlistRes.data);
            }
            
            const dbCmsData = cmsRes?.data;
            const roomStatusOverrides = (dbCmsData?.how_to_videos || dbCmsData?.howToVideos)?.room_status_overrides || {};

            if (roomsRes && !roomsRes.error && roomsRes.data && roomsRes.data.length > 0) {
                const mappedRooms = roomsRes.data.map((r: any) => ({
                    ...r,
                    status: (r.status || roomStatusOverrides[r.id] || 'Active') as 'Active' | 'Inactive'
                }));
                setRooms(mappedRooms);
            } else {
                setRooms(prev => {
                    const base = prev && prev.length > 0 ? prev : DEFAULT_ROOMS;
                    return base.map(r => ({
                        ...r,
                        status: (r.status || roomStatusOverrides[r.id] || 'Active') as 'Active' | 'Inactive'
                    }));
                });
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
            
            if (cmsRes?.data) {
              const dbCms = cmsRes.data;
              const normalizeCmsData = (data: any, fallback: any) => {
                if (!hasData(data)) return fallback;
                if (Array.isArray(data)) return { ...fallback, en: data };
                return { ...fallback, ...data };
              };

              const cmsCategories = (dbCms.how_to_videos || dbCms.howToVideos)?.accommodationCategories || dbCms.accommodation_categories || dbCms.accommodationCategories;

              // Merge DB contract translations if available
              let mergedTranslations: ContractTranslationsStore = { ...DEFAULT_CONTRACT_TRANSLATIONS };
              if (contractTranslationsRes && !contractTranslationsRes.error && Array.isArray(contractTranslationsRes.data) && contractTranslationsRes.data.length > 0) {
                contractTranslationsRes.data.forEach((row: any) => {
                  const langCode = row.language_code as Language;
                  if (mergedTranslations[langCode]) {
                    mergedTranslations[langCode] = {
                      ...mergedTranslations[langCode],
                      status: (row.status || 'draft') as 'draft' | 'approved',
                      approvedAt: row.approved_at || undefined,
                      approvedBy: row.approved_by || undefined,
                      version: row.version || mergedTranslations[langCode].version,
                      ...(row.content_json || {})
                    };
                  }
                });
              } else if (dbCms.contract_translations || (dbCms.how_to_videos || dbCms.howToVideos)?.contractTranslations) {
                const storedCmsTranslations = dbCms.contract_translations || (dbCms.how_to_videos || dbCms.howToVideos)?.contractTranslations;
                mergedTranslations = { ...DEFAULT_CONTRACT_TRANSLATIONS, ...storedCmsTranslations };
              }
              setContractTranslations(mergedTranslations);

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
                accommodationAddresses: (dbCms.how_to_videos || dbCms.howToVideos)?.accommodationAddresses || dbCms.accommodationAddresses || DEFAULT_ACCOMMODATION_ADDRESSES,
                accommodationCategories: Array.isArray(cmsCategories) && cmsCategories.length > 0 ? cmsCategories : DEFAULT_ACCOMMODATION_CATEGORIES,
                supportContent: (dbCms.how_to_videos || dbCms.howToVideos)?.supportContent || dbCms.supportContent || dbCms.support_content || DEFAULT_SUPPORT_CONTENT,
                contractTranslations: mergedTranslations
              });

              if (!hasLoadedCategories && Array.isArray(cmsCategories) && cmsCategories.length > 0) {
                setAccommodationCategories(cmsCategories);
              }
            }
        } catch (err) {
            console.error('Unexpected error fetching public data:', err);
        }
  }, []);

  const initializeApp = useCallback(async () => {
        try {
            // Run public data fetch and session check in parallel for maximum speed
            const [, sessionRes] = await Promise.all([
                fetchPublicData(),
                supabase.auth.getSession()
            ]);
            
            const session = sessionRes?.data?.session;
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

  // Helper to synchronize raw database room occupancy using strict whitelist ('Confirmed', 'Occupied')
  const syncRoomOccupancyToDb = async (roomIds: (number | undefined)[], currentBookings: Booking[]) => {
    const uniqueRoomIds = Array.from(new Set(roomIds.filter((id): id is number => typeof id === 'number' && id > 0)));
    for (const rId of uniqueRoomIds) {
        const room = rooms.find(r => r.id === rId);
        if (!room) continue;

        // Strict whitelist: ONLY 'Confirmed' and 'Occupied' statuses count as occupied
        const activeCount = currentBookings.filter(b => 
            b.room_id === rId && 
            (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.OCCUPIED || (b.status as string) === 'Confirmed' || (b.status as string) === 'Occupied')
        ).length;
        const isNowAvailable = activeCount < (room.capacity || 1);

        const { error: roomErr } = await supabase
            .from('rooms')
            .update({ occupied_slots: activeCount, is_available: isNowAvailable })
            .eq('id', rId);

        if (!roomErr) {
            setRooms(prev => prev.map(r => r.id === rId ? { ...r, occupied_slots: activeCount, is_available: isNowAvailable } : r));
        } else {
            console.error(`Failed to update occupancy in DB for room ${rId}:`, roomErr.message);
        }
    }
  };

  const addBooking = async (newBooking: Booking) => {
    try {
        // --- SAFEGUARD: Bed Space & Room Parent Matching ---
        let targetRoomId = newBooking.room_id;
        const targetBedSpaceId = newBooking.bed_space_id;

        if (targetBedSpaceId) {
            // Find bed space record to guarantee 100% parent room alignment
            let bedSpace = bedSpaces.find(bs => bs.id === targetBedSpaceId);
            if (!bedSpace) {
                const { data: fetchedBed, error: bedFetchErr } = await supabase
                    .from('bed_spaces')
                    .select('id, room_id, label')
                    .eq('id', targetBedSpaceId)
                    .single();
                if (bedFetchErr || !fetchedBed) {
                    throw new Error(`Validation Error: Bed Space ID #${targetBedSpaceId} does not exist in the database.`);
                }
                bedSpace = fetchedBed as BedSpace;
            }

            if (targetRoomId && targetRoomId !== bedSpace.room_id) {
                console.warn(`[Safeguard Auto-Correction] Booking room_id (${targetRoomId}) did not match bed_space #${targetBedSpaceId} parent room_id (${bedSpace.room_id}). Auto-aligning room_id to ${bedSpace.room_id}.`);
            }
            targetRoomId = bedSpace.room_id;
        }

        // Remove the 'rooms', 'profiles', and 'id' objects before inserting into Supabase
        // We let Supabase generate the ID
        const { rooms: rObj, profiles, student_name, id, ...bookingToInsert } = newBooking as any;
        bookingToInsert.room_id = targetRoomId;
        if (targetBedSpaceId) {
            bookingToInsert.bed_space_id = targetBedSpaceId;
        }
        
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

        // Recalculate room occupancy slots and availability in Supabase (whitelist: Confirmed/Occupied)
        await syncRoomOccupancyToDb([data.room_id], updatedBookings);

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

        // Recalculate room occupancy slots and availability in Supabase (whitelist: Confirmed/Occupied)
        await syncRoomOccupancyToDb([booking.room_id], updatedBookings);

        return { success: true };
    } catch (err: any) {
        console.error("Error updating booking status in Supabase:", err.message);
        return { success: false, error: err.message };
    }
  };

  const updateBooking = async (id: number, updates: Partial<Booking>) => {
    try {
        const existingBooking = bookings.find(b => b.id === id);

        // --- SAFEGUARD: Bed Space & Room Parent Matching on Update ---
        const targetBedSpaceId = updates.bed_space_id !== undefined ? updates.bed_space_id : existingBooking?.bed_space_id;
        let targetRoomId = updates.room_id !== undefined ? updates.room_id : existingBooking?.room_id;

        if (targetBedSpaceId) {
            let bedSpace = bedSpaces.find(bs => bs.id === targetBedSpaceId);
            if (!bedSpace) {
                const { data: fetchedBed, error: bedFetchErr } = await supabase
                    .from('bed_spaces')
                    .select('id, room_id, label')
                    .eq('id', targetBedSpaceId)
                    .single();
                if (bedFetchErr || !fetchedBed) {
                    throw new Error(`Validation Error: Bed Space ID #${targetBedSpaceId} does not exist in the database.`);
                }
                bedSpace = fetchedBed as BedSpace;
            }

            if (targetRoomId !== bedSpace.room_id) {
                console.warn(`[Safeguard Auto-Correction] Booking update room_id (${targetRoomId}) did not match bed_space #${targetBedSpaceId} parent room_id (${bedSpace.room_id}). Auto-aligning room_id to ${bedSpace.room_id}.`);
                targetRoomId = bedSpace.room_id;
                updates.room_id = targetRoomId;
            }
        }

        // Strip joined fields that might be in the updates object
        const { rooms, profiles, ...dbUpdates } = updates as any;
        if (targetRoomId !== undefined) {
            dbUpdates.room_id = targetRoomId;
        }
        
        const { error } = await supabase
            .from('bookings')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;

        const updatedBookings = bookings.map(b => b.id === id ? { ...b, ...updates, ...(targetRoomId ? { room_id: targetRoomId } : {}) } : b);
        setBookings(updatedBookings);

        // Recalculate room occupancy slots and availability in Supabase (whitelist: Confirmed/Occupied)
        const affectedRoomIds = [existingBooking?.room_id, targetRoomId].filter((x): x is number => typeof x === 'number');
        await syncRoomOccupancyToDb(affectedRoomIds, updatedBookings);

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

        // 4. Update the room/bed occupancy slots and is_available status dynamically (whitelist: Confirmed/Occupied)
        await syncRoomOccupancyToDb([booking.room_id], remainingBookings);

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
        if (content.accommodationCategories) {
          setAccommodationCategories(content.accommodationCategories);
        }

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
                announcements: updatedCms.announcements,
                accommodationAddresses: updatedCms.accommodationAddresses,
                accommodationCategories: updatedCms.accommodationCategories || accommodationCategories,
                supportContent: updatedCms.supportContent
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

  const refreshAccommodationCategories = async (): Promise<AccommodationCategory[]> => {
    try {
      const { data: dbCategories, error } = await supabase
        .from('accommodation_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && dbCategories && dbCategories.length > 0) {
        const mapped: AccommodationCategory[] = dbCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          address: c.address || '',
          defaultPrice: c.default_price !== null && c.default_price !== undefined ? Number(c.default_price) : undefined,
          status: (c.status || 'Active') as 'Active' | 'Inactive',
          created_at: c.created_at,
          updated_at: c.updated_at
        }));
        setAccommodationCategories(mapped);
        return mapped;
      }

      // Fallback to cms_content
      const { data: dbCms } = await supabase
        .from('cms_content')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (dbCms) {
        const cmsCategories = (dbCms.how_to_videos || dbCms.howToVideos)?.accommodationCategories || dbCms.accommodation_categories || dbCms.accommodationCategories;
        if (Array.isArray(cmsCategories) && cmsCategories.length > 0) {
          setAccommodationCategories(cmsCategories);
          return cmsCategories;
        }
      }

      return accommodationCategories;
    } catch (err: any) {
      console.error('Error refreshing accommodation categories from Supabase:', err.message);
      return accommodationCategories;
    }
  };

  const addAccommodationCategory = async (categoryInput: Omit<AccommodationCategory, 'id' | 'created_at'> | string | (Omit<AccommodationCategory, 'created_at'> & { id?: string })) => {
    try {
      const rawName = typeof categoryInput === 'string' ? categoryInput : categoryInput.name;
      const trimmedName = (rawName || '').trim();

      if (!trimmedName) {
        return { success: false, error: 'Category name cannot be empty.' };
      }

      // Check for duplicate name (case-insensitive)
      const exists = accommodationCategories.some(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
        return { success: false, error: `Category "${trimmedName}" already exists. Please choose a unique name.` };
      }

      let slug = (typeof categoryInput === 'object' && (categoryInput as any).id && (categoryInput as any).id.trim())
        ? (categoryInput as any).id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/(^-|-$)/g, '')
        : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;

      if (!slug) slug = `cat-${Date.now()}`;

      const duplicateSlug = accommodationCategories.some(c => c.id.toLowerCase() === slug.toLowerCase());
      if (duplicateSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const newCategory: AccommodationCategory = {
        id: slug,
        name: trimmedName,
        description: typeof categoryInput === 'object' ? categoryInput.description : '',
        address: typeof categoryInput === 'object' ? categoryInput.address : '',
        defaultPrice: typeof categoryInput === 'object' && categoryInput.defaultPrice !== undefined ? Number(categoryInput.defaultPrice) : undefined,
        status: typeof categoryInput === 'object' && categoryInput.status ? categoryInput.status : 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 1. Optimistic UI update
      setAccommodationCategories(prev => {
        const filtered = prev.filter(c => c.id !== slug && c.name.toLowerCase() !== trimmedName.toLowerCase());
        return [...filtered, newCategory];
      });

      // 2. Persist directly to accommodation_categories table in Supabase
      const dbPayload = {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description || '',
        address: newCategory.address || '',
        default_price: newCategory.defaultPrice !== undefined && newCategory.defaultPrice !== null ? newCategory.defaultPrice : null,
        status: newCategory.status || 'Active',
        display_order: accommodationCategories.length + 1,
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('accommodation_categories')
        .upsert([dbPayload], { onConflict: 'name' });

      if (dbError) {
        console.warn("Notice saving to accommodation_categories table:", dbError.message);
      }

      // 3. Keep cmsContent in sync
      const updatedCategories = [...accommodationCategories.filter(c => c.id !== slug), newCategory];
      const updatedAddresses = {
        ...cmsContent.accommodationAddresses,
        ...(newCategory.address ? { [trimmedName]: newCategory.address } : {})
      };

      await updateCmsContent({
        accommodationCategories: updatedCategories,
        accommodationAddresses: updatedAddresses
      });

      return { success: true, category: newCategory };
    } catch (err: any) {
      console.error('Error adding accommodation category:', err.message);
      return { success: false, error: err.message || 'Failed to add accommodation category' };
    }
  };

  const updateAccommodationCategory = async (id: string, updates: Partial<AccommodationCategory>) => {
    try {
      const existing = accommodationCategories.find(c => c.id === id);
      if (!existing) {
        return { success: false, error: 'Category not found.' };
      }

      const oldName = existing.name;
      const oldId = existing.id;
      let targetId = oldId;

      if (updates.id !== undefined && updates.id.trim() !== '') {
        const cleanId = updates.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/(^-|-$)/g, '');
        if (!cleanId) {
          return { success: false, error: 'Category ID cannot be empty.' };
        }
        const duplicateId = accommodationCategories.some(c => c.id !== id && c.id.toLowerCase() === cleanId.toLowerCase());
        if (duplicateId) {
          return { success: false, error: `Category ID "${cleanId}" is already taken by another category.` };
        }
        targetId = cleanId;
      }

      if (updates.name !== undefined) {
        const trimmedName = updates.name.trim();
        if (!trimmedName) {
          return { success: false, error: 'Category name cannot be empty.' };
        }
        const duplicate = accommodationCategories.some(c => c.id !== id && c.name.trim().toLowerCase() === trimmedName.toLowerCase());
        if (duplicate) {
          return { success: false, error: `Category "${trimmedName}" already exists. Please choose a unique name.` };
        }
        updates.name = trimmedName;
      }

      const updatedCategory: AccommodationCategory = {
        ...existing,
        ...updates,
        id: targetId,
        updated_at: new Date().toISOString()
      };

      // 1. Optimistic UI update
      setAccommodationCategories(prev => prev.map(c => c.id === oldId ? updatedCategory : c));

      // 2. Persist to accommodation_categories table in Supabase
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (targetId !== oldId) dbUpdates.id = targetId;
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.defaultPrice !== undefined) dbUpdates.default_price = updates.defaultPrice !== null ? Number(updates.defaultPrice) : null;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error: dbError } = await supabase
        .from('accommodation_categories')
        .update(dbUpdates)
        .eq('id', oldId);

      if (dbError) {
        throw new Error(`Failed to update accommodation category in database: ${dbError.message}`);
      }

      // 3. If category name changed, synchronize all rooms in Supabase that reference the old category name
      if (updates.name && updates.name !== oldName) {
        const newName = updates.name.trim();
        const { error: roomSyncErr } = await supabase
          .from('rooms')
          .update({ apartment_name: newName })
          .eq('apartment_name', oldName);
        
        if (roomSyncErr) {
          throw new Error(`Failed to update room records for renamed category "${newName}": ${roomSyncErr.message}`);
        }

        // Update local rooms state immediately
        setRooms(prev => prev.map(r => r.apartment_name === oldName ? { ...r, apartment_name: newName } : r));
      }

      // 4. Keep cmsContent in sync
      const nextList = accommodationCategories.map(c => c.id === oldId ? updatedCategory : c);
      const updatedAddresses = { ...cmsContent.accommodationAddresses };
      if (updates.name && updates.name !== oldName && updatedAddresses[oldName]) {
        updatedAddresses[updates.name] = updatedCategory.address || updatedAddresses[oldName];
        delete updatedAddresses[oldName];
      } else if (updatedCategory.address) {
        updatedAddresses[updatedCategory.name] = updatedCategory.address;
      }

      await updateCmsContent({
        accommodationCategories: nextList,
        accommodationAddresses: updatedAddresses
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error updating accommodation category:', err.message);
      return { success: false, error: err.message || 'Failed to update accommodation category' };
    }
  };

  const deleteAccommodationCategory = async (id: string) => {
    try {
      const existing = accommodationCategories.find(c => c.id === id);
      if (!existing) {
        return { success: false, error: 'Category not found.' };
      }

      // Safety check: verify no rooms are currently assigned to this category
      const assignedRooms = rooms.filter(
        r => (r.apartment_name || '').trim().toLowerCase() === existing.name.trim().toLowerCase() ||
             (r.category || '').trim().toLowerCase() === existing.name.trim().toLowerCase()
      );

      if (assignedRooms.length > 0) {
        return {
          success: false,
          error: `Cannot delete category "${existing.name}": There are ${assignedRooms.length} room(s) currently assigned to this category. Please reassign or delete these rooms first.`
        };
      }

      const nextList = accommodationCategories.filter(c => c.id !== id);
      setAccommodationCategories(nextList);

      const { error } = await supabase
        .from('accommodation_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn("Notice deleting from accommodation_categories table:", error.message);
      }

      const updatedAddresses = { ...cmsContent.accommodationAddresses };
      delete updatedAddresses[existing.name];

      await updateCmsContent({
        accommodationCategories: nextList,
        accommodationAddresses: updatedAddresses
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting accommodation category:', err.message);
      return { success: false, error: err.message || 'Failed to delete accommodation category' };
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

        const { id, created_at, bedLabels, ...roomData } = newRoom as any;
        
        const roomToInsert = {
            ...roomData,
            status: newRoom.status || 'Active',
            property_id: propData.id,
        };

        let insertedRoom: any = null;
        const { data, error } = await supabase
            .from('rooms')
            .insert([roomToInsert])
            .select()
            .single();

        if (error) {
            console.warn("Supabase insert error (trying fallback omitting next_available_date and status):", error);
            if (error.message?.includes('next_available_date') || error.message?.includes('status') || error.code === 'P0002' || error.message?.includes('column')) {
                const { next_available_date, status, ...fallbackData } = roomToInsert;
                const fallbackRes = await supabase
                    .from('rooms')
                    .insert([fallbackData])
                    .select()
                    .single();
                if (fallbackRes.error) {
                    throw fallbackRes.error;
                }
                insertedRoom = { ...fallbackRes.data, next_available_date: newRoom.next_available_date, status: newRoom.status || 'Active' };
            } else {
                throw error;
            }
        } else {
            insertedRoom = data;
        }
        
        console.log("Room added successfully:", insertedRoom);

        // Auto-ensure category is registered in accommodation_categories table
        if (insertedRoom && insertedRoom.apartment_name) {
            const catName = insertedRoom.apartment_name.trim();
            const catExists = accommodationCategories.some(c => c.name.toLowerCase() === catName.toLowerCase());
            if (!catExists && catName) {
                const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
                const autoCategory: AccommodationCategory = {
                    id: slug,
                    name: catName,
                    description: `${catName} student residence.`,
                    defaultPrice: insertedRoom.price_per_month || 175,
                    status: 'Active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                addAccommodationCategory(autoCategory).catch(e => console.warn("Notice auto-persisting category:", e));
            }
        }

        // Auto-provision bed_spaces for the new room
        if (insertedRoom && insertedRoom.id) {
            const isPrivate = insertedRoom.type?.toLowerCase().includes('private') || insertedRoom.capacity === 1;
            const customBedLabels = (newRoom as any).bedLabels;
            const targetLabels = (Array.isArray(customBedLabels) && customBedLabels.length > 0)
                ? customBedLabels
                : (isPrivate
                    ? ['Single']
                    : Array.from({ length: Math.max(1, insertedRoom.capacity || 2) }, (_, i) => `Bed ${String.fromCharCode(65 + i)}`));

            const bedSpacesToInsert = targetLabels.map((label: string) => ({
                room_id: insertedRoom.id,
                label
            }));

            const { data: insertedBeds, error: bedErr } = await supabase
                .from('bed_spaces')
                .insert(bedSpacesToInsert)
                .select();

            if (bedErr) {
                throw new Error(`Room created, but failed to auto-insert bed spaces: ${bedErr.message}`);
            } else if (insertedBeds) {
                setBedSpaces(prev => [...prev, ...insertedBeds]);
            }
        }

        const finalRoom: Room = {
            ...insertedRoom,
            status: (insertedRoom.status || newRoom.status || 'Active') as 'Active' | 'Inactive'
        };

        setRooms(prev => [...prev, finalRoom]);
        return { success: true, data: finalRoom };
    } catch (err: any) {
        console.error("Error adding room to Supabase:", err);
        return { success: false, error: err.message || "Failed to create room in database." };
    }
  };

  const updateRoom = async (updatedRoom: Room) => {
    try {
        console.log("Updating room in Supabase:", updatedRoom.id, updatedRoom);

        // 1. Safety check: query live database bookings for this room before modifying configuration
        const isPrivate = updatedRoom.type?.toLowerCase().includes('private') || updatedRoom.capacity === 1;
        const customBedLabels = (updatedRoom as any).bedLabels;
        const targetLabels: string[] = (Array.isArray(customBedLabels) && customBedLabels.length > 0)
            ? customBedLabels
            : (isPrivate
                ? ['Single']
                : Array.from({ length: Math.max(1, updatedRoom.capacity || 2) }, (_, i) => `Bed ${String.fromCharCode(65 + i)}`));

        const targetCapacity = isPrivate ? 1 : Math.max(1, updatedRoom.capacity || targetLabels.length || 2);

        // Query live bookings for this room from Supabase
        let liveRoomBookings: any[] = [];
        const { data: dbBookings, error: liveErr } = await supabase
            .from('bookings')
            .select('id, full_name, status, room_id, bed_space_id, checked_out_at, end_date')
            .eq('room_id', updatedRoom.id);

        if (!liveErr && Array.isArray(dbBookings)) {
            liveRoomBookings = dbBookings;
        } else {
            liveRoomBookings = bookings.filter(b => b.room_id === updatedRoom.id);
        }

        const inactiveStatuses = ['CANCELLED', 'REJECTED', 'COMPLETED', 'EXPIRED'];
        const activeBookings = liveRoomBookings.filter(b => {
            const bStatus = (b.status || '').toUpperCase().trim().replace(/[\s_-]+/g, '_');
            const isInactive = inactiveStatuses.includes(bStatus) || Boolean(b.checked_out_at);
            return !isInactive;
        });

        // Block if active booking count exceeds new target capacity
        if (activeBookings.length > targetCapacity) {
            const studentNames = activeBookings.map(b => b.full_name || (b as any).student_name || 'Student').filter(Boolean).join(', ');
            return {
                success: false,
                error: `Cannot modify room configuration: Room currently has ${activeBookings.length} active booking(s) (${studentNames || 'Active Students'}), which exceeds the requested capacity of ${targetCapacity}. Please reassign or conclude those bookings before reducing capacity.`
            };
        }

        // Check if any specific bed space being removed is actively assigned
        const currentRoomBeds = bedSpaces.filter(b => b.room_id === updatedRoom.id);
        let removedBeds: any[] = [];
        if (isPrivate && currentRoomBeds.length > 1) {
            removedBeds = currentRoomBeds.slice(1);
        } else if (!isPrivate && currentRoomBeds.length > targetLabels.length) {
            removedBeds = currentRoomBeds.slice(targetLabels.length);
        }

        for (const bed of removedBeds) {
            const assignedActive = activeBookings.find(b => {
                const bAny = b as any;
                return b.bed_space_id === bed.id || 
                    (b.room_id === updatedRoom.id && (bAny.bed_space_name === bed.label || bAny.assigned_space?.includes(bed.label)));
            });
            if (assignedActive) {
                return {
                    success: false,
                    error: `Cannot modify room configuration: Bed Space "${bed.label}" (ID: ${bed.id}) currently has an active booking for student ${assignedActive.full_name || (assignedActive as any).student_name || 'assigned student'} (Status: ${assignedActive.status}). Please reassign or conclude their booking before reducing capacity or converting this room to private.`
                };
            }
        }

        const { id, created_at, property_id, bedLabels, ...updateData } = updatedRoom as any;

        // 2. Ensure category strictly satisfies PostgreSQL check constraint ('Standard' | 'Premium')
        const aptCat = (updatedRoom.apartment_name || updatedRoom.category || '').toLowerCase();
        updateData.category = aptCat.includes('premium') ? 'Premium' : 'Standard';
        updateData.apartment_name = updatedRoom.apartment_name || (updateData.category === 'Premium' ? 'Premium 1' : 'Standard');

        // 3. Ensure accommodation type is valid ENUM
        if (updateData.category === 'Premium') {
            updateData.type = isPrivate ? AccommodationType.PREMIUM_PRIVATE : AccommodationType.PREMIUM_SHARED;
        } else {
            updateData.type = isPrivate ? AccommodationType.STANDARD_PRIVATE : AccommodationType.STANDARD_SHARED;
        }

        // 4. Resolve room_number uniqueness to prevent duplicate key violations on UNIQUE(property_id, room_number)
        let targetRoomNum = (updateData.room_number || '').trim();
        const digitMatch = targetRoomNum.match(/\d+/);
        const rDigit = digitMatch ? digitMatch[0] : '1';

        const hasCollision = rooms.some(
            r => r.id !== updatedRoom.id && 
            ((r.room_number || '').trim().toLowerCase() === `room ${rDigit}`.toLowerCase() ||
             (r.room_number || '').trim().toLowerCase() === targetRoomNum.toLowerCase())
        );

        if (hasCollision) {
            let prefix = 'STD';
            if (aptCat.includes('premium 1')) prefix = 'P1';
            else if (aptCat.includes('premium 2')) prefix = 'P2';
            else if (aptCat.includes('premium 3')) prefix = 'P3';
            else if (aptCat.includes('premium')) prefix = 'PRM';
            
            updateData.room_number = `${prefix}-R${rDigit}`;
        } else if (!targetRoomNum.toLowerCase().startsWith('room') && !targetRoomNum.includes('-')) {
            updateData.room_number = `Room ${rDigit}`;
        }

        const { error, data } = await supabase
            .from('rooms')
            .update(updateData)
            .eq('id', updatedRoom.id)
            .select();

        if (error) {
            console.warn("Supabase update error (trying fallback omitting next_available_date/status):", error);
            const { next_available_date, status, ...fallbackData } = updateData;
            const fallbackRes = await supabase
                .from('rooms')
                .update(fallbackData)
                .eq('id', updatedRoom.id)
                .select();
            
            if (fallbackRes.error) {
                throw fallbackRes.error;
            }

            // Sync room status override to Supabase cms_content to ensure persistence in Supabase
            if (updatedRoom.status) {
                try {
                    const { data: currentCms } = await supabase.from('cms_content').select('*').limit(1).maybeSingle();
                    if (currentCms) {
                        const currentVideos = currentCms.how_to_videos || {};
                        const currentOverrides = currentVideos.room_status_overrides || {};
                        const updatedOverrides = { ...currentOverrides, [updatedRoom.id]: updatedRoom.status };
                        await supabase.from('cms_content').update({
                            how_to_videos: { ...currentVideos, room_status_overrides: updatedOverrides }
                        }).eq('id', currentCms.id);
                    }
                } catch (cmsErr) {
                    console.warn("Notice syncing room status to Supabase cms_content:", cmsErr);
                }
            }
        } else if (updatedRoom.status) {
            // Keep Supabase cms_content status backup in sync as well
            try {
                const { data: currentCms } = await supabase.from('cms_content').select('*').limit(1).maybeSingle();
                if (currentCms) {
                    const currentVideos = currentCms.how_to_videos || {};
                    const currentOverrides = currentVideos.room_status_overrides || {};
                    const updatedOverrides = { ...currentOverrides, [updatedRoom.id]: updatedRoom.status };
                    await supabase.from('cms_content').update({
                        how_to_videos: { ...currentVideos, room_status_overrides: updatedOverrides }
                    }).eq('id', currentCms.id);
                }
            } catch (cmsErr) {
                console.warn("Notice syncing room status override:", cmsErr);
            }
        }
        
        console.log("Room updated successfully in Supabase:", updatedRoom.id);

        // Fetch current bed spaces for this room from DB
        const { data: existingBeds } = await supabase
            .from('bed_spaces')
            .select('*')
            .eq('room_id', updatedRoom.id)
            .order('id', { ascending: true });

        const currentBeds = existingBeds || [];

        // Reconcile bed spaces
        if (currentBeds.length === 1 && currentBeds[0].label === 'Single' && !isPrivate) {
            const { error: singleBedErr } = await supabase
                .from('bed_spaces')
                .update({ label: targetLabels[0] || 'Bed A' })
                .eq('id', currentBeds[0].id);
            if (singleBedErr) {
                throw new Error(`Failed to update bed space label: ${singleBedErr.message}`);
            }

            const extraBeds = targetLabels.slice(1).map(label => ({
                room_id: updatedRoom.id,
                label
            }));
            if (extraBeds.length > 0) {
                const { error: extraInsErr } = await supabase.from('bed_spaces').insert(extraBeds);
                if (extraInsErr) {
                    throw new Error(`Failed to add extra bed spaces: ${extraInsErr.message}`);
                }
            }
        } else if (isPrivate && currentBeds.length > 0) {
            const { error: singleBedErr } = await supabase
                .from('bed_spaces')
                .update({ label: 'Single' })
                .eq('id', currentBeds[0].id);
            if (singleBedErr) {
                throw new Error(`Failed to update bed label to Single: ${singleBedErr.message}`);
            }

            const extraBedIds = currentBeds.slice(1).map(b => b.id);
            for (const bId of extraBedIds) {
                const { error: delErr } = await supabase.from('bed_spaces').delete().eq('id', bId);
                if (delErr) {
                    throw new Error(`Failed to remove bed space (ID: ${bId}): ${delErr.message}. The bed may be referenced by an existing booking.`);
                }
            }
        } else {
            const existingLabels = new Set(currentBeds.map(b => b.label));
            const missingLabels = targetLabels.filter(lbl => !existingLabels.has(lbl));
            if (missingLabels.length > 0) {
                const newBedsToInsert = missingLabels.map(label => ({
                    room_id: updatedRoom.id,
                    label
                }));
                const { error: insErr } = await supabase.from('bed_spaces').insert(newBedsToInsert);
                if (insErr) {
                    throw new Error(`Failed to insert new bed spaces: ${insErr.message}`);
                }
            }

            const excessBeds = currentBeds.filter(b => !targetLabels.includes(b.label));
            for (const excess of excessBeds) {
                const { error: delErr } = await supabase.from('bed_spaces').delete().eq('id', excess.id);
                if (delErr) {
                    throw new Error(`Failed to remove excess bed space "${excess.label}" (ID: ${excess.id}): ${delErr.message}. The bed may be referenced by an existing booking.`);
                }
            }
        }

        // Refresh bed spaces in local state
        const { data: refreshedBeds } = await supabase
            .from('bed_spaces')
            .select('*')
            .order('id', { ascending: true });

        if (refreshedBeds) {
            setBedSpaces(refreshedBeds);
        }

        const refreshedRoom: Room = {
            ...updatedRoom,
            ...updateData
        };

        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? refreshedRoom : r));
        return { success: true };
    } catch (err: any) {
        console.error("Error updating room in Supabase:", err);
        return { success: false, error: err.message || "Failed to update room in database." };
    }
  };

  const toggleRoomStatus = async (roomId: number, newStatus: 'Active' | 'Inactive') => {
    try {
        const room = rooms.find(r => r.id === roomId);
        if (!room) throw new Error("Room not found");
        const updated = { ...room, status: newStatus };
        return await updateRoom(updated);
    } catch (err: any) {
        console.error("Error toggling room status:", err);
        return { success: false, error: err.message || "Failed to toggle room status" };
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

        // 2. Delete child bed_spaces first (to satisfy foreign key constraints)
        const { error: bedDeleteError } = await supabase
            .from('bed_spaces')
            .delete()
            .eq('room_id', roomId);

        if (bedDeleteError) {
            throw new Error(`Failed to delete bed spaces for room: ${bedDeleteError.message}`);
        }

        // 3. Delete room from rooms table
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (error) throw error;

        setBedSpaces(prev => prev.filter(b => b.room_id !== roomId));
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

  const updateStudentProfile = async (studentId: string, profileUpdates: {
    full_name?: string;
    email?: string;
    phone_number?: string;
    gender?: 'Male' | 'Female';
    nationality?: string;
    passport_number?: string;
    emergency_contact?: string;
    emergency_contact_details?: string;
    address_in_egypt?: string;
    building_no?: string;
    flat_no?: string;
    street_name?: string;
    district_name?: string;
    state?: string;
  }): Promise<{ success: boolean; error?: string; updatedStudent?: User }> => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);

      // 1. Direct Supabase updates to 'profiles' table if studentId is UUID
      if (isUUID) {
        const dbProfileUpdates: Record<string, any> = {};
        if (profileUpdates.full_name !== undefined) dbProfileUpdates.full_name = profileUpdates.full_name;
        if (profileUpdates.phone_number !== undefined) dbProfileUpdates.phone_number = profileUpdates.phone_number;
        if (profileUpdates.gender !== undefined) dbProfileUpdates.gender = profileUpdates.gender;
        if (profileUpdates.nationality !== undefined) dbProfileUpdates.nationality = profileUpdates.nationality;
        if (profileUpdates.passport_number !== undefined) dbProfileUpdates.passport_number = profileUpdates.passport_number;

        const { error: profileError } = await supabase
          .from('profiles')
          .update(dbProfileUpdates)
          .eq('id', studentId);

        if (profileError) {
          console.error("Supabase profiles update error:", profileError.message);
          throw profileError;
        }
      }

      // 2. Direct Supabase updates to 'bookings' table for this student to sync all contract & occupancy data
      const dbBookingUpdates: Record<string, any> = {};
      if (profileUpdates.full_name !== undefined) dbBookingUpdates.full_name = profileUpdates.full_name;
      if (profileUpdates.email !== undefined) dbBookingUpdates.email = profileUpdates.email;
      if (profileUpdates.phone_number !== undefined) dbBookingUpdates.phone_number = profileUpdates.phone_number;
      if (profileUpdates.nationality !== undefined) dbBookingUpdates.nationality = profileUpdates.nationality;
      if (profileUpdates.passport_number !== undefined) dbBookingUpdates.passport_number = profileUpdates.passport_number;
      if (profileUpdates.gender !== undefined) dbBookingUpdates.gender = profileUpdates.gender;
      if (profileUpdates.emergency_contact_details !== undefined) dbBookingUpdates.emergency_contact_details = profileUpdates.emergency_contact_details;
      if (profileUpdates.emergency_contact !== undefined) dbBookingUpdates.emergency_contact = profileUpdates.emergency_contact;
      if (profileUpdates.address_in_egypt !== undefined) dbBookingUpdates.address_in_egypt = profileUpdates.address_in_egypt;
      if (profileUpdates.building_no !== undefined) dbBookingUpdates.building_no = profileUpdates.building_no;
      if (profileUpdates.flat_no !== undefined) dbBookingUpdates.flat_no = profileUpdates.flat_no;
      if (profileUpdates.street_name !== undefined) dbBookingUpdates.street_name = profileUpdates.street_name;
      if (profileUpdates.district_name !== undefined) dbBookingUpdates.district_name = profileUpdates.district_name;
      if (profileUpdates.state !== undefined) dbBookingUpdates.state = profileUpdates.state;

      if (Object.keys(dbBookingUpdates).length > 0) {
        if (isUUID) {
          const { error: bookingUpdateErr } = await supabase
            .from('bookings')
            .update(dbBookingUpdates)
            .or(`student_id.eq.${studentId},user_id.eq.${studentId}`);
          
          if (bookingUpdateErr) {
            console.error("Supabase bookings update error:", bookingUpdateErr.message);
            throw bookingUpdateErr;
          }
        } else if (profileUpdates.email) {
          const { error: emailBookingErr } = await supabase
            .from('bookings')
            .update(dbBookingUpdates)
            .eq('email', profileUpdates.email);

          if (emailBookingErr) {
            console.error("Supabase bookings email update error:", emailBookingErr.message);
            throw emailBookingErr;
          }
        }
      }

      // 3. Update React AppContext state
      setStudents(prev => {
        const found = prev.some(st => st.id === studentId);
        if (found) {
          return prev.map(st => st.id === studentId ? { ...st, ...profileUpdates } : st);
        }
        // If not present in students array, create or update
        return [{
          id: studentId,
          full_name: profileUpdates.full_name || '',
          email: profileUpdates.email || '',
          phone_number: profileUpdates.phone_number,
          gender: profileUpdates.gender || 'Male',
          nationality: profileUpdates.nationality,
          passport_number: profileUpdates.passport_number,
          role: 'student' as const,
          created_at: new Date().toISOString()
        }, ...prev];
      });

      setUsers(prev => prev.map(u => (u.id === studentId || (u.email && profileUpdates.email && u.email.toLowerCase() === profileUpdates.email.toLowerCase())) ? { ...u, ...profileUpdates } : u));

      setBookings(prev => prev.map(b => {
        if (b.student_id === studentId || b.user_id === studentId || (b.email && profileUpdates.email && b.email.toLowerCase() === profileUpdates.email.toLowerCase())) {
          return {
            ...b,
            ...dbBookingUpdates
          };
        }
        return b;
      }));

      // 4. Fetch fresh profile from Supabase to verify
      let updatedUserObj: User = {
        id: studentId,
        full_name: profileUpdates.full_name || '',
        email: profileUpdates.email || '',
        phone_number: profileUpdates.phone_number,
        gender: profileUpdates.gender || 'Male',
        nationality: profileUpdates.nationality,
        passport_number: profileUpdates.passport_number,
        role: 'student',
        created_at: new Date().toISOString()
      };

      if (isUUID) {
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', studentId)
          .maybeSingle();

        if (freshProfile) {
          updatedUserObj = {
            id: freshProfile.id,
            email: profileUpdates.email || '',
            full_name: freshProfile.full_name,
            role: freshProfile.role,
            gender: freshProfile.gender,
            phone_number: freshProfile.phone_number,
            passport_number: freshProfile.passport_number,
            nationality: freshProfile.nationality,
            created_at: freshProfile.created_at
          };
        }
      }

      return { success: true, updatedStudent: updatedUserObj };
    } catch (err: any) {
      console.error("Error updating student profile in Supabase:", err);
      return { success: false, error: err.message || "Failed to update student profile." };
    }
  };

  const addToWaitlist = async (entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'status'> & { status?: WaitlistStatus }) => {
    try {
      const newEntryPayload: any = {
        student_id: entry.student_id || user?.id || null,
        full_name: entry.full_name || user?.full_name || null,
        email: entry.email || user?.email || null,
        phone_number: entry.phone_number || user?.phone_number || null,
        category: entry.category,
        accommodation_type: entry.accommodation_type,
        room_id: entry.room_id || null,
        bed_space_id: entry.bed_space_id || null,
        duration_months: entry.duration_months || 6,
        status: entry.status || 'Waiting',
        notes: entry.notes || null,
      };

      let insertedData: any = null;

      if (user) {
        // Authenticated student or admin/staff
        const { data, error } = await supabase
          .from('waitlist')
          .insert([newEntryPayload])
          .select('*, profiles:student_id(full_name, phone_number, nationality)')
          .maybeSingle();

        if (error) {
          console.warn("Notice: select with profile join failed, attempting plain insert:", error.message);
          const { error: plainErr } = await supabase
            .from('waitlist')
            .insert([newEntryPayload]);
          if (plainErr) throw plainErr;
        } else {
          insertedData = data;
        }
      } else {
        // Unauthenticated guest applicant
        const { error } = await supabase
          .from('waitlist')
          .insert([newEntryPayload]);

        if (error) throw error;
      }

      // Log system audit activity so bell and notifications log it
      try {
        const applicantName = newEntryPayload.full_name || user?.full_name || 'Applicant';
        addActivity({
          user_id: user?.id || 'guest',
          type: 'system',
          description: `Waitlist application: ${applicantName} registered for ${newEntryPayload.category} (${newEntryPayload.accommodation_type})`,
          timestamp: new Date().toISOString()
        });
      } catch (actErr) {
        console.warn("Notice logging waitlist activity:", actErr);
      }

      if (insertedData) {
        setWaitlist(prev => [insertedData, ...prev.filter(w => w.id !== insertedData.id)]);
        return { success: true, data: insertedData };
      }

      // Optimistic local update
      const optimisticEntry: WaitlistEntry = {
        id: Date.now(),
        student_id: newEntryPayload.student_id,
        full_name: newEntryPayload.full_name,
        email: newEntryPayload.email,
        phone_number: newEntryPayload.phone_number,
        category: newEntryPayload.category,
        accommodation_type: newEntryPayload.accommodation_type,
        room_id: newEntryPayload.room_id,
        bed_space_id: newEntryPayload.bed_space_id,
        duration_months: newEntryPayload.duration_months,
        status: newEntryPayload.status,
        notes: newEntryPayload.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setWaitlist(prev => [optimisticEntry, ...prev]);
      return { success: true, data: optimisticEntry };
    } catch (err: any) {
      console.error("Error adding to waitlist:", err.message);
      return { success: false, error: err.message || "Failed to join waitlist. Please try again." };
    }
  };

  const refreshWaitlist = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*, profiles:student_id(full_name, phone_number, nationality)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWaitlist(data);
      }
    } catch (err) {
      console.warn("Notice refreshing waitlist:", err);
    }
  }, []);

  const updateWaitlistStatus = async (id: number, status: WaitlistStatus) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status, updated_at: new Date().toISOString() } : w));
      return { success: true };
    } catch (err: any) {
      console.error("Error updating waitlist status:", err.message);
      return { success: false, error: err.message || "Failed to update waitlist status." };
    }
  };

  const updateWaitlistEntry = async (id: number, updates: Partial<WaitlistEntry>) => {
    try {
      const { profiles, ...dbUpdates } = updates as any;
      const { error } = await supabase
        .from('waitlist')
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setWaitlist(prev => prev.map(w => w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w));
      return { success: true };
    } catch (err: any) {
      console.error("Error updating waitlist entry:", err.message);
      return { success: false, error: err.message || "Failed to update waitlist entry." };
    }
  };

  const refreshEmailLogs = useCallback(async () => {
    try {
      const logs = await fetchRecentEmailLogs();
      setEmailLogs(logs);
    } catch (err) {
      console.warn("Error refreshing email logs:", err);
    }
  }, []);

  const retryEmailLog = async (logId: number): Promise<{ success: boolean; error?: string }> => {
    const target = emailLogs.find(l => l.id === logId);
    if (!target) return { success: false, error: 'Email log entry not found.' };

    const res = await sendEmail({
      to: target.recipient,
      subject: target.subject,
      body: `[Retry of automated residency notification]\n\n${target.subject}\n\nPlease contact residency management if you have any questions.`,
      templateName: target.template_name || 'manual_retry',
      metadata: { ...target.metadata, retried_from_log_id: logId }
    });

    await refreshEmailLogs();
    return res;
  };

  // ==============================================================================
  // CREDITS & CREDIT TRANSACTIONS MANAGEMENT
  // ==============================================================================
  const refreshCredits = useCallback(async () => {
    try {
      const [creditsRes, txRes] = await Promise.all([
        safeFetch(supabase.from('credits').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('credit_transactions').select('*, profiles:processed_by(full_name)').order('created_at', { ascending: false }))
      ]);

      if (creditsRes?.data && !creditsRes.error) {
        const rawTxs = txRes?.data || [];
        const txs: CreditTransaction[] = rawTxs.map((t: any) => ({
          id: t.id,
          credit_id: t.credit_id,
          amount_used: Number(t.amount_used) || 0,
          date_used: t.date_used,
          amount_remaining_after: Number(t.amount_remaining_after) || 0,
          purpose_notes: t.purpose_notes,
          processed_by: t.processed_by,
          processed_by_name: t.profiles?.full_name || null,
          created_at: t.created_at
        }));

        const combined: CreditRecord[] = creditsRes.data.map((c: any) => ({
          id: c.id,
          student_name: c.student_name,
          email: c.email,
          student_id: c.student_id,
          originating_booking_id: c.originating_booking_id,
          booking_reference: c.booking_reference,
          deposit_amount: Number(c.deposit_amount) || 0,
          credit_balance: Number(c.credit_balance) || 0,
          total_used: Number(c.total_used) || 0,
          status: c.status,
          notes: c.notes,
          created_by: c.created_by,
          created_at: c.created_at,
          updated_at: c.updated_at,
          transactions: txs.filter(t => t.credit_id === c.id)
        }));

        setCredits(combined);
        setCreditTransactions(txs);
      }
    } catch (err) {
      console.warn("Notice loading credits:", err);
    }
  }, []);

  // Real-time synchronization for credits & credit transactions
  useEffect(() => {
    if (user && (user.role === 'staff' || user.role === 'proprietor')) {
      refreshCredits();

      const creditsChannel = supabase
        .channel('global-credits-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'credits' }, () => {
          refreshCredits();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_transactions' }, () => {
          refreshCredits();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(creditsChannel);
      };
    }
  }, [user?.role, user?.id, refreshCredits]);

  const addCredit = async (creditData: {
    student_name: string;
    email: string;
    deposit_amount: number;
    booking_reference?: string;
    student_id?: string;
    originating_booking_id?: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; data?: CreditRecord }> => {
    try {
      const deposit = Number(creditData.deposit_amount);
      if (isNaN(deposit) || deposit <= 0) {
        return { success: false, error: 'Deposit amount must be greater than $0.' };
      }

      const payload: any = {
        student_name: creditData.student_name.trim(),
        email: creditData.email.trim(),
        deposit_amount: deposit,
        credit_balance: deposit,
        total_used: 0,
        status: 'Active Credit',
        notes: creditData.notes?.trim() || null,
        booking_reference: creditData.booking_reference?.trim() || null,
        student_id: creditData.student_id || null,
        originating_booking_id: creditData.originating_booking_id || null,
        created_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('credits')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const mappedRecord: CreditRecord = {
        id: data.id,
        student_name: data.student_name,
        email: data.email,
        student_id: data.student_id,
        originating_booking_id: data.originating_booking_id,
        booking_reference: data.booking_reference,
        deposit_amount: Number(data.deposit_amount),
        credit_balance: Number(data.credit_balance),
        total_used: Number(data.total_used),
        status: data.status,
        notes: data.notes,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        transactions: []
      };

      setCredits(prev => [mappedRecord, ...prev.filter(c => c.id !== mappedRecord.id)]);

      // Log to admin audit log
      if (user) {
        addActivity({
          user_id: user.id,
          type: 'system',
          description: `Registered new credit account ${mappedRecord.id} ($${deposit}) for ${mappedRecord.student_name}.`,
          timestamp: new Date().toISOString()
        });
      }

      return { success: true, data: mappedRecord };
    } catch (err: any) {
      console.error("Error adding credit:", err.message);
      return { success: false, error: err.message };
    }
  };

  const executeCreditUsage = async (params: {
    creditId: string;
    amountUsed: number;
    dateUsed?: string;
    purposeNotes?: string;
  }): Promise<{ success: boolean; error?: string; remainingBalance?: number; transaction?: CreditTransaction }> => {
    try {
      const credit = credits.find(c => c.id === params.creditId);
      if (!credit) {
        return { success: false, error: `Credit record ${params.creditId} not found.` };
      }

      const used = Number(params.amountUsed);
      if (isNaN(used) || used <= 0) {
        return { success: false, error: 'Amount used must be greater than $0.' };
      }

      if (used > credit.credit_balance) {
        return { success: false, error: `Amount used ($${used}) exceeds available credit balance ($${credit.credit_balance}).` };
      }

      const newRemaining = Math.max(0, Number((credit.credit_balance - used).toFixed(2)));
      const newTotalUsed = Number(((credit.total_used || 0) + used).toFixed(2));
      const newStatus = newRemaining === 0 ? 'Fully Used' : 'Active Credit';
      const whenDate = params.dateUsed || new Date().toISOString().split('T')[0];

      // 1. Insert immutable transaction row
      const txPayload: any = {
        credit_id: params.creditId,
        amount_used: used,
        date_used: whenDate,
        amount_remaining_after: newRemaining,
        purpose_notes: params.purposeNotes?.trim() || 'Credit deducted toward tenancy renewal/services.',
        processed_by: user?.id || null
      };

      const { data: txData, error: txErr } = await supabase
        .from('credit_transactions')
        .insert([txPayload])
        .select('*, profiles:processed_by(full_name)')
        .single();

      if (txErr) throw txErr;

      // 2. Update parent credit row
      const { error: creditUpdateErr } = await supabase
        .from('credits')
        .update({
          credit_balance: newRemaining,
          total_used: newTotalUsed,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.creditId);

      if (creditUpdateErr) throw creditUpdateErr;

      const mappedTx: CreditTransaction = {
        id: txData.id,
        credit_id: txData.credit_id,
        amount_used: Number(txData.amount_used),
        date_used: txData.date_used,
        amount_remaining_after: Number(txData.amount_remaining_after),
        purpose_notes: txData.purpose_notes,
        processed_by: txData.processed_by,
        processed_by_name: txData.profiles?.full_name || user?.full_name || 'Admin',
        created_at: txData.created_at
      };

      // Update local state
      setCreditTransactions(prev => [mappedTx, ...prev]);
      setCredits(prev => prev.map(c => {
        if (c.id === params.creditId) {
          return {
            ...c,
            credit_balance: newRemaining,
            total_used: newTotalUsed,
            status: newStatus,
            updated_at: new Date().toISOString(),
            transactions: [mappedTx, ...(c.transactions || [])]
          };
        }
        return c;
      }));

      // Log to admin audit log
      if (user) {
        addActivity({
          user_id: user.id,
          type: 'payment',
          description: `Executed $${used} credit usage for ${credit.student_name} (${params.creditId}). Remaining: $${newRemaining}.`,
          timestamp: new Date().toISOString()
        });
      }

      return { success: true, remainingBalance: newRemaining, transaction: mappedTx };
    } catch (err: any) {
      console.error("Error executing credit usage:", err.message);
      return { success: false, error: err.message };
    }
  };

  const approveContractTranslation = async (lang: Language, approvedByName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = contractTranslations[lang];
      if (!existing) return { success: false, error: `Translation for language '${lang}' not found.` };
      if (lang === 'en') return { success: true }; // English is default

      const now = new Date().toISOString();
      const updated: LegalContractTranslation = {
        ...existing,
        status: 'approved',
        approvedAt: now,
        approvedBy: approvedByName || user?.full_name || user?.email || 'Admin',
        lastUpdated: now
      };

      const updatedStore: ContractTranslationsStore = {
        ...contractTranslations,
        [lang]: updated
      };

      setContractTranslations(updatedStore);

      // Persist to contract_translations table in Supabase
      const dbPayload = {
        language_code: lang,
        language_name: updated.languageName,
        native_name: updated.nativeName,
        direction: updated.direction,
        status: 'approved',
        approved_by: user?.id || null,
        approved_at: now,
        version: updated.version || 1,
        content_json: updated,
        updated_at: now
      };

      const { error: dbErr } = await supabase
        .from('contract_translations')
        .upsert([dbPayload], { onConflict: 'language_code' });

      if (dbErr) {
        console.warn("Notice updating contract_translations table:", dbErr.message);
      }

      // Also persist to CMS content for fallback durability
      await updateCmsContent({ contractTranslations: updatedStore });

      // Admin audit log
      if (user) {
        addActivity({
          user_id: user.id,
          type: 'system',
          description: `Approved Tenancy Agreement translation for ${updated.languageName} (${lang.toUpperCase()}). Now live for students.`,
          timestamp: now
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error approving contract translation:", err.message);
      return { success: false, error: err.message };
    }
  };

  const revertContractTranslationToDraft = async (lang: Language): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = contractTranslations[lang];
      if (!existing) return { success: false, error: `Translation for language '${lang}' not found.` };
      if (lang === 'en') return { success: false, error: "English contract cannot be reverted to draft." };

      const now = new Date().toISOString();
      const updated: LegalContractTranslation = {
        ...existing,
        status: 'draft',
        approvedAt: undefined,
        approvedBy: undefined,
        lastUpdated: now
      };

      const updatedStore: ContractTranslationsStore = {
        ...contractTranslations,
        [lang]: updated
      };

      setContractTranslations(updatedStore);

      const dbPayload = {
        language_code: lang,
        language_name: updated.languageName,
        native_name: updated.nativeName,
        direction: updated.direction,
        status: 'draft',
        approved_by: null,
        approved_at: null,
        version: updated.version || 1,
        content_json: updated,
        updated_at: now
      };

      const { error: dbErr } = await supabase
        .from('contract_translations')
        .upsert([dbPayload], { onConflict: 'language_code' });

      if (dbErr) {
        console.warn("Notice updating contract_translations table:", dbErr.message);
      }

      await updateCmsContent({ contractTranslations: updatedStore });

      if (user) {
        addActivity({
          user_id: user.id,
          type: 'system',
          description: `Reverted Tenancy Agreement translation for ${updated.languageName} (${lang.toUpperCase()}) to Draft. Students will receive English contract until re-approved.`,
          timestamp: now
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error reverting contract translation to draft:", err.message);
      return { success: false, error: err.message };
    }
  };

  const updateContractTranslation = async (lang: Language, updates: Partial<LegalContractTranslation>): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = contractTranslations[lang];
      if (!existing) return { success: false, error: `Translation for language '${lang}' not found.` };

      const now = new Date().toISOString();
      const updated: LegalContractTranslation = {
        ...existing,
        ...updates,
        version: (existing.version || 1) + 1,
        lastUpdated: now
      };

      const updatedStore: ContractTranslationsStore = {
        ...contractTranslations,
        [lang]: updated
      };

      setContractTranslations(updatedStore);

      const dbPayload = {
        language_code: lang,
        language_name: updated.languageName,
        native_name: updated.nativeName,
        direction: updated.direction,
        status: updated.status,
        approved_by: updated.status === 'approved' ? (user?.id || null) : null,
        approved_at: updated.status === 'approved' ? (updated.approvedAt || now) : null,
        version: updated.version,
        content_json: updated,
        updated_at: now
      };

      const { error: dbErr } = await supabase
        .from('contract_translations')
        .upsert([dbPayload], { onConflict: 'language_code' });

      if (dbErr) {
        console.warn("Notice updating contract_translations table:", dbErr.message);
      }

      await updateCmsContent({ contractTranslations: updatedStore });

      return { success: true };
    } catch (err: any) {
      console.error("Error updating contract translation:", err.message);
      return { success: false, error: err.message };
    }
  };

  const resetContractTranslation = async (lang: Language): Promise<{ success: boolean; error?: string }> => {
    try {
      const defaultDraft = DEFAULT_CONTRACT_TRANSLATIONS[lang];
      if (!defaultDraft) return { success: false, error: `Default translation for '${lang}' not found.` };

      const updatedStore: ContractTranslationsStore = {
        ...contractTranslations,
        [lang]: { ...defaultDraft }
      };

      setContractTranslations(updatedStore);

      const dbPayload = {
        language_code: lang,
        language_name: defaultDraft.languageName,
        native_name: defaultDraft.nativeName,
        direction: defaultDraft.direction,
        status: defaultDraft.status,
        approved_by: null,
        approved_at: null,
        version: 1,
        content_json: defaultDraft,
        updated_at: new Date().toISOString()
      };

      const { error: dbErr } = await supabase
        .from('contract_translations')
        .upsert([dbPayload], { onConflict: 'language_code' });

      if (dbErr) {
        console.warn("Notice resetting contract_translations table:", dbErr.message);
      }

      await updateCmsContent({ contractTranslations: updatedStore });

      return { success: true };
    } catch (err: any) {
      console.error("Error resetting contract translation:", err.message);
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

  // Centralized, memoized parsedRoomSpaces
  const parsedRoomSpaces = useMemo(() => {
    return getParsedRoomSpaces(rooms, effectiveOccupancyBookings, bedSpaces, { includeInactive: true }, accommodationCategories);
  }, [rooms, effectiveOccupancyBookings, bedSpaces, accommodationCategories]);

  // Centralized roomOccupancyMap mapping each room ID to its true occupied count and availability
  const roomOccupancyMap = useMemo(() => {
    const map: Record<number, { occupiedSlots: number; capacity: number; slotsLeft: number; isOccupied: boolean; isAvailable: boolean }> = {};
    for (const r of rooms) {
      const matchingSpaces = parsedRoomSpaces.filter(s => s.roomId === r.id || (s.dbRoom && s.dbRoom.id === r.id));
      const totalCap = matchingSpaces.length > 0 ? matchingSpaces.length : (r.capacity || 1);
      const occupied = matchingSpaces.filter(s => s.isOccupied).length;
      const isInactive = r.status === 'Inactive';
      const remaining = isInactive ? 0 : Math.max(0, totalCap - occupied);
      const isFull = isInactive || remaining === 0;
      map[r.id] = {
        occupiedSlots: occupied,
        capacity: totalCap,
        slotsLeft: remaining,
        isOccupied: isFull,
        isAvailable: !isInactive && remaining > 0
      };
    }
    return map;
  }, [rooms, parsedRoomSpaces]);

  // Dynamic self-healed rooms list
  const effectiveRooms = useMemo(() => {
    return rooms.map(r => {
      const occ = roomOccupancyMap[r.id];
      if (!occ) return r;
      return {
        ...r,
        capacity: occ.capacity,
        occupied_slots: occ.occupiedSlots,
        is_available: occ.isAvailable
      };
    });
  }, [rooms, roomOccupancyMap]);

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
    parsedRoomSpaces,
    roomOccupancyMap,
    addBooking,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    cmsContent,
    updateCmsContent,
    rooms: effectiveRooms,
    bedSpaces,
    addRoom,
    updateRoom,
    toggleRoomStatus,
    deleteRoom,
    activities,
    addActivity,
    students,
    users,
    addUser,
    updateUser,
    updateStudentProfile,
    deleteUser,
    academicTerms,
    bookingPackages,
    waitlist,
    addToWaitlist,
    updateWaitlistStatus,
    updateWaitlistEntry,
    refreshWaitlist,
    emailLogs,
    refreshEmailLogs,
    retryEmailLog,
    conversations,
    unreadMessagesCount,
    refreshConversations,
    fetchConversationMessages,
    sendMessage,
    markConversationAsRead,
    credits,
    creditTransactions,
    refreshCredits,
    addCredit,
    executeCreditUsage,
    contractTranslations,
    approveContractTranslation,
    revertContractTranslationToDraft,
    updateContractTranslation,
    resetContractTranslation,
    loading,
    landlordDetails: cmsContent.landlordDetails || DEFAULT_LANDLORD_DETAILS,
    accommodationAddresses: cmsContent.accommodationAddresses || DEFAULT_ACCOMMODATION_ADDRESSES,
    accommodationCategories,
    addAccommodationCategory,
    updateAccommodationCategory,
    deleteAccommodationCategory,
    refreshAccommodationCategories
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
