import { Language } from '../types';

export interface ContractSectionParties {
  title: string;
  landlordLabel: string;
  landlordNameLabel: string;
  landlordName: string;
  landlordAddressLabel: string;
  landlordAddress: string;
  landlordPhoneLabel: string;
  landlordPhone: string;
  tenantLabel: string;
  tenantNameLabel: string;
  tenantNationalityLabel: string;
  tenantPassportLabel: string;
  tenantAddressLabel: string;
  tenantPhoneLabel: string;
  tenantEmailLabel: string;
}

export interface ContractSectionProperty {
  title: string;
  intro: string;
  assignedUnitLabel: string;
}

export interface ContractSectionTerm {
  title: string;
  commencementLabel: string;
  expiryLabel: string;
  durationSuffix: string;
  renewalLabel: string;
  renewalText: string;
  overstayLabel: string;
  overstayText: string;
}

export interface ContractSectionRent {
  title: string;
  monthlyRentLabel: string;
  monthlyRentPerMonth: string;
  privateRoomSuffix: string;
  sharedRoomSuffix: string;
  paymentLabel: string;
  paymentText: string;
  methodLabel: string;
  methodText: string;
}

export interface ContractSectionDeposit {
  title: string;
  amountLabel: string;
  amountText: string;
  paymentLabel: string;
  paymentText: string;
  refundLabel: string;
  refundText: string;
  earlyTerminationLabel: string;
  earlyTerminationText: string;
  noShowLabel: string;
  noShowText: string;
}

export interface ContractSectionUtilities {
  title: string;
  body: string;
}

export interface ContractSectionUseOccupancy {
  title: string;
  useTitle: string;
  useBody: string;
  occupancyTitle: string;
  occupancyIntro: string;
  occupancyPoints: string[];
}

export interface ContractSectionCleaningSafety {
  title: string;
  cleaningTitle: string;
  cleaningPoints: string[];
  maintenanceTitle: string;
  maintenanceBody: string;
  safetyTitle: string;
  safetyPoints: string[];
  securityTitle: string;
  securityPoints: string[];
}

export interface ContractSectionHouseRules {
  title: string;
  visitorTitle: string;
  visitorPoints: string[];
  womenNotice: string;
  houseRulesTitle: string;
  houseRulesPoints: string[];
  inspectionTitle: string;
  inspectionPoints: string[];
}

export interface ContractSectionIslamicValues {
  title: string;
  communicationTitle: string;
  communicationBody: string;
  conductTitle: string;
  conductPoints: string[];
  ethicsTitle: string;
  ethicsPoints: string[];
  salawatHighlight: string;
}

export interface ContractSectionTerminationUndertaking {
  title: string;
  terminationTitle: string;
  terminationPoints: string[];
  undertakingTitle: string;
  undertakingIntro: string;
  undertakingAcknowledge: string;
  undertakingPoints: string[];
  extremismHighlight: string;
}

export interface ContractSectionSignatures {
  title: string;
  intro: string;
  landlordLabel: string;
  tenantLabel: string;
  dateLabel: string;
  awaitingSignatureText: string;
  footerText: string;
  pageText: string;
  agreementDateIntro: string;
}

export interface LegalContractTranslation {
  language: Language;
  languageName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  status: 'draft' | 'approved';
  approvedAt?: string | null;
  approvedBy?: string | null;
  version: number;
  lastUpdated: string;
  headerTitle: string;
  headerSubtitle: string;
  sections: {
    parties: ContractSectionParties;
    property: ContractSectionProperty;
    term: ContractSectionTerm;
    rent: ContractSectionRent;
    deposit: ContractSectionDeposit;
    utilities: ContractSectionUtilities;
    useOccupancy: ContractSectionUseOccupancy;
    cleaningSafety: ContractSectionCleaningSafety;
    houseRules: ContractSectionHouseRules;
    islamicValues: ContractSectionIslamicValues;
    terminationUndertaking: ContractSectionTerminationUndertaking;
    signatures: ContractSectionSignatures;
  };
}

export type ContractTranslationsStore = Record<Language, LegalContractTranslation>;

export const DEFAULT_CONTRACT_TRANSLATIONS: ContractTranslationsStore = {
  en: {
    language: 'en',
    languageName: 'English',
    nativeName: 'English',
    direction: 'ltr',
    status: 'approved',
    approvedAt: '2026-01-01T00:00:00.000Z',
    approvedBy: 'System Baseline',
    version: 1,
    lastUpdated: '2026-08-31T00:00:00.000Z',
    headerTitle: 'TENANCY AGREEMENT',
    headerSubtitle: 'Al-Ibaanah Arabic Center',
    sections: {
      parties: {
        title: '1. PARTIES TO THE AGREEMENT',
        landlordLabel: 'LANDLORD',
        landlordNameLabel: 'Name',
        landlordName: 'Jimoh Bolakale Ajao (Al-Ibaanah Arabic Center)',
        landlordAddressLabel: 'Address',
        landlordAddress: '9, Mahmood Tawfeeq Street, off Kaabool Street, Makram Ebeid, Nasr City, Egypt',
        landlordPhoneLabel: 'Phone',
        landlordPhone: '+20 103 007 2440',
        tenantLabel: 'TENANT',
        tenantNameLabel: 'Name',
        tenantNationalityLabel: 'Nationality',
        tenantPassportLabel: 'Passport No.',
        tenantAddressLabel: 'Address',
        tenantPhoneLabel: 'Phone',
        tenantEmailLabel: 'Email'
      },
      property: {
        title: '2. RENTAL PROPERTY & UNIT',
        intro: 'The property subject to this Agreement is located at:',
        assignedUnitLabel: 'Assigned Unit Space:'
      },
      term: {
        title: '3. TERM OF LEASE',
        commencementLabel: 'Commencement:',
        expiryLabel: 'Expiry:',
        durationSuffix: 'Months',
        renewalLabel: 'Renewal:',
        renewalText: 'Upon mutual agreement between both parties',
        overstayLabel: 'Overstay:',
        overstayText: 'USD 15 per night beyond the agreed period, subject to landlord approval'
      },
      rent: {
        title: '4. RENT',
        monthlyRentLabel: 'Monthly Rent:',
        monthlyRentPerMonth: 'USD {rate} per month',
        privateRoomSuffix: 'private room',
        sharedRoomSuffix: 'shared room in shared apartment',
        paymentLabel: 'Payment:',
        paymentText: "Two months' rent paid in advance upon arrival",
        methodLabel: 'Method:',
        methodText: 'Cash — payable at Al-Ibaanah Arabic Center'
      },
      deposit: {
        title: '5. SECURITY DEPOSIT',
        amountLabel: 'Amount:',
        amountText: "USD {rate} (one month's rent)",
        paymentLabel: 'Payment:',
        paymentText: 'Due upon signing of this Agreement',
        refundLabel: 'Refund:',
        refundText: 'Refundable at end of lease, provided no damages and full compliance with all terms',
        earlyTerminationLabel: 'Early Termination:',
        earlyTerminationText: 'The landlord reserves the right to withhold the deposit if the tenant vacates before the agreed end date',
        noShowLabel: 'No-Show:',
        noShowText: 'The deposit is non-refundable if the tenant fails to arrive after signing this Agreement'
      },
      utilities: {
        title: '6. UTILITIES',
        body: 'All utility expenses — including electricity, gas, water, and internet — are covered by the landlord and included in the monthly rent. Tenants are expected to use all utilities responsibly and in moderation. Excessive or unreasonable consumption may result in the landlord revising the rental terms or imposing usage limits.'
      },
      useOccupancy: {
        title: 'SECTION 1 — USE AND OCCUPANCY',
        useTitle: '1.1 Use of Property',
        useBody: 'Reflects hostel accommodation: The property shall be used exclusively as shared hostel/dormitory accommodation. All residents must adhere to the terms of this Agreement and House Rules provided by the landlord. The landlord retains the right to oversee the property and ensure it is kept in clean, safe and lawful conditions at all times.',
        occupancyTitle: '1.2 Occupancy',
        occupancyIntro: 'The apartment will accommodate up to {maxResidents} residents.',
        occupancyPoints: [
          'Each resident must provide a valid passport copy and sign an internal occupancy form.',
          'Subletting or reassignment of any kind is strictly prohibited under any circumstances.'
        ]
      },
      cleaningSafety: {
        title: 'SECTION 2 — CLEANING, MAINTENANCE, SAFETY & SECURITY',
        cleaningTitle: '2.1 Cleaning and Maintenance',
        cleaningPoints: [
          'The landlord shall ensure cleaning of all shared areas (kitchen, living room, hallways, bathrooms) three times per week.',
          'Each resident is responsible for maintaining hygienic conditions in their private room and keeping a cleaning log.',
          'A designated person will collect trash daily; residents must deposit their waste in the appropriate bins.',
          'No trash or waste may be left in corridors, stairways, or on balconies at any time.',
          'Any shared area, appliance, or item used must be left clean and in the condition it was found.'
        ],
        maintenanceTitle: '2.2 Maintenance and Repairs',
        maintenanceBody: 'General maintenance of the property is the responsibility of the landlord. However, any damage resulting from misuse or negligence by a resident shall be the financial responsibility of that resident and may result in a fine. Residents must report any maintenance issues promptly and treat all property and facilities with care.',
        safetyTitle: '2.3 Safety and Emergency Procedures',
        safetyPoints: [
          'Open flames, candles, and tampering with fire safety equipment are strictly prohibited.',
          'Two fire extinguishers are installed and accessible within the apartment at all times.',
          'A first aid kit and emergency contact list are available on-site.',
          'All residents must familiarise themselves with emergency exits and evacuation procedures.',
          'Any emergency must be reported to the landlord immediately.'
        ],
        securityTitle: '2.4 Security',
        securityPoints: [
          'All doors, windows, and the balcony must remain closed and secured at all times, and opened only when in use.',
          'Any resident who fails to properly secure a door or window shall be held fully responsible for any resulting theft or damage.',
          'All residents are expected to remain vigilant and actively contribute to the safety and security of the property.'
        ]
      },
      houseRules: {
        title: 'SECTION 3 — VISITORS, HOUSE RULES & ENTRY',
        visitorTitle: '3.1 Visitor Policy',
        visitorPoints: [
          'Visitors are permitted between 10:00 AM and 8:00 PM only.',
          'No overnight stays are allowed under any circumstances.',
          'Family visits must comply with visiting hours and all house rules.',
          'Non-family visitors are not permitted in any private rooms.',
          'Family members may only enter the room of the specific tenant they are visiting.',
          'The resident receiving visitors is fully accountable for the behaviour of their guests.'
        ],
        womenNotice: 'Women are not permitted in the apartment under any circumstances, including family members of the tenant.',
        houseRulesTitle: '3.2 House Rules',
        houseRulesPoints: [
          'Smoking inside the apartment is strictly prohibited.',
          'No pets are allowed.',
          'Music is not permitted inside the apartment.',
          'Trash must be disposed of daily in the compound bin. No waste may be left in stairways, corridors, or balconies.',
          'No modifications of any kind may be made to the apartment without prior written approval from the landlord.',
          'Tenants must maintain cleanliness throughout their stay.',
          'Residents must respect neighbours and observe building regulations.',
          'Any damage caused by a resident is their sole financial responsibility.',
          'Food and eating are strictly limited to the kitchen or dining area. No food is permitted in the rooms.'
        ],
        inspectionTitle: '3.3 Inspection and Entry',
        inspectionPoints: [
          "The landlord or a representative may inspect shared areas bi-weekly with 48 hours' prior notice.",
          "The landlord may not enter private rooms without the tenant's consent, except in cases of emergency or with prior notice for scheduled inspection or repair."
        ]
      },
      islamicValues: {
        title: 'SECTION 4 — COMMUNICATION, CONDUCT & ISLAMIC VALUES',
        communicationTitle: '4.1 Communication',
        communicationBody: 'A WhatsApp group shall be created for the apartment. Every tenant is required to join and remain active in the group to receive important updates, notices, and communications from the landlord or their representative.',
        conductTitle: '4.2 Conflict Resolution and Conduct',
        conductPoints: [
          'Any disagreement or dispute among residents must be escalated to the landlord for resolution.',
          'Fighting, keeping malice, gossiping, or backbiting is strictly prohibited.',
          'All tenants are expected to uphold a respectful and cooperative environment at all times.'
        ],
        ethicsTitle: '4.3 Islamic Environment and Ethics',
        ethicsPoints: [
          'The apartment shall be maintained as an Islamic environment. All residents are expected to observe etiquette and conduct in accordance with the Qur’an and the Sunnah.',
          'Behaviour, speech, dress, and interactions among residents must reflect the values of modesty, respect, and cooperation as taught in Islam.',
          'No resident may absent themselves from congregational prayer without a valid legislated excuse as defined by the Shari’ah.',
          'Any conduct contradicting these Islamic principles may result in corrective measures or termination of this Agreement by the landlord.'
        ],
        salawatHighlight: 'All residents are expected to attend the masjid for the five daily prayers (salawat).'
      },
      terminationUndertaking: {
        title: 'SECTION 5 — TERMINATION AND TENANT UNDERTAKING',
        terminationTitle: '5.1 Termination',
        terminationPoints: [
          'All parties agree to strictly abide by the terms and conditions of this Agreement for its full duration.',
          'The tenant shall forfeit the entire security deposit if they vacate before the stipulated end date, unless otherwise approved in writing by the landlord under exceptional circumstances.',
          'In the event of serious misconduct or repeated violation of house rules, the landlord reserves the right to terminate this Agreement or request the removal of the resident(s) involved, without refund of rent or deposit for the period in question.'
        ],
        undertakingTitle: '5.2 Tenant Undertaking',
        undertakingIntro: "I, {name}, the tenant, commit to respecting the property, maintaining its condition, and preserving the landlord's trust and privacy.",
        undertakingAcknowledge: 'I acknowledge and undertake the following:',
        undertakingPoints: [
          'I will report any pre-existing or new damage within one (1) week of receiving the keys.',
          'I will return the apartment in the same condition as it was handed over to me.',
          'I will notify the landlord of any incidents occurring on the property.'
        ],
        extremismHighlight: 'I am not affiliated with any extremist group or movement, including Takfir, Khawarij, Daesh, Tabligh, Ikhwan, or any similar organisation.'
      },
      signatures: {
        title: 'SIGNATURES',
        intro: 'By signing below, both parties confirm that they have read, understood, and agreed to all the terms and conditions set forth in this Tenancy Agreement.',
        landlordLabel: 'LANDLORD',
        tenantLabel: 'TENANT',
        dateLabel: 'Date',
        awaitingSignatureText: 'Awaiting Student Digital Signature',
        footerText: 'Al-Ibaanah Arabic Center - Official Student Residency Agreement',
        pageText: 'Page {page} of 4',
        agreementDateIntro: 'This agreement is made on the'
      }
    }
  },

  ar: {
    language: 'ar',
    languageName: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    status: 'draft',
    approvedAt: null,
    approvedBy: null,
    version: 1,
    lastUpdated: '2026-08-31T00:00:00.000Z',
    headerTitle: 'عقد إيجار سكني للطلاب',
    headerSubtitle: 'مركز الإبانة للغة العربية',
    sections: {
      parties: {
        title: '١. أطراف العقد',
        landlordLabel: 'المؤجر',
        landlordNameLabel: 'الاسم',
        landlordName: 'جيموه بولاكالي أجاو (مركز الإبانة للغة العربية)',
        landlordAddressLabel: 'العنوان',
        landlordAddress: '٩ شارع محمود توفيق، متفرع من شارع كابول، مكرم عبيد، مدينة نصر، مصر',
        landlordPhoneLabel: 'الهاتف',
        landlordPhone: '+20 103 007 2440',
        tenantLabel: 'المستأجر',
        tenantNameLabel: 'الاسم الكامل',
        tenantNationalityLabel: 'الجنسية',
        tenantPassportLabel: 'رقم جواز السفر',
        tenantAddressLabel: 'العنوان الأصلي',
        tenantPhoneLabel: 'رقم الهاتف (واتساب)',
        tenantEmailLabel: 'البريد الإلكتروني'
      },
      property: {
        title: '٢. العقار والوحدة السكنية',
        intro: 'يقع العقار محل هذا العقد في العنوان التالي:',
        assignedUnitLabel: 'الوحدة / السرير المخصص:'
      },
      term: {
        title: '٣. مدة الإيجار',
        commencementLabel: 'تاريخ البدء:',
        expiryLabel: 'تاريخ الانتهاء:',
        durationSuffix: 'أشهر',
        renewalLabel: 'التجديد:',
        renewalText: 'بموافقة الطرفين المتبادلة مسبقاً',
        overstayLabel: 'الإقامة الزائدة:',
        overstayText: '١٥ دولاراً أمريكياً لكل ليلة بعد الفترة المتفق عليها، وتخضع لموافقة المؤجر'
      },
      rent: {
        title: '٤. القيمة الإيجارية',
        monthlyRentLabel: 'الإيجار الشهري:',
        monthlyRentPerMonth: '{rate} دولار أمريكي شهرياً',
        privateRoomSuffix: 'غرفة خاصة',
        sharedRoomSuffix: 'غرفة مشتركة في شقة طلابية',
        paymentLabel: 'الدفع:',
        paymentText: 'يتم دفع إيجار شهرين مقدماً عند الوصول',
        methodLabel: 'طريقة الدفع:',
        methodText: 'نقداً — تدفع في مركز الإبانة للغة العربية'
      },
      deposit: {
        title: '٥. مبلغ التأمين (الوديعة)',
        amountLabel: 'المبلغ:',
        amountText: '{rate} دولار أمريكي (إيجار شهر واحد)',
        paymentLabel: 'السداد:',
        paymentText: 'مستحق الدفع فور توقيع هذا العقد',
        refundLabel: 'الاسترداد:',
        refundText: 'يُسترد عند نهاية فترة العقد، شريطة عدم وجود أضرار والالتزام الكامل بكافة الشروط',
        earlyTerminationLabel: 'الإنهاء المبكر:',
        earlyTerminationText: 'يحق للمؤجر مصادرة مبلغ التأمين إذا أخلى المستأجر السكن قبل تاريخ الانتهاء المتفق عليه',
        noShowLabel: 'عدم الحضور:',
        noShowText: 'التأمين غير قابل للاسترداد في حال عدم حضور المستأجر بعد توقيع هذا العقد'
      },
      utilities: {
        title: '٦. المرافق والخدمات',
        body: 'يتحمل المؤجر جميع فواتير المرافق — بما في ذلك الكهرباء والغاز والماء والإنترنت — وهي مشمولة ضمن الإيجار الشهري. يُتوقع من المستأجرين استخدام كافة المرافق بمسؤولية واعتدال. قد يؤدي الاستهلاك المفرط أو غير المبرر إلى إعادة النظر في الشروط أو فرض قيود على الاستخدام.'
      },
      useOccupancy: {
        title: 'البند الأول — الاستخدام والإشغال',
        useTitle: '١.١ استخدام العقار',
        useBody: 'نظام السكن الطلابي المشترك: يُستخدم العقار حصرياً كسكن طلابي مشترك. يجب على جميع المقيمين الالتزام ببنود هذا العقد والقواعد الداخلية المحددة من قبل المؤجر. يحتفظ المؤجر بالحق في الإشراف على العقار وضمان الحفاظ عليه نظيفاً وآمناً وقانونياً في جميع الأوقات.',
        occupancyTitle: '١.٢ السعة الإشغالية',
        occupancyIntro: 'تتسع الشقة لعدد أقصاه {maxResidents} مقيمين.',
        occupancyPoints: [
          'يجب على كل مقيم تقديم نسخة سارية من جواز السفر والتوقيع على استمارة الإشغال الداخلية.',
          'يُحظر منعاً باتاً التأجير من الباطن أو التنازل عن السكن للغير تحت أي ظرف من الظروف.'
        ]
      },
      cleaningSafety: {
        title: 'البند الثاني — النظافة والصيانة والأمن والسلامة',
        cleaningTitle: '٢.١ النظافة العامة والصيانة',
        cleaningPoints: [
          'يلتزم المؤجر بتوفير خدمة تنظيف لجميع المرافق المشتركة (المطبخ، غرفة المعيشة، الممرات، دورات المياه) ثلاث مرات أسبوعياً.',
          'يتحمل كل مقيم مسؤولية الحفاظ على النظافة التامة لغرفته الخاصة والالتزام بجدول النظافة.',
          'يقوم مسؤول مخصص بجمع القمامة يومياً؛ ويجب على المقيمين وضع النفايات في الحاويات المخصصة.',
          'يُمنع منعاً باتاً ترك القمامة أو المخلفات في الممرات أو السلالم أو الشرفات في أي وقت.',
          'يجب ترك أي منطقة أو جهاز أو أداة تم استخدامها نظيفة وفي الحالة التي كانت عليها.'
        ],
        maintenanceTitle: '٢.٢ الصيانة والإصلاحات',
        maintenanceBody: 'الصيانة العامة للعقار تقع على عاتق المؤجر. ومع ذلك، فإن أي ضرر ناتج عن سوء الاستخدام أو الإهمال من قبل أي مقيم سيكون مسؤوليته المالية الكاملة وقد يترتب عليه غرامة مالية. يجب الإبلاغ الفوري عن أي عطل والتعامل بحرص مع كافة المرافق.',
        safetyTitle: '٢.٣ إجراءات السلامة والطوارئ',
        safetyPoints: [
          'يُحظر تماماً استخدام النيران المكشوفة أو الشموع أو العبث بمعدات مكافحة الحرائق.',
          'توجد طفايتا حريق مثبتتان ويمكن الوصول إليهما بسهولة داخل الشقة طوال الوقت.',
          'تتوفر حقيبة إسعافات أولية وقائمة بأرقام الطوارئ في الموقع.',
          'يجب على جميع المقيمين معرفة مخارج الطوارئ وإجراءات الإخلاء بدقة.',
          'يجب إبلاغ المؤجر فوراً بأي حالة طارئة تحدث داخل السكن.'
        ],
        securityTitle: '٢.٤ الأمن والأمان',
        securityPoints: [
          'يجب إغلاق وإحكام قفل جميع الأبواب والنوافذ وباب الشرفة في جميع الأوقات، وفتحها فقط عند الاستخدام.',
          'أي مقيم يقصر في إغلاق الأبواب أو النوافذ بشكل صحيح يتحمل المسؤولية الكاملة عن أي سرقة أو ضرر ينتج عن ذلك.',
          'يُتوقع من المقيمين التحلي باليقظة والمساهمة الفعالة في سلامة وأمن السكن.'
        ]
      },
      houseRules: {
        title: 'البند الثالث — الزوار واللوائح الداخلية والدخول',
        visitorTitle: '٣.١ لائحة الزيارات',
        visitorPoints: [
          'تُسمح الزيارات بين الساعة ١٠:٠٠ صباحاً وحتى ٨:٠٠ مساءً فقط.',
          'يُمنع المبيت للزوار منعاً باتاً وتحت أي ظرف.',
          'يجب أن تتوافق زيارات العائلة مع ساعات الزيارة وكافة القواعد الداخلية.',
          'يُمنع دخول الزوار من غير العائلة إلى الغرف الخاصة.',
          'لا يجوز لأفراد العائلة دخول سوى غرفة الطالب المعني بالزيارة فقط.',
          'المقيم الذي يستقبل زواراً مسؤول مسؤولية تامة عن تصرفات وسلوك ضيوفه.'
        ],
        womenNotice: 'يُحظر منعاً باتاً دخول النساء إلى الشقة تحت أي ظرف من الظروف، بما في ذلك أفراد أسرة المستأجر.',
        houseRulesTitle: '٣.٢ القواعد المنزلية',
        houseRulesPoints: [
          'التدخين ممنوع منعاً باتاً داخل الشقة بكافة أرجائها.',
          'يُمنع اقتناء أو إدخال الحيوانات الأليفة نهائياً.',
          'يُمنع تشغيل الموسيقى والمعازف داخل الشقة.',
          'يجب التخلص من القمامة يومياً في الصندوق المخصص بالمبنى، ويُحظر تركها في الممرات أو الشرفات.',
          'يُحظر إجراء أي تعديلات أو تغييرات داخل الشقة دون موافقة خطية مسبقة من المؤجر.',
          'يجب على المستأجرين المحافظة على النظافة التامة طوال فترة الإقامة.',
          'يجب احترام الجيران والالتزام بالهدوء ولوائح المبنى.',
          'أي تلف يسببه المقيم يقع على مسؤوليته المالية الفردية.',
          'يقتصر تناول الطعام على المطبخ أو منطقة تناول الطعام فقط، ويُمنع الأكل داخل غرف النوم.'
        ],
        inspectionTitle: '٣.٣ التفتيش والدخول',
        inspectionPoints: [
          'يحق للمؤجر أو من ينوب عنه معاينة المناطق المشتركة كل أسبوعين بإشعار مسبق قبل ٤٨ ساعة.',
          'لا يجوز للمؤجر دخول الغرف الخاصة دون إذن المستأجر، باستثناء حالات الطوارئ القصوى أو للإصلاحات المجدولة مسبقاً.'
        ]
      },
      islamicValues: {
        title: 'البند الرابع — التواصل والسلوك والقيم الإسلامية',
        communicationTitle: '٤.١ وسائل التواصل',
        communicationBody: 'يتم إنشاء مجموعة واتساب خاصة بالشقة. يجب على كل مستأجر الانضمام والبقاء نشطاً في المجموعة لتلقي التحديثات والإشعارات المهمة من المؤجر أو من ينوب عنه.',
        conductTitle: '٤.٢ فض النزاعات وحسن السلوك',
        conductPoints: [
          'يجب رفع أي خلاف أو نزاع بين المقيمين إلى المؤجر مباشرة لحله بالحسنى.',
          'يُحظر تماماً الشجار أو الهجر والخصام أو الغيبة والنميمة.',
          'يُتوقع من جميع المستأجرين الحفاظ على بيئة ملؤها الاحترام والتعاون الأخوي.'
        ],
        ethicsTitle: '٤.٣ البيئة الإسلامية والآداب الشرعية',
        ethicsPoints: [
          'يُدار السكن وفق بيئة إسلامية ملتزمة، ويُتوقع من المقيمين الالتزام بآداب وسلوكيات الكتاب والسنة.',
          'يجب أن تعكس الأقوال والأفعال واللباس والمعاملات قيم الحشمة والاحترام والتعاون على البر والتقوى.',
          'لا يجوز لأي مقيم التخلف عن صلاة الجماعة إلا بعذر شرعي معتبر في الشريعة الإسلامية.',
          'أي سلوك يخالف هذه المبادئ الإسلامية قد يترتب عليه اتخاذ إجراءات تصحيحية أو إنهاء العقد فوراً من قبل المؤجر.'
        ],
        salawatHighlight: 'يُتوقع من جميع المقيمين أداء الصلوات الخمس جماعة في المسجد بانتظام.'
      },
      terminationUndertaking: {
        title: 'البند الخامس — إنهاء العقد وتعهد المستأجر',
        terminationTitle: '٥.١ إنهاء العقد',
        terminationPoints: [
          'يتعهد الطرفان بالالتزام التام بكافة بنود وشروط هذا العقد طوال مدته.',
          'يفقد المستأجر كامل مبلغ التأمين في حال إخلاء السكن قبل موعد الانتهاء المحدد، ما لم تكن هناك موافقة خطية استثنائية من المؤجر.',
          'في حال ارتكاب مخالفات جسيمة أو تكرار مخالفة القواعد، يحق للمؤجر إنهاء العقد ومطالبة المستأجر بالمغادرة الفورية دون استرداد الإيجار أو التأمين.'
        ],
        undertakingTitle: '٥.٢ تعهد المستأجر',
        undertakingIntro: 'أتعهد أنا المستأجر: {name}، باحترام العقار وصيانته والحفاظ على أمانة المؤجر وخصوصيته.',
        undertakingAcknowledge: 'أقر وأتعهد بما يلي:',
        undertakingPoints: [
          'الإبلاغ عن أي تلفيات موجودة مسبقاً أو طارئة خلال أسبوع واحد من استلام المفاتيح.',
          'تسليم الشقة ومحتوياتها عند المغادرة بنفس الحالة السليمة التي استلمتها بها.',
          'إخطار المؤجر فوراً بأي طارئ أو حادث يحدث في العقار.'
        ],
        extremismHighlight: 'أقر وأشهد بأنني لست منتمياً إلى أي جماعة أو تنظيم متطرف أو حزبي، بما في ذلك التكفير، أو الخوارج، أو تنظيم داعش، أو جماعة التبليغ، أو الإخوان، أو أي تنظيم مشابه.'
      },
      signatures: {
        title: 'التوقيعات والإقرار',
        intro: 'بالتوقيع أدناه، يقر الطرفان بأنهما قد قرآ وفهما ووافقا على جميع البنود والشروط الواردة في هذا العقد.',
        landlordLabel: 'المؤجر',
        tenantLabel: 'المستأجر',
        dateLabel: 'التاريخ',
        awaitingSignatureText: 'في انتظار التوقيع الرقمي للمستأجر',
        footerText: 'مركز الإبانة للغة العربية - العقد الرسمي لسكن الطلاب',
        pageText: 'صفحة {page} من ٤',
        agreementDateIntro: 'حُرر هذا العقد بتاريخ'
      }
    }
  },

  ru: {
    language: 'ru',
    languageName: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    status: 'draft',
    approvedAt: null,
    approvedBy: null,
    version: 1,
    lastUpdated: '2026-08-31T00:00:00.000Z',
    headerTitle: 'ДОГОВОР АРЕНДЫ ЖИЛЬЯ',
    headerSubtitle: 'Арабский центр Al-Ibaanah',
    sections: {
      parties: {
        title: '1. СТОРОНЫ ДОГОВОРА',
        landlordLabel: 'АРЕНДОДАТЕЛЬ',
        landlordNameLabel: 'ФИО',
        landlordName: 'Jimoh Bolakale Ajao (Al-Ibaanah Arabic Center)',
        landlordAddressLabel: 'Адрес',
        landlordAddress: '9, Mahmood Tawfeeq Street, off Kaabool Street, Makram Ebeid, Nasr City, Egypt',
        landlordPhoneLabel: 'Телефон',
        landlordPhone: '+20 103 007 2440',
        tenantLabel: 'АРЕНДАТОР (СТУДЕНТ)',
        tenantNameLabel: 'ФИО по загранпаспорту',
        tenantNationalityLabel: 'Гражданство',
        tenantPassportLabel: 'Номер загранпаспорта',
        tenantAddressLabel: 'Постоянный адрес проживания',
        tenantPhoneLabel: 'Телефон (WhatsApp)',
        tenantEmailLabel: 'Электронная почта'
      },
      property: {
        title: '2. ОБЪЕКТ АРЕНДЫ',
        intro: 'Объект недвижимости, являющийся предметом настоящего Договора, расположен по адресу:',
        assignedUnitLabel: 'Выделенное спальное место / комната:'
      },
      term: {
        title: '3. СРОК АРЕНДЫ',
        commencementLabel: 'Дата начала:',
        expiryLabel: 'Дата окончания:',
        durationSuffix: 'месяцев',
        renewalLabel: 'Продление:',
        renewalText: 'По взаимному согласию обеих сторон',
        overstayLabel: 'Сверхсрочное пребывание:',
        overstayText: '15 долларов США за сутки сверх согласованного срока (с согласия арендодателя)'
      },
      rent: {
        title: '4. АРЕНДНАЯ ПЛАТА',
        monthlyRentLabel: 'Ежемесячная плата:',
        monthlyRentPerMonth: '{rate} USD в месяц',
        privateRoomSuffix: 'отдельная комната',
        sharedRoomSuffix: 'место в общей комнате студенческой квартиры',
        paymentLabel: 'Порядок оплаты:',
        paymentText: 'Оплата за два месяца вперед производится по прибытии',
        methodLabel: 'Способ оплаты:',
        methodText: 'Наличными в кассе Арабского центра Al-Ibaanah'
      },
      deposit: {
        title: '5. ГАРАНТИЙНЫЙ ДЕПОЗИТ (ЗАЛОГ)',
        amountLabel: 'Сумма:',
        amountText: '{rate} USD (в размере месячной арендной платы)',
        paymentLabel: 'Срок внесения:',
        paymentText: 'Подлежит оплате при подписании настоящего Договора',
        refundLabel: 'Возврат:',
        refundText: 'Возвращается по окончании срока аренды при отсутствии ущерба и соблюдении всех условий',
        earlyTerminationLabel: 'Досрочное расторжение:',
        earlyTerminationText: 'Арендодатель оставляет за собой право удержать залог, если студент выселяется раньше согласованного срока',
        noShowLabel: 'Неприбытие:',
        noShowText: 'Залог не возвращается в случае неприбытия студента после подписания Договора'
      },
      utilities: {
        title: '6. КОММУНАЛЬНЫЕ УСЛУГИ',
        body: 'Все расходы на коммунальные услуги (электричество, газ, водоснабжение и интернет) покрываются арендодателем и включены в ежемесячную арендную плату. Студенты обязуются расходовать ресурсы ответственно и бережно. Чрезмерное или неразумное потребление может привести к пересмотру условий аренды.'
      },
      useOccupancy: {
        title: 'РАЗДЕЛ 1 — ИСПОЛЬЗОВАНИЕ И ПРОЖИВАНИЕ',
        useTitle: '1.1 Назначение жилья',
        useBody: 'Студенческое общежитие: помещение используется исключительно для совместного студенческого проживания. Все жильцы обязаны соблюдать условия настоящего Договора и Правила внутреннего распорядка. Арендодатель сохраняет право контроля за надлежащим санитарным и безопасным состоянием жилья.',
        occupancyTitle: '1.2 Вместимость квартиры',
        occupancyIntro: 'Квартира рассчитана на проживание максимум {maxResidents} человек.',
        occupancyPoints: [
          'Каждый жилец обязан предоставить копию действующего загранпаспорта и подписать внутреннюю форму заселения.',
          'Субаренда, передача места третьим лицам или переуступка категорически запрещены.'
        ]
      },
      cleaningSafety: {
        title: 'РАЗДЕЛ 2 — УБОРКА, ТЕХОБСЛУЖИВАНИЕ И БЕЗОПАСНОСТЬ',
        cleaningTitle: '2.1 Уборка и санитарные нормы',
        cleaningPoints: [
          'Арендодатель обеспечивает профессиональную уборку общих зон (кухня, гостиная, коридоры, санузлы) три раза в неделю.',
          'Каждый жилец несет ответственность за чистоту в своей комнате и соблюдение графика уборки.',
          'Вынос мусора осуществляется ежедневно специально назначенным лицом; жильцы обязаны складывать мусор в отведенные контейнеры.',
          'Категорически запрещено оставлять мусор в коридорах, на лестницах или балконах.',
          'Любая общая зона, техника или кухонная утварь после использования должна быть убрана и вымыта.'
        ],
        maintenanceTitle: '2.2 Обслуживание и ремонт',
        maintenanceBody: 'Общее техническое обслуживание жилья обеспечивает арендодатель. Однако любой ущерб, возникший в результате небрежности или неправильного использования со стороны жильца, возмещается этим жильцом в полном объеме и может повлечь за собой штраф.',
        safetyTitle: '2.3 Пожарная безопасность и действия при ЧС',
        safetyPoints: [
          'Использование открытого огня, свечей и вмешательство в работу пожарного оборудования строго запрещены.',
          'В квартире установлены и всегда доступны два исправных огнетушителя.',
          'Аптечка первой помощи и список экстренных телефонов находятся на видном месте.',
          'Все жильцы обязаны ознакомиться со схемами эвакуации и правилами безопасности.',
          'О любых происшествиях необходимо немедленно сообщать арендодателю.'
        ],
        securityTitle: '2.4 Безопасность помещения',
        securityPoints: [
          'Все двери, окна и балкон должны быть закрыты и заперты в любое время, кроме моментов непосредственного проветривания.',
          'Жилец, не закрывший дверь или окно, несет полную материальную ответственность за возможную кражу или порчу имущества.',
          'Жильцы обязаны проявлять бдительность и поддерживать безопасность всего жилого комплекса.'
        ]
      },
      houseRules: {
        title: 'РАЗДЕЛ 3 — ГОСТИ, ПРАВИЛА ДОМА И ПРОВЕРКИ',
        visitorTitle: '3.1 Правила приема гостей',
        visitorPoints: [
          'Посещение гостей разрешено строго с 10:00 до 20:00.',
          'Оставление гостей на ночь категорически запрещено.',
          'Визиты родственников должны соответствовать часам посещения и общим правилам.',
          'Посторонним посетителям запрещен вход в спальные комнаты.',
          'Члены семьи могут находиться исключительно в комнате пригласившего их студента.',
          'Студент, принимающий гостей, несет полную ответственность за их поведение.'
        ],
        womenNotice: 'Нахождение женщин в квартире строго запрещено при любых обстоятельствах, включая родственниц арендатора.',
        houseRulesTitle: '3.2 Правила проживания в доме',
        houseRulesPoints: [
          'Курение внутри квартиры категорически запрещено.',
          'Содержание домашних животных строго запрещено.',
          'Прослушивание музыки внутри квартиры запрещено.',
          'Мусор ежедневно выносится в контейнеры; запрещено оставлять пакеты в подъезде или на балконе.',
          'Любые перепланировки или изменения в квартире запрещены без письменного согласия арендодателя.',
          'Жильцы обязаны постоянно поддерживать чистоту и порядок.',
          'Необходимо уважать покой соседей и соблюдать тишину.',
          'Ущерб, причиненный имуществу, возмещается виновным жильцом.',
          'Прием пищи разрешен исключительно на кухне и в столовой зоне. Употребление еды в спальнях запрещено.'
        ],
        inspectionTitle: '3.3 Осмотр и доступ в помещение',
        inspectionPoints: [
          'Арендодатель вправе осматривать общие зоны раз в две недели с предварительным уведомлением за 48 часов.',
          'Вход в жилые комнаты без согласия студента запрещен, кроме экстренных аварийных ситуаций.'
        ]
      },
      islamicValues: {
        title: 'РАЗДЕЛ 4 — СВЯЗЬ, ПОВЕДЕНИЕ И ИСЛАМСКИЕ ЦЕННОСТИ',
        communicationTitle: '4.1 Связь и уведомления',
        communicationBody: 'Для жильцов квартиры создается группа в WhatsApp. Каждый студент обязан вступить в группу и своевременно читать важные объявления администрации.',
        conductTitle: '4.2 Взаимоотношения и решение споров',
        conductPoints: [
          'Все разногласия между жильцами передаются на рассмотрение арендодателю.',
          'Ссоры, вражда, злословие, сплетни и бойкотирование строго запрещены.',
          'Жильцы обязаны поддерживать атмосферу братства, взаимного уважения и поддержки.'
        ],
        ethicsTitle: '4.3 Исламская среда и этика',
        ethicsPoints: [
          'Квартира функционирует как исламская среда, где соблюдаются нормы Корана и Сунны.',
          'Поведение, речь, внешний вид и общение должны отражать скромность и исламский этикет.',
          'Пропуск обязательной коллективной молитвы без уважительной шариатской причины недопустим.',
          'Нарушение исламских принципов может повлечь предупреждение или расторжение договора.'
        ],
        salawatHighlight: 'Все студенты обязаны совершать пять обязательных молитв (намазов) в мечети с джамаатом.'
      },
      terminationUndertaking: {
        title: 'РАЗДЕЛ 5 — РАСТОРЖЕНИЕ ДОГОВОРА И ОБЯЗАТЕЛЬСТВА СТУДЕНТА',
        terminationTitle: '5.1 Расторжение договора',
        terminationPoints: [
          'Стороны обязуются строго соблюдать условия Договора на протяжении всего срока его действия.',
          'При досрочном выезде без уважительных причин залоговый депозит аннулируется в пользу арендодателя.',
          'При грубых нарушениях правил арендодатель вправе немедленно выселить нарушителя без возврата оплаты.'
        ],
        undertakingTitle: '5.2 Обязательство студента',
        undertakingIntro: 'Я, {name}, обязуюсь бережно относиться к имуществу, соблюдать порядок и оправдывать доверие арендодателя.',
        undertakingAcknowledge: 'Я подтверждаю и принимаю на себя следующие обязательства:',
        undertakingPoints: [
          'Сообщить обо всех обнаруженных неисправностях в течение одной недели после заселения.',
          'Сдать квартиру при выезде в том же исправном и чистом состоянии, в каком принял.',
          'Немедленно уведомлять арендодателя о любых нештатных происшествиях.'
        ],
        extremismHighlight: 'Я подтверждаю, что не принадлежу и не имею отношения к экстремистским, сектантским или радикальным течениям (такфир, хавариджи, ДАИШ/ИГИЛ, таблиг, ихваны и др.).'
      },
      signatures: {
        title: 'ПОДПИСИ СТОРОН',
        intro: 'Подписывая настоящий документ, стороны подтверждают, что полностью прочитали, поняли и согласны со всеми условиями Договора.',
        landlordLabel: 'АРЕНДОДАТЕЛЬ',
        tenantLabel: 'АРЕНДАТОР',
        dateLabel: 'Дата',
        awaitingSignatureText: 'Ожидается электронная подпись студента',
        footerText: 'Арабский центр Al-Ibaanah - Официальный договор аренды студенческого жилья',
        pageText: 'Стр. {page} из 4',
        agreementDateIntro: 'Договор заключен'
      }
    }
  },

  fr: {
    language: 'fr',
    languageName: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    status: 'draft',
    approvedAt: null,
    approvedBy: null,
    version: 1,
    lastUpdated: '2026-08-31T00:00:00.000Z',
    headerTitle: 'CONTRAT DE LOCATION RÉSIDENTIELLE ÉTUDIANTE',
    headerSubtitle: 'Centre Arabe Al-Ibaanah',
    sections: {
      parties: {
        title: '1. PARTIES AU CONTRAT',
        landlordLabel: 'LE BAILLEUR (PROPRIÉTAIRE)',
        landlordNameLabel: 'Nom complet',
        landlordName: 'Jimoh Bolakale Ajao (Centre Arabe Al-Ibaanah)',
        landlordAddressLabel: 'Adresse',
        landlordAddress: '9, rue Mahmood Tawfeeq, angle rue Kaabool, Makram Ebeid, Nasr City, Le Caire, Égypte',
        landlordPhoneLabel: 'Téléphone',
        landlordPhone: '+20 103 007 2440',
        tenantLabel: 'LE LOCATAIRE (ÉTUDIANT)',
        tenantNameLabel: 'Nom complet (selon passeport)',
        tenantNationalityLabel: 'Nationalité',
        tenantPassportLabel: 'N° de passeport',
        tenantAddressLabel: 'Adresse de résidence d’origine',
        tenantPhoneLabel: 'Téléphone (WhatsApp)',
        tenantEmailLabel: 'Courriel'
      },
      property: {
        title: '2. BIEN LOUÉ ET LOGEMENT',
        intro: 'Le bien immobilier faisant l’objet du présent contrat est situé à l’adresse suivante :',
        assignedUnitLabel: 'Unité / Lit attribué :'
      },
      term: {
        title: '3. DURÉE DU CONTRAT',
        commencementLabel: 'Date de début :',
        expiryLabel: 'Date d’expiration :',
        durationSuffix: 'mois',
        renewalLabel: 'Renouvellement :',
        renewalText: 'Par accord mutuel préalable entre les deux parties',
        overstayLabel: 'Dépassement de séjour :',
        overstayText: '15 USD par nuit au-delà de la période convenue, sous réserve d’approbation du bailleur'
      },
      rent: {
        title: '4. LOYER',
        monthlyRentLabel: 'Loyer mensuel :',
        monthlyRentPerMonth: '{rate} USD par mois',
        privateRoomSuffix: 'chambre privée',
        sharedRoomSuffix: 'chambre partagée dans un appartement étudiant',
        paymentLabel: 'Modalités de paiement :',
        paymentText: 'Deux mois de loyer payés d’avance à l’arrivée',
        methodLabel: 'Mode de paiement :',
        methodText: 'En espèces — payable au Centre Arabe Al-Ibaanah'
      },
      deposit: {
        title: '5. DÉPÔT DE GARANTIE (CAUTION)',
        amountLabel: 'Montant :',
        amountText: '{rate} USD (équivalent à un mois de loyer)',
        paymentLabel: 'Exigibilité :',
        paymentText: 'Dû dès la signature du présent contrat',
        refundLabel: 'Remboursement :',
        refundText: 'Restituable à la fin du bail, sous réserve d’absence de dégâts et du respect intégral des conditions',
        earlyTerminationLabel: 'Résiliation anticipée :',
        earlyTerminationText: 'Le bailleur se réserve le droit de retenir la caution si le locataire quitte les lieux avant la date convenue',
        noShowLabel: 'Non-présentation :',
        noShowText: 'La caution est non remboursable si l’étudiant ne se présente pas après la signature du présent contrat'
      },
      utilities: {
        title: '6. CHARGES ET SERVICES',
        body: 'Toutes les charges locatives — électricité, gaz, eau et connexion internet — sont prises en charge par le bailleur et incluses dans le loyer mensuel. Les locataires s’engagent à utiliser ces services avec responsabilité et modération. Une consommation excessive ou abusive pourra entraîner une révision des conditions ou la fixation de limites d’usage.'
      },
      useOccupancy: {
        title: 'SECTION 1 — USAGE ET OCCUPATION DES LIEUX',
        useTitle: '1.1 Usage des lieux',
        useBody: 'Hébergement étudiant partagé : le bien est exclusivement destiné à un usage d’hébergement étudiant collectif. Tous les résidents doivent se conformer aux termes du contrat et au règlement intérieur. Le bailleur se réserve le droit d’assurer la supervision des lieux afin de garantir leur propreté et sécurité.',
        occupancyTitle: '1.2 Capacité d’occupation',
        occupancyIntro: 'L’appartement peut accueillir un maximum de {maxResidents} résidents.',
        occupancyPoints: [
          'Chaque résident doit fournir une copie de son passeport en cours de validité et signer la fiche d’occupation.',
          'La sous-location ou la cession de bail est strictement interdite en toutes circonstances.'
        ]
      },
      cleaningSafety: {
        title: 'SECTION 2 — ENTRETIEN, SÉCURITÉ ET TRANQUILLITÉ',
        cleaningTitle: '2.1 Entretien et propreté',
        cleaningPoints: [
          'Le bailleur assure le nettoyage professionnel des parties communes (cuisine, salon, couloirs, sanitaires) trois fois par semaine.',
          'Chaque résident est responsable du maintien d’une hygiène stricte dans sa chambre et du suivi de l’entretien.',
          'Une personne désignée collecte les poubelles quotidiennement ; les déchets doivent être déposés dans les bacs appropriés.',
          'Aucun déchet ne doit être déposé dans les couloirs, escaliers ou sur les balcons à aucun moment.',
          'Tout espace commun ou équipement utilisé doit être laissé parfaitement propre après usage.'
        ],
        maintenanceTitle: '2.2 Maintenance et réparations',
        maintenanceBody: 'L’entretien général incombe au bailleur. Toutefois, tout dommage résultant d’une négligence ou d’un mauvais usage par un résident engagera sa responsabilité financière directe et pourra faire l’objet d’une pénalité.',
        safetyTitle: '2.3 Sécurité et procédures d’urgence',
        safetyPoints: [
          'Les flammes nues, bougies et manipulations des dispositifs de sécurité incendie sont strictement interdites.',
          'Deux extincteurs en état de marche sont accessibles en permanence dans l’appartement.',
          'Une trousse de premiers secours et la liste des numéros d’urgence sont consultables sur place.',
          'Tous les résidents doivent prendre connaissance des issues de secours et des consignes d’évacuation.',
          'Toute urgence doit être signalée immédiatement au bailleur.'
        ],
        securityTitle: '2.4 Sécurité des accès',
        securityPoints: [
          'Toutes les portes, fenêtres et le balcon doivent rester fermés et verrouillés, sauf en cas d’usage immédiat.',
          'Tout résident n’ayant pas sécurisé une ouverture sera tenu pour responsable de tout vol ou dégradation consécutif.',
          'Chaque étudiant doit faire preuve de vigilance constante pour garantir la sécurité collective.'
        ]
      },
      houseRules: {
        title: 'SECTION 3 — VISITEURS, RÈGLEMENT INTÉRIEUR ET VISITES',
        visitorTitle: '3.1 Politique des visites',
        visitorPoints: [
          'Les visites sont autorisées exclusivement entre 10h00 et 20h00.',
          'Les nuitées de personnes extérieures sont formellement interdites.',
          'Les visites familiales doivent respecter les horaires et le règlement de l’établissement.',
          'Les visiteurs extérieurs à la famille n’ont pas accès aux chambres privées.',
          'Les membres de la famille ne peuvent accéder qu’à la chambre du locataire concerné.',
          'Le résident qui reçoit un invité demeure pleinement responsable de son comportement.'
        ],
        womenNotice: 'La présence de femmes dans l’appartement est formellement interdite en toutes circonstances, y compris pour les membres de la famille.',
        houseRulesTitle: '3.2 Règlement intérieur',
        houseRulesPoints: [
          'Interdiction absolue de fumer dans l’appartement.',
          'Les animaux de compagnie sont strictement interdits.',
          'La musique et les instruments sont formellement prohibés dans l’appartement.',
          'Les ordures doivent être jetées quotidiennement dans le conteneur de l’immeuble.',
          'Aucune modification ou aménagement ne peut être effectué sans accord écrit préalable du bailleur.',
          'Les résidents doivent maintenir les lieux propres et salubres.',
          'Le respect du voisinage et le calme nocturne sont obligatoires.',
          'Toute détérioration sera facturée au résident responsable.',
          'Les repas sont pris exclusivement dans la cuisine ou la salle à manger. Nourriture interdite en chambre.'
        ],
        inspectionTitle: '3.3 Droit de visite et inspection',
        inspectionPoints: [
          'Le bailleur ou son représentant peut inspecter les parties communes toutes les deux semaines avec préavis de 48h.',
          'L’accès aux chambres privées nécessite l’accord du locataire, sauf urgence absolue ou maintenance planifiée.'
        ]
      },
      islamicValues: {
        title: 'SECTION 4 — COMMUNICATION, COMPORTEMENT ET VALEURS ISLAMIQUES',
        communicationTitle: '4.1 Communication officielle',
        communicationBody: 'Un groupe WhatsApp dédié à l’appartement est créé. Chaque locataire doit obligatoirement y participer afin de recevoir les communications officielles de la direction.',
        conductTitle: '4.2 Résolution des conflits et bienséance',
        conductPoints: [
          'Tout différend entre résidents doit être immédiatement soumis au bailleur pour médiation.',
          'Les querelles, la rancune, la médisance et le colportage sont formellement prohibés.',
          'Tous les locataires doivent entretenir une atmosphère de respect fraternel et d’entraide.'
        ],
        ethicsTitle: '4.3 Environnement islamique et éthique',
        ethicsPoints: [
          'Le logement constitue un environnement islamique régi par les préceptes du Coran et de la Sounnah.',
          'Le comportement, les propos, la tenue vestimentaire et les relations doivent refléter la pudeur et la fraternité.',
          'Aucun résident ne doit délaisser la prière en groupe à la mosquée sans excuse religieuse valable.',
          'Tout manquement grave à ces règles éthiques pourra entraîner la résiliation immédiate du contrat.'
        ],
        salawatHighlight: 'Tous les résidents sont tenus d’accomplir les cinq prières quotidiennes (salawat) à la mosquée en congrégation.'
      },
      terminationUndertaking: {
        title: 'SECTION 5 — RÉSILIATION ET ENGAGEMENT DU LOCATAIRE',
        terminationTitle: '5.1 Résiliation',
        terminationPoints: [
          'Les parties s’engagent à respecter scrupuleusement les clauses du contrat pendant toute sa durée.',
          'Le locataire perd l’intégralité de sa caution en cas de départ anticipé sans accord écrit préalable.',
          'En cas de faute grave ou d’infraction répétée, le bailleur peut résilier le bail sans remboursement.'
        ],
        undertakingTitle: '5.2 Engagement solennel du locataire',
        undertakingIntro: 'Je soussigné, {name}, m’engage à respecter le bien loué, à préserver son état et à honorer la confiance du bailleur.',
        undertakingAcknowledge: 'Je reconnais et prends solennellement les engagements suivants :',
        undertakingPoints: [
          'Signaler tout défaut ou dommage préexistant dans un délai de sept (7) jours après la remise des clés.',
          'Restituer l’appartement dans l’état de propreté et de bon fonctionnement initial.',
          'Avertir immédiatement la direction de tout incident survenant au sein du logement.'
        ],
        extremismHighlight: 'Je certifie sur l’honneur n’avoir aucune affiliation avec un quelconque mouvement ou groupe extrémiste ou sectaire (Takfir, Khawarij, Daesh, Tabligh, Ikhwan ou similaire).'
      },
      signatures: {
        title: 'SIGNATURES DES PARTIES',
        intro: 'Par leur signature ci-dessous, les deux parties confirment avoir lu, compris et approuvé l’ensemble des conditions du présent contrat.',
        landlordLabel: 'LE BAILLEUR',
        tenantLabel: 'LE LOCATAIRE',
        dateLabel: 'Date',
        awaitingSignatureText: 'En attente de la signature électronique de l’étudiant',
        footerText: 'Centre Arabe Al-Ibaanah - Contrat Officiel de Logement Étudiant',
        pageText: 'Page {page} sur 4',
        agreementDateIntro: 'Fait le'
      }
    }
  },

  uz: {
    language: 'uz',
    languageName: 'Uzbek',
    nativeName: "O'zbekcha",
    direction: 'ltr',
    status: 'draft',
    approvedAt: null,
    approvedBy: null,
    version: 1,
    lastUpdated: '2026-08-31T00:00:00.000Z',
    headerTitle: 'TALABALAR TURAR-JOYI IJARASI SHARTNOMASI',
    headerSubtitle: "Al-Ibaanah Arab Tili Markazi",
    sections: {
      parties: {
        title: '1. SHARTNOMA TOMONLARI',
        landlordLabel: 'IJARAGA BERUVCHI',
        landlordNameLabel: 'To‘liq ismi',
        landlordName: 'Jimoh Bolakale Ajao (Al-Ibaanah Arab Tili Markazi)',
        landlordAddressLabel: 'Manzili',
        landlordAddress: '9, Mahmood Tawfeeq ko‘chasi, Kaabool chorrahasi, Makram Ebeid, Nasr City, Qohira, Misr',
        landlordPhoneLabel: 'Telefon',
        landlordPhone: '+20 103 007 2440',
        tenantLabel: 'IJARACHI (TALABA)',
        tenantNameLabel: 'Pasportdagi to‘liq ismi',
        tenantNationalityLabel: 'Fuqaroligi',
        tenantPassportLabel: 'Xorijiy pasport raqami',
        tenantAddressLabel: 'Doimiy yashash manzili',
        tenantPhoneLabel: 'Telefon (WhatsApp)',
        tenantEmailLabel: 'Elektron pochta'
      },
      property: {
        title: '2. IJARA OB’EKTI VA XONA',
        intro: 'Ushbu Shartnoma predmeti bo‘lgan turar-joy quyidagi manzilda joylashgan:',
        assignedUnitLabel: 'Biriktirilgan joy / xona:'
      },
      term: {
        title: '3. IJARA MUDDATI',
        commencementLabel: 'Boshlanish sanasi:',
        expiryLabel: 'Tugash sanasi:',
        durationSuffix: 'oy',
        renewalLabel: 'Uzaytirish:',
        renewalText: 'Har ikki tomonning o‘zaro kelishuviga binoan',
        overstayLabel: 'Muddatsiz qolish:',
        overstayText: 'Kelishilgan muddatdan oshgan har bir kecha uchun 15 AQSh dollari (ijaraga beruvchi roziligi bilan)'
      },
      rent: {
        title: '4. IJARA HAQI',
        monthlyRentLabel: 'Oylik ijara to‘lovi:',
        monthlyRentPerMonth: 'Oyiga {rate} AQSh dollari',
        privateRoomSuffix: 'alohida xona',
        sharedRoomSuffix: 'umumiy talabalar kvartirasidagi o‘rin',
        paymentLabel: 'To‘lov tartibi:',
        paymentText: 'Yetib kelganda 2 oylik ijara haqi oldindan to‘lanadi',
        methodLabel: 'To‘lov shakli:',
        methodText: 'Naqd pulda — Al-Ibaanah Arab tili markazida qabul qilinadi'
      },
      deposit: {
        title: '5. KAFOLAT GAROV PULI (DEPOZIT)',
        amountLabel: 'Summasi:',
        amountText: '{rate} AQSh dollari (bir oylik ijara haqi miqdorida)',
        paymentLabel: 'To‘lash muddati:',
        paymentText: 'Ushbu Shartnoma imzolangan paytda to‘lanishi shart',
        refundLabel: 'Qaytarilishi:',
        refundText: 'Ijara muddati tugaganda, moddiy zarar bo‘lmaganda va barcha shartlarga to‘liq rioya qilinganda qaytariladi',
        earlyTerminationLabel: 'Muddatidan oldin bekor qilish:',
        earlyTerminationText: 'Ijarachi kelishilgan muddatdan oldin chiqib ketsa, depozit qaytarilmaydi',
        noShowLabel: 'Kechikish yoki kelmaslik:',
        noShowText: 'Shartnoma imzolangandan so‘ng talaba kelmasa, garov puli qaytarilmaydi'
      },
      utilities: {
        title: '6. KOMMUNAL XIZMATLAR',
        body: 'Barcha kommunal to‘lovlar (elektr energiyasi, gaz, suv va internet) ijaraga beruvchi tomonidan to‘lanadi va oylik ijara haqiga kiritilgan. Talabalar resurslardan tejamkorlik va mas’uliyat bilan foydalanishlari shart. Haddan tashqari ko‘p isrof qilish ijara shartlarini qayta ko‘rib chiqishga sabab bo‘lishi mumkin.'
      },
      useOccupancy: {
        title: '1-BO‘LIM — FOYDALANISH VA YASHASH TARTIBI',
        useTitle: '1.1 Turar-joydan foydalanish',
        useBody: 'Talabalar yotoqxonasi: xonadon faqat talabalarning birgalikda yashashi uchun mo‘ljallangan. Barcha istiqomat qiluvchilar ushbu Shartnoma va Ichki tartib qoidalariga rioya qilishlari shart. Ijaraga beruvchi xonadonning tozaligi va xavfsizligini nazorat qilish huquqini saqlab qoladi.',
        occupancyTitle: '1.2 Yashovchilar soni',
        occupancyIntro: 'Xonadon ko‘pi bilan {maxResidents} nafar talabaga mo‘ljallangan.',
        occupancyPoints: [
          'Har bir talaba pasport nusxasini topshirishi va ichki ro‘yxatga olish varaqasini imzolashi shart.',
          'Xonani yoki joyni boshqa shaxslarga qayta ijaraga berish qat’iyan man etiladi.'
        ]
      },
      cleaningSafety: {
        title: '2-BO‘LIM — TOZALIK, TEXNIK XIZMAT VA XAVFSIZLIK',
        cleaningTitle: '2.1 Tozalik va sanitariya',
        cleaningPoints: [
          'Ijaraga beruvchi umumiy foydalanish joylarini (oshxona, zal, yo‘laklar, hojatxona va yuvinish xonalari) haftasiga 3 marta tozalashni ta’minlaydi.',
          'Har bir talaba o‘z xonasining tozaligi va gigiyenasiga shaxsan javobgardir.',
          'Chiqindilar har kuni maxsus xodim tomonidan olib chiqiladi; chiqindilarni faqat maxsus idishlarga tashlash shart.',
          'Yo‘laklar, zinapoyalar yoki balkonlarda axlat qoldirish qat’iyan taqiqlanadi.',
          'Foydalanilgan har qanday buyum yoki texnika darhol tozalab qo‘yilishi shart.'
        ],
        maintenanceTitle: '2.2 Texnik xizmat va ta’mirlash',
        maintenanceBody: 'Umumiy texnik ta’mirlash ijaraga beruvchi zimmasidadir. Biroq, talabaning e’tiborsizligi tufayli yetkazilgan har qanday zarar uning o‘z hisobidan qoplanadi va jarimaga tortilishi mumkin.',
        safetyTitle: '2.3 Yong‘in xavfsizligi va favqulodda holatlar',
        safetyPoints: [
          'Ochiq olov, sham yoqish va yong‘in xavfsizligi uskunalariga tegish qat’iyan taqiqlanadi.',
          'Kvartirada 2 ta soz holatdagi o‘t o‘chirgich mavjud va doimo ochiq joyda saqlanadi.',
          'Birinchi tibbiy yordam qutisi va favqulodda raqamlar ro‘yxati mavjud.',
          'Barcha talabalar xavfsizlik va evakuatsiya yo‘llarini yaxshi bilishlari shart.',
          'Favqulodda holat yuz berganda darhol ijaraga beruvchiga xabar berilishi kerak.'
        ],
        securityTitle: '2.4 Xavfsizlik choralari',
        securityPoints: [
          'Barcha eshiklar, derazalar va balkon eshigi doimo yopiq va qulflangan bo‘lishi shart.',
          'Eshik yoki derazani ochiq qoldirgan talaba o‘g‘irlik yoki moddiy zarar uchun to‘liq javobgardir.',
          'Har bir talaba ehtiyotkor bo‘lishi va xonadon xavfsizligiga hissa qo‘shishi shart.'
        ]
      },
      houseRules: {
        title: '3-BO‘LIM — MEHMONLAR, ICHKI TARTIB VA TEKSHIRUV',
        visitorTitle: '3.1 Mehmonlar qoidasi',
        visitorPoints: [
          'Mehmonlar tashrifi faqat soat 10:00 dan 20:00 gacha ruxsat etiladi.',
          'Mehmonlarning kechasi qolib ketishi qat’iyan man etiladi.',
          'Oila a’zolarining tashrifi belgilangan soatlar va tartibga muvofiq bo‘lishi shart.',
          'Begona mehmonlarning yotoqxonalarga kirishi taqiqlanadi.',
          'Oila a’zolari faqat taklif qilgan talabaning xonasiga kirishi mumkin.',
          'Mehmon chaqirgan talaba uning xatti-harakatlari uchun to‘liq javobgardir.'
        ],
        womenNotice: 'Xonadonga ayollarning kirishi qat’iyan man etiladi, shu jumladan talabaning oila a’zolari ham.',
        houseRulesTitle: '3.2 Ichki tartib-qoidalar',
        houseRulesPoints: [
          'Kvartira ichida tamaki chekish mutlaqo taqiqlanadi.',
          'Uy hayvonlarini saqlash qat’iyan man etiladi.',
          'Kvartirada musiqa tinglash taqiqlanadi.',
          'Axlat har kuni bino tashqarisidagi konteynerga tashlanishi shart.',
          'Ijaraga beruvchining yozma ruxsatisiz xonadonda hech qanday o‘zgartirish kiritish mumkin emas.',
          'Talabalar tozalik va ozodalikni doimo saqlashlari shart.',
          'Qo‘shnilar tinchligini hurmat qilish va qoidalarga amal qilish shart.',
          'Yetkazilgan har qanday zarar aybdor talaba tomonidan qoplanadi.',
          'Ovqatlanish faqat oshxonada amalga oshiriladi. Yotoqxonalarda ovqat yeyish taqiqlanadi.'
        ],
        inspectionTitle: '3.3 Ko‘rik va xonaga kirish',
        inspectionPoints: [
          'Ijaraga beruvchi 48 soat oldin ogohlantirgan holda har 2 haftada umumiy joylarni ko‘zdan kechirishi mumkin.',
          'Talabaning roziligisiz uning xonasiga kirish taqiqlanadi (favqulodda holatlar bundan mustasno).'
        ]
      },
      islamicValues: {
        title: '4-BO‘LIM — ALOQA, XULQ-ATVOR VA ISLOMIY QADRIYATLAR',
        communicationTitle: '4.1 Aloqa va e’lonlar',
        communicationBody: 'Xonadon uchun WhatsApp guruhi tashkil etiladi. Har bir talaba muhim e’lonlarni o‘z vaqtida qabul qilish uchun guruhda faol bo‘lishi shart.',
        conductTitle: '4.2 O‘zaro munosabatlar va nizolarni hal qilish',
        conductPoints: [
          'Talabalar o‘rtasidagi barcha kelishmovchiliklar hal qilish uchun ijaraga beruvchiga bildiriladi.',
          'Urishish, gina saqlash, g‘iybat va chaqimchilik qat’iyan taqiqlanadi.',
          'Barcha talabalar o‘zaro hurmat va birodarlik muhitini saqlashlari shart.'
        ],
        ethicsTitle: '4.3 Islomiy muhit va odob-axloq',
        ethicsPoints: [
          'Kvartira Qur’on va Sunnatga muvofiq islomiy muhit asosida faoliyat yuritadi.',
          'Kiyinish, muomala va so‘zlashuv odobi islomiy hayo va hurmatni aks ettirishi shart.',
          'Uzrli shar’iy sababsiz jamoat namozini tark etishga yo‘l qo‘yilmaydi.',
          'Islomiy odobga zid xatti-harakatlar shartnomani bekor qilishga olib kelishi mumkin.'
        ],
        salawatHighlight: 'Barcha talabalar kunlik 5 vaqt namozni masjidda jamoat bilan ado etishlari shart.'
      },
      terminationUndertaking: {
        title: '5-BO‘LIM — SHARTNOMANI BEKOR QILISH VA TALABANING MAJBURIYATI',
        terminationTitle: '5.1 Shartnomani bekor qilish',
        terminationPoints: [
          'Tomonlar Shartnoma shartlariga uning butun muddati davomida qat’iy rioya qilishga kelishadilar.',
          'Kelishilgan muddatdan oldin chiqib ketilgan taqdirda garov puli qaytarilmaydi.',
          'Qoidalar qo‘pol ravishda buzilganda ijaraga beruvchi talabani to‘lovni qaytarmasdan xonadondan chiqarish huquqiga ega.'
        ],
        undertakingTitle: '5.2 Talabaning rasmiy kafolati',
        undertakingIntro: 'Men, talaba {name}, mulkni asrashga, tartibni saqlashga va ijaraga beruvchining ishonchini oqlashga va’da beraman.',
        undertakingAcknowledge: 'Quyidagilarni tasdiqlayman va o‘z zimmamga olaman:',
        undertakingPoints: [
          'Kalitlarni olgandan keyin 1 hafta ichida barcha mavjud kamchiliklar haqida xabar berish.',
          'Chiqib ketayotganda xonadonni qabul qilib olgan holatda topshirish.',
          'Kvartirada yuz bergan har qanday noxush hodisa haqida zudlik bilan xabar berish.'
        ],
        extremismHighlight: 'Men hech qanday ekstremistik, buzg‘unchi yoki radikal guruhlarga (Takfir, Xavorij, Doyish/IShID, Tablig‘, Ixvon va shunga o‘xshash) aloqador emasligimni tasdiqlayman.'
      },
      signatures: {
        title: 'TOMONLARNING IMZOLARI',
        intro: 'Quyida imzo chekish orqali tomonlar ushbu Shartnomaning barcha shartlarini o‘qib chiqqanliklari, tushunganliklari va qabul qilganliklarini tasdiqlaydilar.',
        landlordLabel: 'IJARAGA BERUVCHI',
        tenantLabel: 'IJARACHI',
        dateLabel: 'Sana',
        awaitingSignatureText: 'Talabaning elektron imzosi kutilmoqda',
        footerText: 'Al-Ibaanah Arab Tili Markazi - Talabalar Turar-joyi Rasmiy Shartnomasi',
        pageText: '{page} / 4-bet',
        agreementDateIntro: 'Ushbu shartnoma tuzilgan sana:'
      }
    }
  },

  zh: {
    language: 'zh',
    languageName: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    status: 'draft',
    approvedAt: null,
    approvedBy: null,
    version: 1,
    lastUpdated: '2026-08-31T00:00:00.000Z',
    headerTitle: '学生宿舍租赁合同协议',
    headerSubtitle: 'Al-Ibaanah 阿拉伯语中心',
    sections: {
      parties: {
        title: '一、 协议各方当事人',
        landlordLabel: '出租方（房东）',
        landlordNameLabel: '姓名',
        landlordName: 'Jimoh Bolakale Ajao（Al-Ibaanah 阿拉伯语中心）',
        landlordAddressLabel: '地址',
        landlordAddress: '9, Mahmood Tawfeeq Street, off Kaabool Street, Makram Ebeid, Nasr City, Cairo, Egypt',
        landlordPhoneLabel: '联系电话',
        landlordPhone: '+20 103 007 2440',
        tenantLabel: '承租方（学生）',
        tenantNameLabel: '护照全名',
        tenantNationalityLabel: '国籍',
        tenantPassportLabel: '护照号码',
        tenantAddressLabel: '原籍常住地址',
        tenantPhoneLabel: '联系电话（WhatsApp）',
        tenantEmailLabel: '电子邮箱'
      },
      property: {
        title: '二、 租赁物业与房间信息',
        intro: '本协议项下的租赁物业地址为：',
        assignedUnitLabel: '分配房间 / 床位：'
      },
      term: {
        title: '三、 租赁期限',
        commencementLabel: '起租日期：',
        expiryLabel: '到期日期：',
        durationSuffix: '个月',
        renewalLabel: '续租约定：',
        renewalText: '须经双方提前达成一致同意',
        overstayLabel: '逾期滞留：',
        overstayText: '超出合同期限按每晚 15 美元计算，并须经房东批准'
      },
      rent: {
        title: '四、 租金与支付方式',
        monthlyRentLabel: '月租金：',
        monthlyRentPerMonth: '每月 {rate} 美元',
        privateRoomSuffix: '独立单间',
        sharedRoomSuffix: '学生公寓合住床位',
        paymentLabel: '支付要求：',
        paymentText: '到达时须提前预付 2 个月租金',
        methodLabel: '付款方式：',
        methodText: '现金支付 — 于 Al-Ibaanah 阿拉伯语中心缴付'
      },
      deposit: {
        title: '五、 履约保证金（押金）',
        amountLabel: '押金金额：',
        amountText: '{rate} 美元（相当于一个月租金）',
        paymentLabel: '缴纳时间：',
        paymentText: '签署本合同时立即缴纳',
        refundLabel: '押金退还：',
        refundText: '租期届满、房屋设施完好且完全遵守合同条款的前提下全额退还',
        earlyTerminationLabel: '提前退租：',
        earlyTerminationText: '如承租人在合同到期前提前搬离，房东有权扣留全部押金',
        noShowLabel: '签约未入住：',
        noShowText: '签署本合同后未能如期入住者，押金概不退还'
      },
      utilities: {
        title: '六、 公用事业费用',
        body: '所有公用事业费用（包括电费、燃气费、水费及互联网费用）均由房东承担并包含在月租金中。学生应本着节约、合理的原则使用水电网络。如有过度或不合理浪费，房东有权调整租赁条款或设定使用限制。'
      },
      useOccupancy: {
        title: '第一条 — 使用性质与入住管理',
        useTitle: '1.1 物业使用性质',
        useBody: '学生合住公寓性质：本物业仅作为学生合住宿舍使用。所有住户必须严格遵守本协议条款及房东制定的房屋守则。房东保留对物业的管理监督权，确保房屋始终处于整洁、安全及合法状态。',
        occupancyTitle: '1.2 入住人数限制',
        occupancyIntro: '本公寓最多容纳 {maxResidents} 名住户。',
        occupancyPoints: [
          '每位住户须提供有效的护照复印件并签署内部入住登记表。',
          '在任何情况下均严禁转租、分租或出借床位给第三方。'
        ]
      },
      cleaningSafety: {
        title: '第二条 — 清洁卫生、维修、消防与安全',
        cleaningTitle: '2.1 清洁与卫生维护',
        cleaningPoints: [
          '房东安排专人每周对公共区域（厨房、客厅、走廊、卫生间）进行三次专业清洁。',
          '每位学生负责保持自己私人房间的卫生，并按要求记录清洁日志。',
          '每日有专人定时清理垃圾；住户须将垃圾妥善投放至指定垃圾桶。',
          '严禁在走廊、楼梯间或阳台堆放任何垃圾或杂物。',
          '使用公共区域、电器或厨具后，须立即清理干净并恢复原状。'
        ],
        maintenanceTitle: '2.2 设施维修与保养',
        maintenanceBody: '房屋日常维护由房东负责。但因学生不当使用或过失造成的任何损坏，由该学生承担全部赔偿责任并可能面临罚款。遇有设施故障须立即报修。',
        safetyTitle: '2.3 消防与应急程序',
        safetyPoints: [
          '严禁使用明火、蜡烛，严禁擅自触碰或破坏消防安全设备。',
          '公寓内配有两具处于完好备用状态的灭火器。',
          '现场配备急救药箱及紧急联络电话清单。',
          '所有住户须熟知紧急疏散通道和安全逃生程序。',
          '遇有任何紧急情况须立即向房东报告。'
        ],
        securityTitle: '2.4 门禁与财产安全',
        securityPoints: [
          '所有入户门、窗户及阳台门除通风使用外，须时刻保持关闭并锁好。',
          '因未按规定锁好门窗而导致失窃或财产损失的，相关责任人须承担全部赔偿责任。',
          '所有住户须保持警惕，共同维护宿舍的安全环境。'
        ]
      },
      houseRules: {
        title: '第三条 — 访客规定、房屋守则与检查',
        visitorTitle: '3.1 访客管理规定',
        visitorPoints: [
          '访客仅允许在上午 10:00 至晚上 20:00 之间来访。',
          '任何情况下严禁外来访客留宿。',
          '家属探访须遵守探访时间及所有房屋守则。',
          '非家属访客严禁进入任何私人卧房。',
          '家属仅可进入所探访学生的指定房间。',
          '接待访客的学生须对访客的一切言行负全部责任。'
        ],
        womenNotice: '严禁任何女性进入本男生宿舍，包括学生的女性直系亲属在内，概无例外。',
        houseRulesTitle: '3.2 宿舍日常守则',
        houseRulesPoints: [
          '公寓内全域严禁吸烟。',
          '严禁饲养任何宠物。',
          '公寓内禁止播放音乐。',
          '垃圾必须每日丢入大楼垃圾桶，严禁堆放在楼道或阳台。',
          '未经房东书面批准，不得对公寓进行任何形式的改造或改动。',
          '住户在整个租期内必须保持个人及公共卫生。',
          '必须尊重邻居，保持安静，遵守大楼管理规定。',
          '任何人造成的财物损坏须由其个人承担全部赔偿。',
          '就餐仅限在厨房或餐厅进行，严禁在卧室房间内饮食。'
        ],
        inspectionTitle: '3.3 检查与进入房屋',
        inspectionPoints: [
          '房东或其代表在提前 48 小时通知的情况下，可每两周对公共区域进行一次检查。',
          '未经学生同意，房东不得擅自进入私人卧室（紧急抢险或预约维修除外）。'
        ]
      },
      islamicValues: {
        title: '第四条 — 日常沟通、行为规范与伊斯兰道德',
        communicationTitle: '4.1 通讯与通知',
        communicationBody: '公寓设立官方 WhatsApp 群组。每位学生必须加入并保持群组活跃，以接收房东或管理人员发布的重要通知。',
        conductTitle: '4.2 纠纷调解与言行举止',
        conductPoints: [
          '住户之间如有任何分歧或争议，须提交房东调解处理。',
          '严禁争吵、结怨、说谎、诽谤或背谈他人。',
          '所有住户应当共同维护互相尊重、团结互助的良好氛围。'
        ],
        ethicsTitle: '4.3 伊斯兰生活环境与品德',
        ethicsPoints: [
          '公寓按照伊斯兰优良传统管理，住户应遵循《古兰经》和圣训所教导的礼节。',
          '住户的言谈举止、穿着打扮及人际交往必须体现端庄、谦逊与互助。',
          '无正当教法允许的理由，不得无故缺席清真寺的集体礼拜。',
          '任何严重违背伊斯兰道德准则的行为，房东有权采取纠正措施或终止合同。'
        ],
        salawatHighlight: '所有住宿学生均须按时前往清真寺参加每日五番拜功（Salawat）的集体礼拜。'
      },
      terminationUndertaking: {
        title: '第五条 — 合同解除与学生承诺保证',
        terminationTitle: '5.1 合同解除',
        terminationPoints: [
          '协议各方同意在整个合同期内严格遵守本协议的所有条款。',
          '承租人如在约定期限前擅自搬离，押金将被全额罚没（经房东书面特许的特殊情况除外）。',
          '如发生严重违纪或屡次违反守则，房东有权立即解除合同并责令搬离，已交租金与押金不予退还。'
        ],
        undertakingTitle: '5.2 学生的庄严承诺',
        undertakingIntro: '本人，承租学生 {name}，在此庄严承诺爱护房屋财产，维持良好秩序，不辜负房东的信任与托付。',
        undertakingAcknowledge: '本人确认并郑重做出以下承诺保证：',
        undertakingPoints: [
          '自收到钥匙之日起一（1）周内，如实报备房屋所有原有或新增损坏。',
          '在退租时，按接管时的良好整洁状态将公寓如数归还。',
          '如物业发生任何意外或突发情况，第一时间向房东报告。'
        ],
        extremismHighlight: '本人郑重声明并保证：本人绝不隶属于、不赞同且不参与任何极端主义、分裂主义或极端派别组织（包括 Takfir、Khawarij、Daesh、Tabligh、Ikhwan 或类似极端派别）。'
      },
      signatures: {
        title: '签署与确认',
        intro: '签署本协议即表示双方已完整阅读、完全理解并自愿遵守本租赁协议所列全部条款。',
        landlordLabel: '出租方（房东）',
        tenantLabel: '承租方（学生）',
        dateLabel: '签署日期',
        awaitingSignatureText: '等待学生完成电子手写签名',
        footerText: 'Al-Ibaanah 阿拉伯语中心 - 官方学生宿舍租赁协议',
        pageText: '第 {page} 页，共 4 页',
        agreementDateIntro: '本协议订立于'
      }
    }
  }
};

export const CONTRACT_LANGUAGES: { code: Language; name: string; native: string; flag: string; direction: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'uz', name: 'Uzbek', native: "O'zbekcha", flag: '🇺🇿', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '中文 (简体)', flag: '🇨🇳', direction: 'ltr' },
];

/**
 * Check whether a translation is approved.
 * Only English is approved by default. Other languages require explicit staff/proprietor approval.
 */
export function isContractLanguageApproved(
  lang: Language,
  translationsStore?: ContractTranslationsStore | Record<string, any>
): boolean {
  if (lang === 'en') return true;
  if (!translationsStore) return false;
  const item = translationsStore[lang];
  return item?.status === 'approved';
}

/**
 * Get active contract translation.
 * If the requested language is not approved, it falls back to the canonical English contract.
 */
export function getActiveContractTranslation(
  requestedLang: Language,
  translationsStore?: ContractTranslationsStore | Record<string, any>,
  allowDraftForAdmin: boolean = false
): LegalContractTranslation {
  const store = (translationsStore as ContractTranslationsStore) || DEFAULT_CONTRACT_TRANSLATIONS;
  const langKey = requestedLang in store ? requestedLang : 'en';
  const target = store[langKey] || store['en'] || DEFAULT_CONTRACT_TRANSLATIONS.en;

  if (allowDraftForAdmin || target.status === 'approved' || langKey === 'en') {
    return target;
  }

  // Fallback to English if target is still in draft mode for students
  return store['en'] || DEFAULT_CONTRACT_TRANSLATIONS.en;
}
